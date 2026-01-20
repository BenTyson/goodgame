'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { TableCard as TableCardType } from '@/types/tables'
import { TABLE_STATUS_CONFIG, RSVP_STATUS_CONFIG } from '@/types/tables'

interface TableCardProps {
  table: TableCardType
  currentUserId?: string
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE, MMM d')
}

function TableCardComponent({ table, currentUserId }: TableCardProps) {
  const scheduledDate = new Date(table.scheduledAt)
  const isPastTable = isPast(scheduledDate)
  const isHost = table.hostId === currentUserId
  const statusConfig = TABLE_STATUS_CONFIG[table.status]
  const rsvpConfig = RSVP_STATUS_CONFIG[table.userRsvpStatus]

  const hostName = table.hostDisplayName || table.hostUsername || 'Unknown'
  const hostAvatar = table.hostCustomAvatarUrl || table.hostAvatarUrl
  const hostInitials = hostName.slice(0, 2).toUpperCase()

  return (
    <Link href={`/tables/${table.tableId}`}>
      <div
        className={cn(
          'group relative rounded-xl border border-border/50 bg-card/50 p-4',
          'hover:border-primary/30 hover:bg-card/80 hover:shadow-md transition-all duration-200',
          isPastTable && 'opacity-75'
        )}
      >
        {/* Status badge */}
        {table.status !== 'scheduled' && (
          <Badge
            variant="outline"
            className={cn('absolute top-3 right-3 text-xs', statusConfig.color, statusConfig.bgColor)}
          >
            {statusConfig.label}
          </Badge>
        )}

        <div className="flex gap-4">
          {/* Game thumbnail */}
          <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {table.gameThumbnailUrl ? (
              <Image
                src={table.gameThumbnailUrl}
                alt={table.gameName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                No image
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            {/* Title/Game name */}
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {table.title || table.gameName}
            </h3>
            {table.title && (
              <p className="text-sm text-muted-foreground truncate">{table.gameName}</p>
            )}

            {/* Date and time */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{getDateLabel(scheduledDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{format(scheduledDate, 'h:mm a')}</span>
              </div>
            </div>

            {/* Location */}
            {table.locationName && (
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{table.locationName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: Host, participants, RSVP status */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          {/* Host */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {hostAvatar && <AvatarImage src={hostAvatar} alt={hostName} />}
              <AvatarFallback className="text-[10px]">{hostInitials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {isHost ? 'You' : hostName}
            </span>
            {isHost && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                Host
              </Badge>
            )}
          </div>

          {/* Participants and RSVP */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{table.attendingCount}</span>
            </div>

            {!isHost && table.userRsvpStatus && (
              <Badge
                variant="outline"
                className={cn('text-xs', rsvpConfig.color, rsvpConfig.bgColor)}
              >
                {rsvpConfig.label}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export const TableCard = memo(TableCardComponent)
