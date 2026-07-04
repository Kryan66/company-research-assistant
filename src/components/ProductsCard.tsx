import { Package } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface ProductsCardProps {
  products: string[]
}

export function ProductsCard({ products }: ProductsCardProps) {
  if (products.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Products & Services
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {products.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
