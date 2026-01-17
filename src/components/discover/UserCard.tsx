'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { FollowButton } from '@/components/profile/FollowButton'
import { cn } from '@/lib/utils'

interface UserCardProps {
  user: {
    id: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
    customAvatarUrl: string | null
    bio?: string | null
  }
  subtitle?: string
  secondaryInfo?: string[]
  showFollowButton?: boolean
  isFollowing?: boolean
  isFriend?: boolean
  className?: string
}

export function UserCard({
  user,
  subtitle,
  secondaryInfo,
  showFollowButton = true,
  isFollowing,
  isFriend,
  className,
}: UserCardProps) {
  const displayName = user.displayName || user.username || 'Anonymous'
  const avatarUrl = user.customAvatarUrl || user.avatarUrl
  const initials = displayName.slice(0, 2).toUpperCase()
  const profileUrl = user.username ? `/u/${user.username}` : undefined

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/30 transition-colors hover:bg-card/50',
        className
      )}
    >
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
        <div className="flex items-center gap-2 mb-1">
          {profileUrl ? (
            <Link
              href={profileUrl}
              className="font-medium text-foreground hover:text-primary transition-colors truncate"
            >
              {displayName}
            </Link>
          ) : (
            <span className="font-medium text-foreground truncate">{displayName}</span>
          )}
          {isFriend && (
            <Badge variant="outline" className="text-xs flex-shrink-0">
              <Users className="h-3 w-3 mr-1" />
              Friend
            </Badge>
          )}
        </div>

        {user.username && (
          <p className="text-sm text-muted-foreground mb-1">@{user.username}</p>
        )}

        {subtitle && (
          <p className="text-sm text-muted-foreground mb-1">{subtitle}</p>
        )}

        {secondaryInfo && secondaryInfo.length > 0 && (
          <p className="text-xs text-muted-foreground/80 truncate">
            {secondaryInfo.join(', ')}
          </p>
        )}
      </div>

      {/* Follow Button */}
      {showFollowButton && (
        <div className="flex-shrink-0">
          <FollowButton
            targetUserId={user.id}
            initialIsFollowing={isFollowing}
            variant="compact"
          />
        </div>
      )}
    </div>
  )
}

// Compact card variant for grids
export function UserCardCompact({
  user,
  subtitle,
  showFollowButton = true,
  isFollowing,
  isFriend,
  className,
}: Omit<UserCardProps, 'secondaryInfo'>) {
  const displayName = user.displayName || user.username || 'Anonymous'
  const avatarUrl = user.customAvatarUrl || user.avatarUrl
  const initials = displayName.slice(0, 2).toUpperCase()
  const profileUrl = user.username ? `/u/${user.username}` : undefined

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center p-4 rounded-xl border border-border/50 bg-card/30 transition-colors hover:bg-card/50',
        className
      )}
    >
      {/* Avatar */}
      {profileUrl ? (
        <Link href={profileUrl}>
          <Avatar className="h-16 w-16 mb-3">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Avatar className="h-16 w-16 mb-3">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
      )}

      {/* Name */}
      <div className="w-full">
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

        {isFriend && (
          <Badge variant="outline" className="text-xs mt-1">
            <Users className="h-3 w-3 mr-1" />
            Friend
          </Badge>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>
      )}

      {/* Follow Button */}
      {showFollowButton && (
        <div className="mt-3">
          <FollowButton
            targetUserId={user.id}
            initialIsFollowing={isFollowing}
            variant="compact"
          />
        </div>
      )}
    </div>
  )
}
