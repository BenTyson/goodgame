'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs, type ProfileTab } from '@/components/profile/ProfileTabs'
import { ProfileOverviewTab } from '@/components/profile/ProfileOverviewTab'
import { ProfileGamesTab } from '@/components/profile/ProfileGamesTab'
import { ProfileFriendsTab } from '@/components/profile/ProfileFriendsTab'
import { ProfileReviewsTab } from '@/components/profile/ProfileReviewsTab'
import { ProfileActivityTab } from '@/components/profile/ProfileActivityTab'
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
  currentUserId?: string
}

function ProfileContentInner({
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
  currentUserId,
}: ProfileContentProps) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get('tab') as ProfileTab) || 'overview'

  return (
    <div className="container py-6">
      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        socialLinks={socialLinks}
        isOwnProfile={isOwnProfile}
        isFollowingUser={isFollowingUser}
        followStats={followStats}
        shelfStats={shelfStats}
        reviewCount={reviewCount}
      />

      {/* Tab Navigation */}
      <ProfileTabs username={profile.username || ''} />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <ProfileOverviewTab
          profile={profile}
          topGames={topGames}
          shelfData={shelfData}
          shelfStats={shelfStats}
          profileStats={profileStats}
          showShelf={showShelf}
          isOwnProfile={isOwnProfile}
          userReviews={userReviews}
          mutualGames={mutualGames}
        />
      )}

      {activeTab === 'games' && (
        <ProfileGamesTab
          shelfData={shelfData}
          shelfStats={shelfStats}
          isOwnProfile={isOwnProfile}
          showShelf={showShelf}
        />
      )}

      {activeTab === 'friends' && (
        <ProfileFriendsTab
          userId={profile.id}
          isOwnProfile={isOwnProfile}
          currentUserId={currentUserId}
        />
      )}

      {activeTab === 'reviews' && (
        <ProfileReviewsTab
          reviews={userReviews}
          username={profile.username || ''}
          isOwnProfile={isOwnProfile}
        />
      )}

      {activeTab === 'activity' && (
        <ProfileActivityTab userId={profile.id} />
      )}
    </div>
  )
}

export function ProfileContent(props: ProfileContentProps) {
  return (
    <Suspense fallback={<ProfileContentLoading />}>
      <ProfileContentInner {...props} />
    </Suspense>
  )
}

function ProfileContentLoading() {
  return (
    <div className="container py-6">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start pb-6 border-b">
          <div className="h-[120px] w-[120px] md:h-[180px] md:w-[180px] rounded-2xl bg-muted" />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="h-8 w-48 bg-muted rounded mx-auto sm:mx-0" />
            <div className="h-4 w-32 bg-muted rounded mx-auto sm:mx-0" />
            <div className="h-16 w-full max-w-md bg-muted rounded mx-auto sm:mx-0" />
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="flex gap-8 py-6 border-b">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 bg-muted rounded" />
          ))}
        </div>
        {/* Tabs skeleton */}
        <div className="flex gap-4 py-4 border-b">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 w-20 bg-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
