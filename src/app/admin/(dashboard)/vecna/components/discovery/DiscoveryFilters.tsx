'use client'

import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface DiscoveryFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  stateFilter: string
  onStateFilterChange: (state: string) => void
  rulebookFilter: string
  onRulebookFilterChange: (filter: string) => void
  familyFilter: string
  onFamilyFilterChange: (filter: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  activeFilterCount: number
  onClearFilters: () => void
}

export function DiscoveryFilters({
  searchQuery,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
  rulebookFilter,
  onRulebookFilterChange,
  familyFilter,
  onFamilyFilterChange,
  sortBy,
  onSortChange,
  activeFilterCount,
  onClearFilters,
}: DiscoveryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 border-b">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[400px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* State filter */}
      <Select value={stateFilter} onValueChange={onStateFilterChange}>
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="State" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All States</SelectItem>
          <SelectItem value="imported">Imported</SelectItem>
          <SelectItem value="enriched">Enriched</SelectItem>
          <SelectItem value="rulebook_missing">No Rulebook</SelectItem>
          <SelectItem value="rulebook_ready">Rulebook Ready</SelectItem>
          <SelectItem value="parsed">Parsed</SelectItem>
          <SelectItem value="taxonomy_assigned">Categorized</SelectItem>
          <SelectItem value="generated">Generated</SelectItem>
          <SelectItem value="review_pending">Needs Review</SelectItem>
          <SelectItem value="published">Published</SelectItem>
        </SelectContent>
      </Select>

      {/* Rulebook filter */}
      <Select value={rulebookFilter} onValueChange={onRulebookFilterChange}>
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Rulebook" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="has_rulebook">Has Rulebook</SelectItem>
          <SelectItem value="no_rulebook">No Rulebook</SelectItem>
          <SelectItem value="ready_to_process">Ready to Process</SelectItem>
        </SelectContent>
      </Select>

      {/* Family filter */}
      <Select value={familyFilter} onValueChange={onFamilyFilterChange}>
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Family" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="has_family">In Family</SelectItem>
          <SelectItem value="standalone">Standalone</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[150px] bg-background">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="year">Year</SelectItem>
          <SelectItem value="state">State</SelectItem>
          <SelectItem value="requests">Most Requested</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-1.5 text-muted-foreground"
        >
          <Filter className="h-3.5 w-3.5" />
          Clear
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
            {activeFilterCount}
          </Badge>
        </Button>
      )}
    </div>
  )
}
