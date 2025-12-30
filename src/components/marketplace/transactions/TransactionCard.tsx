'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Package,
  Truck,
  ExternalLink,
  ChevronRight,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, formatCurrency } from '@/lib/utils'
import { CheckoutButton } from './CheckoutButton'
import {
  TRANSACTION_STATUS_INFO,
  SHIPPING_CARRIERS,
  type TransactionCardData,
} from '@/types/marketplace'

interface TransactionCardProps {
  transaction: TransactionCardData
  onAction?: () => void
}

export function TransactionCard({
  transaction,
  onAction,
}: TransactionCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const statusInfo = TRANSACTION_STATUS_INFO[transaction.status]
  const isBuyer = transaction.role === 'buyer'
  const actionText = isBuyer ? statusInfo.buyerAction : statusInfo.sellerAction

  // Format amounts
  const total = (transaction.amount_cents + transaction.shipping_cents) / 100
  const formattedTotal = formatCurrency(total, transaction.currency)

  // Get initials
  const otherUserName = transaction.other_user_display_name || transaction.other_user_username || 'User'
  const initials = otherUserName.slice(0, 2).toUpperCase()

  // Build tracking URL
  const trackingUrl = transaction.tracking_number && transaction.shipping_carrier && transaction.shipping_carrier !== 'other'
    ? `${SHIPPING_CARRIERS[transaction.shipping_carrier].trackingUrl}${transaction.tracking_number}`
    : null

  const handleConfirmDelivery = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/marketplace/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_delivery' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to confirm delivery')
      }

      onAction?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <Link
          href={`/marketplace/transactions/${transaction.id}`}
          className="block"
        >
          <div className="flex gap-4 p-4">
            {/* Game Image */}
            <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
              {transaction.game_image ? (
                <Image
                  src={transaction.game_image}
                  alt={transaction.game_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {transaction.game_name.charAt(0)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Game name and status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">
                    {transaction.game_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isBuyer ? 'Purchased from' : 'Sold to'}{' '}
                    <span className="font-medium">{otherUserName}</span>
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(statusInfo.bgColor, statusInfo.color, 'shrink-0')}
                >
                  {statusInfo.label}
                </Badge>
              </div>

              {/* Price and date */}
              <div className="flex items-center justify-between mt-2">
                <p className="font-semibold">{formattedTotal}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Action hint */}
              {actionText && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="truncate">{actionText}</span>
                  <ChevronRight className="h-3 w-3 shrink-0" />
                </p>
              )}
            </div>
          </div>
        </Link>

        {/* Quick actions */}
        {(transaction.status === 'pending_payment' && isBuyer) && (
          <div className="border-t px-4 py-3 bg-muted/30">
            <CheckoutButton
              transactionId={transaction.id}
              onError={setError}
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>
        )}

        {(transaction.status === 'shipped' && isBuyer) && (
          <div className="border-t px-4 py-3 bg-muted/30 space-y-2">
            {trackingUrl && (
              <Button variant="outline" size="sm" asChild className="w-full">
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                  <Truck className="h-4 w-4 mr-2" />
                  Track Package
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
            )}
            <Button
              onClick={handleConfirmDelivery}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Confirm Received
                </>
              )}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {(transaction.status === 'payment_held' && !isBuyer) && (
          <div className="border-t px-4 py-3 bg-muted/30">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/marketplace/transactions/${transaction.id}`)}
            >
              <Truck className="h-4 w-4 mr-2" />
              Add Shipping Info
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
