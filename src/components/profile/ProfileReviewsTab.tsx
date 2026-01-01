'use client'

import { ProfileReviews } from './ProfileReviews'
import type { UserReviewWithGame } from '@/lib/supabase/review-queries'

interface ProfileReviewsTabProps {
  reviews: UserReviewWithGame[]
  username: string
  isOwnProfile: boolean
}

export function ProfileReviewsTab({
  reviews,
  username,
  isOwnProfile,
}: ProfileReviewsTabProps) {
  return (
    <ProfileReviews
      reviews={reviews}
      username={username}
      isOwnProfile={isOwnProfile}
      mode="full"
    />
  )
}
