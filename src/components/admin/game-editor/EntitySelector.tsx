'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown, Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { LinkedEntity } from '@/lib/supabase/game-queries'

export type EntityType = 'designers' | 'publishers' | 'artists'

interface EntitySelectorProps {
  /** Entity type to search/create */
  type: EntityType
  /** Label shown above the selector */
  label: string
  /** Currently selected entities */
  value: LinkedEntity[]
  /** Callback when selection changes */
  onChange: (entities: LinkedEntity[]) => void
  /** Whether multiple selections are allowed */
  multiple?: boolean
  /** Placeholder text when no selection */
  placeholder?: string
}

interface SearchResult {
  id: string
  name: string
  slug: string
}

const TYPE_LABELS: Record<EntityType, { singular: string; plural: string }> = {
  designers: { singular: 'designer', plural: 'designers' },
  publishers: { singular: 'publisher', plural: 'publishers' },
  artists: { singular: 'artist', plural: 'artists' },
}

export function EntitySelector({
  type,
  label,
  value,
  onChange,
  multiple = true,
  placeholder,
}: EntitySelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const typeLabels = TYPE_LABELS[type]

  // Search for entities as user types
  const searchEntities = useCallback(async (searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchQuery.trim()) {
      // Load initial results when query is empty
      setIsSearching(true)
      try {
        const response = await fetch(`/api/admin/entities?type=${type}&limit=20`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.entities || [])
        }
      } catch {
        // Silently fail on initial load
      } finally {
        setIsSearching(false)
      }
      return
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/admin/entities?type=${type}&q=${encodeURIComponent(searchQuery)}&limit=20`
        )
        if (response.ok) {
          const data = await response.json()
          setResults(data.entities || [])
        }
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 200)
  }, [type])

  // Load initial results when popover opens
  useEffect(() => {
    if (open) {
      searchEntities('')
    }
  }, [open, searchEntities])

  // Search when query changes
  useEffect(() => {
    if (open) {
      searchEntities(query)
    }
  }, [query, open, searchEntities])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleSelect = useCallback((entity: SearchResult) => {
    // Check if already selected
    if (value.some(v => v.id === entity.id)) {
      // Remove if clicking again
      onChange(value.filter(v => v.id !== entity.id))
    } else {
      // Add to selection
      const newEntity: LinkedEntity = {
        id: entity.id,
        name: entity.name,
        slug: entity.slug,
        // First selected item is primary (for designers/publishers)
        is_primary: type !== 'artists' && value.length === 0,
      }
      if (multiple) {
        onChange([...value, newEntity])
      } else {
        onChange([newEntity])
        setOpen(false)
      }
    }
    setQuery('')
  }, [value, onChange, multiple, type])

  const handleRemove = useCallback((entityId: string) => {
    const newValue = value.filter(v => v.id !== entityId)
    // If we removed the primary, make the first remaining one primary
    if (newValue.length > 0 && type !== 'artists') {
      const hadPrimary = value.find(v => v.id === entityId)?.is_primary
      if (hadPrimary) {
        newValue[0] = { ...newValue[0], is_primary: true }
      }
    }
    onChange(newValue)
  }, [value, onChange, type])

  const handleCreate = useCallback(async () => {
    if (!query.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name: query.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        handleSelect(data.entity)
      }
    } catch {
      // Handle error silently
    } finally {
      setIsCreating(false)
    }
  }, [query, type, handleSelect])

  // Check if current query matches any existing entity exactly
  const exactMatch = results.find(
    r => r.name.toLowerCase() === query.toLowerCase()
  )

  // Filter out already selected items from results
  const filteredResults = results.filter(
    r => !value.some(v => v.id === r.id)
  )

  const showCreateOption = query.trim() && !exactMatch && !isSearching

  return (
    <div className="space-y-2">
      <label className="uppercase tracking-wider text-xs text-primary">
        {label}
      </label>

      {/* Selected items */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((entity) => (
            <Badge
              key={entity.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {entity.name}
              {entity.is_primary && type !== 'artists' && (
                <span className="text-[10px] text-primary ml-1">(Primary)</span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(entity.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="text-muted-foreground">
              {placeholder || `Search ${typeLabels.plural}...`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${typeLabels.plural}...`}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {isSearching ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Searching...
                </div>
              ) : (
                <>
                  {filteredResults.length === 0 && !showCreateOption && (
                    <CommandEmpty>
                      No {typeLabels.plural} found.
                    </CommandEmpty>
                  )}

                  {filteredResults.length > 0 && (
                    <CommandGroup>
                      {filteredResults.map((entity) => (
                        <CommandItem
                          key={entity.id}
                          value={entity.id}
                          onSelect={() => handleSelect(entity)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              value.some(v => v.id === entity.id)
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {entity.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {showCreateOption && (
                    <CommandGroup>
                      <CommandItem
                        value={`create-${query}`}
                        onSelect={handleCreate}
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Create "{query}"
                      </CommandItem>
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
