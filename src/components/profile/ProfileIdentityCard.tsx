'use client'

import Link from 'next/link'
import { MapPin, Calendar, Settings, Globe, Gamepad2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FollowButton } from './FollowButton'
import { XIcon, InstagramIcon, DiscordIcon } from '@/components/icons/social'
import type { UserProfile, SocialLinks } from '@/types/database'

interface ProfileIdentityCardProps {
  profile: UserProfile
  socialLinks: SocialLinks
  isOwnProfile: boolean
  isFollowingUser: boolean
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

export function ProfileIdentityCard({
  profile,
  socialLinks,
  isOwnProfile,
  isFollowingUser,
}: ProfileIdentityCardProps) {
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

  return (
    <Card className="overflow-hidden">
      {/* Avatar Section */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-28 w-28 rounded-2xl object-cover border-4 border-background shadow-lg"
          />
        ) : (
          <div className="h-28 w-28 rounded-2xl bg-primary flex items-center justify-center border-4 border-background shadow-lg">
            <span className="text-3xl font-bold text-primary-foreground">
              {initial}
            </span>
          </div>
        )}

        {/* Name + Badge */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-bold">{displayName}</h1>
            {profile.role === 'admin' && (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">@{profile.username}</p>
        </div>

        {/* Member Since / Last Active */}
        <div className="mt-3 flex flex-col items-center gap-1 text-sm text-muted-foreground">
          {memberSince && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
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
      </div>

      {/* Bio Section */}
      {(profile.bio || profile.location) && (
        <>
          <Separator />
          <div className="px-6 py-4 space-y-3">
            {profile.bio && (
              <p className="text-sm whitespace-pre-wrap text-foreground/90">
                {profile.bio}
              </p>
            )}
            {profile.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Social Links */}
      {hasSocialLinks && (
        <>
          <Separator />
          <div className="px-6 py-4 flex justify-center gap-2">
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
        </>
      )}

      {/* Action Button */}
      <Separator />
      <div className="px-6 py-4">
        {isOwnProfile ? (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        ) : (
          <FollowButton
            targetUserId={profile.id}
            initialIsFollowing={isFollowingUser}
          />
        )}
      </div>
    </Card>
  )
}
