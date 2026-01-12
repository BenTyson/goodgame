'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { VIBE_COLORS, type ShelfStatus } from '@/types/database'

// Simplified shelf status options for the dialog
const SHELF_OPTIONS: { value: ShelfStatus; label: string }[] = [
  { value: 'played', label: 'Played' },
  { value: 'owned', label: 'Owned' },
  { value: 'want_to_play', label: 'Want' },
  { value: 'wishlist', label: 'Wishlist' },
]

interface RatingFollowUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rating: number
  gameName: string
  currentShelfStatus?: ShelfStatus | null
  currentThoughts?: string | null
  onSave: (data: { shelfStatus: ShelfStatus; thoughts: string | null }) => Promise<void>
  onSkip: () => void
  onDelete?: () => Promise<void>
  isEditing?: boolean
}

export function RatingFollowUpDialog({
  open,
  onOpenChange,
  rating,
  gameName,
  currentShelfStatus,
  currentThoughts,
  onSave,
  onSkip,
  onDelete,
  isEditing = false,
}: RatingFollowUpDialogProps) {
  const [shelfStatus, setShelfStatus] = useState<ShelfStatus>(currentShelfStatus || 'played')
  const [thoughts, setThoughts] = useState(currentThoughts || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Sync state when dialog opens with new values
  useEffect(() => {
    if (open) {
      setShelfStatus(currentShelfStatus || 'played')
      setThoughts(currentThoughts || '')
    }
  }, [open, currentShelfStatus, currentThoughts])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        shelfStatus,
        thoughts: thoughts.trim() || null,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    onSkip()
    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const colorConfig = VIBE_COLORS[rating] || VIBE_COLORS[7]
  const isProcessing = isSaving || isDeleting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="sr-only">Rating saved</DialogTitle>
          <DialogDescription className="sr-only">
            Optionally add more details about your rating
          </DialogDescription>

          {/* Rating display */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <span className="text-lg text-muted-foreground">You rated this</span>
            <span
              className={cn(
                'inline-flex items-center justify-center w-16 h-16 rounded-full text-3xl font-bold',
                colorConfig.bg,
                colorConfig.text
              )}
            >
              {rating}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Shelf status selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Add to your shelf:
            </label>
            <div className="flex flex-wrap gap-2">
              {SHELF_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setShelfStatus(option.value)}
                  disabled={isProcessing}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer',
                    'border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    shelfStatus === option.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-foreground border-border hover:bg-muted',
                    isProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Thoughts textarea */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Share your thoughts (optional):
            </label>
            <Textarea
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              placeholder={`What did you think about ${gameName}?`}
              className="resize-none min-h-[100px]"
              disabled={isProcessing}
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          {isEditing && onDelete ? (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={isProcessing}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isProcessing}
            className="flex-1"
          >
            {isEditing ? 'Cancel' : 'Skip'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isProcessing}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
