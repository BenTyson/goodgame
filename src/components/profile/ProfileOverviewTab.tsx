'use client'

import { ProfileShelfGrid } from './ProfileShelfGrid'
import { TopGamesDisplay } from './TopGamesDisplay'
import { ProfileInsights } from './ProfileInsights'
import { ProfileReviews } from './ProfileReviews'
import { ProfileMarketplaceFeedback } from './ProfileMarketplaceFeedback'
import { MutualGamesSection } from './MutualGamesSection'
import type { UserProfile, Game } from '@/types/database'
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

interface ProfileOverviewTabProps {
  profile: UserProfile
  topGames: TopGameWithDetails[] | null
  shelfData: ShelfGame[] | null
  shelfStats: ShelfStats | null
  profileStats: ProfileStatsData | null
  showShelf: boolean
  isOwnProfile: boolean
  userReviews: UserReviewWithGame[]
  mutualGames: MutualGame[] | null
}

export function ProfileOverviewTab({
  profile,
  topGames,
  shelfData,
  shelfStats,
  profileStats,
  showShelf,
  isOwnProfile,
  userReviews,
  mutualGames,
}: ProfileOverviewTabProps) {
  const displayName = profile.display_name || profile.username || 'User'

  return (
    <div className="space-y-8">
      {/* Top Games Section */}
      {(topGames || isOwnProfile) && (
        <TopGamesDisplay
          topGames={topGames || []}
          isOwner={isOwnProfile}
          userId={profile.id}
        />
      )}

      {/* Game Shelf Preview */}
      <ProfileShelfGrid
        shelfData={shelfData}
        shelfStats={shelfStats}
        isOwnProfile={isOwnProfile}
        showShelf={showShelf}
        showViewFullButton={true}
        mode="preview"
      />

      {/* Reviews Preview */}
      {(userReviews.length > 0 || isOwnProfile) && (
        <ProfileReviews
          reviews={userReviews}
          username={profile.username || ''}
          isOwnProfile={isOwnProfile}
          mode="preview"
        />
      )}

      {/* Collection Insights */}
      {showShelf && (
        <ProfileInsights
          shelfStats={shelfStats}
          profileStats={profileStats}
        />
      )}

      {/* Marketplace Reputation */}
      <ProfileMarketplaceFeedback
        userId={profile.id}
        username={profile.username}
        isOwnProfile={isOwnProfile}
      />

      {/* Mutual Games */}
      {mutualGames && mutualGames.length > 0 && (
        <MutualGamesSection
          mutualGames={mutualGames}
          displayName={displayName}
        />
      )}
    </div>
  )
}
