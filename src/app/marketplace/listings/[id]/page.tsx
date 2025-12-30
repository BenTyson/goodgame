import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  MapPin,
  Package,
  Clock,
  Eye,
  Heart,
  Users,
  Timer,
  Calendar,
  MessageCircle,
  DollarSign,
  ExternalLink,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConditionBadge, SellerRating } from '@/components/marketplace'
import { getListingById } from '@/lib/supabase/listing-queries'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ListingDetailActions } from './ListingDetailActions'

interface ListingDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing) {
    return {
      title: 'Listing Not Found',
    }
  }

  const typeLabel = listing.listing_type === 'sell'
    ? 'For Sale'
    : listing.listing_type === 'trade'
      ? 'For Trade'
      : 'Wanted'

  return {
    title: `${listing.game.name} - ${typeLabel}`,
    description: listing.description || `${listing.game.name} ${typeLabel.toLowerCase()} on Board Nomads Marketplace`,
  }
}

function formatPrice(cents: number | null, currency: string = 'USD'): string {
  if (cents === null) return 'Price TBD'
  return formatCurrency(cents / 100, currency)
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

function formatExpiresIn(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Expired'
  if (diffDays === 1) return 'Expires tomorrow'
  if (diffDays <= 7) return `Expires in ${diffDays} days`
  return `Expires in ${Math.floor(diffDays / 7)} weeks`
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === listing.seller_id

  const typeLabel = listing.listing_type === 'sell'
    ? 'For Sale'
    : listing.listing_type === 'trade'
      ? 'For Trade'
      : 'Wanted'

  const typeColor = listing.listing_type === 'sell'
    ? 'bg-green-500'
    : listing.listing_type === 'trade'
      ? 'bg-purple-500'
      : 'bg-blue-500'

  const shippingLabel = listing.shipping_preference === 'local_only'
    ? 'Local pickup only'
    : listing.shipping_preference === 'ship_only'
      ? 'Shipping only'
      : 'Pickup or shipping'

  const expiresText = formatExpiresIn(listing.expires_at)

  // Get images sorted by display_order
  const sortedImages = listing.images?.sort((a, b) => a.display_order - b.display_order) || []
  const primaryImage = sortedImages.find(img => img.is_primary)?.url
    || sortedImages[0]?.url
    || listing.game.box_image_url
    || listing.game.thumbnail_url

  // Seller display name
  const sellerName = listing.seller.display_name || listing.seller.username || 'Anonymous'
  const sellerInitials = sellerName.slice(0, 2).toUpperCase()
  const sellerAvatar = listing.seller.custom_avatar_url || listing.seller.avatar_url

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 md:py-12">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-6 -ml-3">
        <Link href="/marketplace">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Images and Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Image */}
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-muted">
              {primaryImage ? (
                <Image
                  src={primaryImage}
                  alt={listing.game.name}
                  fill
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-muted-foreground">
                  {listing.game.name.charAt(0)}
                </div>
              )}
              {/* Type Badge */}
              <Badge className={cn('absolute top-4 left-4', typeColor)}>
                {typeLabel}
              </Badge>
            </div>

            {/* Additional Images */}
            {sortedImages.length > 1 && (
              <div className="p-4 border-t">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {sortedImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted border-2 border-transparent hover:border-primary cursor-pointer"
                    >
                      <Image
                        src={image.url}
                        alt={`${listing.game.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Description */}
          {listing.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {listing.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Game Details */}
          <Card>
            <CardHeader>
              <CardTitle>About the Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-muted">
                  {listing.game.box_image_url || listing.game.thumbnail_url ? (
                    <Image
                      src={listing.game.box_image_url || listing.game.thumbnail_url || ''}
                      alt={listing.game.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      {listing.game.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{listing.game.name}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    {listing.game.player_count_min && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {listing.game.player_count_min}
                          {listing.game.player_count_max && listing.game.player_count_max !== listing.game.player_count_min
                            ? `-${listing.game.player_count_max}`
                            : ''} players
                        </span>
                      </div>
                    )}
                    {listing.game.play_time_min && (
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        <span>
                          {listing.game.play_time_min}
                          {listing.game.play_time_max && listing.game.play_time_max !== listing.game.play_time_min
                            ? `-${listing.game.play_time_max}`
                            : ''} min
                        </span>
                      </div>
                    )}
                  </div>
                  <Button variant="link" asChild className="px-0 mt-2 h-auto">
                    <Link href={`/games/${listing.game.slug}`}>
                      View game details
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Purchase Info */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card>
            <CardContent className="pt-6">
              {/* Condition */}
              {listing.condition && (
                <div className="mb-4">
                  <ConditionBadge condition={listing.condition} />
                </div>
              )}

              {/* Price */}
              {listing.listing_type === 'sell' && listing.price_cents && (
                <div className="mb-4">
                  <p className="text-4xl font-bold">
                    {formatPrice(listing.price_cents, listing.currency)}
                  </p>
                  {listing.shipping_cost_cents !== null && listing.shipping_preference !== 'local_only' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      + {formatPrice(listing.shipping_cost_cents, listing.currency)} shipping
                    </p>
                  )}
                </div>
              )}

              {listing.listing_type === 'trade' && (
                <div className="mb-4">
                  <p className="text-2xl font-semibold">Open to Trades</p>
                  {listing.trade_preferences && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {listing.trade_preferences}
                    </p>
                  )}
                </div>
              )}

              {listing.listing_type === 'want' && (
                <div className="mb-4">
                  <p className="text-2xl font-semibold">Looking to Buy</p>
                </div>
              )}

              <Separator className="my-4" />

              {/* Location & Shipping */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {listing.location_city && listing.location_state
                        ? `${listing.location_city}, ${listing.location_state}`
                        : listing.location_state || 'Location not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p className="text-muted-foreground">{shippingLabel}</p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Actions */}
              <ListingDetailActions
                listingId={listing.id}
                sellerId={listing.seller_id}
                isOwner={isOwner}
                userId={user?.id}
                listing={listing}
              />
            </CardContent>
          </Card>

          {/* Seller Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href={`/u/${listing.seller.username}`}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={sellerAvatar || undefined} alt={sellerName} />
                  <AvatarFallback>{sellerInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold group-hover:text-primary transition-colors">
                    {sellerName}
                  </p>
                  <p className="text-sm text-muted-foreground">@{listing.seller.username}</p>
                </div>
              </Link>
              <Separator />
              {/* Seller Reputation */}
              <SellerRating
                sellerId={listing.seller_id}
                sellerUsername={listing.seller.username}
                variant="inline"
                showFeedback={false}
              />
            </CardContent>
          </Card>

          {/* Listing Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="text-2xl font-semibold text-foreground">
                      {listing.view_count || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span className="text-2xl font-semibold text-foreground">
                      {listing.save_count || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Saves</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Listed
                  </span>
                  <span>{formatTimeAgo(listing.created_at)}</span>
                </div>
                {expiresText && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Status
                    </span>
                    <span className={expiresText === 'Expired' ? 'text-destructive' : ''}>
                      {expiresText}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
