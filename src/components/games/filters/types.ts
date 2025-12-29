export interface FilterOption {
  id: string
  slug: string
  name: string
}

export type TaxonomyType = 'categories' | 'mechanics' | 'themes' | 'experiences'
export type RangeType = 'players' | 'time' | 'weight'

export interface TaxonomyFilters {
  categories: string[]
  mechanics: string[]
  themes: string[]
  experiences: string[]
}

export interface RangeFilters {
  playersMin: number
  playersMax: number
  timeMin: number
  timeMax: number
  weightMin: number
  weightMax: number
}

export interface FilterState extends TaxonomyFilters, RangeFilters {}

export interface FilterOptions {
  categories: FilterOption[]
  mechanics: FilterOption[]
  themes: FilterOption[]
  experiences: FilterOption[]
}

export interface ActiveFilter {
  type: TaxonomyType | RangeType
  value: string
  label: string
  slug?: string // For taxonomy filters
}

// Default range values
export const DEFAULT_RANGES = {
  players: { min: 1, max: 8 },
  time: { min: 0, max: 180 },
  weight: { min: 1, max: 5 },
} as const

// Check if range is at default values
export function isRangeDefault(type: RangeType, min: number, max: number): boolean {
  const defaults = DEFAULT_RANGES[type]
  return min === defaults.min && max === defaults.max
}
