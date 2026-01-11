'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/AuthContext'
import { getFriendsVibesJoin } from '@/lib/supabase/vibe-queries'
import { cn } from '@/lib/utils'
import type { FriendVibe } from '@/types/database'

interface FriendsVibesProps {
  gameId: string
  maxVisible?: number
  className?: string
}

export function FriendsVibes({
  gameId,
  maxVisible = 5,
  className,
}: FriendsVibesProps) {
  const { user } = useAuth()
  const [friendsVibes, setFriendsVibes] = useState<FriendVibe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!user) {
      setFriendsVibes([])
      return
    }

    setIsLoading(true)
    getFriendsVibesJoin(user.id, gameId)
      .then(setFriendsVibes)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [user, gameId])

  // Don't show if not logged in
  if (!user) return null

  // Loading state
  if (isLoading) {
    return <FriendsVibesSkeleton className={className} />
  }

  // No friends have vibed
  if (friendsVibes.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border/50 bg-card/30 p-4', className)}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Friends&apos; Vibes</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Be the first among your friends to drop a vibe!
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/discover">Find Friends</Link>
        </Button>
      </div>
    )
  }

  const visibleVibes = expanded ? friendsVibes : friendsVibes.slice(0, maxVisible)
  const remainingCount = friendsVibes.length - maxVisible

  return (
    <div className={cn('rounded-xl border border-border/50 bg-card/30 p-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {friendsVibes.length} {friendsVibes.length === 1 ? 'friend' : 'friends'} dropped vibes
        </span>
      </div>

      {/* Stacked avatars */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            'flex items-center',
            expanded ? 'flex-wrap gap-2' : '-space-x-2'
          )}
        >
          {visibleVibes.map((vibe, index) => {
            const displayName = vibe.user.displayName || vibe.user.username || 'Anonymous'
            const avatarUrl = vibe.user.customAvatarUrl || vibe.user.avatarUrl
            const initials = displayName.slice(0, 2).toUpperCase()
            const profileUrl = vibe.user.username ? `/u/${vibe.user.username}` : undefined

            return (
              <div
                key={vibe.id}
                className={cn(
                  'relative transition-all duration-200',
                  !expanded && 'hover:scale-110 hover:z-10'
                )}
                style={{ zIndex: friendsVibes.length - index }}
              >
                {profileUrl ? (
                  <Link href={profileUrl}>
                    <Avatar className="h-8 w-8 ring-2 ring-background">
                      <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Link>
                ) : (
                  <Avatar className="h-8 w-8 ring-2 ring-background">
                    <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}

          {!expanded && remainingCount > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-background cursor-pointer hover:bg-muted/80 transition-colors"
            >
              +{remainingCount}
            </button>
          )}
        </div>
      </div>

      {/* Natural language summary */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {friendsVibes.slice(0, 3).map((vibe, index, arr) => {
          const name = vibe.user.displayName || vibe.user.username || 'Someone'
          const vibeWord = getVibeWord(vibe.value)
          const isLast = index === arr.length - 1
          const isSecondToLast = index === arr.length - 2

          return (
            <span key={vibe.id}>
              <span className="font-medium text-foreground">{name}</span>
              {' '}{vibeWord}{' '}
              <span className="font-medium">({vibe.value})</span>
              {!isLast && (
                isSecondToLast && arr.length > 2
                  ? ', '
                  : isSecondToLast
                    ? ' and '
                    : ', '
              )}
            </span>
          )
        })}
        {friendsVibes.length > 3 && (
          <span> and {friendsVibes.length - 3} more</span>
        )}
      </p>

      {/* Collapse button */}
      {expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-3 text-sm text-primary hover:underline cursor-pointer"
        >
          Show less
        </button>
      )}
    </div>
  )
}

// Get natural language description based on vibe value
function getVibeWord(value: number): string {
  if (value >= 9) return 'loved it'
  if (value >= 7) return 'thought it was solid'
  if (value >= 5) return 'had mixed feelings'
  if (value >= 3) return 'wasn\'t into it'
  return 'really didn\'t like it'
}

// Skeleton for loading state
export function FriendsVibesSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border/50 bg-card/30 p-4 animate-pulse', className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
      <div className="flex -space-x-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-8 rounded-full bg-muted ring-2 ring-background" />
        ))}
      </div>
      <div className="h-4 w-3/4 rounded bg-muted" />
    </div>
  )
}
