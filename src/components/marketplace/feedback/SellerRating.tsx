'use client'

import { useState, useEffect } from 'react'
import { Star, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ReputationBadge, ReputationCompact } from './ReputationBadge'
import { FeedbackCardCompact } from './FeedbackCard'
import type { UserReputationStats, FeedbackWithDetails, TrustLevel } from '@/types/marketplace'
import { cn } from '@/lib/utils'

interface SellerRatingProps {
  sellerId: string
  sellerUsername?: string | null
  variant?: 'compact' | 'card' | 'inline'
  showFeedback?: boolean
  feedbackLimit?: number
  className?: string
}

/**
 * SellerRating - Display seller reputation with optional recent feedback
 * Fetches data from the reputation API
 */
export function SellerRating({
  sellerId,
  sellerUsername,
  variant = 'compact',
  showFeedback = false,
  feedbackLimit = 3,
  className,
}: SellerRatingProps) {
  const [reputation, setReputation] = useState<UserReputationStats | null>(null)
  const [feedback, setFeedback] = useState<FeedbackWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReputation() {
      try {
        const params = new URLSearchParams({
          include_feedback: showFeedback ? 'true' : 'false',
          feedback_limit: String(feedbackLimit),
        })

        const response = await fetch(`/api/marketplace/reputation/${sellerId}?${params}`)
        if (response.ok) {
          const data = await response.json()
          setReputation(data.reputation)
          if (data.recent_feedback) {
            setFeedback(data.recent_feedback)
          }
        }
      } catch (error) {
        console.error('Error fetching reputation:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReputation()
  }, [sellerId, showFeedback, feedbackLimit])

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  if (!reputation) {
    return null
  }

  // Inline variant - just rating and count
  if (variant === 'inline') {
    return (
      <ReputationCompact
        trustLevel={reputation.trust_level}
        rating={reputation.seller_rating}
        feedbackCount={reputation.seller_feedback_count}
        className={className}
      />
    )
  }

  // Compact variant - badge only
  if (variant === 'compact') {
    return (
      <ReputationBadge
        trustLevel={reputation.trust_level}
        rating={reputation.seller_rating}
        feedbackCount={reputation.seller_feedback_count}
        size="sm"
        className={className}
      />
    )
  }

  // Card variant - full display with optional feedback
  return (
    <div className={cn('bg-card border rounded-lg p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Seller Rating</h3>
        {sellerUsername && (
          <Link
            href={`/u/${sellerUsername}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            View profile
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <ReputationBadge
          trustLevel={reputation.trust_level}
          rating={reputation.seller_rating}
          feedbackCount={reputation.seller_feedback_count}
          size="lg"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div>
          <div className="text-lg font-bold">{reputation.total_sales}</div>
          <div className="text-xs text-muted-foreground">Sales</div>
        </div>
        <div>
          <div className="text-lg font-bold">
            {reputation.seller_rating?.toFixed(1) || '-'}
          </div>
          <div className="text-xs text-muted-foreground">Rating</div>
        </div>
        <div>
          <div className="text-lg font-bold text-green-600">
            {reputation.seller_feedback_count > 0
              ? `${Math.round((reputation.seller_positive_count / reputation.seller_feedback_count) * 100)}%`
              : '-'}
          </div>
          <div className="text-xs text-muted-foreground">Positive</div>
        </div>
      </div>

      {/* Recent Feedback */}
      {showFeedback && feedback.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Recent Feedback</h4>
          <div className="divide-y">
            {feedback.map((item) => (
              <FeedbackCardCompact key={item.id} feedback={item} />
            ))}
          </div>
          {reputation.seller_feedback_count > feedbackLimit && (
            <Link
              href={`/u/${sellerUsername}?tab=feedback`}
              className="block text-center text-sm text-primary hover:underline mt-3"
            >
              View all {reputation.seller_feedback_count} reviews
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Static seller rating display (when data is already loaded)
 */
export function SellerRatingStatic({
  rating,
  feedbackCount,
  salesCount,
  trustLevel,
  variant = 'inline',
  className,
}: {
  rating: number | null
  feedbackCount: number
  salesCount: number
  trustLevel: TrustLevel
  variant?: 'inline' | 'compact' | 'badge'
  className?: string
}) {
  if (variant === 'badge') {
    return (
      <ReputationBadge
        trustLevel={trustLevel}
        rating={rating}
        feedbackCount={feedbackCount}
        size="sm"
        className={className}
      />
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        {rating !== null && (
          <>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({feedbackCount})</span>
          </>
        )}
        {salesCount > 0 && (
          <>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-muted-foreground">{salesCount} sold</span>
          </>
        )}
      </div>
    )
  }

  // Inline variant
  return (
    <ReputationCompact
      trustLevel={trustLevel}
      rating={rating}
      feedbackCount={feedbackCount}
      className={className}
    />
  )
}
