'use client'

import { Cpu, Zap, Sparkles, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ModelType = 'haiku' | 'sonnet' | 'opus'

const MODEL_CONFIG: Record<ModelType, { label: string; description: string; icon: React.ElementType }> = {
  haiku: { label: 'Haiku', description: 'Fast & cheap for testing', icon: Zap },
  sonnet: { label: 'Sonnet', description: 'Balanced quality & speed', icon: Sparkles },
  opus: { label: 'Opus', description: 'Best quality, slower', icon: Brain },
}

export interface ModelSelectorProps {
  value: ModelType
  onChange: (model: ModelType) => void
}

/**
 * AI model selector for content generation.
 * Shows toggle buttons for Haiku, Sonnet, and Opus with descriptions.
 */
export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
      <Cpu className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Model:</span>
      <div className="flex gap-1 bg-muted/50 rounded-md p-0.5">
        {(Object.keys(MODEL_CONFIG) as ModelType[]).map((model) => {
          const config = MODEL_CONFIG[model]
          const Icon = config.icon
          return (
            <Button
              key={model}
              variant="ghost"
              size="sm"
              onClick={() => onChange(model)}
              className={cn(
                'h-7 text-xs gap-1',
                value === model && 'bg-background shadow-sm'
              )}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </Button>
          )
        })}
      </div>
      <span className="text-xs text-muted-foreground ml-auto">
        {MODEL_CONFIG[value].description}
      </span>
    </div>
  )
}
