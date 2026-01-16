import { Gamepad2, Star, Users } from 'lucide-react'
import type { CommunityStats } from '@/lib/supabase/game-queries'

interface CommunityStatsBarProps {
  stats: CommunityStats
}

export function CommunityStatsBar({ stats }: CommunityStatsBarProps) {
  const statItems = [
    {
      icon: Gamepad2,
      value: stats.totalGames,
      label: 'Games',
    },
    {
      icon: Star,
      value: stats.totalRatings,
      label: 'Ratings',
    },
    {
      icon: Users,
      value: stats.totalUsers,
      label: 'Collectors',
    },
  ]

  return (
    <div className="flex items-center justify-center gap-6 sm:gap-10">
      {statItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-muted-foreground">
          <item.icon className="h-4 w-4" />
          <span className="font-semibold text-foreground">{item.value.toLocaleString()}</span>
          <span className="text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
