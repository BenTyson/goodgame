'use client'

import { useState } from 'react'
import { Brain, ChevronDown, Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { CrunchBreakdown, ComplexityTier } from '@/types/database'

interface ComplexityDisplayProps {
  /** AI-generated Crunch Score (1-10 scale) */
  crunchScore?: number | null
  /** Detailed breakdown of complexity factors */
  crunchBreakdown?: CrunchBreakdown | null
  /** BGG weight for reference (1-5 scale) */
  weight?: number | null
  /** Complexity tier classification */
  complexityTier?: ComplexityTier | null
  /** Display variant */
  variant?: 'default' | 'compact' | 'badge'
  /** Show detailed breakdown on click/hover */
  showBreakdown?: boolean
  className?: string
}

// Complexity tier labels for Crunch Score
function getCrunchTier(score: number): { label: string; color: string } {
  if (score <= 2) return { label: 'Gateway', color: 'text-emerald-600 dark:text-emerald-400' }
  if (score <= 4) return { label: 'Light', color: 'text-green-600 dark:text-green-400' }
  if (score <= 5.5) return { label: 'Medium-Light', color: 'text-lime-600 dark:text-lime-400' }
  if (score <= 6.5) return { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' }
  if (score <= 7.5) return { label: 'Medium-Heavy', color: 'text-orange-600 dark:text-orange-400' }
  if (score <= 8.5) return { label: 'Heavy', color: 'text-red-600 dark:text-red-400' }
  return { label: 'Expert', color: 'text-rose-600 dark:text-rose-400' }
}

// Visual progress bar for scores
function ScoreBar({ value, max = 10, className }: { value: number; max?: number; className?: string }) {
  const percentage = (value / max) * 100

  return (
    <div className={cn('h-1.5 w-full bg-muted rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Breakdown detail row
function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <ScoreBar value={value} className="w-16" />
        <span className="font-medium w-4 text-right">{value}</span>
      </div>
    </div>
  )
}

export function ComplexityDisplay({
  crunchScore,
  crunchBreakdown,
  weight,
  complexityTier,
  variant = 'default',
  showBreakdown = true,
  className
}: ComplexityDisplayProps) {
  const [open, setOpen] = useState(false)

  // Prefer Crunch Score over BGG weight
  const hasCrunch = crunchScore !== null && crunchScore !== undefined
  const hasWeight = weight !== null && weight !== undefined

  if (!hasCrunch && !hasWeight) return null

  const displayScore = hasCrunch ? crunchScore : weight
  const displayMax = hasCrunch ? 10 : 5
  const displayLabel = hasCrunch ? 'Crunch Score' : 'Complexity'
  const tier = hasCrunch
    ? getCrunchTier(crunchScore!)
    : complexityTier
      ? { label: complexityTier.name, color: 'text-foreground' }
      : null

  // Badge variant
  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5 cursor-help',
                tier?.color,
                className
              )}
            >
              <Brain className="h-3 w-3" />
              <span>{displayScore?.toFixed(1)}</span>
              {tier && <span className="text-muted-foreground">/</span>}
              {tier && <span className="font-normal">{tier.label}</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{displayLabel}: {displayScore?.toFixed(1)} / {displayMax}</p>
            {hasCrunch && <p className="text-xs text-muted-foreground">AI-analyzed from rulebook</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Brain className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold">{displayScore?.toFixed(1)}</span>
        <span className="text-muted-foreground">/ {displayMax}</span>
        {tier && (
          <span className={cn('text-sm', tier.color)}>
            ({tier.label})
          </span>
        )}
      </div>
    )
  }

  // Default variant with optional breakdown popover
  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
        <Brain className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">{displayScore?.toFixed(1)}</span>
          <span className="text-muted-foreground text-sm">/ {displayMax}</span>
          {tier && (
            <span className={cn('text-sm font-medium', tier.color)}>
              {tier.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{displayLabel}</span>
          {hasCrunch && (
            <>
              <span className="text-muted-foreground/50">|</span>
              <span className="flex items-center gap-0.5">
                <Brain className="h-3 w-3" />
                AI-analyzed
              </span>
            </>
          )}
        </div>
      </div>
      {showBreakdown && crunchBreakdown && (
        <ChevronDown className={cn(
          'h-4 w-4 text-muted-foreground transition-transform',
          open && 'rotate-180'
        )} />
      )}
    </div>
  )

  // If we have breakdown, wrap in popover
  if (showBreakdown && crunchBreakdown) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto p-2 -m-2 hover:bg-muted/50 w-full justify-start"
          >
            {content}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Brain className="h-4 w-4 text-primary" />
              <span className="font-semibold">Crunch Score Breakdown</span>
            </div>
            <div className="space-y-2">
              <BreakdownRow label="Rules Density" value={crunchBreakdown.rulesDensity} />
              <BreakdownRow label="Decision Space" value={crunchBreakdown.decisionSpace} />
              <BreakdownRow label="Learning Curve" value={crunchBreakdown.learningCurve} />
              <BreakdownRow label="Strategic Depth" value={crunchBreakdown.strategicDepth} />
              <BreakdownRow label="Component Complexity" value={crunchBreakdown.componentComplexity} />
            </div>
            {crunchBreakdown.reasoning && (
              <div className="pt-2 border-t">
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  <p className="leading-relaxed">{crunchBreakdown.reasoning}</p>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return content
}
