'use client'

import { ProfileIdentityCard } from '@/components/profile/ProfileIdentityCard'
import { ProfileHeroStats } from '@/components/profile/ProfileHeroStats'
import { ProfileShelfGrid } from '@/components/profile/ProfileShelfGrid'
import { ProfileInsights } from '@/components/profile/ProfileInsights'
import { ProfileReviews } from '@/components/profile/ProfileReviews'
import { MutualGamesSection } from '@/components/profile/MutualGamesSection'
import { TopGamesDisplay } from '@/components/profile/TopGamesDisplay'
import type { UserProfile, SocialLinks, Game, FollowStats as FollowStatsType } from '@/types/database'
import type { TopGameWithDetails, MutualGame } from '@/lib/supabase/user-queries'
import type { UserReviewWithGame } from '@/lib/supabase/review-queries'

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
  userReviews: UserReviewWithGame[]
  reviewCount: number
  mutualGames: MutualGame[] | null
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
  userReviews,
  reviewCount,
  mutualGames,
}: ProfileContentProps) {
  const displayName = profile.display_name || profile.username || 'User'

  return (
    <div className="container py-6">
      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row lg:gap-8">
        {/* Left Column - Identity Card (Sticky on Desktop) */}
        <div className="w-full lg:w-[320px] lg:flex-shrink-0 mb-6 lg:mb-0">
          <div className="lg:sticky lg:top-24">
            <ProfileIdentityCard
              profile={profile}
              socialLinks={socialLinks}
              isOwnProfile={isOwnProfile}
              isFollowingUser={isFollowingUser}
            />
          </div>
        </div>

        {/* Right Column - Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Game Shelf Grid (Top Position - Most Prominent) */}
          <ProfileShelfGrid
            shelfData={shelfData}
            shelfStats={shelfStats}
            isOwnProfile={isOwnProfile}
            showShelf={showShelf}
            showViewFullButton={true}
          />

          {/* Top Games Section */}
          {(topGames || isOwnProfile) && (
            <TopGamesDisplay
              topGames={topGames || []}
              isOwner={isOwnProfile}
              userId={profile.id}
            />
          )}

          {/* Hero Stats (Moved below shelf) */}
          <ProfileHeroStats
            username={profile.username || ''}
            totalGames={shelfStats?.total || 0}
            averageRating={profileStats?.averageRating || null}
            totalRated={profileStats?.totalRated || 0}
            followerCount={followStats?.followerCount || 0}
            followingCount={followStats?.followingCount || 0}
            reviewCount={reviewCount}
          />

          {/* Collection Insights */}
          {showShelf && (
            <ProfileInsights
              shelfStats={shelfStats}
              profileStats={profileStats}
            />
          )}

          {/* Reviews Section */}
          {(userReviews.length > 0 || isOwnProfile) && (
            <ProfileReviews
              reviews={userReviews}
              username={profile.username || ''}
              isOwnProfile={isOwnProfile}
            />
          )}

          {/* Mutual Games (only shown when viewing another user's profile) */}
          {mutualGames && mutualGames.length > 0 && (
            <MutualGamesSection
              mutualGames={mutualGames}
              displayName={displayName}
            />
          )}
        </div>
      </div>
    </div>
  )
}
