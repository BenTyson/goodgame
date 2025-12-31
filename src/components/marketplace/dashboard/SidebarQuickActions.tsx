'use client'

import Link from 'next/link'
import { Plus, Settings, Star, DollarSign, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TrustLevel } from '@/types/marketplace'

interface SidebarQuickActionsProps {
  totalEarningsCents: number
  rating: number | null
  feedbackCount: number
  trustLevel: TrustLevel
  isCollapsed?: boolean
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function getTrustLevelLabel(level: TrustLevel): string {
  const labels: Record<TrustLevel, string> = {
    new: 'New Seller',
    established: 'Established',
    trusted: 'Trusted',
    top_seller: 'Top Seller',
  }
  return labels[level] || 'New Seller'
}

function getTrustLevelColor(level: TrustLevel): string {
  const colors: Record<TrustLevel, string> = {
    new: 'text-slate-500',
    established: 'text-blue-500',
    trusted: 'text-purple-500',
    top_seller: 'text-amber-500',
  }
  return colors[level] || 'text-slate-500'
}

export function SidebarQuickActions({
  totalEarningsCents,
  rating,
  feedbackCount,
  trustLevel,
  isCollapsed,
}: SidebarQuickActionsProps) {
  if (isCollapsed) {
    return (
      <div className="space-y-2">
        <Button size="icon" asChild className="w-full">
          <Link href="/marketplace/listings/new" title="New Listing">
            <Plus className="h-5 w-5" />
          </Link>
        </Button>
        <Button variant="outline" size="icon" asChild className="w-full">
          <Link href="/settings/marketplace" title="Settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Seller Stats */}
      <div className="bg-muted rounded-lg p-3 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Seller Stats
        </h3>

        {/* Earnings */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          <div className="flex-1">
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(totalEarningsCents)}
            </p>
            <p className="text-xs text-muted-foreground">Total Earnings</p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          <div className="flex-1">
            <p className="text-lg font-bold text-foreground">
              {rating !== null ? rating.toFixed(1) : '—'}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({feedbackCount})
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
        </div>

        {/* Trust Level */}
        <div className="flex items-center gap-2">
          <ShieldCheck className={cn('h-4 w-4', getTrustLevelColor(trustLevel))} />
          <div className="flex-1">
            <p className={cn('text-sm font-semibold', getTrustLevelColor(trustLevel))}>
              {getTrustLevelLabel(trustLevel)}
            </p>
            <p className="text-xs text-muted-foreground">Trust Level</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button asChild className="w-full">
          <Link href="/marketplace/listings/new">
            <Plus className="h-4 w-4 mr-2" />
            New Listing
          </Link>
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link href="/settings/marketplace">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  )
}
