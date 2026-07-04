import FormData from 'form-data'
import type { DiscordConfig } from '../types/index.js'

/**
 * Send a research report notification + PDF attachment to a Discord channel.
 * Uses Discord Bot API v10 with multipart form data for the file upload.
 *
 * The message includes applicant info and company details.
 * The PDF is attached as a file in the same request.
 */
export async function sendToDiscord(
  config: DiscordConfig,
  companyName: string,
  companyWebsite: string,
  pdfBuffer: Buffer
): Promise<void> {
  const { botToken, channelId, applicantName, applicantEmail } = config

  if (!botToken || !channelId) {
    throw new Error('Discord bot token and channel ID are required')
  }

  const messageContent = [
    '📊 **New Company Research Report**',
    '',
    `**Applicant:** ${applicantName}`,
    `**Email:** ${applicantEmail}`,
    `**Company:** ${companyName}`,
    `**Website:** ${companyWebsite}`,
    '',
    '_Report PDF attached below._',
  ].join('\n')

  // Discord multipart upload: JSON payload + file attachment in one request
  const form = new FormData()

  form.append(
    'payload_json',
    JSON.stringify({ content: messageContent })
  )

  form.append('files[0]', pdfBuffer, {
    filename: `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`,
    contentType: 'application/pdf',
  })

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${botToken}`,
        ...form.getHeaders(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: form as any,
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Discord API error (${response.status}): ${text}`)
  }
}
