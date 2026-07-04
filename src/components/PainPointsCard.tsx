import { AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface PainPointsCardProps {
  painPoints: string[]
}

export function PainPointsCard({ painPoints }: PainPointsCardProps) {
  if (painPoints.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          AI-Identified Pain Points
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {painPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-amber-500 mt-1">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
