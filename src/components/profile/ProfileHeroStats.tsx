'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ProfileHeroStatsProps {
  username: string
  totalGames: number
  averageRating: number | null
  totalRated: number
  followerCount: number
  followingCount: number
  reviewCount: number
}

interface StatCardProps {
  value: string | number
  label: string
  href?: string
}

function StatCard({ value, label, href }: StatCardProps) {
  const content = (
    <Card className={`p-4 text-center ${href ? 'hover:bg-accent/50 transition-colors cursor-pointer' : ''}`}>
      <div className="text-3xl font-bold text-foreground">
        {value}
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        {label}
      </div>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

export function ProfileHeroStats({
  username,
  totalGames,
  averageRating,
  totalRated,
  followerCount,
  followingCount,
  reviewCount,
}: ProfileHeroStatsProps) {
  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          value={totalGames}
          label="Games"
        />
        <StatCard
          value={averageRating ? averageRating.toFixed(1) : '-'}
          label="Avg Rating"
        />
        <StatCard
          value={followerCount}
          label="Followers"
          href={`/u/${username}/followers`}
        />
        <StatCard
          value={reviewCount}
          label="Reviews"
        />
      </div>

      {/* Achievement Badges */}
      <div className="flex flex-wrap gap-2">
        {totalGames >= 100 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            Collector 100+
          </Badge>
        )}
        {totalGames >= 50 && totalGames < 100 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            Collector 50+
          </Badge>
        )}
        {totalRated >= 25 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            Prolific Rater
          </Badge>
        )}
        {reviewCount >= 10 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            Reviewer
          </Badge>
        )}
        {reviewCount >= 25 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            Top Reviewer
          </Badge>
        )}
      </div>
    </div>
  )
}
