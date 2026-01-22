'use client'

import { useMemo, useCallback, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Star, Sparkles, HelpCircle, Plus, Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaxonomySuggestion } from '@/types/database'
import type { SelectedTaxonomyItem } from '@/lib/admin/wizard'

interface TaxonomyItem {
  id: string
  name: string
  description: string | null
  icon?: string | null
}

type TaxonomyType = 'category' | 'mechanic' | 'theme' | 'player_experience'

interface NewTaxonomyCreateResult {
  id: string
  name: string
  slug: string
}

interface TaxonomySelectorProps<T extends TaxonomyItem> {
  items: T[]
  selected: SelectedTaxonomyItem[]
  suggestions?: TaxonomySuggestion[]
  onChange: (selected: SelectedTaxonomyItem[]) => void
  onNewTaxonomyCreated?: (item: NewTaxonomyCreateResult) => void
  type: TaxonomyType
  allowPrimary?: boolean
  className?: string
  gameId?: string
}

function getTypeLabel(type: TaxonomyType): string {
  switch (type) {
    case 'category': return 'categories'
    case 'mechanic': return 'mechanics'
    case 'theme': return 'themes'
    case 'player_experience': return 'player experiences'
  }
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
  suggestions = [],
  onChange,
  onNewTaxonomyCreated,
  type,
  allowPrimary = true,
  className,
  gameId,
}: TaxonomySelectorProps<T>) {
  const [creatingId, setCreatingId] = useState<string | null>(null)
  const [slugInputs, setSlugInputs] = useState<Record<string, string>>({})
  const [rejectedSuggestionIds, setRejectedSuggestionIds] = useState<Set<string>>(new Set())
  // Memoize suggestion map - only recalculate when suggestions or type change
  const suggestionMap = useMemo(() => new Map(
    suggestions
      .filter(s => s.suggestion_type === type && s.target_id)
      .map(s => [s.target_id!, s])
  ), [suggestions, type])

  // Memoize selected state lookups - create a Set for O(1) lookups
  const selectedIds = useMemo(() => new Set(selected.map(s => s.id)), [selected])
  const primaryId = useMemo(() => selected.find(s => s.isPrimary)?.id, [selected])

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])
  const isPrimary = useCallback((id: string) => id === primaryId, [primaryId])

  // Memoize handlers
  const handleToggle = useCallback((id: string) => {
    if (selectedIds.has(id)) {
      onChange(selected.filter(s => s.id !== id))
    } else {
      onChange([...selected, { id, isPrimary: false }])
    }
  }, [selectedIds, selected, onChange])

  const handleSetPrimary = useCallback((id: string) => {
    onChange(
      selected.map(s => ({
        ...s,
        isPrimary: s.id === id,
      }))
    )
  }, [selected, onChange])

  // Memoize sorted items - only recalculate when items or suggestionMap change
  const sortedItems = useMemo(() => [...items].sort((a, b) => {
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
  }), [items, suggestionMap])

  // Memoize filtered item lists
  const suggestedItems = useMemo(
    () => sortedItems.filter(item => suggestionMap.has(item.id)),
    [sortedItems, suggestionMap]
  )
  const otherItems = useMemo(
    () => sortedItems.filter(item => !suggestionMap.has(item.id)),
    [sortedItems, suggestionMap]
  )

  // Filter new taxonomy suggestions for this type
  const newTaxonomySuggestionType = type === 'theme' ? 'new_theme' : type === 'player_experience' ? 'new_experience' : null
  const newSuggestions = useMemo(
    () => suggestions.filter(s =>
      s.suggestion_type === newTaxonomySuggestionType &&
      s.status === 'pending' &&
      !rejectedSuggestionIds.has(s.id)
    ),
    [suggestions, newTaxonomySuggestionType, rejectedSuggestionIds]
  )

  // Handle creating new taxonomy from suggestion
  const handleCreateAndApply = useCallback(async (suggestion: TaxonomySuggestion) => {
    if (!gameId || !suggestion.suggested_name) return

    const slug = slugInputs[suggestion.id] || suggestion.suggested_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    setCreatingId(suggestion.id)
    try {
      const response = await fetch('/api/admin/games/taxonomy/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          gameId,
          type: type === 'theme' ? 'theme' : 'player_experience',
          name: suggestion.suggested_name,
          description: suggestion.suggested_description,
          slug,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to create taxonomy:', error)
        return
      }

      const result = await response.json()

      // Notify parent of new taxonomy item
      if (onNewTaxonomyCreated && result.item) {
        onNewTaxonomyCreated(result.item)
      }

      // Auto-select the new item
      onChange([...selected, { id: result.item.id, isPrimary: false }])
    } catch (error) {
      console.error('Failed to create taxonomy:', error)
    } finally {
      setCreatingId(null)
    }
  }, [gameId, slugInputs, type, onNewTaxonomyCreated, onChange, selected])

  // Handle rejecting a new taxonomy suggestion
  const handleRejectSuggestion = useCallback(async (suggestionId: string) => {
    try {
      await fetch('/api/admin/games/taxonomy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, status: 'rejected' }),
      })
      setRejectedSuggestionIds(prev => new Set([...prev, suggestionId]))
    } catch (error) {
      console.error('Failed to reject suggestion:', error)
    }
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      {/* AI Suggested Section */}
      {suggestedItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 uppercase tracking-wider text-xs text-primary font-medium">
            <Sparkles className="h-4 w-4" />
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
          <div className="uppercase tracking-wider text-xs text-primary font-medium">
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

      {/* New Taxonomy Suggestions Section */}
      {newSuggestions.length > 0 && (type === 'theme' || type === 'player_experience') && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 uppercase tracking-wider text-xs text-amber-600 dark:text-amber-400 font-medium">
            <Plus className="h-4 w-4" />
            Suggested New {type === 'theme' ? 'Themes' : 'Player Experiences'}
          </div>
          <div className="space-y-2">
            {newSuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-amber-700 dark:text-amber-300">
                        {suggestion.suggested_name}
                      </span>
                      <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                        AI Suggested
                      </Badge>
                    </div>
                    {suggestion.suggested_description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.suggested_description}
                      </p>
                    )}
                    {suggestion.reasoning && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Reasoning: {suggestion.reasoning}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Slug (auto-generated)"
                        value={slugInputs[suggestion.id] || ''}
                        onChange={(e) => setSlugInputs(prev => ({ ...prev, [suggestion.id]: e.target.value }))}
                        className="h-8 text-sm max-w-[200px]"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateAndApply(suggestion)}
                        disabled={creatingId === suggestion.id}
                        className="h-8 text-xs"
                      >
                        {creatingId === suggestion.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Create & Apply
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRejectSuggestion(suggestion.id)}
                        className="h-8 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No {getTypeLabel(type)} available</p>
        </div>
      )}
    </div>
  )
}
