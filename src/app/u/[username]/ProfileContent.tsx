'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin,
  Calendar,
  Lock,
  Settings,
  Package,
  ShoppingCart,
  Target,
  Star,
  Archive,
  Gamepad2,
  Globe,
  Users,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TopGamesDisplay } from '@/components/profile/TopGamesDisplay'
import { FollowButton } from '@/components/profile/FollowButton'
import { XIcon, InstagramIcon, DiscordIcon } from '@/components/icons/social'
import type { UserProfile, SocialLinks, Game, FollowStats as FollowStatsType } from '@/types/database'
import type { TopGameWithDetails } from '@/lib/supabase/user-queries'

interface ShelfGame {
  id: string
  status: string
  rating: number | null
  game: Pick<Game, 'id' | 'name' | 'slug' | 'box_image_url'> | null
}

interface ShelfStats {
  total: number
  owned: number
  want_to_buy: number
  want_to_play: number
  wishlist: number
  previously_owned: number
}

interface ProfileStatsData {
  totalGames: number
  totalRated: number
  averageRating: number | null
  categoryBreakdown: { name: string; count: number }[]
  playerCountBreakdown: { range: string; count: number }[]
}

interface ProfileContentProps {
  profile: UserProfile
  socialLinks: SocialLinks
  topGames: TopGameWithDetails[] | null
  shelfData: ShelfGame[] | null
  shelfStats: ShelfStats | null
  profileStats: ProfileStatsData | null
  showShelf: boolean
  isOwnProfile: boolean
  followStats: FollowStatsType | null
  isFollowingUser: boolean
}

const statusConfig = {
  owned: { label: 'Owned', icon: Package, color: 'text-primary' },
  want_to_buy: { label: 'Want to Buy', icon: ShoppingCart, color: 'text-primary' },
  want_to_play: { label: 'Want to Play', icon: Target, color: 'text-primary' },
  wishlist: { label: 'Wishlist', icon: Star, color: 'text-primary' },
  previously_owned: { label: 'Previously Owned', icon: Archive, color: 'text-muted-foreground' },
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

export function ProfileContent({
  profile,
  socialLinks,
  topGames,
  shelfData,
  shelfStats,
  profileStats,
  showShelf,
  isOwnProfile,
  followStats,
  isFollowingUser,
}: ProfileContentProps) {
  const displayName = profile.display_name || profile.username || 'User'
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

  // Use custom avatar if available, otherwise fall back to OAuth avatar
  const avatarUrl = profile.custom_avatar_url || profile.avatar_url

  // Get the first initial for avatar fallback
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="container py-6">
      {/* Profile Header Zone */}
      <div className="rounded-2xl bg-card border border-border/50">
        {/* Banner */}
        <div className="relative h-36 sm:h-44 w-full bg-gradient-to-br from-primary/20 via-primary/10 to-background rounded-t-2xl overflow-hidden">
          {profile.header_image_url && (
            <Image
              src={profile.header_image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1024px"
              priority
            />
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-6 pb-6 pt-4">
          {/* Avatar + Name Row */}
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0 -mt-8 sm:-mt-10 relative z-10">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover border-4 border-card shadow-lg"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-primary flex items-center justify-center border-4 border-card shadow-lg">
                  <span className="text-2xl sm:text-3xl font-bold text-primary-foreground">
                    {initial}
                  </span>
                </div>
              )}
            </div>

            {/* Name + Actions */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold">
                  {displayName}
                </h1>
                {profile.role === 'admin' && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">@{profile.username}</p>
            </div>

            <div className="flex gap-2">
              {!isOwnProfile && (
                <FollowButton
                  targetUserId={profile.id}
                  initialIsFollowing={isFollowingUser}
                />
              )}
              {isOwnProfile && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              )}
            </div>
          </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 text-sm text-foreground/90 whitespace-pre-wrap max-w-2xl">
              {profile.bio}
            </p>
          )}

          {/* Meta Row */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{profile.location}</span>
              </div>
            )}
            {memberSince && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {memberSince}</span>
              </div>
            )}
            {profile.last_active_at && (
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span>Active {formatLastActive(profile.last_active_at)}</span>
              </div>
            )}

            {/* Separator */}
            {hasSocialLinks && <div className="hidden sm:block w-px h-4 bg-border" />}

            {/* Social Links - Icon only with tooltips */}
            {socialLinks.bgg_username && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={`https://boardgamegeek.com/user/${socialLinks.bgg_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-accent transition-colors"
                  >
                    <Gamepad2 className="h-4 w-4" />
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
                    className="p-1.5 rounded-md hover:bg-accent transition-colors"
                  >
                    <XIcon className="h-4 w-4" />
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
                    className="p-1.5 rounded-md hover:bg-accent transition-colors"
                  >
                    <InstagramIcon className="h-4 w-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>@{socialLinks.instagram_handle}</TooltipContent>
              </Tooltip>
            )}
            {socialLinks.discord_username && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="p-1.5 rounded-md cursor-default">
                    <DiscordIcon className="h-4 w-4" />
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
                    className="p-1.5 rounded-md hover:bg-accent transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>Website</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Stats Row */}
          <div className="mt-5 flex flex-wrap gap-3">
            {shelfStats && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{shelfStats.total}</span>
                <span className="text-xs text-muted-foreground">games</span>
              </div>
            )}
            {profileStats?.averageRating && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{profileStats.averageRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">avg rating</span>
              </div>
            )}
            {followStats && profile.username && (
              <>
                <Link
                  href={`/u/${profile.username}/followers`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="font-semibold">{followStats.followerCount}</span>
                  <span className="text-xs text-muted-foreground">followers</span>
                </Link>
                <Link
                  href={`/u/${profile.username}/following`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="font-semibold">{followStats.followingCount}</span>
                  <span className="text-xs text-muted-foreground">following</span>
                </Link>
              </>
            )}
            {/* Badges */}
            {profileStats && profileStats.totalGames >= 100 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Collector 100+
              </Badge>
            )}
            {profileStats && profileStats.totalGames >= 50 && profileStats.totalGames < 100 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Collector 50+
              </Badge>
            )}
            {profileStats && profileStats.totalRated >= 25 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Rater
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Top Games Section */}
      {(topGames || isOwnProfile) && (
        <div className="mt-6">
          <TopGamesDisplay
            topGames={topGames || []}
            isOwner={isOwnProfile}
            userId={profile.id}
          />
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      {showShelf && shelfStats ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Collection Grid - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                My Shelf
              </h2>
              {isOwnProfile && shelfStats.total > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/shelf">View All</Link>
                </Button>
              )}
            </div>

            {shelfData && shelfData.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {shelfData.map((item) => {
                  if (!item.game) return null
                  const config = statusConfig[item.status as keyof typeof statusConfig]

                  return (
                    <Link
                      key={item.id}
                      href={`/games/${item.game.slug}`}
                      className="group"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        {item.game.box_image_url ? (
                          <Image
                            src={item.game.box_image_url}
                            alt={item.game.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                            <span className="text-xl font-bold text-primary/40">
                              {item.game.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        {/* Status icon */}
                        {config && (
                          <div className="absolute bottom-1 right-1">
                            <div className={`p-1 rounded-full bg-background/90 shadow-sm ${config.color}`}>
                              <config.icon className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                        {/* Rating */}
                        {item.rating && (
                          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-background/90 text-xs font-medium shadow-sm">
                            {item.rating}/10
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-center truncate text-muted-foreground group-hover:text-foreground transition-colors">
                        {item.game.name}
                      </p>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center rounded-xl border border-dashed">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">
                  {isOwnProfile
                    ? "You haven't added any games yet."
                    : "No games in collection."}
                </p>
                {isOwnProfile && (
                  <Button className="mt-4" size="sm" asChild>
                    <Link href="/games">Browse Games</Link>
                  </Button>
                )}
              </div>
            )}

            {shelfStats.total > 12 && !isOwnProfile && (
              <p className="text-xs text-center text-muted-foreground">
                Showing 12 of {shelfStats.total} games
              </p>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Insights
            </h2>

            <div className="rounded-xl border bg-card/50 p-4 space-y-5">
              {/* Collection Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Collection
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {shelfStats.owned > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium">{shelfStats.owned}</span>
                      <span className="text-muted-foreground">owned</span>
                    </div>
                  )}
                  {shelfStats.wishlist > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="font-medium">{shelfStats.wishlist}</span>
                      <span className="text-muted-foreground">wishlist</span>
                    </div>
                  )}
                  {shelfStats.want_to_play > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-medium">{shelfStats.want_to_play}</span>
                      <span className="text-muted-foreground">want to play</span>
                    </div>
                  )}
                  {shelfStats.want_to_buy > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      <span className="font-medium">{shelfStats.want_to_buy}</span>
                      <span className="text-muted-foreground">want to buy</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Player Preferences */}
              {profileStats && profileStats.playerCountBreakdown.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Player Count
                  </h3>
                  <div className="space-y-1.5">
                    {profileStats.playerCountBreakdown.map((item) => {
                      const maxCount = Math.max(...profileStats.playerCountBreakdown.map(p => p.count), 1)
                      return (
                        <div key={item.range} className="flex items-center gap-2">
                          <span className="text-xs w-14 text-muted-foreground">{item.range}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/60 rounded-full"
                              style={{ width: `${(item.count / maxCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs w-4 text-right text-muted-foreground">{item.count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Top Categories */}
              {profileStats && profileStats.categoryBreakdown.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Top Categories
                  </h3>
                  <div className="space-y-1">
                    {profileStats.categoryBreakdown.slice(0, 5).map((category, idx) => {
                      const maxCount = Math.max(...profileStats.categoryBreakdown.slice(0, 5).map(c => c.count), 1)
                      return (
                        <div key={category.name} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-3">{idx + 1}</span>
                          <span className="text-xs flex-1 truncate">{category.name}</span>
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/60 rounded-full"
                              style={{ width: `${(category.count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Shelf is private */
        <div className="mt-6 py-12 text-center rounded-xl border border-dashed">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">
            This user&apos;s game collection is private.
          </p>
        </div>
      )}
    </div>
  )
}
