'use client'

import { forwardRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TreeNodeProps } from './types'
import { RELATION_STYLES, getGameThumbnail, NODE_WIDTH, NODE_HEIGHT } from './types'

export const TreeNode = forwardRef<HTMLDivElement, TreeNodeProps>(
  function TreeNode({ node, isBase, variant = 'admin', onClick, isSelected }, ref) {
    const { game, relationType } = node
    const thumbnail = getGameThumbnail(game)

    // Get styling based on relation type
    const style = isBase
      ? RELATION_STYLES.base
      : relationType
        ? RELATION_STYLES[relationType]
        : RELATION_STYLES.expansion_of

    const nodeContent = (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center gap-1 p-2 rounded-lg bg-card transition-all',
          style.borderClass,
          isSelected && 'ring-2 ring-primary',
          onClick && 'cursor-pointer hover:shadow-md',
          'relative'
        )}
        style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
        onClick={() => onClick?.(game)}
        data-game-id={game.id}
      >
        {/* Game Image */}
        <div className="relative w-full aspect-[4/3] rounded overflow-hidden bg-muted">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={game.name}
              fill
              className="object-cover"
              sizes={`${NODE_WIDTH}px`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Game Name */}
        <div className="w-full text-center">
          <p className="text-xs font-medium leading-tight line-clamp-2" title={game.name}>
            {game.name}
          </p>
          {game.year_published && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {game.year_published}
            </p>
          )}
        </div>

        {/* Relation Badge (for non-base games) */}
        {!isBase && relationType && (
          <span
            className={cn(
              'absolute -top-2 -right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded',
              'bg-background border shadow-sm',
              relationType === 'expansion_of' && 'text-blue-600 border-blue-300',
              relationType === 'sequel_to' && 'text-green-600 border-green-300',
              relationType === 'prequel_to' && 'text-purple-600 border-purple-300',
              relationType === 'standalone_in_series' && 'text-cyan-600 border-cyan-300',
              relationType === 'spin_off_of' && 'text-pink-600 border-pink-300',
              relationType === 'reimplementation_of' && 'text-orange-600 border-orange-300',
            )}
          >
            {style.shortLabel}
          </span>
        )}

        {/* Base badge */}
        {isBase && (
          <span className="absolute -top-2 -right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300 shadow-sm dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700">
            Base
          </span>
        )}
      </div>
    )

    // In admin variant, wrap with link to game editor
    if (variant === 'admin') {
      return (
        <div className="relative group">
          {nodeContent}
          <Link
            href={`/admin/games/${game.id}`}
            className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-background/80 hover:bg-background"
            title="Edit game"
          >
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )
    }

    // In public variant, wrap with link to game page
    if (variant === 'public' && game.slug) {
      return (
        <Link href={`/games/${game.slug}`} className="block">
          {nodeContent}
        </Link>
      )
    }

    return nodeContent
  }
)
