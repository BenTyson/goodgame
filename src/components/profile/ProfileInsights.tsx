'use client'

import {
  Package,
  ShoppingCart,
  Dices,
  Star,
  Users,
  BarChart3,
} from 'lucide-react'
import { Card } from '@/components/ui/card'

interface ShelfStats {
  total: number
  owned: number
  want_to_buy: number
  want_to_play: number
  wishlist: number
  previously_owned: number
}

interface ProfileStatsData {
  totalGames: number
  totalRated: number
  averageRating: number | null
  categoryBreakdown: { name: string; count: number }[]
  playerCountBreakdown: { range: string; count: number }[]
}

interface ProfileInsightsProps {
  shelfStats: ShelfStats | null
  profileStats: ProfileStatsData | null
}

export function ProfileInsights({ shelfStats, profileStats }: ProfileInsightsProps) {
  if (!shelfStats || shelfStats.total === 0) {
    return null
  }

  return (
    <Card className="p-5 space-y-5">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        Collection Insights
      </h3>

      {/* Collection Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Collection
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {shelfStats.owned > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-medium">{shelfStats.owned}</span>
              <span className="text-muted-foreground">owned</span>
            </div>
          )}
          {shelfStats.wishlist > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-primary" />
              <span className="font-medium">{shelfStats.wishlist}</span>
              <span className="text-muted-foreground">wishlist</span>
            </div>
          )}
          {shelfStats.want_to_play > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Dices className="h-4 w-4 text-primary" />
              <span className="font-medium">{shelfStats.want_to_play}</span>
              <span className="text-muted-foreground">want to play</span>
            </div>
          )}
          {shelfStats.want_to_buy > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="font-medium">{shelfStats.want_to_buy}</span>
              <span className="text-muted-foreground">want to buy</span>
            </div>
          )}
        </div>
      </div>

      {/* Player Count Preferences */}
      {profileStats && profileStats.playerCountBreakdown.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Player Count
          </h4>
          <div className="space-y-1.5">
            {profileStats.playerCountBreakdown.map((item) => {
              const maxCount = Math.max(...profileStats.playerCountBreakdown.map(p => p.count), 1)
              return (
                <div key={item.range} className="flex items-center gap-2">
                  <span className="text-xs w-16 text-muted-foreground">{item.range}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs w-5 text-right text-muted-foreground">{item.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Categories */}
      {profileStats && profileStats.categoryBreakdown.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Top Categories
          </h4>
          <div className="space-y-1">
            {profileStats.categoryBreakdown.slice(0, 5).map((category, idx) => {
              const maxCount = Math.max(...profileStats.categoryBreakdown.slice(0, 5).map(c => c.count), 1)
              return (
                <div key={category.name} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-3">{idx + 1}</span>
                  <span className="text-xs flex-1 truncate">{category.name}</span>
                  <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{ width: `${(category.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
