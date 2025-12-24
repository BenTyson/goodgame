'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Gamepad2,
  BookOpen,
  FileText,
  Grid3X3,
  Library,
  Loader2,
} from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { createClient } from '@/lib/supabase/client'
import type { Game, Category, Collection } from '@/types/database'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [games, setGames] = React.useState<Game[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [collections, setCollections] = React.useState<Collection[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasLoaded, setHasLoaded] = React.useState(false)

  // Fetch data when dialog opens
  React.useEffect(() => {
    if (open && !hasLoaded) {
      setIsLoading(true)
      const supabase = createClient()

      Promise.all([
        supabase
          .from('games')
          .select('*')
          .eq('is_published', true)
          .order('name'),
        supabase
          .from('categories')
          .select('*')
          .order('display_order'),
        supabase
          .from('collections')
          .select('*')
          .eq('is_published', true)
          .order('display_order'),
      ]).then(([gamesResult, categoriesResult, collectionsResult]) => {
        setGames(gamesResult.data || [])
        setCategories(categoriesResult.data || [])
        setCollections(collectionsResult.data || [])
        setIsLoading(false)
        setHasLoaded(true)
      })
    }
  }, [open, hasLoaded])

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false)
      command()
    },
    [onOpenChange]
  )

  const gamesWithRules = games.filter(g => g.has_rules)
  const gamesWithScoreSheets = games.filter(g => g.has_score_sheet)

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search for games, rules, score sheets, and more"
    >
      <CommandInput placeholder="Search games, rules, score sheets..." />
      <CommandList className="max-h-[60vh]">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <CommandEmpty>No results found.</CommandEmpty>

            {/* Games */}
            <CommandGroup heading={`Games (${games.length})`}>
              {games.map((game) => (
                <CommandItem
                  key={game.slug}
                  value={`game ${game.name} ${game.tagline || ''}`}
                  onSelect={() => runCommand(() => router.push(`/games/${game.slug}`))}
                >
                  <Gamepad2 className="mr-2 h-4 w-4 text-primary" />
                  <span>{game.name}</span>
                  {game.tagline && (
                    <span className="ml-2 text-muted-foreground text-xs truncate">
                      {game.tagline}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Rules */}
            {gamesWithRules.length > 0 && (
              <>
                <CommandGroup heading={`Rules (${gamesWithRules.length})`}>
                  {gamesWithRules.map((game) => (
                    <CommandItem
                      key={`rules-${game.slug}`}
                      value={`rules how to play ${game.name}`}
                      onSelect={() =>
                        runCommand(() => router.push(`/games/${game.slug}/rules`))
                      }
                    >
                      <BookOpen className="mr-2 h-4 w-4 text-primary" />
                      <span>How to Play {game.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Score Sheets */}
            {gamesWithScoreSheets.length > 0 && (
              <>
                <CommandGroup heading={`Score Sheets (${gamesWithScoreSheets.length})`}>
                  {gamesWithScoreSheets.map((game) => (
                    <CommandItem
                      key={`score-${game.slug}`}
                      value={`score sheet ${game.name}`}
                      onSelect={() =>
                        runCommand(() => router.push(`/games/${game.slug}/score-sheet`))
                      }
                    >
                      <FileText className="mr-2 h-4 w-4 text-primary" />
                      <span>{game.name} Score Sheet</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Categories */}
            <CommandGroup heading="Categories">
              {categories.map((category) => (
                <CommandItem
                  key={category.slug}
                  value={`category ${category.name} ${category.description || ''}`}
                  onSelect={() =>
                    runCommand(() => router.push(`/categories/${category.slug}`))
                  }
                >
                  <Grid3X3 className="mr-2 h-4 w-4 text-primary" />
                  <span>{category.name} Games</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Collections */}
            <CommandGroup heading="Collections">
              {collections.map((collection) => (
                <CommandItem
                  key={collection.slug}
                  value={`collection ${collection.name} ${collection.short_description || ''}`}
                  onSelect={() =>
                    runCommand(() => router.push(`/collections/${collection.slug}`))
                  }
                >
                  <Library className="mr-2 h-4 w-4 text-primary" />
                  <span>{collection.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Pages */}
            <CommandGroup heading="Pages">
              <CommandItem
                value="all games browse"
                onSelect={() => runCommand(() => router.push('/games'))}
              >
                <Gamepad2 className="mr-2 h-4 w-4 text-primary" />
                <span>All Games</span>
              </CommandItem>
              <CommandItem
                value="all rules browse"
                onSelect={() => runCommand(() => router.push('/rules'))}
              >
                <BookOpen className="mr-2 h-4 w-4 text-primary" />
                <span>Browse Rules</span>
              </CommandItem>
              <CommandItem
                value="all score sheets browse"
                onSelect={() => runCommand(() => router.push('/score-sheets'))}
              >
                <FileText className="mr-2 h-4 w-4 text-primary" />
                <span>Browse Score Sheets</span>
              </CommandItem>
              <CommandItem
                value="all categories browse"
                onSelect={() => runCommand(() => router.push('/categories'))}
              >
                <Grid3X3 className="mr-2 h-4 w-4 text-primary" />
                <span>All Categories</span>
              </CommandItem>
              <CommandItem
                value="all collections browse"
                onSelect={() => runCommand(() => router.push('/collections'))}
              >
                <Library className="mr-2 h-4 w-4 text-primary" />
                <span>All Collections</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
