import { useEffect, useRef, useState } from 'react'
import { Search, Download, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatInput } from '@/components/ChatInput'
import { ProgressSteps } from '@/components/ProgressSteps'
import { CompanyCard } from '@/components/CompanyCard'
import { ProductsCard } from '@/components/ProductsCard'
import { PainPointsCard } from '@/components/PainPointsCard'
import { CompetitorsCard } from '@/components/CompetitorsCard'
import { SettingsPanel } from '@/components/SettingsPanel'
import { startResearch, downloadPDF, sendToDiscord } from '@/lib/api'
import type {
  ChatMessage,
  CompanyResearch,
  DiscordConfig,
  ResearchStage,
} from '@/lib/types'

const DEFAULT_DISCORD_CONFIG: DiscordConfig = {
  botToken: '',
  channelId: '',
  applicantName: '',
  applicantEmail: '',
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentStage, setCurrentStage] = useState<ResearchStage>('searching')
  const [progressMessage, setProgressMessage] = useState('')
  const [discordConfig, setDiscordConfig] = useState<DiscordConfig>(DEFAULT_DISCORD_CONFIG)
  const [pdfLoading, setPdfLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentStage, progressMessage])

  const handleSubmit = async (query: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
    }

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      isLoading: true,
      stage: 'searching',
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setIsLoading(true)
    setCurrentStage('searching')
    setProgressMessage('Starting research...')

    try {
      const { promise } = startResearch(query, (event) => {
        setCurrentStage(event.stage)
        setProgressMessage(event.message)
      })

      const research = await promise

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, isLoading: false, research, stage: 'done' }
            : m
        )
      )

      if (discordConfig.botToken && discordConfig.channelId) {
        sendToDiscord(discordConfig, research).catch(() => {})
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Research failed'
      setCurrentStage('error')
      setProgressMessage(errMsg)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, isLoading: false, content: `Error: ${errMsg}`, stage: 'error' }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async (research: CompanyResearch) => {
    setPdfLoading(true)
    try {
      const blob = await downloadPDF(research)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${research.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'PDF download failed')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Company Research Assistant</h1>
        </div>
        <SettingsPanel config={discordConfig} onSave={setDiscordConfig} />
      </header>

      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="rounded-full bg-primary/10 p-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Research any company</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Enter a company name or website URL to get AI-powered insights,
                  competitor analysis, and a downloadable PDF report.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Stripe', 'https://notion.so', 'Shopify'].map((example) => (
                  <button
                    key={example}
                    onClick={() => handleSubmit(example)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors cursor-pointer"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'user' && (
                <div className="flex justify-end mb-4">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%] text-sm">
                    {msg.content}
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="space-y-4">
                  {msg.isLoading && (
                    <ProgressSteps
                      currentStage={currentStage}
                      message={progressMessage}
                    />
                  )}

                  {msg.research && (
                    <div className="space-y-4">
                      <CompanyCard research={msg.research} />
                      <ProductsCard products={msg.research.productsServices} />
                      <PainPointsCard painPoints={msg.research.painPoints} />
                      <CompetitorsCard competitors={msg.research.competitors} />

                      <div className="flex justify-center pt-2">
                        <Button
                          onClick={() => handleDownloadPDF(msg.research!)}
                          disabled={pdfLoading}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {pdfLoading ? 'Generating...' : 'Download PDF Report'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {msg.content && msg.stage === 'error' && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                      {msg.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div ref={chatEndRef} />
        </div>
      </div>

      <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
