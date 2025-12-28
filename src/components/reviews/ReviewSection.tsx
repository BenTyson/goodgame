'use client'

import * as React from 'react'
import { MessageSquare, Loader2, PenLine } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReviewCard } from './ReviewCard'
import { ReviewDialog } from './ReviewDialog'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  getGameReviews,
  getUserReviewForGame,
  type ReviewWithUser,
} from '@/lib/supabase/user-queries'

interface ReviewSectionProps {
  gameId: string
  gameName: string
  initialReviews: ReviewWithUser[]
  initialHasMore: boolean
}

export function ReviewSection({
  gameId,
  gameName,
  initialReviews,
  initialHasMore,
}: ReviewSectionProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = React.useState(initialReviews)
  const [hasMore, setHasMore] = React.useState(initialHasMore)
  const [cursor, setCursor] = React.useState<string | undefined>(
    initialReviews.length > 0 ? initialReviews[initialReviews.length - 1].review_updated_at : undefined
  )
  const [isLoading, setIsLoading] = React.useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [userShelfEntry, setUserShelfEntry] = React.useState<{
    id: string
    review: string | null
    rating: number | null
  } | null>(null)
  const [loadingUserEntry, setLoadingUserEntry] = React.useState(false)

  // Fetch user's shelf entry when dialog is about to open
  const handleWriteReview = async () => {
    if (!user) return

    setLoadingUserEntry(true)
    try {
      const entry = await getUserReviewForGame(user.id, gameId)
      if (entry) {
        setUserShelfEntry(entry)
        setDialogOpen(true)
      } else {
        // User doesn't have this game on their shelf
        // TODO: Show a message or redirect to add to shelf
        alert('You need to add this game to your shelf before writing a review.')
      }
    } catch (error) {
      console.error('Error fetching user entry:', error)
    } finally {
      setLoadingUserEntry(false)
    }
  }

  // Load more reviews
  const loadMore = async () => {
    if (!hasMore || isLoading) return

    setIsLoading(true)
    try {
      const result = await getGameReviews(gameId, cursor)
      setReviews((prev) => [...prev, ...result.reviews])
      setHasMore(result.hasMore)
      setCursor(result.nextCursor)
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh reviews after saving
  const handleReviewSaved = async () => {
    try {
      const result = await getGameReviews(gameId)
      setReviews(result.reviews)
      setHasMore(result.hasMore)
      setCursor(result.nextCursor)
    } catch (error) {
      console.error('Error refreshing reviews:', error)
    }
  }

  // Check if current user has already written a review
  const userHasReview = user && reviews.some((r) => r.user_id === user.id)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews
          {reviews.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({reviews.length}{hasMore ? '+' : ''})
            </span>
          )}
        </h2>

        {user && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleWriteReview}
            disabled={loadingUserEntry}
          >
            {loadingUserEntry ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PenLine className="mr-2 h-4 w-4" />
            )}
            {userHasReview ? 'Edit Review' : 'Write Review'}
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No reviews yet</p>
          {user && (
            <p className="text-sm">Be the first to review this game!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load More Reviews
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Review Dialog */}
      {userShelfEntry && (
        <ReviewDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          gameName={gameName}
          userGameId={userShelfEntry.id}
          initialReview={userShelfEntry.review}
          initialRating={userShelfEntry.rating}
          onSaved={handleReviewSaved}
        />
      )}
    </section>
  )
}
