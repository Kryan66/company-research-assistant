import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import type { DiscordConfig } from '@/lib/types'

interface SettingsPanelProps {
  config: DiscordConfig
  onSave: (config: DiscordConfig) => void
}

export function SettingsPanel({ config, onSave }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<DiscordConfig>(config)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Discord Integration</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Configure Discord to automatically send reports after research completes.
              Settings are stored in session only (not persisted).
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="botToken">Discord Bot Token</Label>
                <Input
                  id="botToken"
                  type="password"
                  placeholder="Bot token from Discord Developer Portal"
                  value={form.botToken}
                  onChange={(e) => setForm({ ...form, botToken: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="channelId">Discord Channel ID</Label>
                <Input
                  id="channelId"
                  placeholder="Channel ID to post reports"
                  value={form.channelId}
                  onChange={(e) => setForm({ ...form, channelId: e.target.value })}
                />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="applicantName">Applicant Name</Label>
                <Input
                  id="applicantName"
                  placeholder="Your name"
                  value={form.applicantName}
                  onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="applicantEmail">Applicant Email</Label>
                <Input
                  id="applicantEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={form.applicantEmail}
                  onChange={(e) => setForm({ ...form, applicantEmail: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            {saved ? 'Saved!' : 'Save Configuration'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
