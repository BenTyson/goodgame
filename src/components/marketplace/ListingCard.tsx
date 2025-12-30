'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MapPin, Truck, Heart, Clock, Tag, ArrowRightLeft } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConditionBadge } from './ConditionBadge'
import type { ListingCardData } from '@/types/marketplace'

interface ListingCardProps {
  listing: ListingCardData
  variant?: 'default' | 'compact' | 'horizontal'
  showSeller?: boolean
  isSaved?: boolean
  onSaveToggle?: (listingId: string) => void
}

/**
 * Format price in cents to display string
 */
function formatPrice(cents: number | null, currency: string = 'USD'): string {
  if (cents === null) return ''
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dollars)
}

/**
 * Get time remaining until expiration
 */
function getTimeRemaining(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  const now = new Date()
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - now.getTime()

  if (diff <= 0) return 'Expired'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days > 7) return null // Don't show if more than a week
  if (days > 0) return `${days}d left`

  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours > 0) return `${hours}h left`

  return 'Ending soon'
}

export function ListingCard({
  listing,
  variant = 'default',
  showSeller = true,
  isSaved = false,
  onSaveToggle,
}: ListingCardProps) {
  const router = useRouter()

  // Determine display image (listing image > game image)
  const displayImage = listing.primary_image_url || listing.game_image

  // Location string
  const locationString = [listing.location_city, listing.location_state]
    .filter(Boolean)
    .join(', ')

  // Time remaining
  const timeRemaining = getTimeRemaining(listing.expires_at)

  // Listing type info
  const listingTypeInfo = {
    sell: { label: 'For Sale', icon: Tag, color: 'bg-green-100 text-green-800' },
    trade: { label: 'For Trade', icon: ArrowRightLeft, color: 'bg-purple-100 text-purple-800' },
    want: { label: 'Wanted', icon: Heart, color: 'bg-blue-100 text-blue-800' },
  }

  const typeInfo = listingTypeInfo[listing.listing_type]

  const handleCardClick = () => {
    router.push(`/marketplace/listings/${listing.id}`)
  }

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSaveToggle?.(listing.id)
  }

  return (
    <Card
      className={cn(
        'group overflow-hidden cursor-pointer',
        'transition-all duration-300',
        '[box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)]',
        'hover:-translate-y-1.5 hover:border-primary/30',
        'active:translate-y-0 active:[box-shadow:var(--shadow-md)]'
      )}
      padding="none"
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={listing.game_name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10">
            <span className="text-4xl font-bold text-primary/30">
              {listing.game_name.charAt(0)}
            </span>
          </div>
        )}

        {/* Condition Badge - Top Left */}
        {listing.condition && (
          <div className="absolute top-2 left-2">
            <ConditionBadge condition={listing.condition} variant="compact" />
          </div>
        )}

        {/* Listing Type Badge - Top Right */}
        <div className="absolute top-2 right-2">
          <Badge className={cn('font-medium shadow-sm', typeInfo.color)}>
            <typeInfo.icon className="h-3 w-3 mr-1" />
            {typeInfo.label}
          </Badge>
        </div>

        {/* Save Button - Hover Only */}
        {onSaveToggle && (
          <button
            onClick={handleSaveClick}
            className={cn(
              'absolute bottom-2 right-2 p-2 rounded-full',
              'bg-white/90 shadow-md',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              'hover:bg-white hover:scale-110'
            )}
          >
            <Heart
              className={cn(
                'h-4 w-4',
                isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'
              )}
            />
          </button>
        )}

        {/* Time Remaining Banner */}
        {timeRemaining && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
            <div className="flex items-center gap-1 text-white text-xs">
              <Clock className="h-3 w-3" />
              <span>{timeRemaining}</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardContent className="p-3 space-y-2">
        {/* Game Name */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {listing.game_name}
        </h3>

        {/* Price & Shipping */}
        <div className="space-y-1">
          {listing.listing_type === 'sell' && listing.price_cents && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-primary">
                {formatPrice(listing.price_cents, listing.currency)}
              </span>
              {listing.shipping_cost_cents !== null && listing.shipping_cost_cents > 0 && (
                <span className="text-xs text-muted-foreground">
                  + {formatPrice(listing.shipping_cost_cents)} shipping
                </span>
              )}
              {listing.shipping_cost_cents === 0 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 text-green-600 border-green-300">
                  Free Shipping
                </Badge>
              )}
            </div>
          )}

          {listing.listing_type === 'trade' && (
            <div className="text-sm font-medium text-purple-600">
              Open to Trade Offers
            </div>
          )}

          {listing.listing_type === 'want' && (
            <div className="text-sm font-medium text-blue-600">
              Looking to Buy
            </div>
          )}
        </div>

        {/* Location & Shipping Preference */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {listing.shipping_preference === 'local_only' ? (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{locationString || 'Local Only'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              <span>
                {listing.shipping_preference === 'ship_only' ? 'Ships Only' : 'Ships'} from{' '}
                {locationString || 'US'}
              </span>
            </div>
          )}
        </div>

        {/* Seller Info */}
        {showSeller && listing.seller_username && (
          <div className="flex items-center justify-between pt-1 border-t">
            <Link
              href={`/u/${listing.seller_username}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              {listing.seller_avatar ? (
                <Image
                  src={listing.seller_avatar}
                  alt={listing.seller_display_name || listing.seller_username}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                  {(listing.seller_display_name || listing.seller_username).charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium truncate max-w-[100px]">
                {listing.seller_display_name || `@${listing.seller_username}`}
              </span>
            </Link>

            {listing.seller_rating !== null && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-yellow-500">★</span>
                <span>{listing.seller_rating.toFixed(1)}</span>
                {listing.seller_sales_count > 0 && (
                  <span className="text-muted-foreground">
                    ({listing.seller_sales_count})
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Loading skeleton for ListingCard
 */
export function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden" padding="none">
      <div className="aspect-square bg-muted animate-pulse" />
      <CardContent className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        <div className="h-6 w-1/2 bg-muted rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}
