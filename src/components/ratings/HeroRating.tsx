'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { D10RatingInput } from './D10RatingInput'
import { AggregateRating } from '@/components/reviews'
import { getUserGameStatus, addToShelf, updateShelfItem } from '@/lib/supabase/user-queries'
import type { UserGame } from '@/types/database'
import { cn } from '@/lib/utils'

interface HeroRatingProps {
  gameId: string
  aggregateRating?: {
    average: number | null
    count: number
  }
  className?: string
}

export function HeroRating({
  gameId,
  aggregateRating,
  className,
}: HeroRatingProps) {
  const { user, isLoading: isAuthLoading, signInWithGoogle } = useAuth()
  const [shelfEntry, setShelfEntry] = useState<UserGame | null>(null)
  const [localRating, setLocalRating] = useState<number | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

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
    } catch (error) {
      // Rollback on error
      console.error('Failed to save rating:', error)
      setLocalRating(previousRating)
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
    </div>
  )
}
