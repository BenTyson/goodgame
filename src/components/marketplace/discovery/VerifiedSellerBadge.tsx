'use client'

import { BadgeCheck, Shield, ShieldCheck, Award } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { TrustLevel } from '@/types/marketplace'
import { TRUST_LEVEL_INFO } from '@/types/marketplace'

interface VerifiedSellerBadgeProps {
  trustLevel: TrustLevel
  rating?: number | null
  salesCount?: number
  variant?: 'default' | 'compact' | 'inline'
  className?: string
  showTooltip?: boolean
}

/**
 * Get the icon component for a trust level
 */
function getTrustIcon(trustLevel: TrustLevel) {
  switch (trustLevel) {
    case 'top_seller':
      return Award
    case 'trusted':
      return ShieldCheck
    case 'established':
      return BadgeCheck
    default:
      return Shield
  }
}

export function VerifiedSellerBadge({
  trustLevel,
  rating,
  salesCount,
  variant = 'default',
  className,
  showTooltip = true,
}: VerifiedSellerBadgeProps) {
  const info = TRUST_LEVEL_INFO[trustLevel]
  const Icon = getTrustIcon(trustLevel)

  // Don't show badge for new sellers unless explicitly shown
  if (trustLevel === 'new' && variant !== 'inline') {
    return null
  }

  const badgeContent = (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1 font-medium',
        info.bgColor,
        info.color,
        variant === 'compact' && 'text-[10px] px-1.5 py-0',
        variant === 'inline' && 'text-xs px-2 py-0.5',
        className
      )}
    >
      <Icon
        className={cn(
          variant === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5'
        )}
      />
      {variant !== 'compact' && info.label}
    </Badge>
  )

  if (!showTooltip) {
    return badgeContent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium">{info.label}</div>
            <p className="text-xs text-muted-foreground">{info.description}</p>
            {(rating !== undefined || salesCount !== undefined) && (
              <div className="flex items-center gap-3 pt-1 border-t text-xs">
                {rating !== null && rating !== undefined && (
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    {rating.toFixed(1)} rating
                  </span>
                )}
                {salesCount !== undefined && salesCount > 0 && (
                  <span>{salesCount} sale{salesCount !== 1 ? 's' : ''}</span>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Inline variant for use in text
 */
interface VerifiedSellerInlineProps {
  trustLevel: TrustLevel
  sellerName: string
  className?: string
}

export function VerifiedSellerInline({
  trustLevel,
  sellerName,
  className,
}: VerifiedSellerInlineProps) {
  // Only show for trusted and above
  if (trustLevel !== 'trusted' && trustLevel !== 'top_seller') {
    return <span className={className}>{sellerName}</span>
  }

  const info = TRUST_LEVEL_INFO[trustLevel]
  const Icon = getTrustIcon(trustLevel)

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {sellerName}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Icon className={cn('h-3.5 w-3.5', info.color)} />
          </TooltipTrigger>
          <TooltipContent side="top">
            <span>{info.label}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  )
}
