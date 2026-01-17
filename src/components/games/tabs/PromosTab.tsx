'use client'

import { Gift, Info } from 'lucide-react'
import { PromoCard } from '@/components/games/PromoCard'
import type { PromoGame } from '@/types/database'

export interface PromosTabProps {
  gameName: string
  promos: PromoGame[]
}

/**
 * Tab component for displaying promo games linked to a parent game.
 * Shows a grid of PromoCard components with brief intro text.
 */
export function PromosTab({ gameName, promos }: PromosTabProps) {
  if (promos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Gift className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="font-semibold text-lg mb-2">No Promos Available</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          We don&apos;t have any promotional items or extras listed for {gameName} yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/30">
        <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Promos & Extras</strong> are official promotional items,
            Kickstarter exclusives, and convention-exclusive content released for this game.
            These are typically not available through retail and may be harder to find.
          </p>
        </div>
      </div>

      {/* Grid of promo cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promos.map((promo) => (
          <PromoCard key={promo.id} promo={promo} />
        ))}
      </div>
    </div>
  )
}
