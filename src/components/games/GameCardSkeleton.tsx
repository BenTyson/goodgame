import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface GameCardSkeletonProps {
  variant?: 'default' | 'compact' | 'featured'
}

export function GameCardSkeleton({ variant = 'default' }: GameCardSkeletonProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden',
        variant === 'featured' && 'md:col-span-2'
      )}
      padding="none"
    >
      {/* Image placeholder */}
      <Skeleton className="aspect-[4/3] rounded-none" />

      <CardContent className="p-5">
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />

        {/* Tagline */}
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-2/3" />

        {/* Stats */}
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-10" />
        </div>

        {/* Badges */}
        {variant !== 'compact' && (
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface GameGridSkeletonProps {
  count?: number
  columns?: 2 | 3 | 4
}

export function GameGridSkeleton({ count = 6, columns = 3 }: GameGridSkeletonProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={`grid gap-6 ${gridCols[columns]}`}>
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  )
}
