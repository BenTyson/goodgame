'use client'

import Link from 'next/link'
import { User, Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import type { ReviewWithUser } from '@/lib/supabase/user-queries'

interface ReviewCardProps {
  review: ReviewWithUser
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { user, rating, review: reviewText, review_updated_at } = review

  return (
    <div className="rounded-lg border bg-card p-4">
      {/* Header with user info and rating */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <Link
          href={user.username ? `/u/${user.username}` : '#'}
          className="flex items-center gap-3 group"
        >
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.custom_avatar_url || user.avatar_url ? (
              <img
                src={user.custom_avatar_url || user.avatar_url || ''}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm group-hover:underline">
              {user.display_name || user.username || 'Anonymous'}
            </p>
            {user.username && (
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            )}
          </div>
        </Link>

        {/* Rating */}
        {rating !== null && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating}/10</span>
          </div>
        )}
      </div>

      {/* Review text */}
      <p className="text-sm text-foreground whitespace-pre-wrap">{reviewText}</p>

      {/* Timestamp */}
      {review_updated_at && (
        <p className="text-xs text-muted-foreground mt-3">
          {formatDistanceToNow(new Date(review_updated_at), { addSuffix: true })}
        </p>
      )}
    </div>
  )
}
