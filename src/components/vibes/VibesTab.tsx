'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { D10RatingInput } from '@/components/ratings/D10RatingInput'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VibeDistribution } from './VibeDistribution'
import { VibeCard, VibeCardSkeleton } from './VibeCard'
import { VibeStatsCard, VibeStatsCardSkeleton } from './VibeStatsCard'
import { VibeFilters } from './VibeFilters'
import { FriendsVibes } from './FriendsVibes'
import { getGameVibes, getUserVibe } from '@/lib/supabase/vibe-queries'
import { getUserGameStatus, addToShelf, updateShelfItem } from '@/lib/supabase/user-queries'
import { updateReview } from '@/lib/supabase/review-queries'
import { cn } from '@/lib/utils'
import type {
  GameVibeStats,
  VibeWithUser,
  VibeSortOption,
  VibeFilterOption,
  UserGame,
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
  const [localThoughts, setLocalThoughts] = useState('')
  const [showThoughtsInput, setShowThoughtsInput] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  // Fetch user's shelf entry when auth resolves
  useEffect(() => {
    if (isAuthLoading) return

    if (user && !hasFetched) {
      getUserGameStatus(user.id, gameId)
        .then((entry) => {
          setShelfEntry(entry)
          setLocalRating(entry?.rating ?? null)
          setLocalThoughts(entry?.review ?? '')
          if (entry?.review) {
            setShowThoughtsInput(true)
          }
        })
        .finally(() => setHasFetched(true))
    } else if (!user) {
      setShelfEntry(null)
      setLocalRating(null)
      setLocalThoughts('')
      setShowThoughtsInput(false)
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

  // Handle thoughts save
  const handleSaveThoughts = async () => {
    if (!shelfEntry || !user) return

    setIsSaving(true)
    try {
      await updateReview(shelfEntry.id, localThoughts || null)
      setShelfEntry((prev) => (prev ? { ...prev, review: localThoughts || null } : null))
    } catch (error) {
      console.error('Failed to save thoughts:', error)
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
        {/* Your Review - shown after rating */}
        {user && (localRating !== null || shelfEntry?.rating) && (
          <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Your Review
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Your vibe:</span>
                <span className="font-bold text-foreground">{localRating ?? shelfEntry?.rating}/10</span>
              </div>
            </div>

            {!showThoughtsInput ? (
              <button
                onClick={() => setShowThoughtsInput(true)}
                className="w-full text-left p-4 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <p className="text-muted-foreground">Share your thoughts about {gameName}...</p>
              </button>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-200">
                <Textarea
                  value={localThoughts}
                  onChange={(e) => setLocalThoughts(e.target.value)}
                  placeholder={`What did you think about ${gameName}?`}
                  className="resize-none min-h-[120px]"
                  disabled={isSaving}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveThoughts}
                    disabled={isSaving || localThoughts === (shelfEntry?.review || '')}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                  {localThoughts !== (shelfEntry?.review || '') && (
                    <span className="text-xs text-muted-foreground">Unsaved changes</span>
                  )}
                  {shelfEntry?.review && localThoughts === shelfEntry.review && (
                    <span className="text-xs text-green-600">Saved</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
                  ? 'No vibes match this filter.'
                  : 'No vibes yet. Be the first!'}
              </p>
            </div>
          ) : (
            // Vibes list
            vibes.map((vibe) => (
              <VibeCard
                key={vibe.id}
                vibe={vibe}
                isOwnVibe={user?.id === vibe.userId}
                onEdit={() => setShowThoughtsInput(true)}
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
                'Load more vibes'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Right Column - Vibe Ratings Sidebar */}
      <div className="space-y-6">
        {/* The Vibe - Stats */}
        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur p-6">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">The Vibe</h2>
          <VibeStatsCard
            average={initialStats.averageVibe}
            count={initialStats.vibeCount}
            median={initialStats.medianVibe}
            stdDeviation={initialStats.vibeStddev}
            vibesWithThoughts={initialStats.vibesWithThoughts}
            modeVibe={initialStats.modeVibe}
          />
        </div>

        {/* Your Vibe - Rating input */}
        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur p-6 space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {user ? 'Your Vibe' : 'Drop Your Vibe'}
          </h2>

          {/* Rating input */}
          <div className="flex items-center gap-3">
            <D10RatingInput
              value={localRating}
              onChange={handleRatingChange}
              disabled={isLoading || isSaving}
              size="md"
              showValue={true}
            />
            {isSaving && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Prompt to add review */}
          {localRating !== null && !shelfEntry?.review && (
            <p className="text-xs text-muted-foreground">
              Add your review in the panel to the left
            </p>
          )}
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

        {/* Your vibe skeleton */}
        <div className="rounded-2xl border border-border/50 bg-card/30 p-6">
          <div className="h-4 w-24 bg-muted rounded mb-4" />
          <div className="h-10 w-full bg-muted rounded" />
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
