'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { UserReviewWithGame } from '@/lib/supabase/review-queries'

interface ProfileReviewsProps {
  reviews: UserReviewWithGame[]
  username: string
  isOwnProfile: boolean
}

function formatRelativeTime(dateString: string): string {
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

export function ProfileReviews({ reviews, username, isOwnProfile }: ProfileReviewsProps) {
  if (reviews.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Reviews</h3>
        </div>
        <div className="text-center py-6 text-muted-foreground text-sm">
          {isOwnProfile
            ? "You haven't written any reviews yet."
            : 'No reviews yet.'}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Reviews</h3>
        </div>
        {reviews.length > 3 && (
          <Link
            href={`/u/${username}/reviews`}
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {reviews.slice(0, 3).map((review) => (
          <div
            key={review.id}
            className="border-b last:border-0 pb-4 last:pb-0"
          >
            {/* Game reference */}
            <Link
              href={`/games/${review.game.slug}`}
              className="flex items-center gap-3 mb-2 group"
            >
              <div className="relative h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                {review.game.box_image_url ? (
                  <Image
                    src={review.game.box_image_url}
                    alt={review.game.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                    <span className="text-sm font-bold text-primary/40">
                      {review.game.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {review.game.name}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {review.rating && (
                    <>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{review.rating}/10</span>
                      <span className="mx-1">-</span>
                    </>
                  )}
                  <span>{formatRelativeTime(review.review_updated_at)}</span>
                </div>
              </div>
            </Link>

            {/* Review text - truncated */}
            <p className="text-sm text-muted-foreground line-clamp-3">
              {review.review}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
