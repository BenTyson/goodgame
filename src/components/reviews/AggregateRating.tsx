'use client'

import { Star } from 'lucide-react'

interface AggregateRatingProps {
  average: number | null
  count: number
}

export function AggregateRating({ average, count }: AggregateRatingProps) {
  if (average === null || count === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="font-medium">{average.toFixed(1)}</span>
      <span className="text-muted-foreground text-sm">
        / 10 from {count} {count === 1 ? 'rating' : 'ratings'}
      </span>
    </div>
  )
}
