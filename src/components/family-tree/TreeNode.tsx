'use client'

import { forwardRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TreeNodeProps } from './types'
import { RELATION_STYLES, getGameThumbnail, NODE_WIDTH, NODE_HEIGHT } from './types'

// Badge color config for glassmorphism effect
const BADGE_COLORS: Record<string, { text: string; glow: string; border: string }> = {
  expansion_of: {
    text: 'text-blue-600 dark:text-blue-400',
    glow: '0 2px 8px rgb(59 130 246 / 0.25)',
    border: 'border-blue-400/50 dark:border-blue-500/50',
  },
  sequel_to: {
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: '0 2px 8px rgb(16 185 129 / 0.25)',
    border: 'border-emerald-400/50 dark:border-emerald-500/50',
  },
  prequel_to: {
    text: 'text-violet-600 dark:text-violet-400',
    glow: '0 2px 8px rgb(139 92 246 / 0.25)',
    border: 'border-violet-400/50 dark:border-violet-500/50',
  },
  standalone_in_series: {
    text: 'text-cyan-600 dark:text-cyan-400',
    glow: '0 2px 8px rgb(6 182 212 / 0.25)',
    border: 'border-cyan-400/50 dark:border-cyan-500/50',
  },
  spin_off_of: {
    text: 'text-pink-600 dark:text-pink-400',
    glow: '0 2px 8px rgb(236 72 153 / 0.25)',
    border: 'border-pink-400/50 dark:border-pink-500/50',
  },
  reimplementation_of: {
    text: 'text-orange-600 dark:text-orange-400',
    glow: '0 2px 8px rgb(249 115 22 / 0.25)',
    border: 'border-orange-400/50 dark:border-orange-500/50',
  },
  promo_of: {
    text: 'text-teal-600 dark:text-teal-400',
    glow: '0 2px 8px rgb(20 184 166 / 0.25)',
    border: 'border-teal-400/50 dark:border-teal-500/50',
  },
}

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

    const badgeColors = relationType ? BADGE_COLORS[relationType] : null

    const nodeContent = (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'group/node relative flex flex-col items-center gap-1.5 p-2.5',
          'rounded-xl bg-card',
          'transition-all duration-300 ease-out',

          // Border styling (not for base game - handled separately)
          !isBase && style.borderClass,

          // Base game special treatment - golden border and ambient glow
          isBase && [
            'border-2 border-amber-400 ring-2 ring-amber-400/30',
            'tree-node--base',
          ],

          // Selection state - multi-layer effect
          isSelected && [
            'ring-2 ring-primary ring-offset-2 ring-offset-background',
            'scale-[1.02]',
            'tree-node--selected',
          ],

          // Interactive styles
          onClick && [
            'cursor-pointer',
            'hover:-translate-y-1',
            'hover:border-primary/60',
          ]
        )}
        style={{
          width: NODE_WIDTH,
          minHeight: NODE_HEIGHT,
          boxShadow: isSelected
            ? 'var(--shadow-card-hover)'
            : 'var(--shadow-card)',
        }}
        onClick={() => onClick?.(game)}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
          }
        }}
        onMouseLeave={(e) => {
          if (onClick && !isSelected) {
            e.currentTarget.style.boxShadow = 'var(--shadow-card)'
          }
        }}
        data-game-id={game.id}
      >
        {/* Game Image */}
        <div
          className={cn(
            'relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted',
            'ring-1 ring-inset ring-black/5 dark:ring-white/5',
            'transition-transform duration-300',
            onClick && 'group-hover/node:scale-[1.02]'
          )}
        >
          {thumbnail ? (
            <>
              <Image
                src={thumbnail}
                alt={game.name}
                fill
                className="object-cover transition-transform duration-300 group-hover/node:scale-105"
                sizes={`${NODE_WIDTH}px`}
              />
              {/* Gradient overlay on hover for polish */}
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-t from-black/20 to-transparent',
                  'opacity-0 transition-opacity duration-300',
                  onClick && 'group-hover/node:opacity-100'
                )}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Game Name */}
        <div className="w-full text-center mt-0.5">
          <p
            className="text-xs font-medium leading-tight line-clamp-2"
            title={game.name}
          >
            {game.name}
          </p>
          {game.year_published && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {game.year_published}
            </p>
          )}
        </div>

        {/* Relation Badge (for non-base games) - Glassmorphism style */}
        {!isBase && relationType && badgeColors && (
          <span
            className={cn(
              'absolute -top-2.5 -right-2.5',
              'text-[9px] font-bold tracking-wider uppercase',
              'px-1.5 py-0.5 rounded-md',
              'backdrop-blur-md bg-background/80',
              'border',
              badgeColors.text,
              badgeColors.border
            )}
            style={{ boxShadow: badgeColors.glow }}
          >
            {style.shortLabel}
          </span>
        )}

        {/* Base Game Badge - Centered golden gradient */}
        {isBase && (
          <span
            className={cn(
              'absolute -top-3 left-1/2 -translate-x-1/2',
              'text-[9px] font-bold tracking-wider uppercase',
              'px-2.5 py-1 rounded-md',
              'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500',
              'text-amber-950',
              'border border-amber-300',
              'shadow-lg'
            )}
            style={{
              boxShadow: '0 4px 12px rgb(251 191 36 / 0.4), 0 0 0 1px rgb(251 191 36 / 0.2)',
            }}
          >
            BASE
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
            className={cn(
              'absolute top-1.5 left-1.5',
              'opacity-0 group-hover:opacity-100',
              'transition-opacity duration-200',
              'p-1 rounded-md',
              'bg-background/90 backdrop-blur-sm',
              'hover:bg-background',
              'shadow-sm border border-border/50'
            )}
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
