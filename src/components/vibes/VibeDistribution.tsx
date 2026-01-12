'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getSpreadDescription } from '@/lib/supabase/vibe-queries'
import { VIBE_COLORS } from '@/types/database'
import type { VibeDistribution as VibeDistributionType } from '@/types/database'

interface VibeDistributionProps {
  distribution: VibeDistributionType
  totalCount: number
  modeVibe?: number | null
  stddev?: number | null
  interactive?: boolean
  onFilterByVibe?: (vibe: number | null) => void
  selectedVibe?: number | null
  animate?: boolean
  className?: string
}

// Height range for bars (proportional to vote count)
const MIN_HEIGHT = 8
const MAX_HEIGHT = 64

export function VibeDistribution({
  distribution,
  totalCount,
  modeVibe,
  stddev,
  interactive = false,
  onFilterByVibe,
  selectedVibe,
  animate = true,
  className,
}: VibeDistributionProps) {
  const [hoveredVibe, setHoveredVibe] = useState<number | null>(null)

  // Calculate proportional heights and find max count
  const { maxCount, barData } = useMemo(() => {
    const entries = Object.entries(distribution).map(([key, count]) => ({
      value: parseInt(key),
      count: count as number,
    }))

    const maxCount = Math.max(...entries.map((e) => e.count), 1)

    const barData = entries.map(({ value, count }) => {
      // Height proportional to count
      const heightRatio = maxCount > 0 ? count / maxCount : 0
      const height = count > 0 ? MIN_HEIGHT + heightRatio * (MAX_HEIGHT - MIN_HEIGHT) : 4
      const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0

      return { value, count, height, percentage }
    })

    return { maxCount, barData }
  }, [distribution, totalCount])

  // Calculate peak info
  const peakVibe = modeVibe || barData.reduce((max, d) => (d.count > max.count ? d : max), barData[0])?.value
  const peakPercentage = peakVibe
    ? ((distribution[peakVibe.toString() as keyof VibeDistributionType] as number) / totalCount * 100).toFixed(0)
    : 0

  const spreadText = getSpreadDescription(stddev ?? null)

  if (totalCount === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-muted-foreground">No ratings yet</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-1 h-20 px-1">
        {barData.map(({ value, count, height, percentage }, index) => {
          const isHovered = hoveredVibe === value
          const isSelected = selectedVibe === value
          const colorConfig = VIBE_COLORS[value]

          return (
            <button
              key={value}
              type="button"
              disabled={!interactive}
              onClick={() => {
                if (interactive && onFilterByVibe) {
                  onFilterByVibe(selectedVibe === value ? null : value)
                }
              }}
              onMouseEnter={() => setHoveredVibe(value)}
              onMouseLeave={() => setHoveredVibe(null)}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-end transition-all duration-200',
                interactive && 'cursor-pointer',
                !interactive && 'cursor-default',
              )}
              aria-label={`${count} ${count === 1 ? 'person' : 'people'} rated ${value}/10 (${percentage.toFixed(0)}%)`}
            >
              {/* Tooltip */}
              {isHovered && count > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg border whitespace-nowrap z-10">
                  {count} ({percentage.toFixed(0)}%)
                </div>
              )}

              {/* Bar */}
              <div
                className={cn(
                  'w-full rounded-t transition-all duration-200',
                  colorConfig?.bar || 'bg-muted',
                  isHovered && 'opacity-100 scale-x-110',
                  isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                  !isHovered && !isSelected && count === 0 && 'opacity-30',
                  !isHovered && !isSelected && count > 0 && 'opacity-80',
                  animate && 'animate-in slide-in-from-bottom duration-300',
                )}
                style={{
                  height,
                  animationDelay: animate ? `${index * 40}ms` : undefined,
                  animationFillMode: 'backwards',
                }}
              />
            </button>
          )
        })}
      </div>

      {/* Number labels */}
      <div className="flex justify-between px-1">
        {barData.map(({ value }) => {
          const isHovered = hoveredVibe === value
          const isSelected = selectedVibe === value
          return (
            <span
              key={value}
              className={cn(
                'flex-1 text-center text-xs tabular-nums transition-colors',
                isHovered || isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              {value}
            </span>
          )
        })}
      </div>

      {/* Summary text */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-1">
        <span>
          Peak: <span className="font-medium text-foreground">{peakVibe}/10</span> ({peakPercentage}%)
        </span>
        <span className="text-border">·</span>
        <span>
          Spread: <span className="font-medium text-foreground">{spreadText}</span>
        </span>
      </div>
    </div>
  )
}
