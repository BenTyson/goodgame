'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, ChevronRight, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTreeLayout } from './use-tree-layout'
import type { FamilyTreeDiagramProps, TreeLayoutNode } from './types'
import { RELATION_STYLES, getGameThumbnail } from './types'

/**
 * Mobile-friendly list view fallback for the family tree
 * Uses indentation instead of graphical connectors
 */
export function FamilyTreeList({
  games,
  relations,
  baseGameId,
  variant = 'admin',
  className,
  onNodeClick,
}: FamilyTreeDiagramProps) {
  const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set([1, 2, 3]))

  const { tiers, baseGame, orphanGames } = useTreeLayout({
    games,
    relations,
    baseGameId,
  })

  const toggleTier = (tier: number) => {
    setExpandedTiers((prev) => {
      const next = new Set(prev)
      if (next.has(tier)) {
        next.delete(tier)
      } else {
        next.add(tier)
      }
      return next
    })
  }

  if (!baseGame || tiers.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <p>No games to display.</p>
      </div>
    )
  }

  // Flatten tiers into a nested list structure
  const tier0 = tiers.find((t) => t.tier === 0)
  const tier1 = tiers.find((t) => t.tier === 1)
  const expansionTiers = tiers.filter((t) => t.tier >= 2)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tier 0: Sequels/Prequels */}
      {tier0 && tier0.nodes.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => toggleTier(0)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {expandedTiers.has(0) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Sequels & Prequels ({tier0.nodes.length})
          </button>
          {expandedTiers.has(0) && (
            <div className="pl-6 space-y-2">
              {tier0.nodes.map((node) => (
                <ListNode
                  key={node.game.id}
                  node={node}
                  variant={variant}
                  onNodeClick={onNodeClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tier 1: Base Game + Variants */}
      {tier1 && (
        <div className="space-y-2">
          {tier1.nodes.map((node) => (
            <ListNode
              key={node.game.id}
              node={node}
              isBase={node.game.id === baseGame.id}
              variant={variant}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}

      {/* Expansion Tiers */}
      {expansionTiers.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => toggleTier(2)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {expandedTiers.has(2) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Expansions ({expansionTiers.reduce((sum, t) => sum + t.nodes.length, 0)})
          </button>
          {expandedTiers.has(2) && (
            <div className="space-y-2">
              {expansionTiers.map((tierData) => (
                <div key={tierData.tier} className="space-y-2" style={{ paddingLeft: (tierData.tier - 1) * 16 }}>
                  {tierData.nodes.map((node) => (
                    <ListNode
                      key={node.game.id}
                      node={node}
                      variant={variant}
                      onNodeClick={onNodeClick}
                      depth={tierData.tier - 1}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orphan Games */}
      {orphanGames.length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Unconnected ({orphanGames.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {orphanGames.map((game) => (
              <span
                key={game.id}
                className="text-sm px-2 py-1 bg-muted rounded"
              >
                {game.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ListNode({
  node,
  isBase,
  variant,
  onNodeClick,
  depth = 0,
}: {
  node: TreeLayoutNode
  isBase?: boolean
  variant: 'admin' | 'public'
  onNodeClick?: (game: import('@/types/database').Game) => void
  depth?: number
}) {
  const { game, relationType } = node
  const thumbnail = getGameThumbnail(game)
  const style = isBase
    ? RELATION_STYLES.base
    : relationType
      ? RELATION_STYLES[relationType]
      : RELATION_STYLES.expansion_of

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors',
        onNodeClick && 'cursor-pointer'
      )}
      onClick={() => onNodeClick?.(game)}
      style={{ marginLeft: depth * 8 }}
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-9 rounded overflow-hidden bg-muted flex-shrink-0">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={game.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Name and Badge */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{game.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {game.year_published && <span>{game.year_published}</span>}
          {game.bgg_id && <span>BGG #{game.bgg_id}</span>}
        </div>
      </div>

      {/* Relation Badge */}
      <span
        className={cn(
          'text-xs font-medium px-2 py-0.5 rounded flex-shrink-0',
          isBase && 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
          !isBase && relationType === 'expansion_of' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
          !isBase && relationType === 'sequel_to' && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
          !isBase && relationType === 'prequel_to' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
          !isBase && relationType === 'standalone_in_series' && 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
          !isBase && relationType === 'spin_off_of' && 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
          !isBase && relationType === 'reimplementation_of' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
        )}
      >
        {style.shortLabel}
      </span>
    </div>
  )

  if (variant === 'admin') {
    return (
      <Link href={`/admin/games/${game.id}`} className="block">
        {content}
      </Link>
    )
  }

  if (variant === 'public' && game.slug) {
    return (
      <Link href={`/games/${game.slug}`} className="block">
        {content}
      </Link>
    )
  }

  return content
}
