'use client'

import Link from 'next/link'
import { MapPin, Calendar, Settings, Globe, Gamepad2, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FollowButton } from './FollowButton'
import { XIcon, InstagramIcon, DiscordIcon } from '@/components/icons/social'
import type { UserProfile, SocialLinks, FollowStats as FollowStatsType } from '@/types/database'

interface ShelfStats {
  total: number
  owned: number
  want_to_buy: number
  want_to_play: number
  wishlist: number
  previously_owned: number
}

interface ProfileHeaderProps {
  profile: UserProfile
  socialLinks: SocialLinks
  isOwnProfile: boolean
  isFollowingUser: boolean
  followStats: FollowStatsType | null
  shelfStats: ShelfStats | null
  reviewCount: number
}

function formatLastActive(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ProfileHeader({
  profile,
  socialLinks,
  isOwnProfile,
  isFollowingUser,
  followStats,
  shelfStats,
  reviewCount,
}: ProfileHeaderProps) {
  const displayName = profile.display_name || profile.username || 'User'
  const avatarUrl = profile.custom_avatar_url || profile.avatar_url
  const initial = displayName.charAt(0).toUpperCase()

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null

  const hasSocialLinks =
    socialLinks.bgg_username ||
    socialLinks.twitter_handle ||
    socialLinks.instagram_handle ||
    socialLinks.discord_username ||
    socialLinks.website_url

  const stats = [
    {
      value: shelfStats?.total || 0,
      label: 'Games',
      href: `?tab=games`,
    },
    {
      value: followStats?.followingCount || 0,
      label: 'Following',
      href: `/u/${profile.username}/following`,
    },
    {
      value: followStats?.followerCount || 0,
      label: 'Followers',
      href: `/u/${profile.username}/followers`,
    },
    {
      value: reviewCount,
      label: 'Reviews',
      href: `?tab=reviews`,
    },
  ]

  return (
    <div className="border-b border-border pb-6 mb-6">
      {/* Main Header Content */}
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-[120px] w-[120px] md:h-[180px] md:w-[180px] rounded-2xl object-cover border-4 border-background shadow-lg flex-shrink-0"
          />
        ) : (
          <div className="h-[120px] w-[120px] md:h-[180px] md:w-[180px] rounded-2xl bg-primary flex items-center justify-center border-4 border-background shadow-lg flex-shrink-0">
            <span className="text-4xl md:text-5xl font-bold text-primary-foreground">
              {initial}
            </span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          {/* Name + Badge */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
            {profile.role === 'admin' && (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Admin
              </Badge>
            )}
          </div>

          {/* Username */}
          <p className="text-muted-foreground mt-1">@{profile.username}</p>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-3 text-foreground/90 whitespace-pre-wrap max-w-2xl">
              {profile.bio}
            </p>
          )}

          {/* Meta Row: Location, Join Date, Last Active */}
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
            {memberSince && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Joined {memberSince}</span>
              </div>
            )}
            {profile.last_active_at && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span>Active {formatLastActive(profile.last_active_at)}</span>
              </div>
            )}
          </div>

          {/* Social Links + Action Button Row */}
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4">
            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex items-center gap-1">
                {socialLinks.bgg_username && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`https://boardgamegeek.com/user/${socialLinks.bgg_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Gamepad2 className="h-5 w-5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>{socialLinks.bgg_username} on BGG</TooltipContent>
                  </Tooltip>
                )}
                {socialLinks.twitter_handle && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`https://twitter.com/${socialLinks.twitter_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <XIcon className="h-5 w-5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>@{socialLinks.twitter_handle}</TooltipContent>
                  </Tooltip>
                )}
                {socialLinks.instagram_handle && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`https://instagram.com/${socialLinks.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <InstagramIcon className="h-5 w-5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>@{socialLinks.instagram_handle}</TooltipContent>
                  </Tooltip>
                )}
                {socialLinks.discord_username && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="p-2 rounded-lg cursor-default">
                        <DiscordIcon className="h-5 w-5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{socialLinks.discord_username}</TooltipContent>
                  </Tooltip>
                )}
                {socialLinks.website_url && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={socialLinks.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Globe className="h-5 w-5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>Website</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {isOwnProfile ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <FollowButton
                  targetUserId={profile.id}
                  initialIsFollowing={isFollowingUser}
                  variant="compact"
                />
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/u/${profile.username}/compare`}>
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare Shelves
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-6 pt-6 border-t border-border flex flex-wrap justify-center sm:justify-start gap-6 md:gap-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group text-center sm:text-left"
          >
            <span className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
              {stat.value.toLocaleString()}
            </span>
            <span className="ml-1.5 text-muted-foreground text-sm">
              {stat.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
