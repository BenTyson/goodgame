'use client'

import { useState } from 'react'
import { RefreshCw, Loader2, Zap, Brain, Gem } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type ContentType = 'rules' | 'setup' | 'reference'
type ModelType = 'haiku' | 'sonnet' | 'opus'

const MODEL_OPTIONS: { value: ModelType; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'haiku', label: 'Haiku', description: 'Fast, good for testing', icon: Zap },
  { value: 'sonnet', label: 'Sonnet', description: 'Balanced (recommended)', icon: Brain },
  { value: 'opus', label: 'Opus', description: 'Best quality', icon: Gem },
]

export interface RegenerateButtonProps {
  contentType: ContentType
  gameId: string
  onComplete: () => void
  disabled?: boolean
}

/**
 * Button with model selector popover for regenerating AI content.
 * Shows a dropdown to select the model before triggering regeneration.
 */
export function RegenerateButton({
  contentType,
  gameId,
  onComplete,
  disabled,
}: RegenerateButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegenerate = async (model: ModelType) => {
    setIsRegenerating(true)
    setError(null)
    setIsOpen(false)

    try {
      const response = await fetch('/api/admin/rulebook/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          contentTypes: [contentType],
          model,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Regeneration failed')
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate')
    } finally {
      setIsRegenerating(false)
    }
  }

  if (isRegenerating) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Regenerating...
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-48 p-2"
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-2 pb-1">
              Select model
            </p>
            {MODEL_OPTIONS.map((option) => {
              const OptionIcon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => handleRegenerate(option.value)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-left"
                >
                  <OptionIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {option.value === 'sonnet' && '(rec)'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
