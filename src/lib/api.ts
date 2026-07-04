import type { CompanyResearch, DiscordConfig, ProgressEvent } from './types'

const API_BASE = '/api'

/**
 * Start a research job and stream progress via SSE.
 * AI model is hardcoded server-side — not configurable from the client.
 */
export function startResearch(
  query: string,
  onProgress: (event: ProgressEvent) => void
): { promise: Promise<CompanyResearch>; abort: () => void } {
  const controller = new AbortController()

  const promise = new Promise<CompanyResearch>((resolve, reject) => {
    fetch(`${API_BASE}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }))
          throw new Error(err.error || 'Research request failed')
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No response stream')

        const decoder = new TextDecoder()
        let buffer = ''
        let finalData: CompanyResearch | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: ProgressEvent = JSON.parse(line.slice(6))
                onProgress(event)

                if (event.stage === 'done' && event.data) {
                  finalData = event.data as CompanyResearch
                }
                if (event.stage === 'error') {
                  throw new Error(event.message)
                }
              } catch (e) {
                if (e instanceof Error && e.message !== line.slice(6)) {
                  throw e
                }
              }
            }
          }
        }

        if (finalData) {
          resolve(finalData)
        } else {
          reject(new Error('Research completed without data'))
        }
      })
      .catch(reject)
  })

  return {
    promise,
    abort: () => controller.abort(),
  }
}

export async function downloadPDF(research: CompanyResearch): Promise<Blob> {
  const res = await fetch(`${API_BASE}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(research),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'PDF generation failed' }))
    throw new Error(err.error)
  }

  return res.blob()
}

export async function sendToDiscord(
  config: DiscordConfig,
  research: CompanyResearch
): Promise<void> {
  const res = await fetch(`${API_BASE}/discord`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, research }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Discord send failed' }))
    throw new Error(err.error)
  }
}
