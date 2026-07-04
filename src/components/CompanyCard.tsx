import { Building2, Globe, Phone, MapPin } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { CompanyResearch } from '@/lib/types'

interface CompanyCardProps {
  research: CompanyResearch
}

export function CompanyCard({ research }: CompanyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {research.companyName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{research.summary}</p>

        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <a
              href={research.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate"
            >
              {research.website}
            </a>
          </div>
          {research.phoneNumber && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{research.phoneNumber}</span>
            </div>
          )}
          {research.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span>{research.address}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
