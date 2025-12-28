'use client'

import { BarChart3, Users, Star, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProfileStatsProps {
  stats: {
    totalGames: number
    totalRated: number
    averageRating: number | null
    categoryBreakdown: { name: string; count: number }[]
    playerCountBreakdown: { range: string; count: number }[]
  }
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const {
    totalGames,
    totalRated,
    averageRating,
    categoryBreakdown,
    playerCountBreakdown,
  } = stats

  // Get top 5 categories
  const topCategories = categoryBreakdown.slice(0, 5)

  // Get the max count for bar width calculation
  const maxCategoryCount = Math.max(...topCategories.map(c => c.count), 1)
  const maxPlayerCount = Math.max(...playerCountBreakdown.map(p => p.count), 1)

  if (totalGames === 0) {
    return null
  }

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Collection Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rating Stats */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Star className="h-4 w-4" />
              Ratings
            </div>
            <div className="flex items-baseline gap-4">
              {averageRating ? (
                <div>
                  <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground ml-1">/ 10</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No ratings yet</span>
              )}
              {totalRated > 0 && (
                <span className="text-sm text-muted-foreground">
                  from {totalRated} rated {totalRated === 1 ? 'game' : 'games'}
                </span>
              )}
            </div>
          </div>

          {/* Player Count Preference */}
          {playerCountBreakdown.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Games by Player Count
              </div>
              <div className="space-y-2">
                {playerCountBreakdown.map((item) => (
                  <div key={item.range} className="flex items-center gap-2">
                    <span className="text-xs w-16 text-muted-foreground">{item.range}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{ width: `${(item.count / maxPlayerCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs w-6 text-right text-muted-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Categories */}
          {topCategories.length > 0 && (
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Top Categories
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topCategories.map((category, index) => (
                  <div key={category.name} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-4">{index + 1}.</span>
                    <span className="text-sm flex-1 truncate">{category.name}</span>
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{ width: `${(category.count / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs w-6 text-right text-muted-foreground">{category.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
