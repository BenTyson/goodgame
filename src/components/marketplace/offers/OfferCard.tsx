'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  ArrowLeftRight,
  Handshake,
  Clock,
  Check,
  X,
  MessageCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Package,
  CreditCard,
  ExternalLink,
} from 'lucide-react'
import { formatDistanceToNow, format, isPast } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  OFFER_STATUS_INFO,
  OFFER_TYPE_INFO,
  type OfferCardData,
  type OfferStatus,
  type OfferType,
} from '@/types/marketplace'

interface OfferCardProps {
  offer: OfferCardData
  role: 'buyer' | 'seller'
  onAction?: () => void
  className?: string
}

const OFFER_TYPE_ICONS: Record<OfferType, typeof DollarSign> = {
  buy: DollarSign,
  trade: ArrowLeftRight,
  buy_plus_trade: Handshake,
}

export function OfferCard({ offer, role, onAction, className }: OfferCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [actionType, setActionType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [responseMessage, setResponseMessage] = useState('')
  const [showResponseInput, setShowResponseInput] = useState(false)

  const statusInfo = OFFER_STATUS_INFO[offer.status]
  const typeInfo = OFFER_TYPE_INFO[offer.offer_type]
  const TypeIcon = OFFER_TYPE_ICONS[offer.offer_type]

  const isExpired = isPast(new Date(offer.expires_at))
  const isPending = offer.status === 'pending'
  const isAccepted = offer.status === 'accepted'
  const canRespond = isPending && !isExpired && role === 'seller'
  const canWithdraw = isPending && !isExpired && role === 'buyer'
  const canPay = isAccepted && role === 'buyer'

  const handleAction = async (action: 'accept' | 'decline' | 'withdraw') => {
    setIsLoading(true)
    setActionType(action)
    setError(null)

    try {
      const response = await fetch(`/api/marketplace/offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          message: responseMessage || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${action} offer`)
      }

      router.refresh()
      onAction?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} offer`)
    } finally {
      setIsLoading(false)
      setActionType(null)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const handleProceedToCheckout = async () => {
    setIsLoading(true)
    setActionType('checkout')
    setError(null)

    try {
      // First create a transaction for this offer
      const transactionRes = await fetch('/api/marketplace/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offer.id }),
      })

      if (!transactionRes.ok) {
        const data = await transactionRes.json()
        throw new Error(data.error || 'Failed to create transaction')
      }

      const { transaction } = await transactionRes.json()

      // Then create checkout session
      const checkoutRes = await fetch(`/api/marketplace/transactions/${transaction.id}/checkout`, {
        method: 'POST',
      })

      if (!checkoutRes.ok) {
        const data = await checkoutRes.json()
        throw new Error(data.error || 'Failed to create checkout')
      }

      const { checkout_url } = await checkoutRes.json()

      // Redirect to Stripe Checkout
      window.location.href = checkout_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setIsLoading(false)
      setActionType(null)
    }
  }

  return (
    <div
      className={cn(
        'border rounded-lg bg-card overflow-hidden transition-shadow',
        'hover:shadow-md',
        className
      )}
    >
      {/* Main Content */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Game Image */}
          <Link
            href={`/games/${offer.game_slug}`}
            className="flex-shrink-0 w-16 h-16 relative rounded overflow-hidden bg-muted"
          >
            {offer.game_image ? (
              <Image
                src={offer.game_image}
                alt={offer.game_name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </Link>

          {/* Offer Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/games/${offer.game_slug}`}
                  className="font-medium hover:text-primary line-clamp-1"
                >
                  {offer.game_name}
                </Link>

                <div className="flex items-center gap-2 mt-1">
                  {/* Offer Type Badge */}
                  <Badge variant="outline" className="text-xs gap-1">
                    <TypeIcon className="h-3 w-3" />
                    {typeInfo.label}
                  </Badge>

                  {/* Status Badge */}
                  <Badge className={cn('text-xs', statusInfo.bgColor, statusInfo.color)}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>

              {/* Offer Amount */}
              <div className="text-right flex-shrink-0">
                {offer.amount_cents && (
                  <div className="font-semibold text-lg">
                    {formatPrice(offer.amount_cents)}
                  </div>
                )}
                {offer.trade_game_count > 0 && (
                  <div className="text-xs text-muted-foreground">
                    +{offer.trade_game_count} game{offer.trade_game_count > 1 ? 's' : ''} in trade
                  </div>
                )}
              </div>
            </div>

            {/* Other Party Info */}
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {offer.other_user_avatar ? (
                <Image
                  src={offer.other_user_avatar}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-[10px]">
                    {(offer.other_user_display_name || offer.other_user_username || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span>
                {role === 'seller' ? 'From ' : 'To '}
                <Link
                  href={`/u/${offer.other_user_username}`}
                  className="hover:text-primary"
                >
                  {offer.other_user_display_name || offer.other_user_username || 'Anonymous'}
                </Link>
              </span>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
              </span>
              {isPending && (
                <span className={cn('flex items-center gap-1', isExpired && 'text-destructive')}>
                  <Clock className="h-3 w-3" />
                  {isExpired
                    ? 'Expired'
                    : `Expires ${formatDistanceToNow(new Date(offer.expires_at), { addSuffix: true })}`}
                </span>
              )}
              {offer.counter_count > 0 && (
                <span className="text-muted-foreground">
                  Counter #{offer.counter_count}
                </span>
              )}
            </div>

            {/* Message Preview */}
            {offer.message && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground">
                  <MessageCircle className="h-3 w-3" />
                  Message
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <p className="text-sm bg-muted/50 rounded p-2 italic">
                    &ldquo;{offer.message}&rdquo;
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </div>

      {/* Actions (Seller) */}
      {canRespond && (
        <div className="border-t bg-muted/30 p-3 space-y-3">
          {showResponseInput ? (
            <>
              <Textarea
                placeholder="Add a message (optional)..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="h-20"
                maxLength={500}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAction('accept')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading && actionType === 'accept' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleAction('decline')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading && actionType === 'decline' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowResponseInput(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setShowResponseInput(true)}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowResponseInput(true)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
              >
                <Link href={`/marketplace/listings/${offer.listing_id}`}>
                  View Listing
                </Link>
              </Button>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      )}

      {/* Actions (Buyer) */}
      {canWithdraw && (
        <div className="border-t bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('withdraw')}
              disabled={isLoading}
            >
              {isLoading && actionType === 'withdraw' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Withdraw Offer
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/marketplace/listings/${offer.listing_id}`}>
                View Listing
              </Link>
            </Button>
          </div>
          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Accepted - Pay Now Button (Buyer) */}
      {canPay && (
        <div className="border-t bg-green-50 p-3 space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Offer Accepted!</span>
          </div>
          <Button
            size="sm"
            onClick={handleProceedToCheckout}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && actionType === 'checkout' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redirecting to payment...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </>
            )}
          </Button>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      )}

      {/* Accepted - Waiting for Payment (Seller) */}
      {isAccepted && role === 'seller' && (
        <div className="border-t bg-green-50 p-3">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Offer Accepted</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Waiting for buyer to complete payment...
          </p>
        </div>
      )}

      {/* Completed/Past Actions - Show View Button */}
      {!isPending && !isAccepted && (
        <div className="border-t bg-muted/30 p-3">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/marketplace/listings/${offer.listing_id}`}>
              View Listing
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
