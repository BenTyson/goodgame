'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  DEFAULT_RANGES,
  type TaxonomyType,
  type RangeType,
  type FilterOption,
} from '@/components/games/filters/types'

// ============================================================================
// Types
// ============================================================================

export interface TaxonomyOptions {
  categories: FilterOption[]
  mechanics: FilterOption[]
  themes: FilterOption[]
  experiences: FilterOption[]
}

export interface TaxonomySelections {
  categories: string[]
  mechanics: string[]
  themes: string[]
  experiences: string[]
}

export interface RangeValues {
  players: [number, number]
  time: [number, number]
  weight: [number, number]
}

export interface UseGameFiltersOptions {
  options: TaxonomyOptions
  initialSearchQuery?: string
}

export interface UseGameFiltersReturn {
  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleSearch: (e: React.FormEvent) => void
  handleClearSearch: () => void

  // Taxonomy selections (derived from URL)
  selected: TaxonomySelections

  // Range values (local state for slider visual feedback)
  ranges: RangeValues
  setPlayerCount: (value: [number, number]) => void
  setPlayTime: (value: [number, number]) => void
  setWeight: (value: [number, number]) => void

  // Handlers
  handleToggleTaxonomy: (type: TaxonomyType, slug: string) => void
  handleRangeCommit: (type: RangeType, value: [number, number]) => void
  handleRemoveRange: (type: RangeType) => void
  handleClearAll: () => void

  // Computed values
  activeTaxonomyCount: number
  hasActiveFilters: boolean
}

// ============================================================================
// URL Parameter Helpers
// ============================================================================

/**
 * Parse taxonomy selections from URL search params
 */
function parseTaxonomyFromUrl(searchParams: URLSearchParams): TaxonomySelections {
  return {
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    mechanics: searchParams.get('mechanics')?.split(',').filter(Boolean) || [],
    themes: searchParams.get('themes')?.split(',').filter(Boolean) || [],
    experiences: searchParams.get('experiences')?.split(',').filter(Boolean) || [],
  }
}

/**
 * Parse range values from URL search params, falling back to defaults
 */
function parseRangesFromUrl(searchParams: URLSearchParams): RangeValues {
  return {
    players: [
      parseInt(searchParams.get('players_min') || String(DEFAULT_RANGES.players.min)),
      parseInt(searchParams.get('players_max') || String(DEFAULT_RANGES.players.max)),
    ],
    time: [
      parseInt(searchParams.get('time_min') || String(DEFAULT_RANGES.time.min)),
      parseInt(searchParams.get('time_max') || String(DEFAULT_RANGES.time.max)),
    ],
    weight: [
      parseFloat(searchParams.get('weight_min') || String(DEFAULT_RANGES.weight.min)),
      parseFloat(searchParams.get('weight_max') || String(DEFAULT_RANGES.weight.max)),
    ],
  }
}

/**
 * URL parameter key mapping for ranges
 */
const RANGE_URL_PARAMS: Record<RangeType, { min: string; max: string }> = {
  players: { min: 'players_min', max: 'players_max' },
  time: { min: 'time_min', max: 'time_max' },
  weight: { min: 'weight_min', max: 'weight_max' },
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGameFilters({
  initialSearchQuery = '',
}: UseGameFiltersOptions): UseGameFiltersReturn {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ---------------------------------------------------------------------------
  // Search state
  // ---------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery)

  // Sync search query when URL changes (e.g., back/forward navigation)
  React.useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

  // ---------------------------------------------------------------------------
  // Taxonomy selections (derived from URL - no local state needed)
  // ---------------------------------------------------------------------------
  const selected = React.useMemo(
    () => parseTaxonomyFromUrl(searchParams),
    [searchParams]
  )

  // ---------------------------------------------------------------------------
  // Range values - local state for slider visual feedback during drag
  // ---------------------------------------------------------------------------
  const rangesFromUrl = React.useMemo(
    () => parseRangesFromUrl(searchParams),
    [searchParams]
  )

  const [playerCount, setPlayerCount] = React.useState<[number, number]>(rangesFromUrl.players)
  const [playTime, setPlayTime] = React.useState<[number, number]>(rangesFromUrl.time)
  const [weight, setWeight] = React.useState<[number, number]>(rangesFromUrl.weight)

  // Sync local range state when URL changes
  React.useEffect(() => {
    setPlayerCount(rangesFromUrl.players)
  }, [rangesFromUrl.players[0], rangesFromUrl.players[1]])

  React.useEffect(() => {
    setPlayTime(rangesFromUrl.time)
  }, [rangesFromUrl.time[0], rangesFromUrl.time[1]])

  React.useEffect(() => {
    setWeight(rangesFromUrl.weight)
  }, [rangesFromUrl.weight[0], rangesFromUrl.weight[1]])

  const ranges: RangeValues = {
    players: playerCount,
    time: playTime,
    weight: weight,
  }

  // ---------------------------------------------------------------------------
  // URL update helper
  // ---------------------------------------------------------------------------
  const updateUrl = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const queryString = params.toString()
      const newUrl = queryString ? `/games?${queryString}` : '/games'

      // Use router.push for better UX (no full page reload flash)
      // The page uses force-dynamic so fresh data will still be fetched
      router.push(newUrl, { scroll: false })
    },
    [searchParams, router]
  )

  // ---------------------------------------------------------------------------
  // Taxonomy handlers
  // ---------------------------------------------------------------------------
  const handleToggleTaxonomy = React.useCallback(
    (type: TaxonomyType, slug: string) => {
      const currentSelected = selected[type]
      const newSelected = currentSelected.includes(slug)
        ? currentSelected.filter((s) => s !== slug)
        : [...currentSelected, slug]

      updateUrl({
        [type]: newSelected.length > 0 ? newSelected.join(',') : null,
      })
    },
    [selected, updateUrl]
  )

  // ---------------------------------------------------------------------------
  // Range handlers
  // ---------------------------------------------------------------------------
  const handleRangeCommit = React.useCallback(
    (type: RangeType, value: [number, number]) => {
      const [min, max] = value
      const defaults = DEFAULT_RANGES[type]
      const params = RANGE_URL_PARAMS[type]

      updateUrl({
        [params.min]: min !== defaults.min ? String(min) : null,
        [params.max]: max !== defaults.max ? String(max) : null,
      })
    },
    [updateUrl]
  )

  const handleRemoveRange = React.useCallback(
    (type: RangeType) => {
      const params = RANGE_URL_PARAMS[type]
      updateUrl({
        [params.min]: null,
        [params.max]: null,
      })
    },
    [updateUrl]
  )

  // ---------------------------------------------------------------------------
  // Search handlers
  // ---------------------------------------------------------------------------
  const handleSearch = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const params = new URLSearchParams(searchParams.toString())

      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim())
      } else {
        params.delete('q')
      }

      const queryString = params.toString()
      const newUrl = queryString ? `/games?${queryString}` : '/games'
      router.push(newUrl, { scroll: false })
    },
    [searchParams, searchQuery, router]
  )

  const handleClearSearch = React.useCallback(() => {
    setSearchQuery('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    const queryString = params.toString()
    const newUrl = queryString ? `/games?${queryString}` : '/games'
    router.push(newUrl, { scroll: false })
  }, [searchParams, router])

  // ---------------------------------------------------------------------------
  // Clear all
  // ---------------------------------------------------------------------------
  const handleClearAll = React.useCallback(() => {
    setSearchQuery('')
    router.push('/games', { scroll: false })
  }, [router])

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------
  const activeTaxonomyCount =
    selected.categories.length +
    selected.mechanics.length +
    selected.themes.length +
    selected.experiences.length

  const hasActiveFilters =
    activeTaxonomyCount > 0 ||
    searchQuery.trim().length > 0 ||
    playerCount[0] !== DEFAULT_RANGES.players.min ||
    playerCount[1] !== DEFAULT_RANGES.players.max ||
    playTime[0] !== DEFAULT_RANGES.time.min ||
    playTime[1] !== DEFAULT_RANGES.time.max ||
    weight[0] !== DEFAULT_RANGES.weight.min ||
    weight[1] !== DEFAULT_RANGES.weight.max

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // Search
    searchQuery,
    setSearchQuery,
    handleSearch,
    handleClearSearch,

    // Taxonomy
    selected,

    // Ranges
    ranges,
    setPlayerCount,
    setPlayTime,
    setWeight,

    // Handlers
    handleToggleTaxonomy,
    handleRangeCommit,
    handleRemoveRange,
    handleClearAll,

    // Computed
    activeTaxonomyCount,
    hasActiveFilters,
  }
}
