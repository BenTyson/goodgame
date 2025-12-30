import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Package, PackageX, CheckCircle, Clock, AlertCircle, Tag } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getSellerListings, getSellerListingStats } from '@/lib/supabase/listing-queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ListingGrid } from '@/components/marketplace'
import type { ListingStatus } from '@/types/marketplace'

export const metadata: Metadata = {
  title: 'My Listings',
  description: 'Manage your marketplace listings',
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  count: number
  color: string
}

function StatCard({ icon, label, count, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function MyListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/marketplace/my-listings')
  }

  // Get listing stats and all listings
  const [stats, allListings] = await Promise.all([
    getSellerListingStats(user.id),
    getSellerListings(user.id),
  ])

  // Filter listings by status
  const activeListings = allListings.filter(l => l.status === 'active')
  const draftListings = allListings.filter(l => l.status === 'draft')
  const pendingListings = allListings.filter(l => l.status === 'pending')
  const soldListings = allListings.filter(l => l.status === 'sold' || l.status === 'traded')
  const expiredListings = allListings.filter(l => l.status === 'expired' || l.status === 'cancelled')

  const hasListings = allListings.length > 0

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Listings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track your marketplace listings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/marketplace/offers">
              <Tag className="h-4 w-4 mr-2" />
              Offers
            </Link>
          </Button>
          <Button asChild>
            <Link href="/marketplace/listings/new">
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Package className="h-5 w-5 text-green-600" />}
          label="Active"
          count={stats.active}
          color="bg-green-100"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          label="Pending"
          count={stats.pending}
          color="bg-yellow-100"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-blue-600" />}
          label="Sold"
          count={stats.sold + stats.traded}
          color="bg-blue-100"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-gray-600" />}
          label="Draft"
          count={stats.draft}
          color="bg-gray-100"
        />
      </div>

      {!hasListings ? (
        /* Empty State */
        <Card className="text-center py-16">
          <CardContent>
            <PackageX className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No listings yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first listing to start selling, trading, or finding games on the marketplace.
            </p>
            <Button asChild>
              <Link href="/marketplace/listings/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Listings Tabs */
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="active" className="gap-2">
              Active
              {stats.active > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.active}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="drafts" className="gap-2">
              Drafts
              {stats.draft > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.draft}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              {stats.pending > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sold" className="gap-2">
              Sold
              {(stats.sold + stats.traded) > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.sold + stats.traded}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="expired" className="gap-2">
              Expired
              {(stats.expired + stats.cancelled) > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.expired + stats.cancelled}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeListings.length > 0 ? (
              <ListingGrid listings={activeListings} />
            ) : (
              <EmptyTabContent
                title="No active listings"
                description="Your active listings will appear here."
              />
            )}
          </TabsContent>

          <TabsContent value="drafts">
            {draftListings.length > 0 ? (
              <ListingGrid listings={draftListings} />
            ) : (
              <EmptyTabContent
                title="No drafts"
                description="Listings saved as drafts will appear here."
              />
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pendingListings.length > 0 ? (
              <ListingGrid listings={pendingListings} />
            ) : (
              <EmptyTabContent
                title="No pending listings"
                description="Listings awaiting buyer action will appear here."
              />
            )}
          </TabsContent>

          <TabsContent value="sold">
            {soldListings.length > 0 ? (
              <ListingGrid listings={soldListings} />
            ) : (
              <EmptyTabContent
                title="No sold listings"
                description="Completed sales and trades will appear here."
              />
            )}
          </TabsContent>

          <TabsContent value="expired">
            {expiredListings.length > 0 ? (
              <ListingGrid listings={expiredListings} />
            ) : (
              <EmptyTabContent
                title="No expired listings"
                description="Expired and cancelled listings will appear here."
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function EmptyTabContent({ title, description }: { title: string; description: string }) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
