'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Star, Sparkles, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Theme, PlayerExperience, TaxonomySuggestion } from '@/types/database'

interface TaxonomyItem {
  id: string
  name: string
  description: string | null
  icon?: string | null
}

interface SelectedItem {
  id: string
  isPrimary: boolean
}

interface TaxonomySelectorProps<T extends TaxonomyItem> {
  items: T[]
  selected: SelectedItem[]
  suggestions: TaxonomySuggestion[]
  onChange: (selected: SelectedItem[]) => void
  type: 'theme' | 'player_experience'
  allowPrimary?: boolean
  className?: string
}

function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 0.8) return { label: 'High', color: 'text-green-600 dark:text-green-400' }
  if (confidence >= 0.5) return { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' }
  return { label: 'Low', color: 'text-orange-600 dark:text-orange-400' }
}

function getConfidencePercent(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

export function TaxonomySelector<T extends TaxonomyItem>({
  items,
  selected,
  suggestions,
  onChange,
  type,
  allowPrimary = true,
  className,
}: TaxonomySelectorProps<T>) {
  const suggestionMap = new Map(
    suggestions
      .filter(s => s.suggestion_type === type && s.target_id)
      .map(s => [s.target_id!, s])
  )

  const isSelected = (id: string) => selected.some(s => s.id === id)
  const isPrimary = (id: string) => selected.find(s => s.id === id)?.isPrimary ?? false

  const handleToggle = (id: string) => {
    if (isSelected(id)) {
      onChange(selected.filter(s => s.id !== id))
    } else {
      onChange([...selected, { id, isPrimary: false }])
    }
  }

  const handleSetPrimary = (id: string) => {
    onChange(
      selected.map(s => ({
        ...s,
        isPrimary: s.id === id,
      }))
    )
  }

  // Sort items: AI-suggested first (by confidence), then alphabetically
  const sortedItems = [...items].sort((a, b) => {
    const aSuggestion = suggestionMap.get(a.id)
    const bSuggestion = suggestionMap.get(b.id)

    // AI suggestions come first
    if (aSuggestion && !bSuggestion) return -1
    if (!aSuggestion && bSuggestion) return 1

    // Among AI suggestions, sort by confidence
    if (aSuggestion && bSuggestion) {
      return (bSuggestion.confidence ?? 0) - (aSuggestion.confidence ?? 0)
    }

    // Non-suggestions sorted alphabetically
    return a.name.localeCompare(b.name)
  })

  const suggestedItems = sortedItems.filter(item => suggestionMap.has(item.id))
  const otherItems = sortedItems.filter(item => !suggestionMap.has(item.id))

  return (
    <div className={cn('space-y-4', className)}>
      {/* AI Suggested Section */}
      {suggestedItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Suggested
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestedItems.map(item => {
              const suggestion = suggestionMap.get(item.id)!
              const checked = isSelected(item.id)
              const primary = isPrimary(item.id)
              const confidence = suggestion.confidence ?? 0

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                    checked
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <Checkbox
                    id={`${type}-${item.id}`}
                    checked={checked}
                    onCheckedChange={() => handleToggle(item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label
                        htmlFor={`${type}-${item.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {item.name}
                      </Label>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          getConfidenceLabel(confidence).color
                        )}
                      >
                        AI {getConfidencePercent(confidence)}
                      </Badge>
                      {allowPrimary && checked && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(item.id)}
                          className={cn(
                            'flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors',
                            primary
                              ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                              : 'text-muted-foreground hover:text-yellow-600 hover:bg-yellow-500/10'
                          )}
                        >
                          <Star className={cn('h-3 w-3', primary && 'fill-current')} />
                          Primary
                        </button>
                      )}
                    </div>
                    {suggestion.reasoning && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 cursor-help">
                              {suggestion.reasoning}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-sm">
                            <p className="text-sm">{suggestion.reasoning}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Items Section */}
      {otherItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            {suggestedItems.length > 0 ? 'Other Options' : 'Available Options'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {otherItems.map(item => {
              const checked = isSelected(item.id)
              const primary = isPrimary(item.id)

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border transition-colors',
                    checked
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <Checkbox
                    id={`${type}-${item.id}`}
                    checked={checked}
                    onCheckedChange={() => handleToggle(item.id)}
                  />
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <Label
                      htmlFor={`${type}-${item.id}`}
                      className="text-sm cursor-pointer truncate"
                    >
                      {item.name}
                    </Label>
                    {allowPrimary && checked && primary && (
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                    )}
                  </div>
                  {allowPrimary && checked && !primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(item.id)}
                      className="text-muted-foreground hover:text-yellow-600 transition-colors"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No {type === 'theme' ? 'themes' : 'player experiences'} available</p>
        </div>
      )}
    </div>
  )
}
