import { Swords, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { Competitor } from '@/lib/types'

interface CompetitorsCardProps {
  competitors: Competitor[]
}

export function CompetitorsCard({ competitors }: CompetitorsCardProps) {
  if (competitors.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          Competitors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {competitors.map((comp, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-background/50 p-3 space-y-1"
            >
              <p className="font-medium text-sm">{comp.name}</p>
              <a
                href={comp.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
              >
                {comp.website}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              {comp.reasoning && (
                <p className="text-xs text-muted-foreground mt-1">{comp.reasoning}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
