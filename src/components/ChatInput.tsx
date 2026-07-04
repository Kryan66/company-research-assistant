import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatInputProps {
  onSubmit: (query: string) => void
  isLoading: boolean
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSubmit(trimmed)
    setInput('')
  }

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-3">
        <p className="text-xs text-muted-foreground">Model: GPT-OSS 120B (Free)</p>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Enter a company name (e.g. "Stripe") or URL (e.g. "https://stripe.com")'
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="shrink-0">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
