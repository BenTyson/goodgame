'use client'

import { useState, useCallback, useEffect } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { Game } from '@/types/database'

interface GamePickerProps {
  onSelect: (game: Game) => void
  excludeGameIds?: string[]
  trigger?: React.ReactNode
  disabled?: boolean
}

export function GamePicker({
  onSelect,
  excludeGameIds = [],
  trigger,
  disabled = false,
}: GamePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)

  // Debounced search using admin API (bypasses RLS to see all games)
  useEffect(() => {
    if (!open) return

    const searchGames = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (search.length >= 2) {
          params.set('search', search)
        }
        params.set('limit', '30')

        const response = await fetch(`/api/admin/games?${params}`)
        if (!response.ok) throw new Error('Search failed')

        const { games: data } = await response.json()
        setGames(data?.filter((g: Game) => !excludeGameIds.includes(g.id)) || [])
      } catch (error) {
        console.error('Search error:', error)
        setGames([])
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(searchGames, 300)
    return () => clearTimeout(timer)
  }, [search, open, excludeGameIds])

  const handleSelect = useCallback(
    (game: Game) => {
      onSelect(game)
      setOpen(false)
      setSearch('')
    },
    [onSelect]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="gap-2"
      >
        {trigger || (
          <>
            Select a game
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </>
        )}
      </Button>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Select a game</DialogTitle>
          <DialogDescription>Search and select a game to add a relationship</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search games..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : games.length === 0 ? (
              <CommandEmpty>
                {search.length < 2 ? 'Type to search games...' : 'No games found.'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {games.map((game) => (
                  <CommandItem
                    key={game.id}
                    value={game.id}
                    onSelect={() => handleSelect(game)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{game.name}</span>
                        {!game.is_published && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Draft
                          </span>
                        )}
                      </div>
                      {game.year_published && (
                        <span className="text-xs text-muted-foreground">
                          {game.year_published}
                        </span>
                      )}
                    </div>
                    <Check className="ml-auto h-4 w-4 opacity-0" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
