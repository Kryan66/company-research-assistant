import * as cheerio from 'cheerio'
import type { CrawledPage } from '../types/index.js'

const MAX_PAGES = 18
const FETCH_TIMEOUT_MS = 10000

// Pages we actively look for by URL path keywords
const PRIORITY_PATHS = [
  'about',
  'products',
  'services',
  'solutions',
  'contact',
  'pricing',
  'company',
  'team',
  'platform',
  'features',
]

// URL patterns to skip (login, admin, cart, etc.)
const SKIP_PATTERNS = [
  /\/login/i,
  /\/signin/i,
  /\/signup/i,
  /\/register/i,
  /\/cart/i,
  /\/checkout/i,
  /\/account/i,
  /\/admin/i,
  /\/wp-admin/i,
  /\/privacy/i,
  /\/terms/i,
  /\/cookie/i,
  /\/legal/i,
  /\/blog\//i,
  /\/news\//i,
  /\/careers/i,
  /\/jobs/i,
  /\.(pdf|jpg|png|gif|svg|css|js|zip)$/i,
]

// HTML elements to strip before text extraction (nav, footer, scripts)
const STRIP_SELECTORS = [
  'script',
  'style',
  'noscript',
  'nav',
  'footer',
  'header',
  '.nav',
  '.navbar',
  '.footer',
  '.cookie',
  '.sidebar',
  '#cookie',
  '[role="navigation"]',
  '[role="banner"]',
]

function normalizeUrl(url: string, base: string): string | null {
  try {
    const resolved = new URL(url, base)
    // Only follow same-origin links
    const baseOrigin = new URL(base).origin
    if (resolved.origin !== baseOrigin) return null
    // Remove hash and trailing slash for dedup
    resolved.hash = ''
    let normalized = resolved.href.replace(/\/$/, '')
    return normalized
  } catch {
    return null
  }
}

function shouldSkip(url: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(url))
}

function extractText(html: string): { title: string; content: string } {
  const $ = cheerio.load(html)

  // Remove boilerplate elements before extracting text
  for (const selector of STRIP_SELECTORS) {
    $(selector).remove()
  }

  const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled'

  // Prefer main content areas, fall back to body
  const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', 'body']
  let content = ''
  for (const sel of mainSelectors) {
    const el = $(sel).first()
    if (el.length) {
      content = el.text().replace(/\s+/g, ' ').trim()
      if (content.length > 100) break
    }
  }

  // Truncate very long pages to keep token usage reasonable
  if (content.length > 8000) {
    content = content.slice(0, 8000) + '...'
  }

  return { title, content }
}

function scoreLink(url: string): number {
  const path = new URL(url).pathname.toLowerCase()
  for (let i = 0; i < PRIORITY_PATHS.length; i++) {
    if (path.includes(PRIORITY_PATHS[i])) return PRIORITY_PATHS.length - i + 10
  }
  // Root/home page gets high priority
  if (path === '' || path === '/') return 20
  return 1
}

async function fetchPage(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; CompanyResearchBot/1.0; +https://github.com/company-research)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })

    if (!response.ok) return null
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) return null

    return await response.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function discoverLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html)
  const links: string[] = []

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
      return
    }
    const normalized = normalizeUrl(href, baseUrl)
    if (normalized && !shouldSkip(normalized)) {
      links.push(normalized)
    }
  })

  return links
}

/**
 * Crawl a company website starting from the given URL.
 * Discovers and visits priority pages (About, Products, Contact, etc.)
 * with a max page limit and deduplication.
 */
export async function crawlWebsite(
  startUrl: string,
  onProgress?: (message: string) => void
): Promise<CrawledPage[]> {
  const visited = new Set<string>()
  const contentHashes = new Set<string>()
  const pages: CrawledPage[] = []
  const queue: string[] = []

  const normalizedStart = normalizeUrl(startUrl, startUrl)
  if (!normalizedStart) throw new Error('Invalid start URL')

  queue.push(normalizedStart)

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    // Sort queue by priority so important pages are crawled first
    queue.sort((a, b) => scoreLink(b) - scoreLink(a))
    const url = queue.shift()!

    if (visited.has(url)) continue
    visited.add(url)

    onProgress?.(`Crawling: ${url}`)

    const html = await fetchPage(url)
    if (!html) continue

    const { title, content } = extractText(html)

    // Deduplicate by content hash (first 500 chars)
    const contentKey = content.slice(0, 500)
    if (contentKey.length < 50 || contentHashes.has(contentKey)) continue
    contentHashes.add(contentKey)

    pages.push({ url, title, content })

    // Discover new internal links
    const links = discoverLinks(html, url)
    for (const link of links) {
      if (!visited.has(link) && !queue.includes(link)) {
        queue.push(link)
      }
    }
  }

  return pages
}
