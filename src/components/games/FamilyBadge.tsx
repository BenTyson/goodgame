import Link from 'next/link'
import { Users2, ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { GameFamily } from '@/types/database'

interface FamilyBadgeProps {
  family: GameFamily
  variant?: 'default' | 'compact'
}

export function FamilyBadge({ family, variant = 'default' }: FamilyBadgeProps) {
  if (variant === 'compact') {
    return (
      <Link href={`/families/${family.slug}`}>
        <Badge
          variant="outline"
          className="gap-1.5 hover:bg-accent transition-colors"
        >
          <Users2 className="h-3 w-3" />
          {family.name}
        </Badge>
      </Link>
    )
  }

  return (
    <Link
      href={`/families/${family.slug}`}
      className="group inline-flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <Users2 className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">
        Part of the{' '}
        <span className="font-medium text-foreground">{family.name}</span>{' '}
        family
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
