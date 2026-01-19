'use client'

import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import {
  Users,
  Calendar,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TableCard as TableCardType } from '@/types/tables'

interface FriendsTablesSectionProps {
  tables: TableCardType[]
  currentUserId: string
}

export function FriendsTablesSection({ tables, currentUserId }: FriendsTablesSectionProps) {
  if (tables.length === 0) return null

  return (
    <div className="mt-10 pt-8 border-t border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">From Your Friends</h2>
            <p className="text-sm text-muted-foreground">
              Tables your friends are hosting
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tables/discover">
            See all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.slice(0, 3).map((table) => (
          <FriendTableCard key={table.tableId} table={table} />
        ))}
      </div>
    </div>
  )
}

interface FriendTableCardProps {
  table: TableCardType
}

function FriendTableCard({ table }: FriendTableCardProps) {
  const scheduledDate = new Date(table.scheduledAt)
  const spotsLeft = table.participantCount && table.attendingCount
    ? (table.participantCount - table.attendingCount)
    : null

  return (
    <Link
      href={`/tables/${table.tableId}`}
      className={cn(
        'group block p-4 rounded-xl border border-border/50 bg-card/50',
        'hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all'
      )}
    >
      {/* Host info */}
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="h-8 w-8">
          {(table.hostCustomAvatarUrl || table.hostAvatarUrl) && (
            <AvatarImage
              src={table.hostCustomAvatarUrl || table.hostAvatarUrl || ''}
              alt={table.hostDisplayName || table.hostUsername || 'Host'}
            />
          )}
          <AvatarFallback className="text-xs">
            {(table.hostDisplayName || table.hostUsername || 'H').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {table.hostDisplayName || table.hostUsername}
          </p>
          <p className="text-xs text-muted-foreground">is hosting</p>
        </div>
        <Badge variant="secondary" className="flex-shrink-0 bg-primary/10 text-primary text-xs">
          Friend
        </Badge>
      </div>

      {/* Game & table info */}
      <div className="flex gap-3">
        <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {table.gameThumbnailUrl ? (
            <Image
              src={table.gameThumbnailUrl}
              alt={table.gameName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
            {table.title || table.gameName}
          </h3>
          {table.title && (
            <p className="text-xs text-muted-foreground truncate">{table.gameName}</p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{format(scheduledDate, 'EEE, MMM d')} at {format(scheduledDate, 'h:mm a')}</span>
        </div>
        {table.locationName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{table.locationName}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{table.attendingCount} attending</span>
          </div>
          {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 3 && (
            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600">
              {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
            </Badge>
          )}
        </div>
      </div>
    </Link>
  )
}
