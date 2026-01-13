import type { Game, GameRelation, RelationType } from '@/types/database'
// Re-export centralized relation config for backwards compatibility
export { RELATION_TYPE_CONFIG as RELATION_CONFIG } from '@/types/database'

// Internal tree node structure for orphan calculation
export interface TreeNode {
  game: Game
  relationType?: RelationType
  children: TreeNode[]
}

// Props for the main FamilyRelationsManager component
export interface FamilyRelationsManagerProps {
  games: Game[]
  relations: GameRelation[]
  baseGameId: string | null
  familyId?: string
  onRelationCreated?: () => void
}

// Relation types available for manual assignment
export const ASSIGNABLE_RELATION_TYPES: { value: RelationType; label: string }[] = [
  { value: 'expansion_of', label: 'Expansion of' },
  { value: 'sequel_to', label: 'Sequel to' },
  { value: 'reimplementation_of', label: 'Reimplementation of' },
  { value: 'spin_off_of', label: 'Spin-off of' },
  { value: 'standalone_in_series', label: 'Standalone in series with' },
]
