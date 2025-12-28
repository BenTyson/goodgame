'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package,
  ShoppingCart,
  Dices,
  Star,
  ArchiveX,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Game } from '@/types/database'

interface ShelfGame {
  id: string
  status: string
  rating: number | null
  game: Pick<Game, 'id' | 'name' | 'slug' | 'box_image_url'> | null
}

interface ShelfStats {
  total: number
  owned: number
  want_to_buy: number
  want_to_play: number
  wishlist: number
  previously_owned: number
}

interface ProfileShelfGridProps {
  shelfData: ShelfGame[] | null
  shelfStats: ShelfStats | null
  isOwnProfile: boolean
  showShelf: boolean
  showViewFullButton?: boolean
  username?: string
}

const statusConfig = {
  owned: { label: 'Owned', icon: Package, color: 'text-primary' },
  want_to_buy: { label: 'Want to Buy', icon: ShoppingCart, color: 'text-primary' },
  want_to_play: { label: 'Want to Play', icon: Dices, color: 'text-primary' },
  wishlist: { label: 'Wishlist', icon: Star, color: 'text-primary' },
  previously_owned: { label: 'Previously Owned', icon: ArchiveX, color: 'text-muted-foreground' },
}

type StatusFilter = 'all' | keyof typeof statusConfig

export function ProfileShelfGrid({
  shelfData,
  shelfStats,
  isOwnProfile,
  showShelf,
  showViewFullButton = false,
  username,
}: ProfileShelfGridProps) {
  const [filter, setFilter] = useState<StatusFilter>('all')

  // Handle private shelf
  if (!showShelf) {
    return (
      <div className="py-12 text-center rounded-xl border border-dashed">
        <Lock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground text-sm">
          This user&apos;s game collection is private.
        </p>
      </div>
    )
  }

  // Handle empty shelf
  if (!shelfData || shelfData.length === 0) {
    return (
      <div className="py-12 text-center rounded-xl border border-dashed">
        <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground text-sm">
          {isOwnProfile
            ? "You haven't added any games yet."
            : 'No games in collection.'}
        </p>
        {isOwnProfile && (
          <Button className="mt-4" size="sm" asChild>
            <Link href="/games">Browse Games</Link>
          </Button>
        )}
      </div>
    )
  }

  // Filter games
  const filteredGames = filter === 'all'
    ? shelfData
    : shelfData.filter(item => item.status === filter)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          Game Shelf
        </h2>
        {shelfStats && shelfStats.total > 0 && isOwnProfile && (
          <Button variant={showViewFullButton ? 'outline' : 'ghost'} size="sm" asChild>
            <Link href="/shelf">View Full Shelf</Link>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      {shelfStats && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <Badge
            variant={filter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('all')}
          >
            All ({shelfStats.total})
          </Badge>
          {shelfStats.owned > 0 && (
            <Badge
              variant={filter === 'owned' ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setFilter('owned')}
            >
              Owned ({shelfStats.owned})
            </Badge>
          )}
          {shelfStats.wishlist > 0 && (
            <Badge
              variant={filter === 'wishlist' ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setFilter('wishlist')}
            >
              Wishlist ({shelfStats.wishlist})
            </Badge>
          )}
          {shelfStats.want_to_play > 0 && (
            <Badge
              variant={filter === 'want_to_play' ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setFilter('want_to_play')}
            >
              Want to Play ({shelfStats.want_to_play})
            </Badge>
          )}
          {shelfStats.want_to_buy > 0 && (
            <Badge
              variant={filter === 'want_to_buy' ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setFilter('want_to_buy')}
            >
              Want to Buy ({shelfStats.want_to_buy})
            </Badge>
          )}
        </div>
      )}

      {/* Games Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
        {filteredGames.map((item) => {
          if (!item.game) return null
          const config = statusConfig[item.status as keyof typeof statusConfig]

          return (
            <Link
              key={item.id}
              href={`/games/${item.game.slug}`}
              className="group"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                {item.game.box_image_url ? (
                  <Image
                    src={item.game.box_image_url}
                    alt={item.game.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, 16vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                    <span className="text-xl font-bold text-primary/40">
                      {item.game.name.charAt(0)}
                    </span>
                  </div>
                )}
                {/* Status icon */}
                {config && (
                  <div className="absolute bottom-1 right-1">
                    <div className={`p-1 rounded-full bg-background/90 shadow-sm ${config.color}`}>
                      <config.icon className="h-3 w-3" />
                    </div>
                  </div>
                )}
                {/* Rating */}
                {item.rating && (
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-background/90 text-xs font-medium shadow-sm">
                    {item.rating}/10
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-xs text-center truncate text-muted-foreground group-hover:text-foreground transition-colors">
                {item.game.name}
              </p>
            </Link>
          )
        })}
      </div>

      {/* Show more indicator */}
      {shelfStats && shelfStats.total > 12 && !isOwnProfile && (
        <p className="text-xs text-center text-muted-foreground">
          Showing {Math.min(filteredGames.length, 12)} of {shelfStats.total} games
        </p>
      )}
    </div>
  )
}
