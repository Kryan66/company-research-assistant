import type { CompanyResearch, Competitor } from '../types/index.js'
import type { CrawledPage } from '../types/index.js'
import type { SerperSearchResult } from '../types/index.js'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

/** Primary free model — only model used unless rate-limited */
const PRIMARY_MODEL = 'openai/gpt-oss-120b:free'
/** Fallback free model when primary returns 429 */
const BACKUP_MODEL = 'openrouter/free'

interface AIAnalysisResult {
  companyName: string
  summary: string
  productsServices: string[]
  painPoints: string[]
  industry: string
  competitors: Competitor[]
}

class OpenRouterRateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpenRouterRateLimitError'
  }
}

async function callOpenRouter(
  model: typeof PRIMARY_MODEL | typeof BACKUP_MODEL,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://company-research-assistant.app',
      'X-Title': 'Company Research Assistant',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  if (response.status === 429) {
    const text = await response.text()
    throw new OpenRouterRateLimitError(`Rate limited (${response.status}): ${text}`)
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenRouter API error (${response.status}): ${text}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Call OpenRouter with hardcoded free models only.
 * Retries once with backup model on 429 rate-limit.
 */
async function callOpenRouterWithFallback(
  systemPrompt: string,
  userPrompt: string,
  onRetry?: () => void
): Promise<string> {
  try {
    return await callOpenRouter(PRIMARY_MODEL, systemPrompt, userPrompt)
  } catch (error) {
    if (error instanceof OpenRouterRateLimitError) {
      onRetry?.()
      return await callOpenRouter(BACKUP_MODEL, systemPrompt, userPrompt)
    }
    throw error
  }
}

function buildCrawledContext(pages: CrawledPage[]): string {
  return pages
    .map((p) => `--- Page: ${p.title} (${p.url}) ---\n${p.content}`)
    .join('\n\n')
}

function buildSearchContext(snippets: string[]): string {
  return snippets.map((s, i) => `[${i + 1}] ${s}`).join('\n')
}

/**
 * Send crawled + searched content to OpenRouter for structured AI analysis.
 * Always uses hardcoded free models — no user override possible.
 */
export async function analyzeCompany(
  companyName: string,
  website: string,
  crawledPages: CrawledPage[],
  searchSnippets: string[],
  competitorSearchResults: SerperSearchResult[],
  existingPhone?: string,
  existingAddress?: string,
  onModelRetry?: () => void
): Promise<AIAnalysisResult> {
  const systemPrompt = `You are a business research analyst. Analyze the provided company information and return a JSON object with this exact structure:
{
  "companyName": "string",
  "summary": "2-3 sentence company overview",
  "productsServices": ["product or service 1", "product or service 2"],
  "painPoints": ["likely business challenge 1", "likely business challenge 2"],
  "industry": "industry/sector name",
  "competitors": [
    { "name": "Competitor Name", "website": "https://competitor.com", "reasoning": "why they compete" }
  ]
}

Rules:
- Base your analysis ONLY on the provided data. Do not invent facts.
- For pain points, infer likely business challenges based on industry, size, and offerings.
- For competitors, prefer those mentioned in search results. Include 3-5 competitors.
- If phone or address info is in the data, note it but don't include in JSON fields (handled separately).
- Return valid JSON only.`

  const userPrompt = `Company: ${companyName}
Website: ${website}
${existingPhone ? `Phone (from search): ${existingPhone}` : ''}
${existingAddress ? `Address (from search): ${existingAddress}` : ''}

=== CRAWLED WEBSITE CONTENT ===
${buildCrawledContext(crawledPages)}

=== SEARCH RESULTS ===
${buildSearchContext(searchSnippets)}

=== COMPETITOR SEARCH RESULTS ===
${competitorSearchResults.map((r) => `- ${r.title}: ${r.link}\n  ${r.snippet}`).join('\n')}`

  const raw = await callOpenRouterWithFallback(systemPrompt, userPrompt, onModelRetry)

  try {
    const parsed = JSON.parse(raw) as AIAnalysisResult
    return {
      companyName: parsed.companyName || companyName,
      summary: parsed.summary || '',
      productsServices: parsed.productsServices || [],
      painPoints: parsed.painPoints || [],
      industry: parsed.industry || '',
      competitors: (parsed.competitors || []).map((c) => ({
        name: c.name,
        website: c.website,
        reasoning: c.reasoning,
      })),
    }
  } catch {
    throw new Error('Failed to parse AI analysis response as JSON')
  }
}

export function buildResearchResult(
  analysis: AIAnalysisResult,
  website: string,
  phone?: string,
  address?: string
): CompanyResearch {
  return {
    companyName: analysis.companyName,
    website,
    phoneNumber: phone,
    address,
    productsServices: analysis.productsServices,
    painPoints: analysis.painPoints,
    summary: analysis.summary,
    competitors: analysis.competitors,
  }
}
