'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { D10RatingInput } from './D10RatingInput'
import { RatingFollowUpDialog } from './RatingFollowUpDialog'
import { AggregateRating } from '@/components/reviews'
import { getUserGameStatus, addToShelf, updateShelfItem, updateReview } from '@/lib/supabase/user-queries'
import type { UserGame, ShelfStatus } from '@/types/database'
import { cn } from '@/lib/utils'

interface HeroRatingProps {
  gameId: string
  gameName: string
  aggregateRating?: {
    average: number | null
    count: number
  }
  className?: string
}

export function HeroRating({
  gameId,
  gameName,
  aggregateRating,
  className,
}: HeroRatingProps) {
  const { user, isLoading: isAuthLoading, signInWithGoogle } = useAuth()
  const [shelfEntry, setShelfEntry] = useState<UserGame | null>(null)
  const [localRating, setLocalRating] = useState<number | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  // Follow-up dialog state
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)
  const [pendingRating, setPendingRating] = useState<number | null>(null)
  const [isEditingRating, setIsEditingRating] = useState(false)

  // Fetch user's shelf entry when auth resolves
  useEffect(() => {
    if (isAuthLoading) return

    if (user && !hasFetched) {
      setIsFetching(true)
      getUserGameStatus(user.id, gameId)
        .then((entry) => {
          setShelfEntry(entry)
          setLocalRating(entry?.rating ?? null)
        })
        .finally(() => {
          setIsFetching(false)
          setHasFetched(true)
        })
    } else if (!user) {
      // Reset when logged out
      setShelfEntry(null)
      setLocalRating(null)
      setHasFetched(false)
    }
  }, [user, gameId, isAuthLoading, hasFetched])

  const handleRatingChange = async (newRating: number | null) => {
    // If not authenticated, trigger login
    if (!user) {
      signInWithGoogle()
      return
    }

    // Don't allow clearing if there's no existing rating to clear
    if (newRating === null && localRating === null) return

    // Track if this is editing an existing rating
    const hadExistingRating = localRating !== null

    // Optimistic update
    const previousRating = localRating
    setLocalRating(newRating)
    setIsSaving(true)

    try {
      if (shelfEntry) {
        // Update existing shelf entry
        await updateShelfItem(shelfEntry.id, { rating: newRating })
        setShelfEntry((prev) => (prev ? { ...prev, rating: newRating } : null))
      } else if (newRating !== null) {
        // Add to shelf with 'played' status
        const result = await addToShelf({
          user_id: user.id,
          game_id: gameId,
          status: 'played',
          rating: newRating,
        })
        setShelfEntry(result)
      }

      // Open follow-up dialog after successful save (only for new/changed ratings)
      if (newRating !== null) {
        setPendingRating(newRating)
        setIsEditingRating(hadExistingRating)
        setShowFollowUpDialog(true)
      }
    } catch (error) {
      // Rollback on error
      console.error('Failed to save rating:', error)
      setLocalRating(previousRating)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle follow-up dialog save
  const handleFollowUpSave = async (data: { shelfStatus: ShelfStatus; thoughts: string | null }) => {
    if (!shelfEntry || !user) return

    setIsSaving(true)
    try {
      await updateShelfItem(shelfEntry.id, { status: data.shelfStatus })
      await updateReview(shelfEntry.id, data.thoughts)
      setShelfEntry((prev) =>
        prev ? { ...prev, status: data.shelfStatus, review: data.thoughts } : null
      )
    } catch (error) {
      console.error('Failed to save follow-up data:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle follow-up dialog skip
  const handleFollowUpSkip = () => {
    setPendingRating(null)
  }

  // Handle delete rating
  const handleDeleteRating = async () => {
    if (!shelfEntry || !user) return

    setIsSaving(true)
    try {
      await updateShelfItem(shelfEntry.id, { rating: null })
      await updateReview(shelfEntry.id, null)
      setShelfEntry((prev) => (prev ? { ...prev, rating: null, review: null } : null))
      setLocalRating(null)
      setPendingRating(null)
    } catch (error) {
      console.error('Failed to delete rating:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading = isAuthLoading || (user && isFetching)

  return (
    <div className={cn('space-y-3', className)}>
      {/* Personal Rating Section */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {user ? 'Your Rating' : 'Rate This Game'}
        </p>
        <div className="flex items-center gap-2">
          <D10RatingInput
            value={localRating}
            onChange={handleRatingChange}
            disabled={isLoading || isSaving}
            size="md"
            showValue={true}
          />
          {isSaving && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
      </div>

      {/* Community Rating */}
      {aggregateRating && aggregateRating.count > 0 ? (
        <AggregateRating
          average={aggregateRating.average}
          count={aggregateRating.count}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No community ratings yet. Be the first!
        </p>
      )}

      {/* Rating Follow-Up Dialog */}
      {pendingRating !== null && (
        <RatingFollowUpDialog
          open={showFollowUpDialog}
          onOpenChange={setShowFollowUpDialog}
          rating={pendingRating}
          gameName={gameName}
          currentShelfStatus={shelfEntry?.status}
          currentThoughts={shelfEntry?.review}
          onSave={handleFollowUpSave}
          onSkip={handleFollowUpSkip}
          onDelete={handleDeleteRating}
          isEditing={isEditingRating}
        />
      )}
    </div>
  )
}
