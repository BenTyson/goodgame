'use client'

import { useState, useEffect } from 'react'
import { Search, GripVertical, X, Plus, Loader2, Trophy } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  saveUserTopGames,
  searchGamesForPicker,
  type TopGameWithDetails,
} from '@/lib/supabase/user-queries'

interface TopGamesEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  initialGames: TopGameWithDetails[]
  onSave: (games: TopGameWithDetails[]) => void
}

interface GameSlot {
  id: string
  position: number
  game: {
    id: string
    name: string
    slug: string
    box_image_url: string | null
    thumbnail_url: string | null
  } | null
}

interface SearchResult {
  id: string
  name: string
  slug: string
  box_image_url: string | null
  thumbnail_url: string | null
  year_published: number | null
}

export function TopGamesEditor({
  open,
  onOpenChange,
  userId,
  initialGames,
  onSave,
}: TopGamesEditorProps) {
  const [slots, setSlots] = useState<GameSlot[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Initialize slots from initial games
  useEffect(() => {
    if (open) {
      const initialSlots: GameSlot[] = Array.from({ length: 10 }, (_, i) => {
        const existingGame = initialGames.find((g) => g.position === i + 1)
        return {
          id: `slot-${i + 1}`,
          position: i + 1,
          game: existingGame ? existingGame.game : null,
        }
      })
      setSlots(initialSlots)
      setSearchQuery('')
      setSearchResults([])
      setActiveSlotId(null)
    }
  }, [open, initialGames])

  // Search for games
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchGamesForPicker(searchQuery)
        // Filter out games already in slots
        const existingGameIds = slots
          .filter((s) => s.game)
          .map((s) => s.game!.id)
        setSearchResults(results.filter((r) => !existingGameIds.includes(r.id)))
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, slots])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSlots((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        // Update positions
        return newItems.map((item, i) => ({ ...item, position: i + 1 }))
      })
    }
  }

  const handleAddGame = (game: SearchResult, slotId: string) => {
    setSlots((items) =>
      items.map((item) =>
        item.id === slotId
          ? {
              ...item,
              game: {
                id: game.id,
                name: game.name,
                slug: game.slug,
                box_image_url: game.box_image_url,
                thumbnail_url: game.thumbnail_url,
              },
            }
          : item
      )
    )
    setSearchQuery('')
    setSearchResults([])
    setActiveSlotId(null)
  }

  const handleRemoveGame = (slotId: string) => {
    setSlots((items) =>
      items.map((item) => (item.id === slotId ? { ...item, game: null } : item))
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Get game IDs in order, filtering out empty slots
      const gameIds = slots.filter((s) => s.game).map((s) => s.game!.id)
      await saveUserTopGames(userId, gameIds)

      // Build the updated games array for the callback
      const updatedGames: TopGameWithDetails[] = slots
        .filter((s) => s.game)
        .map((s, index) => ({
          id: `temp-${index}`, // Will be replaced by actual IDs on next fetch
          position: index + 1,
          game: s.game!,
        }))

      onSave(updatedGames)
      onOpenChange(false)
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const filledSlots = slots.filter((s) => s.game).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Edit Top 10 Games
          </DialogTitle>
          <DialogDescription>
            Drag to reorder. Click an empty slot to add a game.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {/* Search UI (shown when a slot is active) - at top for visibility */}
          {activeSlotId && (
            <div className="mb-4 p-3 border rounded-lg bg-muted/50 sticky top-0 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a game..."
                  className="pl-9"
                  autoFocus
                />
              </div>

              {isSearching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => handleAddGame(game, activeSlotId)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                    >
                      <div className="relative h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        {game.box_image_url || game.thumbnail_url ? (
                          <img
                            src={game.thumbnail_url || game.box_image_url || ''}
                            alt={game.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex items-center justify-center h-full text-sm font-bold text-muted-foreground">
                            {game.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{game.name}</p>
                        {game.year_published && (
                          <p className="text-xs text-muted-foreground">
                            {game.year_published}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No games found
                </p>
              )}
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slots.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {slots.map((slot) => (
                  <SortableSlot
                    key={slot.id}
                    slot={slot}
                    isActive={activeSlotId === slot.id}
                    onActivate={() => setActiveSlotId(slot.id)}
                    onRemove={() => handleRemoveGame(slot.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter className="border-t pt-4 -mx-6 px-6">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {filledSlots} of 10 games selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SortableSlotProps {
  slot: GameSlot
  isActive: boolean
  onActivate: () => void
  onRemove: () => void
}

function SortableSlot({ slot, isActive, onActivate, onRemove }: SortableSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id, disabled: !slot.game })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const medalColors: Record<number, string> = {
    1: 'bg-amber-400 text-amber-900',
    2: 'bg-gray-300 text-gray-700',
    3: 'bg-amber-700 text-amber-100',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border ${
        isActive ? 'border-primary bg-primary/5' : 'border-border'
      } ${slot.game ? 'bg-background' : 'bg-muted/30'}`}
    >
      {/* Position badge */}
      <div
        className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
          medalColors[slot.position] || 'bg-muted text-muted-foreground'
        }`}
      >
        {slot.position}
      </div>

      {slot.game ? (
        <>
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Game info */}
          <div className="relative h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
            {slot.game.box_image_url || slot.game.thumbnail_url ? (
              <img
                src={slot.game.thumbnail_url || slot.game.box_image_url || ''}
                alt={slot.game.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex items-center justify-center h-full text-sm font-bold text-muted-foreground">
                {slot.game.name.charAt(0)}
              </span>
            )}
          </div>
          <span className="flex-1 font-medium truncate">{slot.game.name}</span>

          {/* Remove button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        /* Empty slot */
        <button
          onClick={onActivate}
          className="flex-1 flex items-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add a game</span>
        </button>
      )}
    </div>
  )
}
