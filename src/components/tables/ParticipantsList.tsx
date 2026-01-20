'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Crown, Check, HelpCircle, X, Clock, UserMinus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ParticipantWithProfile, RSVPStatus } from '@/types/tables'

interface ParticipantsListProps {
  participants: ParticipantWithProfile[]
  currentUserId?: string
  isHost?: boolean
  onRemoveParticipant?: (userId: string) => Promise<void>
}

const RSVP_ICONS: Record<RSVPStatus, typeof Check> = {
  attending: Check,
  maybe: HelpCircle,
  declined: X,
  invited: Clock,
}

const RSVP_COLORS: Record<RSVPStatus, string> = {
  attending: 'text-emerald-600 bg-emerald-500/10',
  maybe: 'text-sky-600 bg-sky-500/10',
  declined: 'text-slate-500 bg-slate-500/10',
  invited: 'text-amber-600 bg-amber-500/10',
}

const RSVP_LABELS: Record<RSVPStatus, string> = {
  attending: 'Attending',
  maybe: 'Maybe',
  declined: 'Declined',
  invited: 'Invited',
}

export function ParticipantsList({
  participants,
  currentUserId,
  isHost,
  onRemoveParticipant,
}: ParticipantsListProps) {
  // Group by status - memoized to prevent unnecessary recalculations
  const { attending, maybe, invited, declined } = useMemo(
    () => ({
      attending: participants.filter((p) => p.rsvpStatus === 'attending'),
      maybe: participants.filter((p) => p.rsvpStatus === 'maybe'),
      invited: participants.filter((p) => p.rsvpStatus === 'invited'),
      declined: participants.filter((p) => p.rsvpStatus === 'declined'),
    }),
    [participants]
  )

  const renderParticipant = (participant: ParticipantWithProfile) => {
    const { user, isHost: participantIsHost, rsvpStatus } = participant
    const displayName = user.displayName || user.username || 'Unknown'
    const avatar = user.customAvatarUrl || user.avatarUrl
    const initials = displayName.slice(0, 2).toUpperCase()
    const Icon = RSVP_ICONS[rsvpStatus]
    const isCurrentUser = user.id === currentUserId

    return (
      <div
        key={participant.id}
        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <Link
          href={`/u/${user.username}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <Avatar className="h-9 w-9">
            {avatar && <AvatarImage src={avatar} alt={displayName} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {isCurrentUser ? 'You' : displayName}
              </span>
              {participantIsHost && (
                <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              )}
            </div>
            {user.username && !isCurrentUser && (
              <span className="text-xs text-muted-foreground">@{user.username}</span>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn('text-xs', RSVP_COLORS[rsvpStatus])}
          >
            <Icon className="h-3 w-3 mr-1" />
            {RSVP_LABELS[rsvpStatus]}
          </Badge>

          {/* Remove button (host only, can't remove self) */}
          {isHost && !participantIsHost && !isCurrentUser && onRemoveParticipant && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.preventDefault()
                onRemoveParticipant(user.id)
              }}
            >
              <UserMinus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  const renderGroup = (title: string, items: ParticipantWithProfile[], showIfEmpty = false) => {
    if (items.length === 0 && !showIfEmpty) return null

    return (
      <div className="space-y-1">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pt-2">
          {title} ({items.length})
        </h4>
        {items.length > 0 ? (
          items.map(renderParticipant)
        ) : (
          <p className="text-sm text-muted-foreground px-3 py-2">No one yet</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {renderGroup('Attending', attending, true)}
      {renderGroup('Maybe', maybe)}
      {renderGroup('Invited', invited)}
      {renderGroup('Declined', declined)}
    </div>
  )
}
