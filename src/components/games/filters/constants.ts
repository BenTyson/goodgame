import {
  Grid3X3,
  Puzzle,
  Palette,
  Users,
  Users2,
  Clock,
  Brain,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronDown,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react'

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
    min: 1,
    max: 8,
    step: 1,
    formatValue: (min, max) => {
      if (min === 1 && max === 8) return 'Any'
      if (min === max) return `${min}`
      return `${min}-${max}`
    },
  },
  {
    icon: Clock,
    label: 'Time',
    key: 'time',
    min: 0,
    max: 180,
    step: 15,
    suffix: 'min',
    formatValue: (min, max) => {
      if (min === 0 && max === 180) return 'Any'
      if (max >= 180) return `${min}+ min`
      return `${min}-${max} min`
    },
  },
  {
    icon: Brain,
    label: 'Complexity',
    key: 'weight',
    min: 1,
    max: 5,
    step: 0.5,
    formatValue: (min, max) => {
      if (min === 1 && max === 5) return 'Any'
      return `${min.toFixed(1)}-${max.toFixed(1)}`
    },
  },
]

// Icon exports for convenience
export const Icons = {
  expand: PanelLeftOpen,
  collapse: PanelLeftClose,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  remove: X,
  categories: Grid3X3,
  mechanics: Puzzle,
  themes: Palette,
  experiences: Users,
  players: Users2,
  time: Clock,
  weight: Brain,
}

// LocalStorage keys
export const STORAGE_KEYS = {
  sidebarCollapsed: 'games-sidebar-collapsed',
  openSections: 'games-filter-sections',
} as const

// Default open sections (only Categories open by default)
export const DEFAULT_OPEN_SECTIONS = ['categories']
