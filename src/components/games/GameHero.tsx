'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Package, ImageOff } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { QuickStatsBar } from './QuickStatsBar'
import { AwardBadgeList } from './AwardBadge'
import { AggregateRating } from '@/components/reviews'
import { BuyButtons } from '@/components/monetization'
import { AddToShelfButton } from '@/components/shelf/AddToShelfButton'
import { cn } from '@/lib/utils'
import type { GameImage, Json, ComplexityTier, Category, Award, AwardCategory } from '@/types/database'

interface BaseGame {
  id: string
  name: string
  slug: string
  box_image_url?: string | null
}

interface GameAward {
  award: Award
  category: AwardCategory | null
  year: number
  result: string | null
}

interface GameHeroProps {
  game: {
    id: string
    name: string
    slug: string
    tagline?: string | null
    box_image_url?: string | null
    wikidata_image_url?: string | null
    images?: GameImage[] | null
    player_count_min: number
    player_count_max: number
    player_count_best?: number[] | null
    play_time_min?: number | null
    play_time_max?: number | null
    crunch_score?: number | null
    crunch_breakdown?: Json | null
    weight?: number | null
    complexity_tier?: ComplexityTier | null
    min_age?: number | null
    amazon_asin?: string | null
    categories?: Category[] | null
  }
  aggregateRating?: {
    average: number | null
    count: number
  }
  baseGame?: BaseGame | null
  awards?: GameAward[]
}

export function GameHero({ game, aggregateRating, baseGame, awards = [] }: GameHeroProps) {
  // Get primary image - try multiple sources
  const heroImage = game.images?.find(img => img.image_type === 'cover' || img.is_primary)
    || game.images?.[0]
  const imageUrl = heroImage?.url || game.wikidata_image_url || game.box_image_url

  // Get primary categories (max 3)
  const displayCategories = game.categories?.slice(0, 3) || []

  return (
    <div className="space-y-8">
      {/* Expansion Callout */}
      {baseGame && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <Package className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Expansion for{' '}
              <Link
                href={`/games/${baseGame.slug}`}
                className="text-primary hover:underline"
              >
                {baseGame.name}
              </Link>
            </p>
          </div>
          {baseGame.box_image_url && (
            <Link href={`/games/${baseGame.slug}`} className="shrink-0">
              <Image
                src={baseGame.box_image_url}
                alt={baseGame.name}
                width={40}
                height={40}
                className="rounded-lg object-cover"
                unoptimized={baseGame.box_image_url.includes('cf.geekdo')}
              />
            </Link>
          )}
        </div>
      )}

      {/* Main Hero Grid */}
      <div className="grid gap-8 lg:gap-12 lg:grid-cols-12 items-center">
        {/* Hero Image */}
        <div className="lg:col-span-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted shadow-xl">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={game.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 33vw"
                unoptimized={imageUrl.includes('cf.geekdo') || imageUrl.includes('wikimedia')}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <ImageOff className="h-16 w-16 opacity-50" />
                <span className="text-sm">No image available</span>
              </div>
            )}
          </div>
        </div>

        {/* Game Info */}
        <div className="lg:col-span-8 space-y-5">
          {/* Categories */}
          {displayCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayCategories.map((cat) => (
                <Link key={cat.slug} href={`/games?categories=${cat.slug}`}>
                  <Badge
                    variant="outline"
                    className="text-xs font-medium border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Title & Tagline */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {game.name}
            </h1>
            {game.tagline && (
              <p className="text-xl text-muted-foreground max-w-2xl">
                {game.tagline}
              </p>
            )}
          </div>

          {/* Community Rating */}
          {aggregateRating && aggregateRating.count > 0 ? (
            <AggregateRating
              average={aggregateRating.average}
              count={aggregateRating.count}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No community ratings yet</p>
          )}

          {/* Quick Stats - Clean inline display */}
          <QuickStatsBar
            playerCountMin={game.player_count_min}
            playerCountMax={game.player_count_max}
            playerCountBest={game.player_count_best}
            playTimeMin={game.play_time_min}
            playTimeMax={game.play_time_max}
            crunchScore={game.crunch_score}
            weight={game.weight}
            complexityTier={game.complexity_tier}
            minAge={game.min_age}
          />

          {/* Awards */}
          {awards.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Awards</p>
              <AwardBadgeList awards={awards} variant="compact" limit={5} />
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <BuyButtons
              amazonAsin={game.amazon_asin}
              gameSlug={game.slug}
            />
            <AddToShelfButton gameId={game.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
