'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { VIBE_COLORS } from '@/types/database'
import type { VibeWithUser } from '@/types/database'

interface VibeCardProps {
  vibe: VibeWithUser
  isOwnVibe?: boolean
  onEdit?: () => void
  variant?: 'default' | 'compact'
  className?: string
}

const TRUNCATE_LENGTH = 280

export function VibeCard({
  vibe,
  isOwnVibe = false,
  onEdit,
  variant = 'default',
  className,
}: VibeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const displayName = vibe.user.displayName || vibe.user.username || 'Anonymous'
  const avatarUrl = vibe.user.customAvatarUrl || vibe.user.avatarUrl
  const initials = displayName.slice(0, 2).toUpperCase()
  const profileUrl = vibe.user.username ? `/u/${vibe.user.username}` : undefined

  const hasLongThoughts = vibe.thoughts && vibe.thoughts.length > TRUNCATE_LENGTH
  const displayedThoughts = vibe.thoughts
    ? (hasLongThoughts && !isExpanded ? vibe.thoughts.slice(0, TRUNCATE_LENGTH) + '...' : vibe.thoughts)
    : null

  const timeAgo = formatDistanceToNow(new Date(vibe.createdAt), { addSuffix: true })

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 py-2',
          className
        )}
      >
        {/* Avatar */}
        {profileUrl ? (
          <Link href={profileUrl} className="shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        )}

        {/* Name and time */}
        <div className="flex-1 min-w-0">
          {profileUrl ? (
            <Link href={profileUrl} className="font-medium text-sm hover:underline truncate block">
              {displayName}
            </Link>
          ) : (
            <span className="font-medium text-sm truncate block">{displayName}</span>
          )}
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Vibe badge */}
        <span
          className={cn(
            'shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
            VIBE_COLORS[vibe.value]?.bg || 'bg-muted',
            VIBE_COLORS[vibe.value]?.text || 'text-foreground'
          )}
        >
          {vibe.value}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4 transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md hover:border-border',
        className
      )}
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {profileUrl ? (
            <Link href={profileUrl} className="block transition-transform hover:scale-105">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {profileUrl ? (
                  <Link href={profileUrl} className="font-semibold hover:underline truncate">
                    {displayName}
                  </Link>
                ) : (
                  <span className="font-semibold truncate">{displayName}</span>
                )}
                {isOwnVibe && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    You
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>

            {/* Vibe value pill */}
            <span
              className={cn(
                'shrink-0 inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-full text-sm font-bold',
                VIBE_COLORS[vibe.value]?.bg || 'bg-muted',
                VIBE_COLORS[vibe.value]?.text || 'text-foreground'
              )}
            >
              {vibe.value}
            </span>
          </div>

          {/* Thoughts */}
          {displayedThoughts && (
            <div className="mt-3">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {displayedThoughts}
              </p>
              {hasLongThoughts && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-1 text-sm text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      Show less <ChevronUp className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Edit button for own vibe */}
          {isOwnVibe && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="mt-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Skeleton for loading state
export function VibeCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 py-2 animate-pulse">
        <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
        <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-1">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
            <div className="h-8 w-12 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
