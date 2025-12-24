'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Library, Star, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RatingInput, RatingDisplay } from '@/components/shelf/RatingInput'
import { updateShelfItem, removeFromShelf } from '@/lib/supabase/user-queries'
import type { UserGameWithGame, UserProfile, ShelfStatus } from '@/types/database'

const STATUS_CONFIG: Record<ShelfStatus, { label: string; icon: string; color: string }> = {
  owned: { label: 'Owned', icon: '📦', color: 'bg-green-100 text-green-800' },
  want_to_buy: { label: 'Want to Buy', icon: '🛒', color: 'bg-blue-100 text-blue-800' },
  want_to_play: { label: 'Want to Play', icon: '🎯', color: 'bg-purple-100 text-purple-800' },
  wishlist: { label: 'Wishlist', icon: '⭐', color: 'bg-yellow-100 text-yellow-800' },
  previously_owned: { label: 'Previously Owned', icon: '📤', color: 'bg-gray-100 text-gray-800' },
}

interface ShelfContentProps {
  initialData: UserGameWithGame[]
  profile: UserProfile | null
}

export function ShelfContent({ initialData, profile }: ShelfContentProps) {
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
    } catch (error) {
      console.error('Error updating rating:', error)
    }
  }

  const handleUpdateStatus = async (id: string, status: ShelfStatus) => {
    try {
      await updateShelfItem(id, { status })
      setShelfItems(items =>
        items.map(item =>
          item.id === id ? { ...item, status } : item
        )
      )
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await removeFromShelf(id)
      setShelfItems(items => items.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error removing from shelf:', error)
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
      <div className="flex flex-wrap gap-4 mb-6">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ShelfStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <SelectItem key={status} value={status}>
                {config.icon} {config.label} ({statusCounts[status] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as typeof sortBy)}
        >
          <SelectTrigger className="w-[180px]">
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

      {/* Game list */}
      {filteredItems.length > 0 && (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Game image */}
                  <Link href={`/games/${item.game?.slug}`} className="shrink-0">
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted">
                      {item.game?.thumbnail_url ? (
                        <Image
                          src={item.game.thumbnail_url}
                          alt={item.game.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Library className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Game info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/games/${item.game?.slug}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {item.game?.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={STATUS_CONFIG[item.status]?.color}
                          >
                            {STATUS_CONFIG[item.status]?.icon}{' '}
                            {STATUS_CONFIG[item.status]?.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`/games/${item.game?.slug}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="mt-3">
                      <RatingInput
                        value={item.rating}
                        onChange={(rating) => handleUpdateRating(item.id, rating)}
                        size="sm"
                      />
                    </div>

                    {/* Status selector (mobile-friendly) */}
                    <div className="mt-3 sm:hidden">
                      <Select
                        value={item.status}
                        onValueChange={(value) => handleUpdateStatus(item.id, value as ShelfStatus)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                            <SelectItem key={status} value={status}>
                              {config.icon} {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
