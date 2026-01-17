import type { Game, GameRelation, RelationType } from '@/types/database'

// Layout constants
export const NODE_WIDTH = 140
export const NODE_HEIGHT = 120
export const NODE_GAP = 24
export const TIER_GAP = 60
export const MAX_DEPTH = 4

// A node positioned in the tree layout
export interface TreeLayoutNode {
  game: Game
  relationType?: RelationType
  tier: number              // 0 = sequels, 1 = base/variants, 2+ = expansions
  column: number            // horizontal position within tier
  parentId?: string         // for drawing connectors
  lineStyle: 'solid' | 'dashed' | 'dotted'
  x?: number                // calculated pixel position
  y?: number
}

// Tier organization of nodes
export interface TierData {
  tier: number
  nodes: TreeLayoutNode[]
}

// Props for the main diagram component
export interface FamilyTreeDiagramProps {
  games: Game[]
  relations: GameRelation[]
  baseGameId: string | null
  familyId?: string

  // Display options
  variant?: 'admin' | 'public'
  className?: string

  // Interactivity (admin)
  onNodeClick?: (game: Game) => void
  selectedGameId?: string
}

// Props for individual tree node
export interface TreeNodeProps {
  node: TreeLayoutNode
  isBase?: boolean
  variant?: 'admin' | 'public'
  onClick?: (game: Game) => void
  isSelected?: boolean
}

// Props for connector lines
export interface TreeConnectorProps {
  fromX: number
  fromY: number
  toX: number
  toY: number
  lineStyle: 'solid' | 'dashed' | 'dotted'
  relationType?: RelationType
}

// Relation type visual config
export interface RelationStyleConfig {
  label: string
  shortLabel: string
  borderClass: string
  lineColor: string
  dashArray: string
}

// Visual styling for each relation type
export const RELATION_STYLES: Record<RelationType | 'base', RelationStyleConfig> = {
  base: {
    label: 'Base Game',
    shortLabel: 'Base',
    borderClass: 'border-3 border-amber-500 ring-2 ring-amber-400/30',
    lineColor: '#f59e0b',
    dashArray: '',
  },
  expansion_of: {
    label: 'Expansion',
    shortLabel: 'Exp',
    borderClass: 'border-2 border-blue-500/70',
    lineColor: '#3b82f6',
    dashArray: '',
  },
  base_game_of: {
    label: 'Base Game',
    shortLabel: 'Base',
    borderClass: 'border-3 border-amber-500',
    lineColor: '#f59e0b',
    dashArray: '',
  },
  sequel_to: {
    label: 'Sequel',
    shortLabel: 'Seq',
    borderClass: 'border-2 border-green-500/70',
    lineColor: '#22c55e',
    dashArray: '',
  },
  prequel_to: {
    label: 'Prequel',
    shortLabel: 'Preq',
    borderClass: 'border-2 border-purple-500/70',
    lineColor: '#a855f7',
    dashArray: '',
  },
  reimplementation_of: {
    label: 'Reimplementation',
    shortLabel: 'Reimp',
    borderClass: 'border-2 border-dashed border-orange-500/70',
    lineColor: '#f97316',
    dashArray: '4,4',
  },
  spin_off_of: {
    label: 'Spin-off',
    shortLabel: 'Spin',
    borderClass: 'border-2 border-dashed border-pink-500/70',
    lineColor: '#ec4899',
    dashArray: '8,4',
  },
  standalone_in_series: {
    label: 'Standalone',
    shortLabel: 'Stand',
    borderClass: 'border-2 border-dashed border-cyan-500/70',
    lineColor: '#06b6d4',
    dashArray: '8,4',
  },
  promo_of: {
    label: 'Promo',
    shortLabel: 'Promo',
    borderClass: 'border-2 border-dashed border-teal-500/70',
    lineColor: '#14b8a6',
    dashArray: '4,4',
  },
}

// Get the best available thumbnail for a game
export function getGameThumbnail(game: Game): string | null {
  return (
    game.thumbnail_url ||
    game.box_image_url ||
    game.hero_image_url ||
    game.wikidata_image_url ||
    (game.bgg_raw_data as { thumbnail?: string } | null)?.thumbnail ||
    null
  )
}
