'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getSpreadDescription } from '@/lib/supabase/vibe-queries'
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

// Size range for dice (proportional to vote count)
const MIN_SIZE = 28
const MAX_SIZE = 52

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

  // Calculate proportional sizes and find max count
  const { maxCount, diceData } = useMemo(() => {
    const entries = Object.entries(distribution).map(([key, count]) => ({
      value: parseInt(key),
      count: count as number,
    }))

    const maxCount = Math.max(...entries.map((e) => e.count), 1)

    const diceData = entries.map(({ value, count }) => {
      // Size proportional to count (min to max range)
      const sizeRatio = maxCount > 0 ? count / maxCount : 0
      const size = MIN_SIZE + sizeRatio * (MAX_SIZE - MIN_SIZE)
      const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0

      return { value, count, size, percentage }
    })

    return { maxCount, diceData }
  }, [distribution, totalCount])

  // Calculate peak info
  const peakVibe = modeVibe || diceData.reduce((max, d) => (d.count > max.count ? d : max), diceData[0])?.value
  const peakPercentage = peakVibe
    ? ((distribution[peakVibe.toString() as keyof VibeDistributionType] as number) / totalCount * 100).toFixed(0)
    : 0

  const spreadText = getSpreadDescription(stddev ?? null)

  if (totalCount === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-muted-foreground">No vibes yet. Be the first!</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dice Row */}
      <div className="flex items-end justify-center gap-1 sm:gap-2">
        {diceData.map(({ value, count, size, percentage }, index) => {
          const isHovered = hoveredVibe === value
          const isSelected = selectedVibe === value
          const fillIntensity = maxCount > 0 ? count / maxCount : 0

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
                'relative flex flex-col items-center gap-1 transition-all duration-300',
                interactive && 'cursor-pointer hover:scale-105',
                !interactive && 'cursor-default',
                animate && 'animate-in fade-in slide-in-from-bottom-2',
              )}
              style={{
                animationDelay: animate ? `${index * 30}ms` : undefined,
                animationFillMode: 'backwards',
              }}
              aria-label={`${count} ${count === 1 ? 'person' : 'people'} rated ${value}/10 (${percentage.toFixed(0)}%)`}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg border whitespace-nowrap z-10">
                  {count} {count === 1 ? 'vibe' : 'vibes'} ({percentage.toFixed(0)}%)
                </div>
              )}

              {/* Die */}
              <DistributionDie
                value={value}
                size={size}
                fillIntensity={fillIntensity}
                isHovered={isHovered}
                isSelected={isSelected}
              />

              {/* Count label */}
              <span
                className={cn(
                  'text-xs tabular-nums transition-colors',
                  isHovered || isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Summary text */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
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

// Individual die for distribution display
interface DistributionDieProps {
  value: number
  size: number
  fillIntensity: number // 0-1, how "filled" the die should appear
  isHovered: boolean
  isSelected: boolean
}

function DistributionDie({
  value,
  size,
  fillIntensity,
  isHovered,
  isSelected,
}: DistributionDieProps) {
  const fontSize = Math.max(10, size * 0.35)

  // Determine style based on state
  const isFilled = fillIntensity > 0.3
  const isActive = isHovered || isSelected

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all duration-300 font-bold tabular-nums select-none',
        // Filled state - solid with subtle shadow (neumorphic)
        isFilled && !isActive && [
          'bg-primary text-primary-foreground',
          'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]',
        ],
        // Hovered/Selected - brighter
        isActive && [
          'bg-primary text-primary-foreground',
          'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'scale-105',
        ],
        // Empty - very subtle
        !isFilled && !isActive && [
          'bg-muted/50 text-muted-foreground',
        ],
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
      style={{
        width: size,
        height: size,
        fontSize,
        opacity: isActive ? 1 : 0.4 + fillIntensity * 0.6,
      }}
    >
      {value}
    </div>
  )
}
