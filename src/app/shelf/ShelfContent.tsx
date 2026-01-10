'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Library,
  Star,
  Trash2,
  Package,
  ShoppingCart,
  Dices,
  ArchiveX,
  Gamepad2,
  LucideIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { RatingInput } from '@/components/shelf/RatingInput'
import { updateShelfItem, removeFromShelf } from '@/lib/supabase/user-queries'
import { cn } from '@/lib/utils'
import type { UserGameWithGame, UserProfile, ShelfStatus } from '@/types/database'

const STATUS_CONFIG: Record<ShelfStatus, { label: string; icon: LucideIcon; color: string }> = {
  owned: { label: 'Owned', icon: Package, color: 'bg-green-100 text-green-800' },
  played: { label: 'Played', icon: Gamepad2, color: 'bg-teal-100 text-teal-800' },
  want_to_buy: { label: 'Want to Buy', icon: ShoppingCart, color: 'bg-blue-100 text-blue-800' },
  want_to_play: { label: 'Want to Play', icon: Dices, color: 'bg-purple-100 text-purple-800' },
  wishlist: { label: 'Wishlist', icon: Star, color: 'bg-yellow-100 text-yellow-800' },
  previously_owned: { label: 'Previously Owned', icon: ArchiveX, color: 'bg-gray-100 text-gray-800' },
}

interface ShelfContentProps {
  initialData: UserGameWithGame[]
  profile: UserProfile | null
}

export function ShelfContent({ initialData, profile }: ShelfContentProps) {
  const router = useRouter()
  const [shelfItems, setShelfItems] = useState(initialData)
  const [statusFilter, setStatusFilter] = useState<ShelfStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'added' | 'name' | 'rating'>('added')

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = [...shelfItems]

    // Filter by status
    if (statusFilter !== 'all') {
      items = items.filter(item => item.status === statusFilter)
    }

    // Sort
    items.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.game?.name || '').localeCompare(b.game?.name || '')
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'added':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
    })

    return items
  }, [shelfItems, statusFilter, sortBy])

  // Count by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: shelfItems.length }
    for (const status of Object.keys(STATUS_CONFIG)) {
      counts[status] = shelfItems.filter(item => item.status === status).length
    }
    return counts
  }, [shelfItems])

  const handleUpdateRating = async (id: string, rating: number | null) => {
    try {
      await updateShelfItem(id, { rating })
      setShelfItems(items =>
        items.map(item =>
          item.id === id ? { ...item, rating } : item
        )
      )
    } catch {
      // Silently handle error
    }
  }

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await removeFromShelf(id)
      setShelfItems(items => items.filter(item => item.id !== id))
    } catch {
      // Silently handle error
    }
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Library className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Your Shelf</h1>
          <p className="text-muted-foreground">
            {shelfItems.length} {shelfItems.length === 1 ? 'game' : 'games'} in your collection
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Status Tabs */}
        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ShelfStatus | 'all')}
          className="w-full sm:w-auto"
        >
          <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="gap-1.5">
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">All</span>
              <span className="text-xs text-muted-foreground">({statusCounts.all})</span>
            </TabsTrigger>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const Icon = config.icon
              const count = statusCounts[status] || 0
              if (count === 0) return null
              return (
                <TabsTrigger key={status} value={status} className="gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                  <span className="text-xs text-muted-foreground">({count})</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        {/* Sort */}
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as typeof sortBy)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="added">Recently Added</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {shelfItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your shelf is empty</h2>
            <p className="text-muted-foreground mb-4">
              Start adding games to track your collection
            </p>
            <Button asChild>
              <Link href="/games">Browse Games</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Game grid */}
      {filteredItems.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => {
            const StatusIcon = STATUS_CONFIG[item.status]?.icon
            const game = item.game

            return (
              <Card
                key={item.id}
                className={cn(
                  'group overflow-hidden cursor-pointer',
                  'transition-all duration-300',
                  '[box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)]',
                  'hover:-translate-y-1 hover:border-primary/30'
                )}
                padding="none"
                onClick={() => router.push(`/games/${game?.slug}`)}
              >
                {/* Game image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {game?.box_image_url || game?.thumbnail_url ? (
                    <Image
                      src={game.box_image_url || game.thumbnail_url || ''}
                      alt={game?.name || 'Game'}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10">
                      <span className="text-4xl font-bold text-primary/30">
                        {game?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}

                  {/* Status badge overlay */}
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant="secondary"
                      className={cn(STATUS_CONFIG[item.status]?.color, 'shadow-sm')}
                    >
                      {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                      {STATUS_CONFIG[item.status]?.label}
                    </Badge>
                  </div>

                  {/* Delete button overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 hover:bg-white text-destructive hover:text-destructive shadow-sm"
                      onClick={(e) => handleRemove(item.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Game name */}
                  <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-1">
                    {game?.name}
                  </h3>

                  {/* Rating */}
                  <div
                    className="mt-3 relative z-10"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <RatingInput
                      value={item.rating}
                      onChange={(rating) => handleUpdateRating(item.id, rating)}
                      size="sm"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Filtered empty state */}
      {shelfItems.length > 0 && filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No games match the current filter
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
