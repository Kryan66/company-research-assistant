import { Router, type Request, type Response } from 'express'
import {
  resolveCompanyWebsite,
  searchCompanyInfo,
  searchCompetitors,
} from '../services/serper.js'
import { crawlWebsite } from '../services/crawler.js'
import { analyzeCompany, buildResearchResult } from '../services/openrouter.js'
import { generatePDFReport } from '../services/pdf.js'
import { sendToDiscord } from '../services/discord.js'
import type { CompanyResearch, DiscordConfig, ProgressEvent } from '../types/index.js'

const router = Router()

function isUrl(input: string): boolean {
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`)
    return !!url.hostname.includes('.')
  } catch {
    return false
  }
}

function sendSSE(res: Response, event: ProgressEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`)
}

/**
 * Main research endpoint — streams progress via Server-Sent Events.
 * POST body: { query: string }
 * AI model is hardcoded server-side (free models only).
 */
router.post('/research', async (req: Request, res: Response) => {
  const { query } = req.body as { query: string }

  if (!query?.trim()) {
    res.status(400).json({ error: 'Query is required' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    let website: string
    let companyName: string

    sendSSE(res, { stage: 'searching', message: 'Searching for company information...' })

    if (isUrl(query)) {
      website = query.startsWith('http') ? query : `https://${query}`
      companyName = new URL(website).hostname.replace('www.', '').split('.')[0]
      companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1)
    } else {
      companyName = query.trim()
      website = await resolveCompanyWebsite(companyName)
      sendSSE(res, {
        stage: 'searching',
        message: `Found website: ${website}`,
      })
    }

    const searchInfo = await searchCompanyInfo(companyName, website)

    sendSSE(res, { stage: 'crawling', message: 'Crawling company website...' })

    const crawledPages = await crawlWebsite(website, (msg) => {
      sendSSE(res, { stage: 'crawling', message: msg })
    })

    sendSSE(res, {
      stage: 'crawling',
      message: `Crawled ${crawledPages.length} pages`,
    })

    sendSSE(res, { stage: 'analyzing', message: 'Analyzing with AI...' })

    const competitorResults = await searchCompetitors(companyName)

    const analysis = await analyzeCompany(
      companyName,
      website,
      crawledPages,
      searchInfo.snippets,
      competitorResults,
      searchInfo.phone,
      searchInfo.address,
      () => {
        sendSSE(res, {
          stage: 'analyzing',
          message: 'Model busy, retrying with backup',
        })
      }
    )

    const research = buildResearchResult(
      analysis,
      website,
      searchInfo.phone,
      searchInfo.address
    )

    sendSSE(res, {
      stage: 'competitors',
      message: `Found ${research.competitors.length} competitors`,
      data: research,
    })

    sendSSE(res, {
      stage: 'done',
      message: 'Research complete!',
      data: research,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    sendSSE(res, { stage: 'error', message })
  }

  res.end()
})

/** Generate and return a PDF report */
router.post('/pdf', (req: Request, res: Response) => {
  const research = req.body as CompanyResearch

  if (!research?.companyName) {
    res.status(400).json({ error: 'Research data is required' })
    return
  }

  try {
    const pdfBuffer = generatePDFReport(research)
    const filename = `${research.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(pdfBuffer)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF generation failed'
    res.status(500).json({ error: message })
  }
})

/** Send report to Discord channel */
router.post('/discord', async (req: Request, res: Response) => {
  const { config, research } = req.body as {
    config: DiscordConfig
    research: CompanyResearch
  }

  if (!config?.botToken || !config?.channelId) {
    res.status(400).json({ error: 'Discord configuration is required' })
    return
  }

  if (!research?.companyName) {
    res.status(400).json({ error: 'Research data is required' })
    return
  }

  try {
    const pdfBuffer = generatePDFReport(research)
    await sendToDiscord(
      config,
      research.companyName,
      research.website,
      pdfBuffer
    )
    res.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Discord send failed'
    res.status(500).json({ error: message })
  }
})

export default router
