'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Star,
  Loader2,
  Users,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import type { ParticipantWithProfile } from '@/types/tables'

interface TableRecapFormProps {
  tableId: string
  participants: ParticipantWithProfile[]
  gameName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function TableRecapForm({
  tableId,
  participants,
  gameName,
  open,
  onOpenChange,
  onComplete,
}: TableRecapFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<'attendance' | 'rating' | 'notes'>('attendance')
  const [attendeeIds, setAttendeeIds] = useState<string[]>(
    // Pre-select those who RSVP'd attending
    participants
      .filter((p) => p.rsvpStatus === 'attending')
      .map((p) => p.userId)
  )
  const [experienceRating, setExperienceRating] = useState<number | null>(null)
  const [wouldPlayAgain, setWouldPlayAgain] = useState<boolean | null>(null)
  const [hostNotes, setHostNotes] = useState('')
  const [highlights, setHighlights] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggleAttendee = (userId: string) => {
    setAttendeeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      const response = await fetch(`/api/tables/${tableId}/recap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostNotes: hostNotes.trim() || null,
          highlights: highlights.trim() || null,
          experienceRating,
          wouldPlayAgain: wouldPlayAgain ?? true,
          attendeeIds,
        }),
      })

      if (response.ok) {
        onOpenChange(false)
        onComplete?.()
        router.refresh()
      }
    } catch (error) {
      console.error('Error submitting recap:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 'attendance':
        return attendeeIds.length > 0
      case 'rating':
        return experienceRating !== null && wouldPlayAgain !== null
      case 'notes':
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (step === 'attendance') setStep('rating')
    else if (step === 'rating') setStep('notes')
    else handleSubmit()
  }

  const prevStep = () => {
    if (step === 'notes') setStep('rating')
    else if (step === 'rating') setStep('attendance')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Table Recap
          </DialogTitle>
          <DialogDescription>
            {step === 'attendance' && 'Who showed up to play?'}
            {step === 'rating' && 'How was the experience?'}
            {step === 'notes' && 'Any notes or highlights?'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {['attendance', 'rating', 'notes'].map((s, i) => (
            <div
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                (s === step || ['attendance', 'rating', 'notes'].indexOf(step) > i)
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Step 1: Attendance */}
        {step === 'attendance' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select everyone who attended the session:
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {participants.map((participant) => {
                const isSelected = attendeeIds.includes(participant.userId)
                const displayName =
                  participant.user.displayName || participant.user.username || 'User'
                const avatar =
                  participant.user.customAvatarUrl || participant.user.avatarUrl
                const initials = displayName.slice(0, 2).toUpperCase()

                return (
                  <div
                    key={participant.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:bg-accent/50'
                    )}
                    onClick={() => toggleAttendee(participant.userId)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleAttendee(participant.userId)}
                    />
                    <Avatar className="h-9 w-9">
                      {avatar && <AvatarImage src={avatar} alt={displayName} />}
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{displayName}</p>
                      {participant.isHost && (
                        <p className="text-xs text-muted-foreground">Host</p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              <Users className="h-4 w-4 inline-block mr-1" />
              {attendeeIds.length} attendee{attendeeIds.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Step 2: Rating */}
        {step === 'rating' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium">How was the session?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setExperienceRating(rating)}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      experienceRating === rating
                        ? 'bg-primary/10 scale-110'
                        : 'hover:bg-accent'
                    )}
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        experienceRating && rating <= experienceRating
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-muted-foreground'
                      )}
                    />
                  </button>
                ))}
              </div>
              {experienceRating && (
                <p className="text-center text-sm text-muted-foreground">
                  {experienceRating === 1 && 'Not great'}
                  {experienceRating === 2 && 'Could be better'}
                  {experienceRating === 3 && 'Pretty good'}
                  {experienceRating === 4 && 'Great time!'}
                  {experienceRating === 5 && 'Amazing!'}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Would you play {gameName} again?</p>
              <div className="flex justify-center gap-4">
                <Button
                  variant={wouldPlayAgain === true ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setWouldPlayAgain(true)}
                  className="flex-1"
                >
                  <ThumbsUp className="h-5 w-5 mr-2" />
                  Yes!
                </Button>
                <Button
                  variant={wouldPlayAgain === false ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setWouldPlayAgain(false)}
                  className="flex-1"
                >
                  <ThumbsDown className="h-5 w-5 mr-2" />
                  Maybe not
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Notes */}
        {step === 'notes' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Highlights (optional)</label>
              <Textarea
                placeholder="What were the best moments?"
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Any other notes about the session?"
                value={hostNotes}
                onChange={(e) => setHostNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button
            variant="ghost"
            onClick={step === 'attendance' ? () => onOpenChange(false) : prevStep}
            disabled={submitting}
          >
            {step === 'attendance' ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={nextStep}
            disabled={!canProceed() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : step === 'notes' ? (
              'Complete Recap'
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
