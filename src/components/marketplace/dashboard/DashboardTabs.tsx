'use client'

import { Package, Tag, DollarSign, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ListingGrid } from '@/components/marketplace'
import { OfferCard } from '@/components/marketplace/offers'
import { TransactionCard } from '@/components/marketplace/transactions'
import type { ListingCardData, OfferCardData, TransactionCardData } from '@/types/marketplace'

type DashboardTab = 'listings' | 'offers' | 'sales' | 'messages'

interface DashboardTabsProps {
  listings: ListingCardData[]
  offers: OfferCardData[]
  transactions: TransactionCardData[]
  onRefresh?: () => void
  activeTab?: DashboardTab
  onTabChange?: (tab: DashboardTab) => void
}

function EmptyTabContent({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-1">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        {actionLabel && actionHref && (
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardTabs({
  listings,
  offers,
  transactions,
  onRefresh,
  activeTab = 'listings',
  onTabChange,
}: DashboardTabsProps) {
  const activeListings = listings.filter(l => l.status === 'active')
  const pendingOffers = offers.filter(o => o.status === 'pending')
  const activeTransactions = transactions.filter(t =>
    ['pending_payment', 'payment_processing', 'payment_held', 'shipped', 'delivered'].includes(t.status)
  )

  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value as DashboardTab)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      {/* Hide TabsList on md+ since sidebar handles navigation */}
      <TabsList className="grid w-full grid-cols-4 md:hidden">
        <TabsTrigger value="listings" className="gap-1">
          <Package className="h-4 w-4" />
          <span className="sr-only">Listings</span>
          {activeListings.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {activeListings.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="offers" className="gap-1">
          <Tag className="h-4 w-4" />
          <span className="sr-only">Offers</span>
          {pendingOffers.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {pendingOffers.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="sales" className="gap-1">
          <DollarSign className="h-4 w-4" />
          <span className="sr-only">Sales</span>
          {activeTransactions.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {activeTransactions.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="messages" className="gap-1">
          <MessageCircle className="h-4 w-4" />
          <span className="sr-only">Messages</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="listings" className="space-y-4 mt-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Active Listings</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace/my-listings">View All</Link>
          </Button>
        </div>
        {activeListings.length > 0 ? (
          <ListingGrid listings={activeListings.slice(0, 8)} />
        ) : (
          <EmptyTabContent
            icon={Package}
            title="No active listings"
            description="Create your first listing to start selling."
            actionLabel="Create Listing"
            actionHref="/marketplace/listings/new"
          />
        )}
      </TabsContent>

      <TabsContent value="offers" className="space-y-4 mt-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pending Offers</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace/offers">View All</Link>
          </Button>
        </div>
        {pendingOffers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pendingOffers.slice(0, 6).map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                role="seller"
                onAction={onRefresh}
              />
            ))}
          </div>
        ) : (
          <EmptyTabContent
            icon={Tag}
            title="No pending offers"
            description="Offers on your listings will appear here."
          />
        )}
      </TabsContent>

      <TabsContent value="sales" className="space-y-4 mt-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Sales</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace/transactions">View All</Link>
          </Button>
        </div>
        {activeTransactions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeTransactions.slice(0, 6).map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onAction={onRefresh}
              />
            ))}
          </div>
        ) : (
          <EmptyTabContent
            icon={DollarSign}
            title="No sales yet"
            description="Your completed sales will appear here."
          />
        )}
      </TabsContent>

      <TabsContent value="messages" className="space-y-4 mt-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Messages</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace/messages">View All</Link>
          </Button>
        </div>
        <EmptyTabContent
          icon={MessageCircle}
          title="No messages"
          description="Messages from buyers will appear here."
        />
      </TabsContent>
    </Tabs>
  )
}
