'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Users, Clock, Brain, BookOpen, FileText, ListChecks, Bookmark } from 'lucide-react'

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

  const contentTypes = [
    { key: 'has_rules', label: 'Rules', icon: BookOpen, href: 'rules' },
    { key: 'has_score_sheet', label: 'Score', icon: FileText, href: 'score-sheet' },
    { key: 'has_setup_guide', label: 'Setup', icon: ListChecks, href: 'setup' },
    { key: 'has_reference', label: 'Ref', icon: Bookmark, href: 'reference' },
  ] as const

  const availableContent = contentTypes.filter(
    (type) => game[type.key as keyof GameRow]
  )

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

        {/* Hover overlay with quick actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex flex-wrap gap-1.5">
              {availableContent.map((type) => (
                <Link
                  key={type.key}
                  href={`/games/${game.slug}/${type.href}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-medium text-black shadow-sm hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  <type.icon className="h-3 w-3" />
                  {type.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-5">
        <h3 className="font-semibold text-lg leading-tight tracking-tight group-hover:text-primary transition-colors duration-200">
          {game.name}
        </h3>

        {game.tagline && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {game.tagline}
          </p>
        )}

        {/* Game stats */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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

          {game.weight && (
            <div className="flex items-center gap-1.5">
              <Brain className="h-4 w-4" />
              <span>{game.weight.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Categories */}
        {game.categories && game.categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
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
