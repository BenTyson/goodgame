'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingInputProps {
  value: number | null
  onChange?: (rating: number | null) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

export function RatingInput({
  value,
  onChange,
  max = 10,
  size = 'md',
  readonly = false,
}: RatingInputProps) {
  const sizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const handleClick = (rating: number) => {
    if (readonly || !onChange) return
    // Toggle off if clicking the same rating
    onChange(value === rating ? null : rating)
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={readonly}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleClick(rating)
          }}
          className={cn(
            'transition-transform p-0.5',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default'
          )}
          aria-label={`Rate ${rating} out of ${max}`}
        >
          <Star
            className={cn(
              sizes[size],
              'transition-colors',
              value !== null && rating <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30 hover:text-muted-foreground/50'
            )}
          />
        </button>
      ))}
      {value !== null && (
        <span className="ml-2 text-sm text-muted-foreground tabular-nums">
          {value}/{max}
        </span>
      )}
    </div>
  )
}

// Compact display version
export function RatingDisplay({
  value,
  max = 10,
}: {
  value: number | null
  max?: number
}) {
  if (value === null) return null

  return (
    <div className="flex items-center gap-1">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium tabular-nums">
        {value}/{max}
      </span>
    </div>
  )
}
