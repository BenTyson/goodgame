'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Loader2, Check, X, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface ShelfGame {
  game_id: string
  game_name: string
  game_slug: string
  game_image: string | null
}

interface TradeSelectorProps {
  userId: string
  selectedGameIds: string[]
  onSelectionChange: (gameIds: string[]) => void
  maxGames?: number
  className?: string
}

export function TradeSelector({
  userId,
  selectedGameIds,
  onSelectionChange,
  maxGames = 10,
  className,
}: TradeSelectorProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ownedGames, setOwnedGames] = useState<ShelfGame[]>([])

  // Fetch user's owned games from shelf
  useEffect(() => {
    const fetchOwnedGames = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/user/shelf?user_id=${userId}&status=owned`)
        if (!response.ok) {
          throw new Error('Failed to fetch shelf')
        }

        const data = await response.json()
        // Transform shelf items to our format
        const games: ShelfGame[] = (data.items || []).map((item: {
          game_id: string
          game: {
            name: string
            slug: string
            box_image_url?: string | null
            thumbnail_url?: string | null
          }
        }) => ({
          game_id: item.game_id,
          game_name: item.game.name,
          game_slug: item.game.slug,
          game_image: item.game.box_image_url || item.game.thumbnail_url || null,
        }))

        setOwnedGames(games)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load your games')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOwnedGames()
  }, [userId])

  const toggleGame = (gameId: string) => {
    if (selectedGameIds.includes(gameId)) {
      onSelectionChange(selectedGameIds.filter(id => id !== gameId))
    } else if (selectedGameIds.length < maxGames) {
      onSelectionChange([...selectedGameIds, gameId])
    }
  }

  const clearSelection = () => {
    onSelectionChange([])
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading your games...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('text-center py-6 text-destructive', className)}>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (ownedGames.length === 0) {
    return (
      <div className={cn('text-center py-6 border rounded-lg bg-muted/30', className)}>
        <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No owned games on your shelf
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Add games to your shelf to offer them in trades
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Selection Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {selectedGameIds.length} of {maxGames} games selected
        </span>
        {selectedGameIds.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="h-auto py-1 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
        {ownedGames.map((game) => {
          const isSelected = selectedGameIds.includes(game.game_id)
          const isDisabled = !isSelected && selectedGameIds.length >= maxGames

          return (
            <button
              key={game.game_id}
              type="button"
              onClick={() => !isDisabled && toggleGame(game.game_id)}
              disabled={isDisabled}
              className={cn(
                'relative flex flex-col items-center p-2 border rounded-lg transition-all text-left',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-1.5 right-1.5">
                <Checkbox
                  checked={isSelected}
                  disabled={isDisabled}
                  className={cn(
                    'h-4 w-4',
                    isSelected && 'bg-primary border-primary text-primary-foreground'
                  )}
                  tabIndex={-1}
                />
              </div>

              {/* Game Image */}
              <div className="relative w-full aspect-square rounded overflow-hidden bg-muted mb-1.5">
                {game.game_image ? (
                  <Image
                    src={game.game_image}
                    alt={game.game_name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                {/* Selected Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>

              {/* Game Name */}
              <span className="text-xs text-center line-clamp-2 w-full">
                {game.game_name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected Games Summary */}
      {selectedGameIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t">
          {selectedGameIds.map((gameId) => {
            const game = ownedGames.find(g => g.game_id === gameId)
            if (!game) return null

            return (
              <div
                key={gameId}
                className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs"
              >
                <span className="truncate max-w-24">{game.game_name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleGame(gameId)
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
