'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Inbox, Send, ArrowLeft, RefreshCw, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { OfferCard } from '@/components/marketplace/offers'
import { cn } from '@/lib/utils'
import type { OffersResponse } from '@/types/marketplace'

interface OffersPageClientProps {
  initialReceivedOffers: OffersResponse
  initialSentOffers: OffersResponse
  pendingReceivedCount: number
  pendingSentCount: number
  userId: string
}

export function OffersPageClient({
  initialReceivedOffers,
  initialSentOffers,
  pendingReceivedCount,
  pendingSentCount,
  userId,
}: OffersPageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [receivedOffers, setReceivedOffers] = useState(initialReceivedOffers)
  const [sentOffers, setSentOffers] = useState(initialSentOffers)
  const [isLoading, setIsLoading] = useState(false)

  const currentOffers = activeTab === 'received' ? receivedOffers : sentOffers
  const currentPendingCount = activeTab === 'received' ? pendingReceivedCount : pendingSentCount
  const role = activeTab === 'received' ? 'seller' : 'buyer'

  const handleRefresh = () => {
    router.refresh()
  }

  const handleLoadMore = async () => {
    if (isLoading || !currentOffers.hasMore) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/marketplace/offers?role=${role}&offset=${currentOffers.offers.length}`
      )

      if (!response.ok) throw new Error('Failed to load more')

      const data: OffersResponse = await response.json()

      if (activeTab === 'received') {
        setReceivedOffers({
          ...data,
          offers: [...receivedOffers.offers, ...data.offers],
        })
      } else {
        setSentOffers({
          ...data,
          offers: [...sentOffers.offers, ...data.offers],
        })
      }
    } catch (error) {
      console.error('Error loading more offers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/marketplace">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Offers</h1>
            <p className="text-muted-foreground text-sm">
              Manage offers on your listings and offers you&apos;ve made
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'received' | 'sent')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="received" className="gap-2">
            <Inbox className="h-4 w-4" />
            Received
            {pendingReceivedCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {pendingReceivedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Sent
            {pendingSentCount > 0 && (
              <Badge className="h-5 px-1.5 text-xs bg-primary">
                {pendingSentCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Received Offers */}
        <TabsContent value="received" className="space-y-4">
          {receivedOffers.offers.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No offers received"
              description="When buyers make offers on your listings, they'll appear here."
            />
          ) : (
            <>
              {receivedOffers.offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  role="seller"
                  onAction={handleRefresh}
                />
              ))}
              {receivedOffers.hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Sent Offers */}
        <TabsContent value="sent" className="space-y-4">
          {sentOffers.offers.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No offers sent"
              description="When you make offers on listings, they'll appear here."
              action={
                <Button asChild>
                  <Link href="/marketplace">
                    <Package className="h-4 w-4 mr-2" />
                    Browse Marketplace
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              {sentOffers.offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  role="buyer"
                  onAction={handleRefresh}
                />
              ))}
              {sentOffers.hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Empty state component
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Inbox
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {description}
      </p>
      {action}
    </div>
  )
}
