'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

import { ListingCard, ListingCardSkeleton } from '../ListingCard'
import type { ListingCardData } from '@/types/marketplace'

interface SimilarListingsProps {
  listingId: string
  limit?: number
  className?: string
}

export function SimilarListings({
  listingId,
  limit = 6,
  className,
}: SimilarListingsProps) {
  const [listings, setListings] = useState<ListingCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSimilarListings = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/marketplace/listings/${listingId}/similar?limit=${limit}`
        )

        if (!res.ok) {
          throw new Error('Failed to fetch similar listings')
        }

        const data = await res.json()
        setListings(data.listings || [])
      } catch (err) {
        console.error('Error fetching similar listings:', err)
        setError('Failed to load recommendations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSimilarListings()
  }, [listingId, limit])

  // Don't render if no listings and not loading
  if (!isLoading && listings.length === 0) {
    return null
  }

  return (
    <section className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">You Might Also Like</h2>
      </div>

      {/* Error State */}
      {error && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {error}
        </p>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Listings Grid */}
      {!isLoading && listings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              variant="compact"
              showSeller={false}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * Server-side version that accepts pre-fetched data
 */
interface SimilarListingsServerProps {
  listings: ListingCardData[]
  className?: string
}

export function SimilarListingsServer({
  listings,
  className,
}: SimilarListingsServerProps) {
  if (listings.length === 0) {
    return null
  }

  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">You Might Also Like</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            variant="compact"
            showSeller={false}
          />
        ))}
      </div>
    </section>
  )
}
