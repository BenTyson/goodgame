'use client'

import Link from 'next/link'
import Image from 'next/image'
import { User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FollowButton } from './FollowButton'
import type { UserFollowWithFollower, UserFollowWithFollowing } from '@/types/database'

type FollowItem = UserFollowWithFollower | UserFollowWithFollowing

interface FollowersListProps {
  items: FollowItem[]
  type: 'followers' | 'following'
  emptyMessage?: string
}

export function FollowersList({
  items,
  type,
  emptyMessage = 'No users to display',
}: FollowersListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const profile = type === 'followers'
          ? (item as UserFollowWithFollower).follower
          : (item as UserFollowWithFollowing).following

        const avatarUrl = profile.custom_avatar_url || profile.avatar_url
        const displayName = profile.display_name || profile.username

        return (
          <Card key={item.id}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <Link href={`/u/${profile.username}`} className="flex-shrink-0">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName || ''}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/u/${profile.username}`} className="hover:underline">
                    <p className="font-medium truncate">{displayName}</p>
                  </Link>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                </div>

                <FollowButton
                  targetUserId={profile.id}
                  variant="compact"
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
