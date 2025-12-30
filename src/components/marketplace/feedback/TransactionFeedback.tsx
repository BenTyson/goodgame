'use client'

import { useState, useEffect } from 'react'
import { Star, Send, Loader2, CheckCircle, User } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FeedbackCard } from './FeedbackCard'
import type { MarketplaceFeedback, FeedbackRole, FeedbackWithDetails } from '@/types/marketplace'
import { FEEDBACK_SETTINGS } from '@/lib/config/marketplace-constants'
import { cn } from '@/lib/utils'

interface TransactionFeedbackProps {
  transactionId: string
  gameName: string
  gameImage?: string | null
  otherPartyName: string
  otherPartyAvatar?: string | null
  onFeedbackSubmitted?: (feedback: MarketplaceFeedback) => void
  className?: string
}

interface FeedbackState {
  buyerFeedback: MarketplaceFeedback | null
  sellerFeedback: MarketplaceFeedback | null
  canLeaveFeedback: boolean
  alreadyLeft: boolean
  userRole: FeedbackRole | null
}

/**
 * TransactionFeedback - Leave or view feedback for a completed transaction
 */
export function TransactionFeedback({
  transactionId,
  gameName,
  gameImage,
  otherPartyName,
  otherPartyAvatar,
  onFeedbackSubmitted,
  className,
}: TransactionFeedbackProps) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  // Fetch existing feedback state
  useEffect(() => {
    async function fetchFeedback() {
      try {
        const response = await fetch(`/api/marketplace/feedback/${transactionId}`)
        if (response.ok) {
          const data = await response.json()
          setFeedbackState(data)
        }
      } catch (err) {
        console.error('Error fetching feedback:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFeedback()
  }, [transactionId])

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/marketplace/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          rating,
          comment: comment.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setSubmitted(true)
      onFeedbackSubmitted?.(data.feedback)

      // Refresh feedback state
      const refreshResponse = await fetch(`/api/marketplace/feedback/${transactionId}`)
      if (refreshResponse.ok) {
        setFeedbackState(await refreshResponse.json())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={cn('bg-card border rounded-lg p-6', className)}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading feedback...</span>
        </div>
      </div>
    )
  }

  if (!feedbackState) {
    return null
  }

  const { canLeaveFeedback, alreadyLeft, userRole, buyerFeedback, sellerFeedback } = feedbackState

  // Get the feedback for the current user's role
  const myFeedback = userRole === 'buyer' ? buyerFeedback : sellerFeedback
  const theirFeedback = userRole === 'buyer' ? sellerFeedback : buyerFeedback

  return (
    <div className={cn('bg-card border rounded-lg', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold">Transaction Feedback</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {userRole === 'buyer'
            ? 'Leave feedback for your experience with this seller'
            : 'Leave feedback for your experience with this buyer'}
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Already submitted feedback */}
        {(alreadyLeft || submitted) && myFeedback && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Your feedback has been submitted</span>
            </div>
            <FeedbackCard
              feedback={{
                ...myFeedback,
                reviewer: {
                  id: '',
                  username: 'You',
                  display_name: 'You',
                  avatar_url: null,
                  custom_avatar_url: null,
                },
                game_name: gameName,
                game_slug: '',
                game_image: gameImage || null,
              }}
              showGame={false}
            />
          </div>
        )}

        {/* Feedback form */}
        {canLeaveFeedback && !alreadyLeft && !submitted && (
          <div className="space-y-4">
            {/* Other party info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {otherPartyAvatar ? (
                <Image
                  src={otherPartyAvatar}
                  alt={otherPartyName}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="font-medium">{otherPartyName}</div>
                <div className="text-sm text-muted-foreground">{gameName}</div>
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-2">
              <Label>Your Rating</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'w-8 h-8 transition-colors',
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30 hover:text-amber-400/50'
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {rating === 0 && 'Select a rating'}
                {rating === 1 && 'Poor - Major issues'}
                {rating === 2 && 'Fair - Some problems'}
                {rating === 3 && 'Good - Acceptable'}
                {rating === 4 && 'Very Good - Recommended'}
                {rating === 5 && 'Excellent - Outstanding!'}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                maxLength={FEEDBACK_SETTINGS.MAX_COMMENT_LENGTH}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/{FEEDBACK_SETTINGS.MAX_COMMENT_LENGTH}
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        )}

        {/* Feedback from the other party */}
        {theirFeedback && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">
              Feedback from {userRole === 'buyer' ? 'seller' : 'buyer'}
            </h4>
            <FeedbackCard
              feedback={{
                ...theirFeedback,
                reviewer: {
                  id: '',
                  username: otherPartyName,
                  display_name: otherPartyName,
                  avatar_url: otherPartyAvatar || null,
                  custom_avatar_url: null,
                },
                game_name: gameName,
                game_slug: '',
                game_image: gameImage || null,
              }}
              showGame={false}
            />
          </div>
        )}

        {/* Waiting for feedback message */}
        {!canLeaveFeedback && !alreadyLeft && (
          <p className="text-sm text-muted-foreground text-center py-4">
            You cannot leave feedback for this transaction.
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Compact feedback prompt for transaction cards
 */
export function FeedbackPrompt({
  transactionId,
  onClick,
  className,
}: {
  transactionId: string
  onClick?: () => void
  className?: string
}) {
  const [canLeave, setCanLeave] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      try {
        const response = await fetch(`/api/marketplace/feedback/${transactionId}`)
        if (response.ok) {
          const data = await response.json()
          setCanLeave(data.canLeaveFeedback && !data.alreadyLeft)
        }
      } catch {
        // Ignore errors
      } finally {
        setChecking(false)
      }
    }

    check()
  }, [transactionId])

  if (checking || !canLeave) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={className}
    >
      <Star className="w-4 h-4 mr-1" />
      Leave Feedback
    </Button>
  )
}
