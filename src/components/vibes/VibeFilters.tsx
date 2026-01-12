'use client'

import { ChevronDown, MessageCircle, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { VibeSortOption, VibeFilterOption } from '@/types/database'

interface VibeFiltersProps {
  totalCount: number
  sort: VibeSortOption
  filter: VibeFilterOption
  onSortChange: (sort: VibeSortOption) => void
  onFilterChange: (filter: VibeFilterOption) => void
  className?: string
}

const SORT_OPTIONS: { value: VibeSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest' },
  { value: 'lowest', label: 'Lowest' },
]

const FILTER_OPTIONS: { value: VibeFilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'with_thoughts', label: 'With thoughts' },
]

export function VibeFilters({
  totalCount,
  sort,
  filter,
  onSortChange,
  onFilterChange,
  className,
}: VibeFiltersProps) {
  const currentSort = SORT_OPTIONS.find((o) => o.value === sort) || SORT_OPTIONS[0]
  const currentFilter = FILTER_OPTIONS.find((o) => o.value === filter) || FILTER_OPTIONS[0]
  const hasActiveFilter = filter !== 'all' || typeof filter === 'number'

  return (
    <div className={cn('flex items-center justify-between gap-4 flex-wrap', className)}>
      {/* Count */}
      <p className="text-lg font-semibold">
        {totalCount.toLocaleString()} {totalCount === 1 ? 'Rating' : 'Ratings'}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              {currentSort.label}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={cn(sort === option.value && 'bg-accent')}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={hasActiveFilter ? 'secondary' : 'outline'}
              size="sm"
              className="gap-1.5"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {typeof filter === 'number' ? `${filter}/10 only` : currentFilter.label}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {FILTER_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value.toString()}
                onClick={() => onFilterChange(option.value)}
                className={cn(filter === option.value && 'bg-accent')}
              >
                {option.label}
              </DropdownMenuItem>
            ))}

            {typeof filter === 'number' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onFilterChange('all')}
                  className="text-muted-foreground"
                >
                  Clear rating filter
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Compact filter bar for mobile (can be expanded)
export function VibeFiltersCompact({
  sort,
  filter,
  onSortChange,
  onFilterChange,
  className,
}: Omit<VibeFiltersProps, 'totalCount'>) {
  const currentSort = SORT_OPTIONS.find((o) => o.value === sort) || SORT_OPTIONS[0]

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2', className)}>
      {/* Sort chips */}
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onSortChange(option.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors cursor-pointer',
            sort === option.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          )}
        >
          {option.label}
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-6 bg-border shrink-0" />

      {/* Filter chips */}
      <button
        onClick={() => onFilterChange(filter === 'with_thoughts' ? 'all' : 'with_thoughts')}
        className={cn(
          'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors inline-flex items-center gap-1.5 cursor-pointer',
          filter === 'with_thoughts'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
        )}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        With thoughts
      </button>

      {/* Clear rating filter if active */}
      {typeof filter === 'number' && (
        <button
          onClick={() => onFilterChange('all')}
          className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap bg-secondary text-secondary-foreground inline-flex items-center gap-1.5 cursor-pointer"
        >
          {filter}/10 only
          <span className="text-xs opacity-70">×</span>
        </button>
      )}
    </div>
  )
}
