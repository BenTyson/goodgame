'use client'

import { X, Play, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { VecnaGame, VecnaFamily } from '@/lib/vecna'

interface BatchActionBarProps {
  selectedGames: VecnaGame[]
  families: VecnaFamily[]
  onClearSelection: () => void
  onStartProcessing: () => void
}

export function BatchActionBar({
  selectedGames,
  families,
  onClearSelection,
  onStartProcessing,
}: BatchActionBarProps) {
  if (selectedGames.length === 0) return null

  // Determine context (same family or mixed)
  const familyIds = new Set<string | null>()
  selectedGames.forEach(game => {
    // Find which family the game belongs to
    const family = families.find(f => f.games.some(g => g.id === game.id))
    familyIds.add(family?.id || null)
  })

  const isSingleFamily = familyIds.size === 1 && !familyIds.has(null)
  const familyName = isSingleFamily
    ? families.find(f => f.id === Array.from(familyIds)[0])?.name
    : null

  // Count games ready to process
  const readyGames = selectedGames.filter(g => g.has_rulebook && !g.is_published)
  const notReadyCount = selectedGames.length - readyGames.length

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'bg-background/95 backdrop-blur-sm border rounded-xl shadow-2xl',
        'px-4 py-3 flex items-center gap-4',
        'animate-in slide-in-from-bottom-5 fade-in duration-200'
      )}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <span className="font-medium tabular-nums">
          {selectedGames.length} game{selectedGames.length !== 1 ? 's' : ''} selected
        </span>
        {familyName && (
          <span className="text-sm text-muted-foreground">
            from {familyName}
          </span>
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Stats */}
      {notReadyCount > 0 && (
        <span className="text-sm text-amber-600 dark:text-amber-400">
          {notReadyCount} need rulebook
        </span>
      )}

      <div className="h-4 w-px bg-border" />

      {/* Actions */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="gap-1.5 text-muted-foreground"
      >
        <X className="h-4 w-4" />
        Clear
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={onStartProcessing}
        disabled={selectedGames.length === 0}
        className="gap-1.5 bg-primary hover:bg-primary/90"
      >
        <Play className="h-4 w-4" />
        Start Processing
        {selectedGames.length > 0 && (
          <span className="ml-1 opacity-70">({selectedGames.length})</span>
        )}
      </Button>
    </div>
  )
}
