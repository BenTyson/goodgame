'use client'

import { Star, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import type { FeedbackWithDetails, FeedbackRole } from '@/types/marketplace'
import { cn } from '@/lib/utils'

interface FeedbackCardProps {
  feedback: FeedbackWithDetails
  showGame?: boolean
  showRole?: boolean
  className?: string
}

/**
 * FeedbackCard - Display a single feedback item
 */
export function FeedbackCard({
  feedback,
  showGame = true,
  showRole = false,
  className,
}: FeedbackCardProps) {
  const avatarUrl = feedback.reviewer.custom_avatar_url || feedback.reviewer.avatar_url
  const displayName = feedback.reviewer.display_name || feedback.reviewer.username || 'Anonymous'

  const roleLabel = feedback.role === 'buyer' ? 'Buyer' : 'Seller'

  return (
    <div className={cn('bg-card border rounded-lg p-4', className)}>
      {/* Header: Reviewer + Rating */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          )}

          {/* Name + Meta */}
          <div className="min-w-0">
            <Link
              href={`/u/${feedback.reviewer.username}`}
              className="font-medium hover:text-primary truncate block"
            >
              {displayName}
            </Link>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}</span>
              {showRole && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-xs uppercase tracking-wide">{roleLabel}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'w-4 h-4',
                star <= feedback.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      {feedback.comment && (
        <p className="text-sm text-foreground/90 mb-3 whitespace-pre-wrap">
          {feedback.comment}
        </p>
      )}

      {/* Game Reference */}
      {showGame && feedback.game_name && (
        <Link
          href={`/games/${feedback.game_slug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {feedback.game_image && (
            <Image
              src={feedback.game_image}
              alt={feedback.game_name}
              width={24}
              height={24}
              className="rounded object-cover"
            />
          )}
          <span className="truncate">{feedback.game_name}</span>
        </Link>
      )}
    </div>
  )
}

/**
 * Compact feedback display for lists
 */
export function FeedbackCardCompact({
  feedback,
  className,
}: {
  feedback: FeedbackWithDetails
  className?: string
}) {
  const avatarUrl = feedback.reviewer.custom_avatar_url || feedback.reviewer.avatar_url
  const displayName = feedback.reviewer.display_name || feedback.reviewer.username || 'Anonymous'

  return (
    <div className={cn('flex items-start gap-3 py-3', className)}>
      {/* Avatar */}
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName}
          width={32}
          height={32}
          className="rounded-full flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{displayName}</span>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'w-3 h-3',
                  star <= feedback.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/30'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
          </span>
        </div>
        {feedback.comment && (
          <p className="text-sm text-muted-foreground line-clamp-2">{feedback.comment}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Star rating display (read-only)
 */
export function StarRating({
  rating,
  size = 'default',
  showValue = false,
  className,
}: {
  rating: number | null
  size?: 'sm' | 'default' | 'lg'
  showValue?: boolean
  className?: string
}) {
  const sizeClass = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size]

  if (rating === null) {
    return (
      <span className="text-sm text-muted-foreground">No ratings yet</span>
    )
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      )}
    </div>
  )
}
