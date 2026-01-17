'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Loader2, Compass } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMutualFriends, getMutualFriendsBetween, getFollowingNonFriends } from '@/lib/supabase/friend-queries'
import type { FriendWithProfile, Friend } from '@/types/database'

interface ProfileFriendsTabProps {
  userId: string
  isOwnProfile: boolean
  currentUserId?: string
}

export function ProfileFriendsTab({
  userId,
  isOwnProfile,
  currentUserId,
}: ProfileFriendsTabProps) {
  const [friends, setFriends] = useState<FriendWithProfile[]>([])
  const [following, setFollowing] = useState<Friend[]>([])
  const [mutualFriends, setMutualFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchFriends() {
      try {
        const [friendsData, followingData] = await Promise.all([
          getMutualFriends(userId),
          getFollowingNonFriends(userId),
        ])
        setFriends(friendsData)
        setFollowing(followingData)

        // If viewing another user's profile, get mutual friends
        if (!isOwnProfile && currentUserId) {
          const mutual = await getMutualFriendsBetween(currentUserId, userId)
          setMutualFriends(mutual)
        }
      } catch (error) {
        console.error('Error fetching friends:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFriends()
  }, [userId, isOwnProfile, currentUserId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasNoContent = friends.length === 0 && following.length === 0

  // Empty state - only show if no friends AND no following
  if (hasNoContent) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-medium mb-2">
          {isOwnProfile ? 'No friends yet' : 'No friends to show'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isOwnProfile
            ? 'Follow users and they follow you back to become friends.'
            : 'Friends appear when users mutually follow each other.'}
        </p>
        {isOwnProfile && (
          <Button asChild>
            <Link href="/discover">
              <Compass className="h-4 w-4 mr-2" />
              Discover People
            </Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
          </h2>
          {following.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Following {following.length} more
            </p>
          )}
        </div>
        {isOwnProfile && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/discover">
              <Compass className="h-4 w-4 mr-2" />
              Find More
            </Link>
          </Button>
        )}
      </div>

      {/* Mutual friends indicator (when viewing another profile) */}
      {!isOwnProfile && mutualFriends.length > 0 && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <MutualFriendsAvatars friends={mutualFriends} />
            <p className="text-sm">
              <span className="font-medium">{mutualFriends.length}</span>{' '}
              mutual {mutualFriends.length === 1 ? 'friend' : 'friends'}
            </p>
          </div>
        </div>
      )}

      {/* Friends Section */}
      {friends.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Friends
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        </div>
      )}

      {/* Following Section (non-friends) */}
      {following.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Following
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {following.map((user) => (
              <FollowingCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FriendCard({ friend }: { friend: FriendWithProfile }) {
  const displayName = friend.displayName || friend.username || 'Anonymous'
  const avatarUrl = friend.customAvatarUrl || friend.avatarUrl
  const initials = displayName.slice(0, 2).toUpperCase()
  const profileUrl = friend.username ? `/u/${friend.username}` : undefined

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/30 transition-colors hover:bg-card/50">
      {/* Avatar */}
      {profileUrl ? (
        <Link href={profileUrl} className="flex-shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        {profileUrl ? (
          <Link
            href={profileUrl}
            className="font-medium text-foreground hover:text-primary transition-colors block truncate"
          >
            {displayName}
          </Link>
        ) : (
          <span className="font-medium text-foreground block truncate">{displayName}</span>
        )}

        {friend.username && (
          <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
        )}

        {friend.mutualGamesCount > 0 && (
          <Badge variant="outline" className="text-xs mt-2">
            {friend.mutualGamesCount} games in common
          </Badge>
        )}
      </div>
    </div>
  )
}

function FollowingCard({ user }: { user: Friend }) {
  const displayName = user.displayName || user.username || 'Anonymous'
  const avatarUrl = user.customAvatarUrl || user.avatarUrl
  const initials = displayName.slice(0, 2).toUpperCase()
  const profileUrl = user.username ? `/u/${user.username}` : undefined

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/30 transition-colors hover:bg-card/50">
      {/* Avatar */}
      {profileUrl ? (
        <Link href={profileUrl} className="flex-shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        {profileUrl ? (
          <Link
            href={profileUrl}
            className="font-medium text-foreground hover:text-primary transition-colors block truncate"
          >
            {displayName}
          </Link>
        ) : (
          <span className="font-medium text-foreground block truncate">{displayName}</span>
        )}

        {user.username && (
          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
        )}
      </div>
    </div>
  )
}

function MutualFriendsAvatars({ friends }: { friends: Friend[] }) {
  const visibleFriends = friends.slice(0, 3)
  const remainingCount = friends.length - 3

  return (
    <div className="flex -space-x-2">
      {visibleFriends.map((friend) => {
        const displayName = friend.displayName || friend.username || 'A'
        const avatarUrl = friend.customAvatarUrl || friend.avatarUrl
        const initials = displayName.slice(0, 1).toUpperCase()

        return (
          <Avatar key={friend.id} className="h-8 w-8 ring-2 ring-background">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        )
      })}
      {remainingCount > 0 && (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-background">
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

// Export for use in profile header
export { MutualFriendsAvatars }
