import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Package,
  CreditCard,
  AlertCircle,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getTransactionById } from '@/lib/supabase/transaction-queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { TRANSACTION_STATUS_INFO } from '@/types/marketplace'
import { TransactionDetailClient } from './TransactionDetailClient'

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string }>
}

export async function generateMetadata({
  params,
}: TransactionDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const transaction = await getTransactionById(id)

  if (!transaction) {
    return { title: 'Transaction Not Found' }
  }

  const gameName = transaction.listing?.game?.name || 'Game'
  return {
    title: `Transaction - ${gameName}`,
    description: `View transaction details for ${gameName}`,
  }
}

export default async function TransactionDetailPage({
  params,
  searchParams,
}: TransactionDetailPageProps) {
  const { id } = await params
  const { payment } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/marketplace/transactions/${id}`)
  }

  const transaction = await getTransactionById(id)

  if (!transaction) {
    notFound()
  }

  // Verify user is buyer or seller
  if (transaction.buyer_id !== user.id && transaction.seller_id !== user.id) {
    notFound()
  }

  const isBuyer = transaction.buyer_id === user.id
  const statusInfo = TRANSACTION_STATUS_INFO[transaction.status]

  // Get game and user info
  const gameName = transaction.listing?.game?.name || 'Game'
  const gameImage = transaction.listing?.game?.box_image_url || transaction.listing?.game?.thumbnail_url
  const gameSlug = transaction.listing?.game?.slug

  const otherUser = isBuyer ? transaction.seller : transaction.buyer
  const otherUserName = otherUser?.display_name || otherUser?.username || 'User'
  const otherUserAvatar = otherUser?.custom_avatar_url || otherUser?.avatar_url
  const otherUserInitials = otherUserName.slice(0, 2).toUpperCase()

  // Calculate totals
  const itemAmount = transaction.amount_cents / 100
  const shippingAmount = transaction.shipping_cents / 100
  const totalAmount = itemAmount + shippingAmount

  return (
    <div className="container max-w-4xl py-8">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-6 -ml-3">
        <Link href="/marketplace/transactions">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transactions
        </Link>
      </Button>

      {/* Payment status messages */}
      {payment === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">Payment Successful!</p>
            <p className="text-sm text-green-700">
              Your payment is being processed. The seller will be notified to ship your item.
            </p>
          </div>
        </div>
      )}

      {payment === 'cancelled' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Payment Cancelled</p>
            <p className="text-sm text-yellow-700">
              Your payment was not completed. You can try again when ready.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-muted">
                  {gameImage ? (
                    <Image
                      src={gameImage}
                      alt={gameName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                      {gameName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h1 className="text-xl font-semibold">{gameName}</h1>
                      <p className="text-sm text-muted-foreground">
                        {isBuyer ? 'Purchased from' : 'Sold to'}{' '}
                        <Link
                          href={`/u/${otherUser?.username}`}
                          className="font-medium hover:underline"
                        >
                          {otherUserName}
                        </Link>
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(statusInfo.bgColor, statusInfo.color)}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {statusInfo.description}
                  </p>
                  {gameSlug && (
                    <Button variant="link" asChild className="px-0 mt-2 h-auto">
                      <Link href={`/games/${gameSlug}`}>
                        View game details
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline and Actions */}
          <TransactionDetailClient
            transaction={transaction}
            isBuyer={isBuyer}
            gameName={gameName}
            gameImage={gameImage}
            otherPartyName={otherUserName}
            otherPartyAvatar={otherUserAvatar}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item</span>
                <span>{formatCurrency(itemAmount, transaction.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {shippingAmount > 0
                    ? formatCurrency(shippingAmount, transaction.currency)
                    : 'Free'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totalAmount, transaction.currency)}</span>
              </div>

              {/* Fee breakdown for seller */}
              {!isBuyer && transaction.status !== 'pending_payment' && (
                <>
                  <Separator />
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Platform fee</span>
                      <span>-{formatCurrency(transaction.platform_fee_cents / 100, transaction.currency)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Processing fee</span>
                      <span>-{formatCurrency(transaction.stripe_fee_cents / 100, transaction.currency)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Your payout</span>
                      <span>{formatCurrency(transaction.seller_payout_cents / 100, transaction.currency)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Other Party Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isBuyer ? 'Seller' : 'Buyer'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/u/${otherUser?.username}`}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUserAvatar || undefined} alt={otherUserName} />
                  <AvatarFallback>{otherUserInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium group-hover:text-primary transition-colors truncate">
                    {otherUserName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{otherUser?.username}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Transaction Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>
                  {new Date(transaction.created_at).toLocaleDateString()}
                </span>
              </div>
              {transaction.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span>
                    {new Date(transaction.paid_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {transaction.shipped_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipped</span>
                  <span>
                    {new Date(transaction.shipped_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {transaction.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivered</span>
                  <span>
                    {new Date(transaction.delivered_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">
                  {transaction.id.slice(0, 8)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
