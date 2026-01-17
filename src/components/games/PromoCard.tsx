'use client'

import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { PromoGame } from '@/types/database'

interface PromoCardProps {
  promo: PromoGame
}

/**
 * Minimal card for displaying a promo game.
 * Shows image, name, year, and truncated description.
 * Links to BGG rather than internal page.
 */
export function PromoCard({ promo }: PromoCardProps) {
  const imageUrl = promo.box_image_url || promo.thumbnail_url
  const bggUrl = promo.bgg_id
    ? `https://boardgamegeek.com/boardgame/${promo.bgg_id}`
    : null

  // Truncate description to ~100 characters
  const truncatedDescription = promo.description
    ? promo.description.length > 100
      ? promo.description.slice(0, 100).trim() + '...'
      : promo.description
    : null

  return (
    <div className="group rounded-xl border border-border/50 bg-card/50 overflow-hidden hover:border-border transition-colors">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted/30">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={promo.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
            <span className="text-4xl">?</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {promo.name}
          </h3>
          {promo.year_published && (
            <span className="text-xs text-muted-foreground shrink-0">
              {promo.year_published}
            </span>
          )}
        </div>

        {truncatedDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {truncatedDescription}
          </p>
        )}

        {bggUrl && (
          <a
            href={bggUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mt-2"
          >
            View on BGG
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}
