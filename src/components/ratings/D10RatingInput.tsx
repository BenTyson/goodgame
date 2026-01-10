'use client'

import { useState } from 'react'
import { D10Dice } from './D10Dice'
import { cn } from '@/lib/utils'

interface D10RatingInputProps {
  value: number | null
  onChange?: (rating: number | null) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export function D10RatingInput({
  value,
  onChange,
  disabled = false,
  size = 'md',
  showValue = true,
  className,
}: D10RatingInputProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)

  const handleClick = (rating: number) => {
    if (disabled || !onChange) return
    // Toggle off if clicking the same rating
    onChange(value === rating ? null : rating)
  }

  const handleMouseEnter = (rating: number) => {
    if (disabled) return
    setHoveredValue(rating)
  }

  const handleMouseLeave = () => {
    setHoveredValue(null)
  }

  // Determine which dice should appear filled
  const isFilled = (diceValue: number): boolean => {
    if (value !== null && diceValue <= value) return true
    return false
  }

  // Determine which dice should appear hovered (preview state)
  const isHovered = (diceValue: number): boolean => {
    if (hoveredValue === null) return false
    // Show preview up to hovered value, but only if not already filled
    if (value !== null && diceValue <= value) return false
    return diceValue <= hoveredValue
  }

  // Display value - show hovered preview or actual value
  const displayValue = hoveredValue !== null ? hoveredValue : value

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleClick(rating)
            }}
            onMouseEnter={() => handleMouseEnter(rating)}
            className={cn(
              'p-0.5 transition-transform',
              !disabled && 'hover:scale-110 cursor-pointer dice-interactive',
              disabled && 'cursor-default opacity-50'
            )}
            aria-label={`Rate ${rating} out of 10`}
          >
            <D10Dice
              value={rating}
              filled={isFilled(rating)}
              hovered={isHovered(rating)}
              size={size}
            />
          </button>
        ))}
      </div>

      {showValue && displayValue !== null && (
        <span
          className={cn(
            'ml-2 text-sm font-medium tabular-nums transition-colors',
            hoveredValue !== null
              ? 'text-primary'
              : 'text-muted-foreground'
          )}
        >
          {displayValue}/10
        </span>
      )}
    </div>
  )
}

// Compact display-only version
export function D10RatingDisplay({
  value,
  size = 'sm',
}: {
  value: number | null
  size?: 'sm' | 'md' | 'lg'
}) {
  if (value === null) return null

  return (
    <div className="flex items-center gap-1">
      <D10Dice value={value} filled size={size} />
      <span className="text-sm font-medium tabular-nums">
        {value}/10
      </span>
    </div>
  )
}
