import type { Game, GameRelation, RelationType } from '@/types/database'

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

// Relation type config for visual styling
export const RELATION_CONFIG: Record<RelationType, {
  label: string
  color: string
}> = {
  expansion_of: {
    label: 'Expansion',
    color: 'text-blue-600',
  },
  base_game_of: {
    label: 'Base Game',
    color: 'text-amber-600',
  },
  sequel_to: {
    label: 'Sequel',
    color: 'text-green-600',
  },
  prequel_to: {
    label: 'Prequel',
    color: 'text-purple-600',
  },
  reimplementation_of: {
    label: 'Reimplementation',
    color: 'text-orange-600',
  },
  spin_off_of: {
    label: 'Spin-off',
    color: 'text-pink-600',
  },
  standalone_in_series: {
    label: 'Standalone',
    color: 'text-cyan-600',
  },
}
