'use client'

import { useState, useMemo } from 'react'
import { Search, Building2, ArrowUpDown, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PublisherCard } from '@/components/publishers'
import type { PublisherWithGameCount } from '@/lib/supabase/queries'

interface PublishersListProps {
  publishers: PublisherWithGameCount[]
}

type SortOption = 'name-asc' | 'name-desc' | 'games-desc' | 'games-asc'

const sortLabels: Record<SortOption, string> = {
  'name-asc': 'Name A-Z',
  'name-desc': 'Name Z-A',
  'games-desc': 'Most Games',
  'games-asc': 'Fewest Games',
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function PublishersList({ publishers }: PublishersListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [letterFilter, setLetterFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')

  // Get all unique categories across all publishers
  const allCategories = useMemo(() => {
    const categoryMap = new Map<string, { slug: string; name: string; count: number }>()

    publishers.forEach(p => {
      p.top_categories?.forEach(cat => {
        const existing = categoryMap.get(cat.slug)
        if (existing) {
          existing.count += cat.count
        } else {
          categoryMap.set(cat.slug, { ...cat })
        }
      })
    })

    return Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8) // Show top 8 categories
  }, [publishers])

  // Get letters that have publishers
  const availableLetters = useMemo(() => {
    const letters = new Set<string>()
    publishers.forEach(p => {
      const firstLetter = p.name.charAt(0).toUpperCase()
      if (alphabet.includes(firstLetter)) {
        letters.add(firstLetter)
      }
    })
    return letters
  }, [publishers])

  const filteredAndSortedPublishers = useMemo(() => {
    let result = [...publishers]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }

    // Apply letter filter
    if (letterFilter) {
      result = result.filter(p =>
        p.name.charAt(0).toUpperCase() === letterFilter
      )
    }

    // Apply category filter
    if (categoryFilter) {
      result = result.filter(p =>
        p.top_categories?.some(cat => cat.slug === categoryFilter)
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'games-desc':
          return b.game_count - a.game_count
        case 'games-asc':
          return a.game_count - b.game_count
        default:
          return 0
      }
    })

    return result
  }, [publishers, searchQuery, letterFilter, categoryFilter, sortBy])

  const hasActiveFilters = letterFilter || categoryFilter || searchQuery.trim()

  const clearAllFilters = () => {
    setSearchQuery('')
    setLetterFilter(null)
    setCategoryFilter(null)
  }

  return (
    <div className="space-y-6">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search publishers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                {sortLabels[sortBy]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={sortBy === option ? 'bg-accent' : ''}
                >
                  {sortLabels[option]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredAndSortedPublishers.length} publisher{filteredAndSortedPublishers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Category Filter */}
      {allCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-1">Type:</span>
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              !categoryFilter
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent border-border'
            }`}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategoryFilter(categoryFilter === cat.slug ? null : cat.slug)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                categoryFilter === cat.slug
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent border-border'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Alphabetical Filter */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-sm font-medium text-muted-foreground mr-2">A-Z:</span>
        <button
          onClick={() => setLetterFilter(null)}
          className={`w-8 h-8 text-sm rounded-md border transition-colors ${
            !letterFilter
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-accent border-border'
          }`}
        >
          All
        </button>
        {alphabet.map((letter) => {
          const isAvailable = availableLetters.has(letter)
          const isActive = letterFilter === letter
          return (
            <button
              key={letter}
              onClick={() => isAvailable && setLetterFilter(isActive ? null : letter)}
              disabled={!isAvailable}
              className={`w-8 h-8 text-sm rounded-md border transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : isAvailable
                    ? 'bg-background hover:bg-accent border-border'
                    : 'bg-muted/30 text-muted-foreground/40 border-transparent cursor-not-allowed'
              }`}
            >
              {letter}
            </button>
          )
        })}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent rounded-md">
              &quot;{searchQuery}&quot;
              <button onClick={() => setSearchQuery('')} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {letterFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent rounded-md">
              Starts with {letterFilter}
              <button onClick={() => setLetterFilter(null)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {categoryFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent rounded-md">
              {allCategories.find(c => c.slug === categoryFilter)?.name}
              <button onClick={() => setCategoryFilter(null)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-primary hover:underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Publishers Grid */}
      {filteredAndSortedPublishers.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">
            No publishers found matching your filters
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedPublishers.map((publisher) => (
            <PublisherCard key={publisher.id} publisher={publisher} />
          ))}
        </div>
      )}
    </div>
  )
}
