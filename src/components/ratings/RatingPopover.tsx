'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { VIBE_COLORS } from '@/types/database'

interface RatingPopoverProps {
  value: number | null
  onChange: (rating: number | null) => void
  onRatingSaved?: (rating: number) => void
  disabled?: boolean
  isSaving?: boolean
  className?: string
}

export function RatingPopover({
  value,
  onChange,
  onRatingSaved,
  disabled = false,
  isSaving = false,
  className,
}: RatingPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localValue, setLocalValue] = useState<number>(value ?? 7)

  // Sync local value when popover opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalValue(value ?? 7)
    }
    setIsOpen(open)
  }

  const handleSave = () => {
    onChange(localValue)
    setIsOpen(false)
    // Notify parent that a rating was saved (for follow-up dialog)
    onRatingSaved?.(localValue)
  }

  const handleClear = () => {
    onChange(null)
    setIsOpen(false)
  }

  const colorConfig = VIBE_COLORS[localValue] || VIBE_COLORS[7]

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          className={cn(
            'inline-flex items-center gap-2 text-sm transition-colors',
            'hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-1 -mx-1',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          disabled={disabled}
        >
          {value !== null ? (
            <>
              <span
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold',
                  VIBE_COLORS[value]?.bg || 'bg-muted',
                  VIBE_COLORS[value]?.text || 'text-foreground'
                )}
              >
                {value}
              </span>
              <span className="text-muted-foreground hover:text-foreground">
                Change
              </span>
            </>
          ) : (
            <span className="text-primary font-medium">
              Rate this game
            </span>
          )}
          {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-64" align="start">
        <div className="space-y-4">
          <div className="text-center">
            <span
              className={cn(
                'inline-flex items-center justify-center w-14 h-14 rounded-full text-2xl font-bold transition-colors',
                colorConfig.bg,
                colorConfig.text
              )}
            >
              {localValue}
            </span>
          </div>

          <div className="px-2">
            <Slider
              value={[localValue]}
              onValueChange={([v]) => setLocalValue(v)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
            {value !== null && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClear}
                disabled={isSaving}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
