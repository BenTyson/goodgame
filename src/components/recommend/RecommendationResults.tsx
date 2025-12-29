'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  RotateCcw,
  Users,
  Clock,
  BarChart3,
  ArrowRight,
  RefreshCw,
  Dices,
  Brain,
  Handshake,
  BookOpen,
  Zap,
  Gem,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Archetype, GameRecommendation, GameSuggestion } from '@/lib/recommend/types'
import { cn } from '@/lib/utils'

// Map archetype icons to components
const ARCHETYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Users,
  Handshake,
  BookOpen,
  Zap,
  Gem,
  Star,
}

interface RecommendationResultsProps {
  archetype: Archetype
  recommendations: GameRecommendation[]
  alsoConsider: GameSuggestion[]
  onRestart: () => void
}

export function RecommendationResults({
  archetype,
  recommendations,
  alsoConsider,
  onRestart,
}: RecommendationResultsProps) {
  const ArchetypeIcon = ARCHETYPE_ICONS[archetype.icon] || Star

  return (
    <div className="animate-in fade-in duration-500">
      {/* Archetype summary */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
          <ArchetypeIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{archetype.name}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Your Perfect Games
        </h1>
        <p className="mt-2 text-muted-foreground">
          Based on your preferences, we think you will love these
        </p>
      </div>

      {/* Recommendations */}
      <div className="space-y-6">
        {recommendations.map((rec, index) => (
          <RecommendationCard
            key={rec.gameId}
            recommendation={rec}
            index={index}
          />
        ))}
      </div>

      {/* Also Consider Section */}
      {alsoConsider.length > 0 && (
        <div className="mt-10 pt-8 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Other games we think might work
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {alsoConsider.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.slug}`}
                className="group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                  {game.thumbnail_url ? (
                    <Image
                      src={game.thumbnail_url}
                      alt={game.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Dices className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium text-center px-2 line-clamp-2">
                      {game.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-10 flex flex-col items-center gap-4">
        {/* Refinement hint */}
        <p className="text-sm text-muted-foreground text-center">
          Not quite right? Try adjusting your preferences.
        </p>

        {/* Restart button */}
        <Button variant="outline" onClick={onRestart} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Start Over
        </Button>

        {/* Browse all games */}
        <Link
          href="/games"
          className="text-sm text-primary hover:underline"
        >
          Browse all games
        </Link>
      </div>
    </div>
  )
}

// Individual recommendation card
interface RecommendationCardProps {
  recommendation: GameRecommendation
  index: number
}

function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const { game, rank, confidence, personalizedReason, playPitch, perfectFor } = recommendation

  // Rank badge styles
  const rankStyles = {
    1: 'bg-amber-500 text-white',
    2: 'bg-slate-400 text-white',
    3: 'bg-amber-700 text-white',
  }

  return (
    <Card
      depth="raised"
      padding="none"
      className={cn(
        'overflow-hidden animate-in fade-in slide-in-from-bottom-4',
        `duration-500 delay-${(index + 1) * 150}`
      )}
      style={{ animationDelay: `${(index + 1) * 150}ms` }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Game image */}
        <div className="relative sm:w-48 h-48 sm:h-auto bg-muted shrink-0">
          {game.thumbnail_url ? (
            <Image
              src={game.thumbnail_url}
              alt={game.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Dices className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}

          {/* Rank badge */}
          <div
            className={cn(
              'absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
              rankStyles[rank as 1 | 2 | 3]
            )}
          >
            #{rank}
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{game.name}</h3>

              {/* Game stats */}
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {game.player_count_min}-{game.player_count_max}
                </span>
                {game.play_time_max && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {game.play_time_min || game.play_time_max}-{game.play_time_max} min
                  </span>
                )}
                {game.weight && (
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5" />
                    {game.weight.toFixed(1)}/5
                  </span>
                )}
              </div>
            </div>

            {/* Confidence badge */}
            {confidence === 'high' && (
              <Badge variant="default" className="shrink-0">
                Top Pick
              </Badge>
            )}
          </div>

          {/* Why you'll love it */}
          <div className="mt-4">
            <p className="text-sm leading-relaxed">
              {personalizedReason}
            </p>
          </div>

          {/* Perfect for line */}
          <p className="mt-3 text-sm text-primary italic">
            {perfectFor}
          </p>

          {/* Action */}
          <div className="mt-4 flex items-center gap-3">
            <Button asChild size="sm" className="gap-2">
              <Link href={`/games/${game.slug}`}>
                Learn More
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              More like this
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
