'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getVibeDescriptor, VIBE_COLORS } from '@/types/database'
import { RatingPopover } from '@/components/ratings/RatingPopover'

interface VibeStatsCardProps {
  average: number | null
  count: number
  median?: number | null
  stdDeviation?: number | null
  vibesWithThoughts?: number
  modeVibe?: number | null
  className?: string
  // User rating integration
  userRating?: number | null
  onRatingChange?: (rating: number | null) => void
  onRatingSaved?: (rating: number) => void
  onSignIn?: () => void
  isAuthenticated?: boolean
  isSaving?: boolean
}

export function VibeStatsCard({
  average,
  count,
  median,
  stdDeviation,
  vibesWithThoughts,
  modeVibe,
  className,
  userRating,
  onRatingChange,
  onRatingSaved,
  onSignIn,
  isAuthenticated = false,
  isSaving = false,
}: VibeStatsCardProps) {
  const [showStats, setShowStats] = useState(false)

  const hasVibes = count > 0 && average !== null
  const descriptor = hasVibes ? getVibeDescriptor(average) : null

  if (!hasVibes) {
    return (
      <div className={cn('text-center', className)}>
        <div className="flex flex-col items-center gap-4">
          <EmptySphere />
          <div>
            <p className="text-lg font-semibold">No ratings yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to rate!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('', className)}>
      <div className="flex flex-col items-center gap-4">
        {/* Large 3D Sphere with average inside */}
        <LargeVibeSphere value={average} />

        {/* Rating count */}
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">
            <AnimatedCounter value={count} /> {count === 1 ? 'rating' : 'ratings'}
          </p>
          <p className={cn(
            'text-sm font-medium mt-1',
            descriptor === 'Beloved' && 'text-emerald-600 dark:text-emerald-400',
            descriptor === 'Well-liked' && 'text-teal-600 dark:text-teal-400',
            descriptor === 'Mixed' && 'text-slate-500',
            descriptor === 'Rough' && 'text-amber-600 dark:text-amber-400',
          )}>
            {descriptor}
          </p>
        </div>

        {/* Expandable stats */}
        {(median !== null || stdDeviation !== null || vibesWithThoughts !== undefined) && (
          <div className="w-full">
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showStats ? 'Hide' : 'View'} stats
              {showStats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showStats && (
              <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4 text-sm animate-in slide-in-from-top-2 duration-200">
                {median !== null && median !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Median</p>
                    <p className="font-medium">{median.toFixed(1)}</p>
                  </div>
                )}
                {modeVibe !== null && modeVibe !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Most Common</p>
                    <p className="font-medium">{modeVibe}/10</p>
                  </div>
                )}
                {stdDeviation !== null && stdDeviation !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Std Dev</p>
                    <p className="font-medium">{stdDeviation.toFixed(2)}</p>
                  </div>
                )}
                {vibesWithThoughts !== undefined && (
                  <div>
                    <p className="text-muted-foreground">With Thoughts</p>
                    <p className="font-medium">{vibesWithThoughts}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Your Rating Section */}
        {onRatingChange && (
          <div className="w-full pt-4 mt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your rating:</span>
              {isAuthenticated ? (
                <RatingPopover
                  value={userRating ?? null}
                  onChange={onRatingChange}
                  onRatingSaved={onRatingSaved}
                  isSaving={isSaving}
                />
              ) : (
                <button
                  onClick={onSignIn}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Sign in to rate
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Large neumorphic sphere for the main vibe display
function LargeVibeSphere({ value }: { value: number }) {
  return (
    <div className="relative">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-30 bg-primary"
        style={{ transform: 'scale(1.3)' }}
      />

      {/* Main sphere - neumorphic */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          'bg-primary text-primary-foreground',
          'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.15),inset_0_-2px_8px_rgba(0,0,0,0.1)]'
        )}
        style={{ width: 120, height: 120 }}
      >
        <span
          className="font-extrabold tabular-nums select-none"
          style={{ fontSize: 42 }}
        >
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

// Empty state sphere - neumorphic
function EmptySphere() {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full opacity-50',
        'bg-muted/50 text-muted-foreground',
        'border-2 border-dashed border-muted-foreground/30'
      )}
      style={{ width: 80, height: 80 }}
    >
      <span className="text-[28px] font-bold select-none">?</span>
    </div>
  )
}

// Simple animated counter
function AnimatedCounter({ value }: { value: number }) {
  // For server rendering, just return the value
  // Animation could be added with framer-motion if needed
  return <span>{value.toLocaleString()}</span>
}

// Skeleton for loading state
export function VibeStatsCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="h-[120px] w-[120px] rounded-full bg-muted" />
        <div className="space-y-2 text-center">
          <div className="h-6 w-24 bg-muted rounded mx-auto" />
          <div className="h-4 w-16 bg-muted rounded mx-auto" />
        </div>
      </div>
    </div>
  )
}
