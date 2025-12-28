'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { RatingInput } from '@/components/shelf/RatingInput'
import { updateReview, updateShelfItem } from '@/lib/supabase/user-queries'

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameName: string
  userGameId: string
  initialReview?: string | null
  initialRating?: number | null
  onSaved?: () => void
}

export function ReviewDialog({
  open,
  onOpenChange,
  gameName,
  userGameId,
  initialReview,
  initialRating,
  onSaved,
}: ReviewDialogProps) {
  const [review, setReview] = React.useState(initialReview || '')
  const [rating, setRating] = React.useState<number | null>(initialRating ?? null)
  const [isSaving, setIsSaving] = React.useState(false)

  // Reset form when dialog opens with new values
  React.useEffect(() => {
    if (open) {
      setReview(initialReview || '')
      setRating(initialRating ?? null)
    }
  }, [open, initialReview, initialRating])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update both review and rating
      await Promise.all([
        updateReview(userGameId, review.trim() || null),
        rating !== initialRating ? updateShelfItem(userGameId, { rating }) : Promise.resolve(),
      ])
      onSaved?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving review:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsSaving(true)
    try {
      await updateReview(userGameId, null)
      setReview('')
      onSaved?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting review:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const hasReview = initialReview && initialReview.trim().length > 0
  const hasChanges = review !== (initialReview || '') || rating !== (initialRating ?? null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{hasReview ? 'Edit Review' : 'Write a Review'}</DialogTitle>
          <DialogDescription>
            Share your thoughts about <span className="font-medium">{gameName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">Your Rating</label>
            <RatingInput
              value={rating}
              onChange={setRating}
              size="lg"
            />
          </div>

          {/* Review text */}
          <div>
            <label className="text-sm font-medium mb-2 block">Review</label>
            <Textarea
              placeholder="What did you think of this game? Share your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {review.length} characters
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {hasReview && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isSaving}
              className="text-destructive hover:text-destructive"
            >
              Delete Review
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
