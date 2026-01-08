'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, Layers, Cog, Palette, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Category, Mechanic, Theme, PlayerExperience } from '@/types/database'

// Extended types with is_primary flag - accepts null from database
type CategoryWithPrimary = Category & { is_primary?: boolean | null }
type ThemeWithPrimary = Theme & { is_primary?: boolean | null }
type ExperienceWithPrimary = PlayerExperience & { is_primary?: boolean | null }

interface TaxonomySectionProps {
  categories?: CategoryWithPrimary[]
  mechanics?: Mechanic[]
  themes?: ThemeWithPrimary[]
  playerExperiences?: ExperienceWithPrimary[]
  /** Number of items to show before collapsing */
  collapseAfter?: number
  /** Show taxonomy type labels */
  showLabels?: boolean
  /** Compact mode for smaller display */
  compact?: boolean
  className?: string
}

interface TaxonomyRowProps {
  icon: React.ReactNode
  label: string
  items: Array<{ slug: string; name: string; is_primary?: boolean | null }>
  colorClass: string
  urlPrefix: string
  collapseAfter: number
  compact?: boolean
}

function TaxonomyRow({
  icon,
  label,
  items,
  colorClass,
  urlPrefix,
  collapseAfter,
  compact
}: TaxonomyRowProps) {
  const [expanded, setExpanded] = useState(false)

  if (!items || items.length === 0) return null

  const displayItems = expanded ? items : items.slice(0, collapseAfter)
  const hasMore = items.length > collapseAfter

  return (
    <div className={cn('flex items-start gap-2', compact ? 'gap-1.5' : 'gap-2')}>
      <div className={cn(
        'flex items-center gap-1.5 shrink-0',
        compact ? 'min-w-[80px]' : 'min-w-[100px]'
      )}>
        <span className={cn('text-muted-foreground', compact ? 'h-3 w-3' : 'h-4 w-4')}>
          {icon}
        </span>
        <span className={cn(
          'text-muted-foreground font-medium uppercase tracking-wider',
          compact ? 'text-[10px]' : 'text-xs'
        )}>
          {label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {displayItems.map((item) => (
          <Link
            key={item.slug}
            href={`${urlPrefix}${item.slug}`}
          >
            <Badge
              variant="outline"
              className={cn(
                'transition-all hover:scale-105',
                compact ? 'text-xs px-2 py-0' : 'text-xs px-2.5 py-0.5',
                colorClass,
                item.is_primary && 'ring-1 ring-offset-1 ring-primary/50 font-semibold'
              )}
            >
              {item.name}
            </Badge>
          </Link>
        ))}
        {hasMore && !expanded && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-auto py-0.5 px-2 text-xs text-muted-foreground hover:text-foreground',
              compact && 'text-[11px]'
            )}
            onClick={() => setExpanded(true)}
          >
            +{items.length - collapseAfter} more
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </Button>
        )}
        {hasMore && expanded && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-0.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(false)}
          >
            Show less
          </Button>
        )}
      </div>
    </div>
  )
}

export function TaxonomySection({
  categories = [],
  mechanics = [],
  themes = [],
  playerExperiences = [],
  collapseAfter = 5,
  showLabels = true,
  compact = false,
  className
}: TaxonomySectionProps) {
  // Filter out empty arrays
  const hasCategories = categories.length > 0
  const hasMechanics = mechanics.length > 0
  const hasThemes = themes.length > 0
  const hasExperiences = playerExperiences.length > 0

  if (!hasCategories && !hasMechanics && !hasThemes && !hasExperiences) {
    return null
  }

  return (
    <div className={cn('space-y-2', compact ? 'space-y-1.5' : 'space-y-2', className)}>
      {hasCategories && (
        <TaxonomyRow
          icon={<Layers className="h-full w-full" />}
          label={showLabels ? 'Categories' : ''}
          items={categories}
          colorClass="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50"
          urlPrefix="/games?categories="
          collapseAfter={collapseAfter}
          compact={compact}
        />
      )}
      {hasMechanics && (
        <TaxonomyRow
          icon={<Cog className="h-full w-full" />}
          label={showLabels ? 'Mechanics' : ''}
          items={mechanics}
          colorClass="border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50"
          urlPrefix="/games?mechanics="
          collapseAfter={collapseAfter}
          compact={compact}
        />
      )}
      {hasThemes && (
        <TaxonomyRow
          icon={<Palette className="h-full w-full" />}
          label={showLabels ? 'Themes' : ''}
          items={themes}
          colorClass="border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50"
          urlPrefix="/games?themes="
          collapseAfter={collapseAfter}
          compact={compact}
        />
      )}
      {hasExperiences && (
        <TaxonomyRow
          icon={<Sparkles className="h-full w-full" />}
          label={showLabels ? 'Experience' : ''}
          items={playerExperiences}
          colorClass="border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50"
          urlPrefix="/games?experiences="
          collapseAfter={collapseAfter}
          compact={compact}
        />
      )}
    </div>
  )
}

// Simple inline badges for hero section (categories only, no labels)
export function CategoryBadges({
  categories,
  limit = 3,
  className
}: {
  categories: CategoryWithPrimary[]
  limit?: number
  className?: string
}) {
  if (!categories || categories.length === 0) return null

  const displayCategories = categories.slice(0, limit)

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displayCategories.map((cat) => (
        <Link key={cat.slug} href={`/games?categories=${cat.slug}`}>
          <Badge
            variant="outline"
            className={cn(
              'text-xs transition-all hover:scale-105',
              'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50',
              cat.is_primary && 'ring-1 ring-offset-1 ring-primary/50 font-semibold'
            )}
          >
            {cat.name}
          </Badge>
        </Link>
      ))}
      {categories.length > limit && (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          +{categories.length - limit}
        </Badge>
      )}
    </div>
  )
}
