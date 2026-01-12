'use client'

import { useState, useEffect, useMemo } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ASSIGNABLE_RELATION_TYPES } from './types'
import type { Game, GameRelation, RelationType } from '@/types/database'

interface RelationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  games: Game[]
  sourceGame?: Game | null
  relation?: GameRelation | null
  onSubmit: (sourceId: string, targetId: string, relationType: RelationType) => Promise<boolean>
  isLoading: boolean
}

export function RelationDialog({
  open,
  onOpenChange,
  mode,
  games,
  sourceGame,
  relation,
  onSubmit,
  isLoading,
}: RelationDialogProps) {
  const [relationType, setRelationType] = useState<RelationType>('expansion_of')
  const [targetId, setTargetId] = useState<string>('')

  // Get source game for display
  const gamesMap = useMemo(() => new Map(games.map(g => [g.id, g])), [games])
  const displaySourceGame = mode === 'create' ? sourceGame : relation ? gamesMap.get(relation.source_game_id) : null

  // Reset form when dialog opens or mode/relation changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && relation) {
        setRelationType(relation.relation_type as RelationType)
        setTargetId(relation.target_game_id)
      } else {
        setRelationType('expansion_of')
        setTargetId('')
      }
    }
  }, [open, mode, relation])

  // Filter out the source game from targets
  const sourceId = mode === 'create' ? sourceGame?.id : relation?.source_game_id
  const potentialTargets = games.filter(g => g.id !== sourceId)

  const handleSubmit = async () => {
    if (!sourceId || !targetId) return

    const success = await onSubmit(sourceId, targetId, relationType)
    if (success) {
      onOpenChange(false)
    }
  }

  const title = mode === 'create' ? 'Link Game to Family Tree' : 'Edit Relation'
  const description = mode === 'create'
    ? `Define how "${displaySourceGame?.name}" relates to another game in this family.`
    : `Change the relationship for "${displaySourceGame?.name}".`
  const submitLabel = mode === 'create' ? 'Create Relation' : 'Update Relation'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{mode === 'create' ? 'This game is a...' : 'Relation Type'}</Label>
            <Select
              value={relationType}
              onValueChange={(v) => setRelationType(v as RelationType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_RELATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Game</Label>
            <Select
              value={targetId}
              onValueChange={setTargetId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a game..." />
              </SelectTrigger>
              <SelectContent>
                {potentialTargets.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name} {game.year_published ? `(${game.year_published})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {displaySourceGame && targetId && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <span className="font-medium">{displaySourceGame.name}</span>
              <span className="text-muted-foreground mx-2">&rarr;</span>
              <span className="text-muted-foreground">
                {ASSIGNABLE_RELATION_TYPES.find(t => t.value === relationType)?.label}
              </span>
              <span className="text-muted-foreground mx-2">&rarr;</span>
              <span className="font-medium">
                {gamesMap.get(targetId)?.name}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!targetId || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
