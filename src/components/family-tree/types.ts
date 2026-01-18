import type { Game, GameRelation, RelationType } from '@/types/database'

// Layout constants
export const NODE_WIDTH = 140
export const NODE_HEIGHT = 125
export const NODE_GAP = 32
export const TIER_GAP = 72
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

// Family info for subtitle display
export interface FamilyInfo {
  name: string
  slug: string
  description?: string | null
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
  familyInfo?: FamilyInfo

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

// Visual styling for each relation type - rich, saturated colors
export const RELATION_STYLES: Record<RelationType | 'base', RelationStyleConfig> = {
  base: {
    label: 'Base Game',
    shortLabel: 'BASE',
    borderClass: 'border-2 border-amber-400 ring-2 ring-amber-400/30',
    lineColor: '#fbbf24',
    dashArray: '',
  },
  expansion_of: {
    label: 'Expansion',
    shortLabel: 'EXP',
    borderClass: 'border-2 border-blue-500',
    lineColor: '#3b82f6',
    dashArray: '',
  },
  base_game_of: {
    label: 'Base Game',
    shortLabel: 'BASE',
    borderClass: 'border-2 border-amber-400',
    lineColor: '#fbbf24',
    dashArray: '',
  },
  sequel_to: {
    label: 'Sequel',
    shortLabel: 'SEQ',
    borderClass: 'border-2 border-emerald-500',
    lineColor: '#10b981',
    dashArray: '',
  },
  prequel_to: {
    label: 'Prequel',
    shortLabel: 'PREQ',
    borderClass: 'border-2 border-violet-500',
    lineColor: '#8b5cf6',
    dashArray: '',
  },
  reimplementation_of: {
    label: 'Reimplementation',
    shortLabel: 'REIMP',
    borderClass: 'border-2 border-dashed border-orange-500',
    lineColor: '#f97316',
    dashArray: '4,4',
  },
  spin_off_of: {
    label: 'Spin-off',
    shortLabel: 'SPIN',
    borderClass: 'border-2 border-dashed border-pink-500',
    lineColor: '#ec4899',
    dashArray: '8,4',
  },
  standalone_in_series: {
    label: 'Standalone',
    shortLabel: 'STAND',
    borderClass: 'border-2 border-dashed border-cyan-500',
    lineColor: '#06b6d4',
    dashArray: '8,4',
  },
  promo_of: {
    label: 'Promo',
    shortLabel: 'PROMO',
    borderClass: 'border-2 border-dashed border-teal-500',
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
