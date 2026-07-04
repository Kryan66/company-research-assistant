import type { SerperSearchResult } from '../types/index.js'

const SERPER_API_URL = 'https://google.serper.dev/search'

async function serperSearch(query: string, num = 10): Promise<SerperSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    throw new Error('SERPER_API_KEY is not configured')
  }

  const response = await fetch(SERPER_API_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Serper API error (${response.status}): ${text}`)
  }

  const data = await response.json()
  const organic: SerperSearchResult[] = (data.organic || []).map(
    (item: { title: string; link: string; snippet: string }) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    })
  )

  return organic
}

/**
 * Resolve a company name to its official website URL using Serper search.
 * Picks the first organic result that looks like an official company site.
 */
export async function resolveCompanyWebsite(companyName: string): Promise<string> {
  const results = await serperSearch(`${companyName} official website`, 5)

  if (results.length === 0) {
    throw new Error(`Could not find a website for "${companyName}"`)
  }

  // Prefer results whose title or URL contains the company name
  const normalized = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const scored = results.map((r) => {
    const urlHost = new URL(r.link).hostname.replace('www.', '').toLowerCase()
    const titleLower = r.title.toLowerCase()
    let score = 0
    if (urlHost.includes(normalized) || normalized.includes(urlHost.split('.')[0])) score += 3
    if (titleLower.includes(companyName.toLowerCase())) score += 2
    // Penalize social media and aggregator sites
    if (/linkedin|facebook|twitter|wikipedia|crunchbase|glassdoor|yelp/.test(urlHost)) score -= 5
    return { ...r, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0].link
}

/**
 * Gather supplementary public info about a company (contact, address, industry).
 */
export async function searchCompanyInfo(
  companyName: string,
  website: string
): Promise<{ phone?: string; address?: string; snippets: string[] }> {
  const queries = [
    `${companyName} phone number address contact`,
    `${companyName} headquarters location`,
    `site:${new URL(website).hostname} contact`,
  ]

  const allResults: SerperSearchResult[] = []
  for (const q of queries) {
    const results = await serperSearch(q, 5)
    allResults.push(...results)
  }

  const snippets = allResults.map((r) => `${r.title}: ${r.snippet}`)

  // Extract phone number from snippets using regex
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
  let phone: string | undefined
  for (const s of snippets) {
    const match = s.match(phoneRegex)
    if (match) {
      phone = match[0]
      break
    }
  }

  // Extract address-like patterns (basic heuristic)
  const addressRegex =
    /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)[,\s]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/i
  let address: string | undefined
  for (const s of snippets) {
    const match = s.match(addressRegex)
    if (match) {
      address = match[0]
      break
    }
  }

  return { phone, address, snippets }
}

/**
 * Search for competitor companies in the same industry.
 */
export async function searchCompetitors(
  companyName: string,
  industry?: string
): Promise<SerperSearchResult[]> {
  const query = industry
    ? `${companyName} competitors alternatives ${industry}`
    : `${companyName} competitors alternatives similar companies`

  return serperSearch(query, 10)
}

export { serperSearch }
