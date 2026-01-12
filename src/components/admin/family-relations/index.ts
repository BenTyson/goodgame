// Main component
export { FamilyRelationsManager } from './FamilyRelationsManager'

// Backwards compatibility alias
export { FamilyRelationsManager as FamilyTreeView } from './FamilyRelationsManager'

// Sub-components (for advanced usage)
export { UnlinkedGamesCard } from './UnlinkedGamesCard'
export { ManageRelationsTable } from './ManageRelationsTable'
export { RelationDialog } from './RelationDialog'

// Hooks
export { useOrphanGames } from './use-orphan-games'
export { useRelationActions } from './use-relation-actions'

// Types and constants
export type { FamilyRelationsManagerProps, TreeNode } from './types'
export { ASSIGNABLE_RELATION_TYPES, RELATION_CONFIG } from './types'
