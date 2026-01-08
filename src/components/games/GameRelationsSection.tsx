import Link from 'next/link'
import Image from 'next/image'
import {
  Puzzle,
  ArrowRight,
  Box,
  RefreshCw,
  Sparkles,
  Users2
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Game, GameFamily, RelationType } from '@/types/database'

interface GameRelationsSectionProps {
  /** The base game this is an expansion of */
  baseGame: Game | null
  /** Expansions for this game */
  expansions: Game[]
  /** Other relations grouped by type */
  otherRelations: Array<{
    type: RelationType
    label: string
    games: Game[]
  }>
  /** The game's family */
  family: GameFamily | null
  /** Display variant */
  variant?: 'default' | 'compact'
  /** Maximum expansions to show */
  expansionsLimit?: number
  className?: string
}

// Icon mapping for relation types
const relationIcons: Record<RelationType, React.ReactNode> = {
  'expansion_of': <Puzzle className="h-4 w-4" />,
  'base_game_of': <Box className="h-4 w-4" />,
  'sequel_to': <ArrowRight className="h-4 w-4" />,
  'prequel_to': <ArrowRight className="h-4 w-4 rotate-180" />,
  'reimplementation_of': <RefreshCw className="h-4 w-4" />,
  'spin_off_of': <Sparkles className="h-4 w-4" />,
  'standalone_in_series': <Users2 className="h-4 w-4" />
}

// Mini game card for relations
function MiniGameCard({ game, className }: { game: Game; className?: string }) {
  const imageUrl = game.box_image_url || game.thumbnail_url || game.wikidata_image_url

  return (
    <Link
      href={`/games/${game.slug}`}
      className={cn(
        'group flex items-center gap-3 rounded-lg border bg-card p-2 transition-all hover:shadow-md hover:border-primary/30',
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={game.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="48px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground">
            {game.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
          {game.name}
        </h4>
        {game.year_published && (
          <p className="text-xs text-muted-foreground">
            {game.year_published}
          </p>
        )}
      </div>

      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  )
}

// Base game callout (when viewing an expansion)
function BaseGameCallout({ game }: { game: Game }) {
  const imageUrl = game.box_image_url || game.thumbnail_url || game.wikidata_image_url

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group flex items-center gap-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 transition-all hover:border-primary/50 hover:bg-primary/10"
    >
      {/* Icon */}
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary shrink-0">
        <Box className="h-5 w-5" />
      </div>

      {/* Thumbnail */}
      {imageUrl && (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
          <Image
            src={imageUrl}
            alt={game.name}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-primary font-medium mb-0.5">
          Requires Base Game
        </p>
        <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
          {game.name}
        </h4>
      </div>

      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
    </Link>
  )
}

export function GameRelationsSection({
  baseGame,
  expansions,
  otherRelations,
  family,
  variant = 'default',
  expansionsLimit = 6,
  className
}: GameRelationsSectionProps) {
  const hasBaseGame = baseGame !== null
  const hasExpansions = expansions.length > 0
  const hasOtherRelations = otherRelations.length > 0 && otherRelations.some(r => r.games.length > 0)
  const hasFamily = family !== null

  // Nothing to show
  if (!hasBaseGame && !hasExpansions && !hasOtherRelations && !hasFamily) {
    return null
  }

  const displayExpansions = expansions.slice(0, expansionsLimit)
  const moreExpansions = expansions.length - expansionsLimit

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        {hasBaseGame && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Puzzle className="h-3 w-3" />
              Expansion
            </Badge>
            <span className="text-sm text-muted-foreground">of</span>
            <Link
              href={`/games/${baseGame.slug}`}
              className="text-sm font-medium hover:text-primary hover:underline"
            >
              {baseGame.name}
            </Link>
          </div>
        )}
        {hasExpansions && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">{expansions.length} expansion{expansions.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {hasFamily && (
          <Link
            href={`/families/${family.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Users2 className="h-3.5 w-3.5" />
            <span>Part of the <span className="font-medium text-foreground">{family.name}</span> family</span>
          </Link>
        )}
      </div>
    )
  }

  // Default variant - full display
  return (
    <div className={cn('space-y-6', className)}>
      {/* Base Game Callout (for expansions) */}
      {hasBaseGame && (
        <BaseGameCallout game={baseGame} />
      )}

      {/* Expansions Grid */}
      {hasExpansions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Puzzle className="h-4 w-4 text-muted-foreground" />
              Expansions
              <Badge variant="secondary" className="ml-1 text-xs">
                {expansions.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Expand your game with additional content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {displayExpansions.map((game) => (
                <MiniGameCard key={game.id} game={game} />
              ))}
            </div>
            {moreExpansions > 0 && family && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3"
                asChild
              >
                <Link href={`/families/${family.slug}`}>
                  View all {expansions.length} expansions
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Other Relations */}
      {hasOtherRelations && (
        <div className="space-y-4">
          {otherRelations.map(({ type, label, games }) => {
            if (games.length === 0) return null

            return (
              <div key={type} className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {relationIcons[type] || <Sparkles className="h-4 w-4" />}
                  </span>
                  {label}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {games.slice(0, 4).map((game) => (
                    <MiniGameCard key={game.id} game={game} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Family Link (at bottom if not expansion) */}
      {hasFamily && !hasBaseGame && (
        <Link
          href={`/families/${family.slug}`}
          className="group flex items-center gap-3 rounded-lg border bg-muted/30 p-4 transition-all hover:bg-muted/50 hover:border-primary/30"
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Users2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Part of</p>
            <p className="font-medium group-hover:text-primary transition-colors">
              The {family.name} Family
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  )
}
