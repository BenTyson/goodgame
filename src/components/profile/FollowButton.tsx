'use client'

import { useState, useEffect } from 'react'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { followUser, unfollowUser, checkIsFollowing } from '@/lib/supabase/user-queries'

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing?: boolean
  variant?: 'default' | 'compact'
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  variant = 'default',
  onFollowChange,
}: FollowButtonProps) {
  const { user, isLoading: isAuthLoading, signInWithGoogle } = useAuth()
  const [following, setFollowing] = useState(initialIsFollowing ?? false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(initialIsFollowing === undefined)

  // Fetch follow status on mount (if not provided)
  useEffect(() => {
    if (isAuthLoading || !user || initialIsFollowing !== undefined) {
      if (!isAuthLoading && !user) {
        setIsFetching(false)
      }
      return
    }

    setIsFetching(true)
    checkIsFollowing(user.id, targetUserId)
      .then(setFollowing)
      .catch(console.error)
      .finally(() => setIsFetching(false))
  }, [user, targetUserId, isAuthLoading, initialIsFollowing])

  const handleToggleFollow = async () => {
    if (!user) {
      signInWithGoogle()
      return
    }

    setIsLoading(true)
    try {
      if (following) {
        await unfollowUser(user.id, targetUserId)
        setFollowing(false)
        onFollowChange?.(false)
      } else {
        await followUser(user.id, targetUserId)
        setFollowing(true)
        onFollowChange?.(true)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button if viewing own profile
  if (user?.id === targetUserId) return null

  // Loading state
  if (isAuthLoading || isFetching) {
    return (
      <Button
        variant="outline"
        size={variant === 'compact' ? 'sm' : 'default'}
        disabled
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  return (
    <Button
      variant={following ? 'outline' : 'default'}
      size={variant === 'compact' ? 'sm' : 'default'}
      onClick={handleToggleFollow}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : following ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}
