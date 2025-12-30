'use client'

import { ListingCard, ListingCardSkeleton } from './ListingCard'
import type { ListingCardData } from '@/types/marketplace'

interface ListingGridProps {
  listings: ListingCardData[]
  columns?: 2 | 3 | 4 | 5
  sidebarExpanded?: boolean
  savedListingIds?: Set<string>
  onSaveToggle?: (listingId: string) => void
}

export function ListingGrid({
  listings,
  columns,
  sidebarExpanded = true,
  savedListingIds,
  onSaveToggle,
}: ListingGridProps) {
  // Dynamic column classes based on sidebar state
  const dynamicGridCols = sidebarExpanded
    ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

  // Static column options (for backwards compatibility)
  const staticGridCols: Record<number, string> = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  }

  // Use static columns if explicitly provided, otherwise use dynamic
  const gridColsClass = columns ? staticGridCols[columns] : dynamicGridCols

  if (listings.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center px-4">
          <p className="text-muted-foreground font-medium">No listings found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or check back later
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid gap-6 ${gridColsClass}`}>
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isSaved={savedListingIds?.has(listing.id)}
          onSaveToggle={onSaveToggle}
        />
      ))}
    </div>
  )
}

/**
 * Loading skeleton for ListingGrid
 */
export function ListingGridSkeleton({
  count = 8,
  sidebarExpanded = true,
}: {
  count?: number
  sidebarExpanded?: boolean
}) {
  const gridColsClass = sidebarExpanded
    ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

  return (
    <div className={`grid gap-6 ${gridColsClass}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}
