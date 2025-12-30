import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingBag, Store, ArrowLeft, Package } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getTransactionsByUser, getActionRequiredCount } from '@/lib/supabase/transaction-queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TransactionsPageClient } from './TransactionsPageClient'

export const metadata: Metadata = {
  title: 'My Transactions',
  description: 'View and manage your marketplace purchases and sales',
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/marketplace/transactions')
  }

  // Fetch initial data for both tabs
  const [purchases, sales, actionCounts] = await Promise.all([
    getTransactionsByUser(user.id, 'buyer', { limit: 20 }),
    getTransactionsByUser(user.id, 'seller', { limit: 20 }),
    getActionRequiredCount(user.id),
  ])

  const hasPurchases = purchases.transactions.length > 0
  const hasSales = sales.transactions.length > 0
  const hasTransactions = hasPurchases || hasSales

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
            <h1 className="text-2xl font-bold">My Transactions</h1>
            <p className="text-muted-foreground text-sm">
              Track your purchases and sales
            </p>
          </div>
        </div>
      </div>

      {!hasTransactions ? (
        <Card className="text-center py-16">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No transactions yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Your purchases and sales will appear here once you complete a transaction.
            </p>
            <Button asChild>
              <Link href="/marketplace">
                Browse Marketplace
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TransactionsPageClient
          initialPurchases={purchases}
          initialSales={sales}
          purchaseActionCount={actionCounts.asBuyer}
          salesActionCount={actionCounts.asSeller}
          userId={user.id}
        />
      )}
    </div>
  )
}
