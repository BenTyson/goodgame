'use client'

import {
  Package,
  Tag,
  AlertTriangle,
  MessageCircle,
  DollarSign,
  Star,
} from 'lucide-react'
import { DashboardStatCard } from './DashboardStatCard'
import type { SellerDashboardStats } from '@/types/marketplace'

interface DashboardStatsGridProps {
  stats: SellerDashboardStats
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatRating(rating: number | null): string {
  if (rating === null) return 'N/A'
  return rating.toFixed(1)
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <DashboardStatCard
        icon={<Package className="h-5 w-5 text-green-600" />}
        label="Active Listings"
        value={stats.activeListings}
        href="/marketplace/my-listings"
        color="bg-green-100"
      />
      <DashboardStatCard
        icon={<Tag className="h-5 w-5 text-blue-600" />}
        label="Pending Offers"
        value={stats.pendingOffers}
        href="/marketplace/offers"
        color="bg-blue-100"
      />
      <DashboardStatCard
        icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
        label="Action Required"
        value={stats.actionRequired}
        color="bg-amber-100"
      />
      <DashboardStatCard
        icon={<MessageCircle className="h-5 w-5 text-purple-600" />}
        label="Unread Messages"
        value={stats.unreadMessages}
        href="/marketplace/messages"
        color="bg-purple-100"
      />
      <DashboardStatCard
        icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
        label="Total Earnings"
        value={formatCurrency(stats.totalEarningsCents)}
        subtitle={`${stats.totalSales} sales`}
        href="/marketplace/transactions"
        color="bg-emerald-100"
      />
      <DashboardStatCard
        icon={<Star className="h-5 w-5 text-yellow-600" />}
        label="Seller Rating"
        value={formatRating(stats.rating)}
        subtitle={`${stats.feedbackCount} reviews`}
        color="bg-yellow-100"
      />
    </div>
  )
}
