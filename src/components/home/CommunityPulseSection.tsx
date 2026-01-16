'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Activity, Star, Package, UserPlus, MessageSquare, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActivityWithDetails, ShelfStatus } from '@/types/database'

interface CommunityPulseSectionProps {
  activities: ActivityWithDetails[]
}

const SHELF_STATUS_LABELS: Record<ShelfStatus, string> = {
  owned: 'owns',
  played: 'played',
  want_to_buy: 'wants to buy',
  want_to_play: 'wants to play',
  wishlist: 'added to wishlist',
  previously_owned: 'previously owned',
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'follow':
      return UserPlus
    case 'shelf_add':
    case 'shelf_update':
      return Package
    case 'rating':
      return Star
    case 'review':
      return MessageSquare
    default:
      return Activity
  }
}

export function CommunityPulseSection({ activities }: CommunityPulseSectionProps) {
  if (activities.length === 0) return null

  return (
    <section className="border-y bg-muted/30">
      <div className="container py-16 md:py-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Community Pulse
              </h2>
            </div>
            <p className="text-muted-foreground text-lg">
              See what the community is playing
            </p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex group">
            <Link href="/feed">
              View Feed
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <Card className="[box-shadow:var(--shadow-card)]">
          <CardContent className="p-0 divide-y">
            {activities.slice(0, 8).map((activity) => (
              <CompactActivityItem key={activity.id} activity={activity} />
            ))}
          </CardContent>
        </Card>

        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/feed">
              View Full Feed
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function CompactActivityItem({ activity }: { activity: ActivityWithDetails }) {
  const Icon = getActivityIcon(activity.activity_type)
  const metadata = activity.metadata as Record<string, unknown>
  const user = activity.user
  const game = activity.game
  const avatarUrl = user.custom_avatar_url || user.avatar_url

  const getActionText = () => {
    switch (activity.activity_type) {
      case 'rating':
        return (
          <>
            rated{' '}
            {game && (
              <Link href={`/games/${game.slug}`} className="font-medium hover:text-primary">
                {game.name}
              </Link>
            )}{' '}
            <span className="inline-flex items-center gap-0.5 text-amber-600">
              <Star className="h-3 w-3 fill-amber-500" />
              {metadata.rating as number}
            </span>
          </>
        )
      case 'shelf_add':
        return (
          <>
            {SHELF_STATUS_LABELS[(metadata.status as ShelfStatus) || 'owned']}{' '}
            {game && (
              <Link href={`/games/${game.slug}`} className="font-medium hover:text-primary">
                {game.name}
              </Link>
            )}
          </>
        )
      case 'follow':
        return (
          <>
            followed{' '}
            {activity.target_user && (
              <Link href={`/u/${activity.target_user.username}`} className="font-medium hover:text-primary">
                {activity.target_user.display_name || activity.target_user.username}
              </Link>
            )}
          </>
        )
      case 'review':
        return (
          <>
            reviewed{' '}
            {game && (
              <Link href={`/games/${game.slug}`} className="font-medium hover:text-primary">
                {game.name}
              </Link>
            )}
          </>
        )
      default:
        return 'did something'
    }
  }

  return (
    <div className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
      {/* Avatar */}
      <Link href={`/u/${user.username}`} className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.display_name || user.username || ''}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          <Link href={`/u/${user.username}`} className="font-semibold hover:text-primary">
            {user.display_name || user.username}
          </Link>{' '}
          {getActionText()}
        </p>
      </div>

      {/* Game thumbnail (if applicable) */}
      {game?.thumbnail_url && (
        <Link href={`/games/${game.slug}`} className="flex-shrink-0">
          <img
            src={game.thumbnail_url}
            alt={game.name}
            className="h-10 w-10 rounded object-cover"
          />
        </Link>
      )}

      {/* Timestamp */}
      {activity.created_at && (
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </span>
      )}
    </div>
  )
}
