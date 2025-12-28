'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  User,
  MapPin,
  Calendar,
  ExternalLink,
  Lock,
  Settings,
  Twitter,
  Globe,
  Gamepad2,
  MessageCircle,
  Package,
  ShoppingCart,
  Target,
  Star,
  Archive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TopGamesDisplay } from '@/components/profile/TopGamesDisplay'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { FollowButton } from '@/components/profile/FollowButton'
import { FollowStats } from '@/components/profile/FollowStats'
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
  owned: { label: 'Owned', icon: Package, color: 'text-green-600' },
  want_to_buy: { label: 'Want to Buy', icon: ShoppingCart, color: 'text-blue-600' },
  want_to_play: { label: 'Want to Play', icon: Target, color: 'text-purple-600' },
  wishlist: { label: 'Wishlist', icon: Star, color: 'text-amber-600' },
  previously_owned: { label: 'Previously Owned', icon: Archive, color: 'text-gray-600' },
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

  return (
    <div className="container max-w-4xl py-8">
      {/* Profile Header */}
      <Card className="mb-8 overflow-hidden">
        {/* Header Banner */}
        {profile.header_image_url && (
          <div className="relative h-32 sm:h-48 w-full">
            <Image
              src={profile.header_image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
            />
          </div>
        )}

        <CardContent className={profile.header_image_url ? 'pt-0 -mt-12 sm:-mt-16 relative' : 'pt-6'}>
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className={`h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-background shadow-lg ${profile.header_image_url ? 'ring-4 ring-background' : ''}`}
                />
              ) : (
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-lg">
                  <User className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold truncate">
                      {displayName}
                    </h1>
                    {/* Role badge */}
                    {profile.role === 'admin' && (
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        Admin
                      </Badge>
                    )}
                    {/* Collection milestone badges */}
                    {profileStats && profileStats.totalGames >= 100 && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        Collector 100+
                      </Badge>
                    )}
                    {profileStats && profileStats.totalGames >= 50 && profileStats.totalGames < 100 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Collector 50+
                      </Badge>
                    )}
                    {profileStats && profileStats.totalRated >= 25 && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Rater
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{profile.username}</p>
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

              {/* Bio */}
              {profile.bio && (
                <p className="mt-4 text-foreground whitespace-pre-wrap">
                  {profile.bio}
                </p>
              )}

              {/* Meta info */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {memberSince && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {memberSince}</span>
                  </div>
                )}
                {profile.last_active_at && (
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Active {formatLastActive(profile.last_active_at)}</span>
                  </div>
                )}
              </div>

              {/* Follow Stats */}
              {followStats && profile.username && (
                <FollowStats
                  username={profile.username}
                  followerCount={followStats.followerCount}
                  followingCount={followStats.followingCount}
                  className="mt-4"
                />
              )}

              {/* Social Links */}
              {hasSocialLinks && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {socialLinks.bgg_username && (
                    <a
                      href={`https://boardgamegeek.com/user/${socialLinks.bgg_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors"
                    >
                      <Gamepad2 className="h-4 w-4" />
                      <span>BGG</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {socialLinks.twitter_handle && (
                    <a
                      href={`https://twitter.com/${socialLinks.twitter_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                      <span>@{socialLinks.twitter_handle}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {socialLinks.instagram_handle && (
                    <a
                      href={`https://instagram.com/${socialLinks.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                      </svg>
                      <span>@{socialLinks.instagram_handle}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {socialLinks.discord_username && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm">
                      <MessageCircle className="h-4 w-4" />
                      <span>{socialLinks.discord_username}</span>
                    </div>
                  )}
                  {socialLinks.website_url && (
                    <a
                      href={socialLinks.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      <span>Website</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Games Section */}
      {(topGames || isOwnProfile) && (
        <TopGamesDisplay
          topGames={topGames || []}
          isOwner={isOwnProfile}
          userId={profile.id}
        />
      )}

      {/* Collection Insights */}
      {profileStats && <ProfileStats stats={profileStats} />}

      {/* Shelf Section */}
      {showShelf && shelfStats ? (
        <div className="space-y-6">
          {/* Stats Bar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Game Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{shelfStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                {shelfStats.owned > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{shelfStats.owned}</p>
                    <p className="text-xs text-muted-foreground">Owned</p>
                  </div>
                )}
                {shelfStats.wishlist > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{shelfStats.wishlist}</p>
                    <p className="text-xs text-muted-foreground">Wishlist</p>
                  </div>
                )}
                {shelfStats.want_to_play > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{shelfStats.want_to_play}</p>
                    <p className="text-xs text-muted-foreground">Want to Play</p>
                  </div>
                )}
                {shelfStats.want_to_buy > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{shelfStats.want_to_buy}</p>
                    <p className="text-xs text-muted-foreground">Want to Buy</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Games Grid */}
          {shelfData && shelfData.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Games</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
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
                            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                            <span className="text-2xl font-bold text-primary/40">
                              {item.game.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        {/* Status badge */}
                        {config && (
                          <div className="absolute bottom-1 right-1">
                            <div className={`p-1 rounded-full bg-white/90 shadow ${config.color}`}>
                              <config.icon className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                        {/* Rating badge */}
                        {item.rating && (
                          <div className="absolute top-1 right-1">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              {item.rating}/10
                            </Badge>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-center truncate">
                        {item.game.name}
                      </p>
                    </Link>
                  )
                })}
              </div>

              {shelfStats.total > 12 && (
                <div className="mt-6 text-center">
                  {isOwnProfile ? (
                    <Button variant="outline" asChild>
                      <Link href="/shelf">View Full Collection</Link>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Showing 12 of {shelfStats.total} games
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? "You haven't added any games to your shelf yet."
                    : "This user hasn't added any games to their shelf yet."}
                </p>
                {isOwnProfile && (
                  <Button className="mt-4" asChild>
                    <Link href="/games">Browse Games</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Shelf is private */
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              This user's game collection is private.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
