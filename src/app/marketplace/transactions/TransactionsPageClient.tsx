'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Store, RefreshCw, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TransactionCard } from '@/components/marketplace/transactions'
import type { TransactionsResponse } from '@/types/marketplace'

interface TransactionsPageClientProps {
  initialPurchases: TransactionsResponse
  initialSales: TransactionsResponse
  purchaseActionCount: number
  salesActionCount: number
  userId: string
}

export function TransactionsPageClient({
  initialPurchases,
  initialSales,
  purchaseActionCount,
  salesActionCount,
  userId,
}: TransactionsPageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases')
  const [purchases, setPurchases] = useState(initialPurchases)
  const [sales, setSales] = useState(initialSales)
  const [isLoading, setIsLoading] = useState(false)

  const currentTransactions = activeTab === 'purchases' ? purchases : sales
  const role = activeTab === 'purchases' ? 'buyer' : 'seller'

  const handleRefresh = () => {
    router.refresh()
  }

  const handleLoadMore = async () => {
    if (isLoading || !currentTransactions.hasMore) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/marketplace/transactions?role=${role}&offset=${currentTransactions.transactions.length}`
      )

      if (!response.ok) throw new Error('Failed to load more')

      const data: TransactionsResponse = await response.json()

      if (activeTab === 'purchases') {
        setPurchases({
          ...data,
          transactions: [...purchases.transactions, ...data.transactions],
        })
      } else {
        setSales({
          ...data,
          transactions: [...sales.transactions, ...data.transactions],
        })
      }
    } catch (error) {
      console.error('Error loading more transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'purchases' | 'sales')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="purchases" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Purchases
            {purchaseActionCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {purchaseActionCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <Store className="h-4 w-4" />
            Sales
            {salesActionCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {salesActionCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Purchases */}
        <TabsContent value="purchases" className="space-y-4">
          {purchases.transactions.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No purchases"
              description="When you buy items from the marketplace, they'll appear here."
              action={
                <Button asChild>
                  <Link href="/marketplace">
                    Browse Marketplace
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              {purchases.transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onAction={handleRefresh}
                />
              ))}
              {purchases.hasMore && (
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

        {/* Sales */}
        <TabsContent value="sales" className="space-y-4">
          {sales.transactions.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No sales"
              description="When you sell items on the marketplace, they'll appear here."
              action={
                <Button asChild>
                  <Link href="/marketplace/listings/new">
                    Create a Listing
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              {sales.transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onAction={handleRefresh}
                />
              ))}
              {sales.hasMore && (
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
  icon: typeof ShoppingBag
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
