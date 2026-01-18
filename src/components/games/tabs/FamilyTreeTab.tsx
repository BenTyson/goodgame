'use client'

import { FamilyTreeDiagram, TreeErrorBoundary } from '@/components/family-tree'
import type { Game, GameFamily, GameRelation } from '@/types/database'

export interface FamilyTreeTabProps {
  currentGameId: string
  family: GameFamily
  games: Game[]
  relations: GameRelation[]
  baseGameId: string | null
}

/**
 * Tab component for displaying a game's family tree.
 * Shows a visual diagram of related games in the same family.
 */
export function FamilyTreeTab({
  currentGameId,
  family,
  games,
  relations,
  baseGameId,
}: FamilyTreeTabProps) {
  return (
    <TreeErrorBoundary fallbackMessage="Unable to render family tree">
      <FamilyTreeDiagram
        games={games}
        relations={relations}
        baseGameId={baseGameId}
        familyId={family.id}
        variant="public"
        selectedGameId={currentGameId}
        familyInfo={{
          name: family.name,
          slug: family.slug,
          description: family.description,
        }}
      />
    </TreeErrorBoundary>
  )
}
