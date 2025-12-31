'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Store, Bell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ListingGrid,
  MarketplaceFilterSidebar,
  MobileMarketplaceFilters,
  useMarketplaceSidebarCollapsed,
  type MarketplaceFilters,
} from '@/components/marketplace'
import { SaveSearchButton } from '@/components/marketplace/discovery'
import type { ListingCardData, ListingType, GameCondition, ShippingPreference, SavedSearchFilters } from '@/types/marketplace'

interface MarketplacePageClientProps {
  listings: ListingCardData[]
  hasFilters: boolean
  totalCount: number
  isAuthenticated: boolean
  savedListingIds: string[]
}

export function MarketplacePageClient({
  listings,
  hasFilters,
  totalCount,
  isAuthenticated,
  savedListingIds,
}: MarketplacePageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sidebarCollapsed] = useMarketplaceSidebarCollapsed()

  // Parse URL params
  const parseArrayParam = <T extends string>(key: string): T[] => {
    return (searchParams.get(key)?.split(',').filter(Boolean) as T[]) || []
  }

  const filters: MarketplaceFilters = {
    listingTypes: parseArrayParam<ListingType>('type'),
    conditions: parseArrayParam<GameCondition>('condition'),
    shippingPreferences: parseArrayParam<ShippingPreference>('shipping'),
    priceMin: searchParams.get('price_min') ? parseInt(searchParams.get('price_min')!) : null,
    priceMax: searchParams.get('price_max') ? parseInt(searchParams.get('price_max')!) : null,
  }

  const searchQuery = searchParams.get('q') || ''
  const [localSearch, setLocalSearch] = React.useState(searchQuery)

  // Sync local search when URL changes
  React.useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  // Update URL with filters
  const updateFilters = React.useCallback(
    (newFilters: MarketplaceFilters) => {
      const params = new URLSearchParams(searchParams.toString())

      // Update listing types
      if (newFilters.listingTypes.length > 0) {
        params.set('type', newFilters.listingTypes.join(','))
      } else {
        params.delete('type')
      }

      // Update conditions
      if (newFilters.conditions.length > 0) {
        params.set('condition', newFilters.conditions.join(','))
      } else {
        params.delete('condition')
      }

      // Update shipping preferences
      if (newFilters.shippingPreferences.length > 0) {
        params.set('shipping', newFilters.shippingPreferences.join(','))
      } else {
        params.delete('shipping')
      }

      // Update price range
      if (newFilters.priceMin !== null) {
        params.set('price_min', String(newFilters.priceMin))
      } else {
        params.delete('price_min')
      }
      if (newFilters.priceMax !== null) {
        params.set('price_max', String(newFilters.priceMax))
      } else {
        params.delete('price_max')
      }

      const queryString = params.toString()
      const newUrl = queryString ? `/marketplace?${queryString}` : '/marketplace'
      window.location.href = newUrl
    },
    [searchParams]
  )

  const handleClearAll = () => {
    const params = new URLSearchParams()
    if (localSearch) {
      params.set('q', localSearch)
    }
    const queryString = params.toString()
    const newUrl = queryString ? `/marketplace?${queryString}` : '/marketplace'
    router.push(newUrl, { scroll: false })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (localSearch.trim()) {
      params.set('q', localSearch.trim())
    } else {
      params.delete('q')
    }
    const queryString = params.toString()
    const newUrl = queryString ? `/marketplace?${queryString}` : '/marketplace'
    router.push(newUrl)
  }

  const handleSaveToggle = (listingId: string) => {
    // TODO: Implement save/unsave functionality with API
    console.log('Toggle save for listing:', listingId)
  }

  const handleSaveSearch = async (request: { name: string; filters: SavedSearchFilters; alert_frequency?: string; alert_email?: boolean }) => {
    const res = await fetch('/api/marketplace/saved-searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!res.ok) {
      throw new Error('Failed to save search')
    }
  }

  const handleLoginRequired = () => {
    router.push('/login?redirect=/marketplace')
  }

  // Build saved search filters from current state
  const savedSearchFilters: SavedSearchFilters = {
    query: searchQuery || undefined,
    listing_types: filters.listingTypes.length > 0 ? filters.listingTypes : undefined,
    conditions: filters.conditions.length > 0 ? filters.conditions : undefined,
    shipping_preferences: filters.shippingPreferences.length > 0 ? filters.shippingPreferences : undefined,
    price_min_cents: filters.priceMin !== null ? filters.priceMin * 100 : undefined,
    price_max_cents: filters.priceMax !== null ? filters.priceMax * 100 : undefined,
  }

  const savedSet = new Set(savedListingIds)

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              Marketplace
            </h1>
            <p className="mt-2 text-muted-foreground">
              Buy, sell, and trade board games with the community
            </p>
          </div>
          {isAuthenticated && (
            <Button asChild size="lg" className="gap-2">
              <Link href="/marketplace/listings/new">
                <Plus className="h-5 w-5" />
                Create Listing
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search games..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
      </form>

      {/* Mobile Filters */}
      <div className="mb-6">
        <MobileMarketplaceFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearAll={handleClearAll}
          resultsCount={listings.length}
        />
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Sidebar - Desktop Only */}
        <MarketplaceFilterSidebar
          filters={filters}
          onFiltersChange={updateFilters}
          onClearAll={handleClearAll}
          className="hidden lg:block shrink-0"
        />

        {/* Listings Grid */}
        <main className="flex-1 min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {hasFilters || searchQuery
                ? `${listings.length} listings match your criteria`
                : `Showing all ${totalCount} listings`}
            </p>
            <div className="flex items-center gap-2">
              {/* Save Search Button - only show when filters are applied */}
              <SaveSearchButton
                filters={savedSearchFilters}
                isLoggedIn={isAuthenticated}
                onSave={handleSaveSearch}
                onLoginRequired={handleLoginRequired}
              />
              {/* Link to saved searches */}
              {isAuthenticated && (
                <Button variant="ghost" size="sm" asChild className="gap-2">
                  <Link href="/marketplace/saved-searches">
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Saved Searches</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {listings.length > 0 ? (
            <ListingGrid
              listings={listings}
              sidebarExpanded={!sidebarCollapsed}
              savedListingIds={savedSet}
              onSaveToggle={isAuthenticated ? handleSaveToggle : undefined}
            />
          ) : (
            <EmptyState
              hasFilters={hasFilters || !!searchQuery}
              isAuthenticated={isAuthenticated}
              onClearFilters={handleClearAll}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function EmptyState({
  hasFilters,
  isAuthenticated,
  onClearFilters,
}: {
  hasFilters: boolean
  isAuthenticated: boolean
  onClearFilters: () => void
}) {
  if (hasFilters) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No listings match your filters</h3>
        <p className="text-muted-foreground mb-4">
          Try adjusting your search criteria or browse all listings
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center py-12 bg-muted/30 rounded-lg">
      <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">No listings yet</h3>
      <p className="text-muted-foreground mb-4">
        Be the first to list a game on the marketplace!
      </p>
      {isAuthenticated && (
        <Button asChild>
          <Link href="/marketplace/listings/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Link>
        </Button>
      )}
    </div>
  )
}
