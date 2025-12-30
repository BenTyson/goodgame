'use client'

import * as React from 'react'
import Image from 'next/image'
import { Search, X, Check, Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

export interface GameOptionData {
  id: string
  name: string
  slug: string
  thumbnail_url: string | null
  year_published?: number | null
}

interface GameSelectorProps {
  selectedGame: GameOptionData | null
  onSelect: (game: GameOptionData | null) => void
  ownedGames?: GameOptionData[]
  className?: string
}

function GameOptionRow({
  game,
  isSelected,
  onSelect,
}: {
  game: GameOptionData
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-lg transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-primary/10'
      )}
    >
      <div className="relative w-12 h-12 shrink-0 rounded overflow-hidden bg-muted">
        {game.thumbnail_url ? (
          <Image
            src={game.thumbnail_url}
            alt={game.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
            {game.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-medium truncate">{game.name}</p>
        {game.year_published && (
          <p className="text-xs text-muted-foreground">{game.year_published}</p>
        )}
      </div>
      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
    </button>
  )
}

function renderGameList(
  games: GameOptionData[],
  selectedGameId: string | undefined,
  onSelect: (game: GameOptionData) => void
) {
  return games.map((game) => (
    <GameOptionRow
      key={game.id}
      game={game}
      isSelected={selectedGameId === game.id}
      onSelect={() => onSelect(game)}
    />
  ))
}

export function GameSelector({
  selectedGame,
  onSelect,
  ownedGames = [],
  className,
}: GameSelectorProps) {
  const [query, setQuery] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<GameOptionData[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const debouncedQuery = useDebounce(query, 300)

  // Search for games when query changes
  React.useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults([])
      return
    }

    const searchGames = async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/games/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          const games: GameOptionData[] = data.games || []
          setSearchResults(games)
        }
      } catch (error) {
        console.error('Error searching games:', error)
      } finally {
        setIsSearching(false)
      }
    }

    searchGames()
  }, [debouncedQuery])

  const handleSelect = (game: GameOptionData) => {
    onSelect(game)
    setQuery('')
    setSearchResults([])
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
  }

  // If a game is selected, show it with clear button
  if (selectedGame) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden bg-muted">
            {selectedGame.thumbnail_url ? (
              <Image
                src={selectedGame.thumbnail_url}
                alt={selectedGame.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                {selectedGame.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{selectedGame.name}</h3>
            {selectedGame.year_published && (
              <p className="text-sm text-muted-foreground">
                {selectedGame.year_published}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for a game..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <Card className="p-2">
          <p className="text-xs text-muted-foreground px-2 py-1">Search Results</p>
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {renderGameList(searchResults, undefined, handleSelect)}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Owned games */}
      {ownedGames.length > 0 && query.length < 2 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Your Games
          </p>
          <ScrollArea className="h-[300px]">
            <div className="space-y-1">
              {renderGameList(ownedGames, undefined, handleSelect)}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Empty state for owned games */}
      {ownedGames.length === 0 && query.length < 2 && !isSearching && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Search for a game above, or add games to your shelf to see them here.
          </p>
        </Card>
      )}
    </div>
  )
}
