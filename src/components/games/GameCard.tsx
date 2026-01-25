'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Users, Clock } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PlaceholderGameImage } from './PlaceholderGameImage'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GameRow, Category } from '@/types/database'

/** Maximum number of category badges to show on game cards */
const MAX_CARD_CATEGORIES = 3

interface GameCardProps {
  game: GameRow & {
    categories?: Pick<Category, 'slug' | 'name'>[]
  }
  variant?: 'default' | 'compact' | 'featured'
}

export function GameCard({
  game,
  variant = 'default',
}: GameCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/games/${game.slug}`)
  }

  return (
    <Card
      className={cn(
        'group overflow-hidden cursor-pointer',
        'transition-all duration-300',
        '[box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)]',
        'hover:-translate-y-1.5 hover:border-primary/30',
        'active:translate-y-0 active:[box-shadow:var(--shadow-md)]',
        variant === 'featured' && 'md:col-span-2'
      )}
      padding="none"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {game.box_image_url ? (
          <Image
            src={game.box_image_url}
            alt={game.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <PlaceholderGameImage gameName={game.name} gameId={game.id} className="transition-transform duration-300 group-hover:scale-105" />
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg leading-tight tracking-tight group-hover:text-primary transition-colors duration-200">
          {game.name}
        </h3>

        {game.tagline && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {game.tagline}
          </p>
        )}

        {/* Game stats */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>
              {game.player_count_min === game.player_count_max
                ? game.player_count_min
                : `${game.player_count_min}-${game.player_count_max}`}
            </span>
          </div>

          {game.play_time_min && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>
                {game.play_time_min === game.play_time_max
                  ? `${game.play_time_min}m`
                  : `${game.play_time_min}-${game.play_time_max}m`}
              </span>
            </div>
          )}
        </div>

        {/* Categories */}
        {game.categories && game.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {game.categories.slice(0, MAX_CARD_CATEGORIES).map((category) => (
              <Badge
                key={category.slug}
                variant="secondary"
                className="text-xs"
              >
                {category.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
