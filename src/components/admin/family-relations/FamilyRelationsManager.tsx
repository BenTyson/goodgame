'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useOrphanGames } from './use-orphan-games'
import { useRelationActions } from './use-relation-actions'
import { UnlinkedGamesCard } from './UnlinkedGamesCard'
import { ManageRelationsTable } from './ManageRelationsTable'
import { RelationDialog } from './RelationDialog'
import type { FamilyRelationsManagerProps } from './types'
import type { Game, GameRelation, RelationType } from '@/types/database'

export function FamilyRelationsManager({
  games,
  relations,
  baseGameId,
  familyId,
  onRelationCreated,
}: FamilyRelationsManagerProps) {
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [linkingGame, setLinkingGame] = useState<Game | null>(null)
  const [editingRelation, setEditingRelation] = useState<GameRelation | null>(null)

  // Hooks
  const orphans = useOrphanGames({ games, relations, baseGameId })
  const {
    createRelation,
    updateRelation,
    deleteRelation,
    isCreating,
    isUpdating,
    deletingId,
  } = useRelationActions({ onRelationCreated })

  // Handlers
  const handleLinkGame = useCallback((game: Game) => {
    setLinkingGame(game)
    setEditingRelation(null)
    setDialogMode('create')
    setDialogOpen(true)
  }, [])

  const handleEditRelation = useCallback((relation: GameRelation) => {
    setEditingRelation(relation)
    setLinkingGame(null)
    setDialogMode('edit')
    setDialogOpen(true)
  }, [])

  const handleDialogSubmit = useCallback(async (
    sourceId: string,
    targetId: string,
    relationType: RelationType
  ): Promise<boolean> => {
    if (dialogMode === 'create') {
      return createRelation(sourceId, targetId, relationType)
    } else if (editingRelation) {
      return updateRelation(editingRelation.id, sourceId, targetId, relationType)
    }
    return false
  }, [dialogMode, editingRelation, createRelation, updateRelation])

  const handleDialogClose = useCallback((open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setLinkingGame(null)
      setEditingRelation(null)
    }
  }, [])

  // Empty state
  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No games in this family yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <UnlinkedGamesCard
        orphans={orphans}
        familyId={familyId}
        games={games}
        onLinkGame={handleLinkGame}
        onRelationsCreated={onRelationCreated}
      />

      <ManageRelationsTable
        relations={relations}
        games={games}
        onEdit={handleEditRelation}
        onDelete={deleteRelation}
        deletingId={deletingId}
      />

      <RelationDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        mode={dialogMode}
        games={games}
        sourceGame={linkingGame}
        relation={editingRelation}
        onSubmit={handleDialogSubmit}
        isLoading={isCreating || isUpdating}
      />
    </div>
  )
}
