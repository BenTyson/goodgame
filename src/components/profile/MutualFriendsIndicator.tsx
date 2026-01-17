'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getMutualFriendsBetween } from '@/lib/supabase/friend-queries'
import type { Friend } from '@/types/database'

interface MutualFriendsIndicatorProps {
  currentUserId: string
  targetUserId: string
  className?: string
}

export function MutualFriendsIndicator({
  currentUserId,
  targetUserId,
  className,
}: MutualFriendsIndicatorProps) {
  const [mutualFriends, setMutualFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchMutualFriends() {
      try {
        const friends = await getMutualFriendsBetween(currentUserId, targetUserId)
        setMutualFriends(friends)
      } catch (error) {
        console.error('Error fetching mutual friends:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMutualFriends()
  }, [currentUserId, targetUserId])

  if (isLoading || mutualFriends.length === 0) {
    return null
  }

  const visibleFriends = mutualFriends.slice(0, 3)
  const remainingCount = mutualFriends.length - 3

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {/* Stacked avatars */}
        <div className="flex -space-x-2">
          {visibleFriends.map((friend) => {
            const displayName = friend.displayName || friend.username || 'A'
            const avatarUrl = friend.customAvatarUrl || friend.avatarUrl
            const initials = displayName.slice(0, 1).toUpperCase()
            const profileUrl = friend.username ? `/u/${friend.username}` : undefined

            return (
              <Link key={friend.id} href={profileUrl || '#'}>
                <Avatar className="h-6 w-6 ring-2 ring-background hover:ring-primary transition-colors">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                </Avatar>
              </Link>
            )
          })}
          {remainingCount > 0 && (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium ring-2 ring-background">
              +{remainingCount}
            </div>
          )}
        </div>

        {/* Text */}
        <span className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{mutualFriends.length}</span>{' '}
          mutual {mutualFriends.length === 1 ? 'friend' : 'friends'}
        </span>
      </div>
    </div>
  )
}

// Compact version for smaller spaces
export function MutualFriendsBadge({
  currentUserId,
  targetUserId,
}: MutualFriendsIndicatorProps) {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCount() {
      try {
        const friends = await getMutualFriendsBetween(currentUserId, targetUserId)
        setCount(friends.length)
      } catch (error) {
        console.error('Error fetching mutual friends count:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCount()
  }, [currentUserId, targetUserId])

  if (isLoading || count === 0) {
    return null
  }

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
      <Users className="h-3 w-3" />
      <span>{count} mutual</span>
    </div>
  )
}
