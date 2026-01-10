'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { UserPlus, Package, Star, Trophy, RefreshCw, User, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ActivityWithDetails, ShelfStatus } from '@/types/database'

interface ActivityItemProps {
  activity: ActivityWithDetails
}

const SHELF_STATUS_LABELS: Record<ShelfStatus, string> = {
  owned: 'Owned',
  played: 'Played',
  want_to_buy: 'Want to Buy',
  want_to_play: 'Want to Play',
  wishlist: 'Wishlist',
  previously_owned: 'Previously Owned',
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
    case 'top_games_update':
      return Trophy
    case 'review':
      return MessageSquare
    default:
      return RefreshCw
  }
}

function UserAvatar({ user }: { user: ActivityWithDetails['user'] }) {
  const avatarUrl = user.custom_avatar_url || user.avatar_url

  return (
    <Link href={`/u/${user.username}`} className="flex-shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.display_name || user.username || ''}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
      )}
    </Link>
  )
}

function UserLink({ user }: { user: ActivityWithDetails['user'] }) {
  return (
    <Link
      href={`/u/${user.username}`}
      className="font-semibold hover:text-primary transition-colors"
    >
      {user.display_name || user.username}
    </Link>
  )
}

function GameLink({ game }: { game: NonNullable<ActivityWithDetails['game']> }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="font-semibold hover:text-primary transition-colors"
    >
      {game.name}
    </Link>
  )
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = getActivityIcon(activity.activity_type)
  const metadata = activity.metadata as Record<string, unknown>

  const renderContent = () => {
    switch (activity.activity_type) {
      case 'follow':
        return (
          <p className="text-sm">
            <UserLink user={activity.user} /> followed{' '}
            {activity.target_user ? (
              <Link
                href={`/u/${activity.target_user.username}`}
                className="font-semibold hover:text-primary transition-colors"
              >
                {activity.target_user.display_name || activity.target_user.username}
              </Link>
            ) : (
              'a user'
            )}
          </p>
        )

      case 'shelf_add': {
        const status = metadata?.status as ShelfStatus | undefined
        return (
          <p className="text-sm">
            <UserLink user={activity.user} /> added{' '}
            {activity.game ? <GameLink game={activity.game} /> : 'a game'} to their shelf
            {status && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {SHELF_STATUS_LABELS[status] || status}
              </Badge>
            )}
          </p>
        )
      }

      case 'shelf_update': {
        const newStatus = metadata?.new_status as ShelfStatus | undefined
        return (
          <p className="text-sm">
            <UserLink user={activity.user} /> updated{' '}
            {activity.game ? <GameLink game={activity.game} /> : 'a game'} status to{' '}
            {newStatus && (
              <Badge variant="secondary" className="text-xs">
                {SHELF_STATUS_LABELS[newStatus] || newStatus}
              </Badge>
            )}
          </p>
        )
      }

      case 'rating': {
        const rating = metadata?.rating as number | undefined
        return (
          <p className="text-sm">
            <UserLink user={activity.user} /> rated{' '}
            {activity.game ? <GameLink game={activity.game} /> : 'a game'}{' '}
            {rating !== undefined && (
              <Badge variant="default" className="ml-1">
                {rating}/10
              </Badge>
            )}
          </p>
        )
      }

      case 'top_games_update':
        return (
          <p className="text-sm">
            <UserLink user={activity.user} /> updated their Top 10 games
          </p>
        )

      case 'review':
        return (
          <p className="text-sm">
            <UserLink user={activity.user} /> reviewed{' '}
            {activity.game ? <GameLink game={activity.game} /> : 'a game'}
          </p>
        )

      default:
        return (
          <p className="text-sm text-muted-foreground">Unknown activity</p>
        )
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <UserAvatar user={activity.user} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">{renderContent()}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                <Icon className="h-3.5 w-3.5" />
                <span>
                  {activity.created_at && formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Game thumbnail for game-related activities */}
            {activity.game && activity.game.box_image_url && (
              <Link
                href={`/games/${activity.game.slug}`}
                className="mt-3 block relative aspect-video max-w-[200px] rounded-lg overflow-hidden bg-muted"
              >
                <Image
                  src={activity.game.box_image_url}
                  alt={activity.game.name}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
