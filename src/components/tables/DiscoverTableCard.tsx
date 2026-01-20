'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import {
  MapPin,
  Users,
  Calendar,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { NearbyTable } from '@/types/tables'

interface DiscoverTableCardProps {
  table: NearbyTable
  isSelected?: boolean
  isHovered?: boolean
  onClick?: () => void
  onHover?: (hovered: boolean) => void
  onClose?: () => void
  variant?: 'list' | 'grid' | 'overlay'
}

function DiscoverTableCardComponent({
  table,
  isSelected,
  isHovered,
  onClick,
  onHover,
  onClose,
  variant = 'list',
}: DiscoverTableCardProps) {
  const scheduledDate = new Date(table.scheduledAt)
  const spotsLeft = table.maxPlayers ? table.maxPlayers - table.attendingCount : null

  const content = (
    <>
      {/* Game image */}
      <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        {table.gameThumbnailUrl ? (
          <Image
            src={table.gameThumbnailUrl}
            alt={table.gameName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <Users className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">
              {table.title || table.gameName}
            </h3>
            {table.title && (
              <p className="text-xs text-muted-foreground truncate">{table.gameName}</p>
            )}
          </div>
          {spotsLeft !== null && spotsLeft <= 2 && spotsLeft > 0 && (
            <Badge variant="secondary" className="flex-shrink-0 bg-amber-500/10 text-amber-600">
              {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
            </Badge>
          )}
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(scheduledDate, 'EEE, MMM d')}</span>
            <Clock className="h-3.5 w-3.5 ml-1" />
            <span>{format(scheduledDate, 'h:mm a')}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{table.locationName || 'Location TBD'}</span>
            {table.distanceMiles && (
              <span className="text-primary font-medium flex-shrink-0">
                {table.distanceMiles.toFixed(1)} mi
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {table.attendingCount} attending
              {table.maxPlayers && ` / ${table.maxPlayers} max`}
            </span>
          </div>
        </div>
      </div>

      {variant !== 'overlay' && (
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
    </>
  )

  if (variant === 'overlay') {
    return (
      <div className="bg-background border border-border rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-4">
          {content}
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
          <Button asChild className="flex-1">
            <Link href={`/tables/${table.tableId}`}>View Details</Link>
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Link
      href={`/tables/${table.tableId}`}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all',
        'hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5',
        isSelected && 'border-primary bg-primary/5 shadow-md',
        isHovered && !isSelected && 'border-primary/20 bg-accent/50',
        !isSelected && !isHovered && 'border-border/50 bg-card/50'
      )}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault()
          onClick()
        }
      }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {content}
    </Link>
  )
}

export const DiscoverTableCard = memo(DiscoverTableCardComponent)
