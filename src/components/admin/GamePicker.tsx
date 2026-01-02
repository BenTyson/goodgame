'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
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

  // Use singleton browser client
  const supabase = createClient()

  // Debounced search
  useEffect(() => {
    if (!open) return

    const searchGames = async () => {
      setLoading(true)
      try {
        if (search.length < 2) {
          // Show recent/popular games when no search
          const { data } = await supabase
            .from('games')
            .select('*')
            .order('name')
            .limit(20)

          setGames(data?.filter(g => !excludeGameIds.includes(g.id)) || [])
        } else {
          // Search by name
          const { data } = await supabase
            .from('games')
            .select('*')
            .ilike('name', `%${search}%`)
            .order('name')
            .limit(20)

          setGames(data?.filter(g => !excludeGameIds.includes(g.id)) || [])
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(searchGames, 300)
    return () => clearTimeout(timer)
  }, [search, open, excludeGameIds, supabase])

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
                    <div className="flex flex-col">
                      <span className="font-medium">{game.name}</span>
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
