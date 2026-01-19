'use client'

import { Star, ThumbsUp, ThumbsDown, Users, Sparkles, Quote } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { TableRecap, ParticipantWithProfile } from '@/types/tables'

interface TableRecapViewProps {
  recap: TableRecap
  participants: ParticipantWithProfile[]
  className?: string
}

export function TableRecapView({ recap, participants, className }: TableRecapViewProps) {
  const attendees = participants.filter((p) => p.attended === true)

  return (
    <div className={cn('rounded-xl border border-border/50 bg-card/50', className)}>
      <div className="p-4 border-b border-border/50">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Session Recap
        </h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Rating section */}
        <div className="flex flex-wrap items-center gap-4">
          {recap.experienceRating && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-5 w-5',
                    star <= recap.experienceRating!
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-muted-foreground/30'
                  )}
                />
              ))}
            </div>
          )}
          <Badge
            variant="outline"
            className={cn(
              recap.wouldPlayAgain
                ? 'border-emerald-500/50 text-emerald-600'
                : 'border-slate-500/50 text-slate-500'
            )}
          >
            {recap.wouldPlayAgain ? (
              <>
                <ThumbsUp className="h-3 w-3 mr-1" />
                Would play again
              </>
            ) : (
              <>
                <ThumbsDown className="h-3 w-3 mr-1" />
                Might not play again
              </>
            )}
          </Badge>
        </div>

        {/* Highlights */}
        {recap.highlights && (
          <div className="relative pl-6">
            <Quote className="absolute left-0 top-0 h-4 w-4 text-muted-foreground" />
            <p className="text-sm italic text-muted-foreground">
              {recap.highlights}
            </p>
          </div>
        )}

        {/* Host notes */}
        {recap.hostNotes && (
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Host Notes</p>
            <p className="text-sm">{recap.hostNotes}</p>
          </div>
        )}

        {/* Attendees */}
        {attendees.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Attended ({attendees.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {attendees.map((attendee) => {
                const displayName =
                  attendee.user.displayName || attendee.user.username || 'User'
                const avatar =
                  attendee.user.customAvatarUrl || attendee.user.avatarUrl
                const initials = displayName.slice(0, 2).toUpperCase()

                return (
                  <div
                    key={attendee.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-full bg-accent/50"
                  >
                    <Avatar className="h-6 w-6">
                      {avatar && <AvatarImage src={avatar} alt={displayName} />}
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{displayName}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Created timestamp */}
        <p className="text-xs text-muted-foreground">
          Recap created {formatDistanceToNow(new Date(recap.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
