import Link from 'next/link'
import { Users2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GameFamily } from '@/types/database'

interface FamilyCardProps {
  family: GameFamily & { game_count: number }
}

export function FamilyCard({ family }: FamilyCardProps) {
  return (
    <Link href={`/families/${family.slug}`}>
      <Card className="h-full transition-colors hover:bg-accent">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">{family.name}</h2>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {family.game_count} {family.game_count === 1 ? 'game' : 'games'}
            </Badge>
          </div>
          {family.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {family.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
