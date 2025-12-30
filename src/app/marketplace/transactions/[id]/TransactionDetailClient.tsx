'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  Truck,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TransactionTimeline,
  CheckoutButton,
  ShippingForm,
} from '@/components/marketplace/transactions'
import { TransactionFeedback } from '@/components/marketplace/feedback'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { SHIPPING_CARRIERS, type TransactionWithDetails } from '@/types/marketplace'

interface TransactionDetailClientProps {
  transaction: TransactionWithDetails
  isBuyer: boolean
  gameName: string
  gameImage?: string | null
  otherPartyName: string
  otherPartyAvatar?: string | null
}

export function TransactionDetailClient({
  transaction,
  isBuyer,
  gameName,
  gameImage,
  otherPartyName,
  otherPartyAvatar,
}: TransactionDetailClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestRefund = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/marketplace/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_refund' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to request refund')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction Status</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTimeline
            status={transaction.status}
            paidAt={transaction.paid_at}
            shippedAt={transaction.shipped_at}
            deliveredAt={transaction.delivered_at}
            releasedAt={transaction.released_at}
          />
        </CardContent>
      </Card>

      {/* Actions based on status and role */}
      {transaction.status === 'pending_payment' && isBuyer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Complete Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your payment will be held securely until you confirm receipt of the item.
              This protects both you and the seller.
            </p>
            <CheckoutButton
              transactionId={transaction.id}
              onError={setError}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {transaction.status === 'payment_held' && !isBuyer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ship the Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The buyer has paid. Please ship the item and add tracking information.
              Funds will be released after the buyer confirms receipt.
            </p>
            <ShippingForm
              transactionId={transaction.id}
              existingCarrier={transaction.shipping_carrier}
              existingTrackingNumber={transaction.tracking_number}
              canShip={true}
              onShipped={() => router.refresh()}
              onError={setError}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {transaction.status === 'shipped' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tracking Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transaction.shipping_carrier && (
              <div>
                <p className="text-sm text-muted-foreground">Carrier</p>
                <p className="font-medium">
                  {SHIPPING_CARRIERS[transaction.shipping_carrier]?.label || transaction.shipping_carrier}
                </p>
              </div>
            )}
            {transaction.tracking_number && (
              <div>
                <p className="text-sm text-muted-foreground">Tracking Number</p>
                <p className="font-mono">{transaction.tracking_number}</p>
              </div>
            )}
            {trackingUrl && (
              <Button variant="outline" asChild className="w-full">
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                  <Truck className="h-4 w-4 mr-2" />
                  Track Package
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
            )}

            {isBuyer && (
              <>
                <p className="text-sm text-muted-foreground">
                  Once you receive the item, please confirm delivery to release
                  payment to the seller.
                </p>
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
              </>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {transaction.status === 'delivered' && !isBuyer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Awaiting Payment Release</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The buyer has confirmed receipt. Your payment will be released automatically
              within 7 days, or sooner if the buyer releases early.
            </p>
          </CardContent>
        </Card>
      )}

      {transaction.status === 'completed' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {isBuyer
                  ? 'Thank you for your purchase! The transaction is complete.'
                  : 'Payment has been released to your account. Thank you for selling on Board Nomads!'}
              </p>
            </CardContent>
          </Card>

          {/* Feedback Form */}
          <TransactionFeedback
            transactionId={transaction.id}
            gameName={gameName}
            gameImage={gameImage}
            otherPartyName={otherPartyName}
            otherPartyAvatar={otherPartyAvatar}
          />
        </>
      )}

      {/* Refund request option for buyer */}
      {isBuyer && ['payment_held', 'shipped'].includes(transaction.status) && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Having Issues?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If there&apos;s a problem with your order, you can request a refund.
              This will notify the seller and our team will review the request.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Request Refund
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Request Refund</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to request a refund? This will pause the
                    transaction while our team reviews your request. The seller will
                    be notified.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRequestRefund}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Requesting...' : 'Request Refund'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </CardContent>
        </Card>
      )}
    </>
  )
}
