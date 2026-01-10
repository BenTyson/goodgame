import {
  Grid3X3,
  Puzzle,
  Palette,
  Users,
  Users2,
  Clock,
  Brain,
  ChevronDown,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react'

import { DEFAULT_RANGES, isRangeDefault } from './types'

export interface TaxonomySectionConfig {
  icon: LucideIcon
  label: string
  key: 'categories' | 'mechanics' | 'themes' | 'experiences'
  urlParam: string
}

export interface RangeFilterConfig {
  icon: LucideIcon
  label: string
  key: 'players' | 'time' | 'weight'
  min: number
  max: number
  step: number
  suffix?: string
  formatValue: (min: number, max: number) => string
}

export const TAXONOMY_SECTIONS: TaxonomySectionConfig[] = [
  { icon: Grid3X3, label: 'Categories', key: 'categories', urlParam: 'categories' },
  { icon: Puzzle, label: 'Mechanics', key: 'mechanics', urlParam: 'mechanics' },
  { icon: Palette, label: 'Themes', key: 'themes', urlParam: 'themes' },
  { icon: Users, label: 'Play Style', key: 'experiences', urlParam: 'experiences' },
]

export const RANGE_FILTERS: RangeFilterConfig[] = [
  {
    icon: Users2,
    label: 'Players',
    key: 'players',
    min: DEFAULT_RANGES.players.min,
    max: DEFAULT_RANGES.players.max,
    step: 1,
    formatValue: (min, max) => {
      if (isRangeDefault('players', min, max)) return 'Any'
      if (min === max) return `${min}`
      return `${min}-${max}`
    },
  },
  {
    icon: Clock,
    label: 'Time',
    key: 'time',
    min: DEFAULT_RANGES.time.min,
    max: DEFAULT_RANGES.time.max,
    step: 15,
    suffix: 'min',
    formatValue: (min, max) => {
      if (isRangeDefault('time', min, max)) return 'Any'
      if (max >= DEFAULT_RANGES.time.max) return `${min}+ min`
      return `${min}-${max} min`
    },
  },
  {
    icon: Brain,
    label: 'Complexity',
    key: 'weight',
    min: DEFAULT_RANGES.weight.min,
    max: DEFAULT_RANGES.weight.max,
    step: 0.5,
    formatValue: (min, max) => {
      if (isRangeDefault('weight', min, max)) return 'Any'
      return `${min.toFixed(1)}-${max.toFixed(1)}`
    },
  },
]

// Icon exports for convenience (used by FilterSection and ActiveFilters)
export const Icons = {
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  remove: X,
}

// LocalStorage keys
export const STORAGE_KEYS = {
  openSections: 'games-filter-sections',
} as const

// Default open sections (only Categories open by default)
export const DEFAULT_OPEN_SECTIONS = ['categories']
