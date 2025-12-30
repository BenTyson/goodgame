'use client'

import { User, UserCheck, BadgeCheck, Award, Star } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { TrustLevel, UserReputationStats } from '@/types/marketplace'
import { TRUST_LEVEL_INFO } from '@/types/marketplace'
import { cn } from '@/lib/utils'

interface ReputationBadgeProps {
  trustLevel: TrustLevel
  rating?: number | null
  feedbackCount?: number
  showLabel?: boolean
  showRating?: boolean
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

const ICONS = {
  User,
  UserCheck,
  BadgeCheck,
  Award,
}

/**
 * ReputationBadge - Display user's trust level and rating
 */
export function ReputationBadge({
  trustLevel,
  rating,
  feedbackCount,
  showLabel = true,
  showRating = true,
  size = 'default',
  className,
}: ReputationBadgeProps) {
  const info = TRUST_LEVEL_INFO[trustLevel]
  const Icon = ICONS[info.icon as keyof typeof ICONS] || User

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs gap-1',
      icon: 'w-3 h-3',
      star: 'w-3 h-3',
    },
    default: {
      container: 'px-2.5 py-1 text-sm gap-1.5',
      icon: 'w-4 h-4',
      star: 'w-3.5 h-3.5',
    },
    lg: {
      container: 'px-3 py-1.5 text-sm gap-2',
      icon: 'w-5 h-5',
      star: 'w-4 h-4',
    },
  }[size]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center rounded-full font-medium',
              info.bgColor,
              info.color,
              sizeClasses.container,
              className
            )}
          >
            <Icon className={sizeClasses.icon} />
            {showLabel && <span>{info.label}</span>}
            {showRating && rating !== null && rating !== undefined && (
              <>
                <span className="text-current/50">·</span>
                <div className="flex items-center gap-0.5">
                  <Star className={cn(sizeClasses.star, 'fill-current')} />
                  <span>{rating.toFixed(1)}</span>
                </div>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{info.label}</p>
          <p className="text-xs text-muted-foreground">{info.description}</p>
          {feedbackCount !== undefined && feedbackCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {feedbackCount} {feedbackCount === 1 ? 'review' : 'reviews'}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Compact reputation display for cards/lists
 */
export function ReputationCompact({
  trustLevel,
  rating,
  feedbackCount,
  className,
}: {
  trustLevel: TrustLevel
  rating?: number | null
  feedbackCount?: number
  className?: string
}) {
  const info = TRUST_LEVEL_INFO[trustLevel]

  return (
    <div className={cn('flex items-center gap-1.5 text-sm', className)}>
      {rating !== null && rating !== undefined && (
        <>
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-medium">{rating.toFixed(1)}</span>
        </>
      )}
      {feedbackCount !== undefined && feedbackCount > 0 && (
        <span className="text-muted-foreground">
          ({feedbackCount})
        </span>
      )}
      {trustLevel !== 'new' && (
        <span className={cn('ml-1', info.color)}>
          {info.label}
        </span>
      )}
    </div>
  )
}

/**
 * Detailed reputation stats display
 */
export function ReputationStats({
  stats,
  className,
}: {
  stats: UserReputationStats
  className?: string
}) {
  const positivePercent = stats.seller_feedback_count > 0
    ? Math.round((stats.seller_positive_count / stats.seller_feedback_count) * 100)
    : 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Badge */}
      <div className="flex items-center gap-3">
        <ReputationBadge
          trustLevel={stats.trust_level}
          rating={stats.seller_rating}
          feedbackCount={stats.seller_feedback_count}
          size="lg"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.total_sales}</div>
          <div className="text-xs text-muted-foreground">Sales</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.total_purchases}</div>
          <div className="text-xs text-muted-foreground">Purchases</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {stats.seller_rating?.toFixed(1) || '-'}
          </div>
          <div className="text-xs text-muted-foreground">Seller Rating</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {positivePercent > 0 ? `${positivePercent}%` : '-'}
          </div>
          <div className="text-xs text-muted-foreground">Positive</div>
        </div>
      </div>

      {/* Feedback Breakdown */}
      {stats.seller_feedback_count > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Seller Feedback</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600">{stats.seller_positive_count} positive</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-muted-foreground">
              {stats.seller_feedback_count - stats.seller_positive_count - stats.seller_negative_count} neutral
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-red-600">{stats.seller_negative_count} negative</span>
          </div>
        </div>
      )}
    </div>
  )
}
