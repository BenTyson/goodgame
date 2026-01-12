'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { VibeDistribution } from './VibeDistribution'
import { VibeCard, VibeCardSkeleton } from './VibeCard'
import { VibeStatsCard, VibeStatsCardSkeleton } from './VibeStatsCard'
import { VibeFilters } from './VibeFilters'
import { FriendsVibes } from './FriendsVibes'
import { RatingFollowUpDialog } from '@/components/ratings/RatingFollowUpDialog'
import { getGameVibes } from '@/lib/supabase/vibe-queries'
import { getUserGameStatus, addToShelf, updateShelfItem } from '@/lib/supabase/user-queries'
import { updateReview } from '@/lib/supabase/review-queries'
import type {
  GameVibeStats,
  VibeWithUser,
  VibeSortOption,
  VibeFilterOption,
  UserGame,
  ShelfStatus,
} from '@/types/database'

interface VibesTabProps {
  gameId: string
  gameName: string
  initialStats: GameVibeStats
  initialVibes: VibeWithUser[]
  initialHasMore: boolean
}

export function VibesTab({
  gameId,
  gameName,
  initialStats,
  initialVibes,
  initialHasMore,
}: VibesTabProps) {
  const { user, isLoading: isAuthLoading, signInWithGoogle } = useAuth()

  // Vibe state
  const [vibes, setVibes] = useState(initialVibes)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [cursor, setCursor] = useState<string | undefined>(
    initialVibes.length > 0 ? initialVibes[initialVibes.length - 1].createdAt : undefined
  )
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Filter/sort state
  const [sort, setSort] = useState<VibeSortOption>('newest')
  const [filter, setFilter] = useState<VibeFilterOption>('all')
  const [isFiltering, setIsFiltering] = useState(false)

  // User's own vibe state
  const [shelfEntry, setShelfEntry] = useState<UserGame | null>(null)
  const [localRating, setLocalRating] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  // Follow-up dialog state
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)
  const [pendingRating, setPendingRating] = useState<number | null>(null)
  const [isEditingVibe, setIsEditingVibe] = useState(false)

  // Fetch user's shelf entry when auth resolves
  useEffect(() => {
    if (isAuthLoading) return

    if (user && !hasFetched) {
      getUserGameStatus(user.id, gameId)
        .then((entry) => {
          setShelfEntry(entry)
          setLocalRating(entry?.rating ?? null)
        })
        .finally(() => setHasFetched(true))
    } else if (!user) {
      setShelfEntry(null)
      setLocalRating(null)
      setHasFetched(false)
    }
  }, [user, gameId, isAuthLoading, hasFetched])

  // Handle rating change
  const handleRatingChange = async (newRating: number | null) => {
    if (!user) {
      signInWithGoogle()
      return
    }

    if (newRating === null && localRating === null) return

    const previousRating = localRating
    setLocalRating(newRating)
    setIsSaving(true)

    try {
      if (shelfEntry) {
        await updateShelfItem(shelfEntry.id, { rating: newRating })
        setShelfEntry((prev) => (prev ? { ...prev, rating: newRating } : null))
      } else if (newRating !== null) {
        const result = await addToShelf({
          user_id: user.id,
          game_id: gameId,
          status: 'played',
          rating: newRating,
        })
        setShelfEntry(result)
      }
    } catch (error) {
      console.error('Failed to save rating:', error)
      setLocalRating(previousRating)
    } finally {
      setIsSaving(false)
    }
  }

  // Called when a rating is saved - opens the follow-up dialog
  const handleRatingSaved = (rating: number) => {
    setPendingRating(rating)
    setIsEditingVibe(false) // New rating, not editing
    setShowFollowUpDialog(true)
  }

  // Handle follow-up dialog save
  const handleFollowUpSave = async (data: { shelfStatus: ShelfStatus; thoughts: string | null }) => {
    if (!shelfEntry || !user) return

    setIsSaving(true)
    try {
      // Update shelf status and thoughts together
      await updateShelfItem(shelfEntry.id, { status: data.shelfStatus })
      await updateReview(shelfEntry.id, data.thoughts)
      setShelfEntry((prev) =>
        prev ? { ...prev, status: data.shelfStatus, review: data.thoughts } : null
      )
    } catch (error) {
      console.error('Failed to save follow-up data:', error)
      throw error // Let the dialog handle the error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle follow-up dialog skip
  const handleFollowUpSkip = () => {
    // Rating is already saved, just close the dialog
    setPendingRating(null)
  }

  // Handle edit from VibeCard - opens the follow-up dialog with existing data
  const handleEditVibe = () => {
    if (localRating) {
      setPendingRating(localRating)
      setIsEditingVibe(true) // Editing existing rating
      setShowFollowUpDialog(true)
    }
  }

  // Handle delete rating
  const handleDeleteRating = async () => {
    if (!shelfEntry || !user) return

    setIsSaving(true)
    try {
      // Clear rating and review but keep shelf entry
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

  // Load more vibes
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const result = await getGameVibes(gameId, { cursor, sort, filter })
      setVibes((prev) => [...prev, ...result.vibes])
      setHasMore(result.hasMore)
      setCursor(result.nextCursor)
    } catch (error) {
      console.error('Failed to load more vibes:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [gameId, cursor, hasMore, isLoadingMore, sort, filter])

  // Refetch when sort/filter changes
  const refetchVibes = useCallback(async () => {
    setIsFiltering(true)
    try {
      const result = await getGameVibes(gameId, { sort, filter })
      setVibes(result.vibes)
      setHasMore(result.hasMore)
      setCursor(result.nextCursor)
    } catch (error) {
      console.error('Failed to fetch vibes:', error)
    } finally {
      setIsFiltering(false)
    }
  }, [gameId, sort, filter])

  useEffect(() => {
    // Only refetch if sort/filter changed from initial
    if (sort !== 'newest' || filter !== 'all') {
      refetchVibes()
    }
  }, [sort, filter, refetchVibes])

  // Handle filter by clicking on distribution
  const handleFilterByVibe = (vibe: number | null) => {
    setFilter(vibe === null ? 'all' : vibe)
  }

  const isLoading = isAuthLoading || (user && !hasFetched)

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Column - Reviews/Vibes Feed */}
      <div className="lg:col-span-2 space-y-6">
        {/* Filter bar */}
        <VibeFilters
          totalCount={initialStats.vibeCount}
          sort={sort}
          filter={filter}
          onSortChange={setSort}
          onFilterChange={setFilter}
        />

        {/* Vibes list */}
        <div className="space-y-4">
          {isFiltering ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <VibeCardSkeleton key={i} />
            ))
          ) : vibes.length === 0 ? (
            // Empty state
            <div className="text-center py-12 rounded-2xl border border-border/50 bg-card/30">
              <p className="text-muted-foreground">
                {filter !== 'all'
                  ? 'No ratings match this filter.'
                  : 'No ratings yet. Be the first!'}
              </p>
            </div>
          ) : (
            // Vibes list
            vibes.map((vibe) => (
              <VibeCard
                key={vibe.id}
                vibe={vibe}
                isOwnVibe={user?.id === vibe.userId}
                onEdit={handleEditVibe}
              />
            ))
          )}
        </div>

        {/* Load more button */}
        {hasMore && !isFiltering && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load more'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Right Column - Vibe Ratings Sidebar */}
      <div className="space-y-6">
        {/* The Vibe - Stats + Your Rating */}
        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur p-6">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">The Vibe</h2>
          <VibeStatsCard
            average={initialStats.averageVibe}
            count={initialStats.vibeCount}
            median={initialStats.medianVibe}
            stdDeviation={initialStats.vibeStddev}
            vibesWithThoughts={initialStats.vibesWithThoughts}
            modeVibe={initialStats.modeVibe}
            userRating={localRating}
            onRatingChange={handleRatingChange}
            onRatingSaved={handleRatingSaved}
            onSignIn={signInWithGoogle}
            isAuthenticated={!!user}
            isSaving={isSaving}
          />
        </div>

        {/* Distribution */}
        {initialStats.vibeCount > 0 && (
          <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur p-6">
            <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">Distribution</h2>
            <VibeDistribution
              distribution={initialStats.distribution}
              totalCount={initialStats.vibeCount}
              modeVibe={initialStats.modeVibe}
              stddev={initialStats.vibeStddev}
              interactive={true}
              onFilterByVibe={handleFilterByVibe}
              selectedVibe={typeof filter === 'number' ? filter : null}
            />
          </div>
        )}

        {/* Friends' Vibes */}
        <FriendsVibes gameId={gameId} />
      </div>

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
          isEditing={isEditingVibe}
        />
      )}
    </div>
  )
}

// Skeleton for the whole tab
export function VibesTabSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-3 animate-pulse">
      {/* Left Column - Feed */}
      <div className="lg:col-span-2 space-y-6">
        {/* Filter bar skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-muted rounded" />
            <div className="h-8 w-20 bg-muted rounded" />
          </div>
        </div>

        {/* Vibes skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <VibeCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Right Column - Sidebar */}
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="rounded-2xl border border-border/50 bg-card/30 p-6">
          <div className="h-4 w-20 bg-muted rounded mb-4" />
          <VibeStatsCardSkeleton />
        </div>

        {/* Distribution skeleton */}
        <div className="rounded-2xl border border-border/50 bg-card/30 p-6">
          <div className="h-4 w-24 bg-muted rounded mb-4" />
          <div className="h-24 w-full bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}
