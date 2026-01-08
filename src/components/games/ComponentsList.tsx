'use client'

import { useState } from 'react'
import {
  Box,
  Layers,
  Dices,
  CircleDot,
  LayoutGrid,
  Users,
  Hexagon,
  Square,
  Package,
  ChevronDown
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { ComponentList } from '@/types/database'

interface ComponentsListProps {
  /** Parsed component list from rulebook */
  components: ComponentList | null | undefined
  /** Display variant */
  variant?: 'default' | 'compact' | 'grid'
  /** Start expanded */
  defaultOpen?: boolean
  className?: string
}

// Icon mapping for component types
const componentIcons: Record<string, React.ReactNode> = {
  cards: <Layers className="h-4 w-4" />,
  dice: <Dices className="h-4 w-4" />,
  tokens: <CircleDot className="h-4 w-4" />,
  boards: <LayoutGrid className="h-4 w-4" />,
  miniatures: <Users className="h-4 w-4" />,
  tiles: <Hexagon className="h-4 w-4" />,
  meeples: <Users className="h-4 w-4" />,
  cubes: <Square className="h-4 w-4" />,
}

// Display labels
const componentLabels: Record<string, string> = {
  cards: 'Cards',
  dice: 'Dice',
  tokens: 'Tokens',
  boards: 'Game Board',
  miniatures: 'Miniatures',
  tiles: 'Tiles',
  meeples: 'Meeples',
  cubes: 'Cubes',
}

interface ComponentItemProps {
  icon: React.ReactNode
  label: string
  count: number | string
  variant: 'default' | 'compact' | 'grid'
}

function ComponentItem({ icon, label, count, variant }: ComponentItemProps) {
  if (variant === 'grid') {
    return (
      <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3 text-center">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-lg font-semibold">{count}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="font-medium">{count}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    )
  }

  // Default variant
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted/50">
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div>
        <span className="font-semibold">{count}</span>
        <span className="text-muted-foreground ml-1.5">{label}</span>
      </div>
    </div>
  )
}

export function ComponentsList({
  components,
  variant = 'default',
  defaultOpen = false,
  className
}: ComponentsListProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (!components) return null

  // Build list of components to display
  const items: Array<{ key: string; icon: React.ReactNode; label: string; count: number | string }> = []

  // Standard numeric components
  const numericKeys = ['cards', 'dice', 'tokens', 'boards', 'miniatures', 'tiles', 'meeples', 'cubes'] as const

  for (const key of numericKeys) {
    const value = components[key]
    if (value && typeof value === 'number' && value > 0) {
      items.push({
        key,
        icon: componentIcons[key] || <Box className="h-4 w-4" />,
        label: componentLabels[key] || key,
        count: value
      })
    }
  }

  // Other components (string array)
  if (components.other && Array.isArray(components.other) && components.other.length > 0) {
    for (const item of components.other) {
      items.push({
        key: `other-${item}`,
        icon: <Package className="h-4 w-4" />,
        label: item,
        count: '+'
      })
    }
  }

  if (items.length === 0) return null

  const totalItems = items.reduce((sum, item) => {
    return sum + (typeof item.count === 'number' ? item.count : 0)
  }, 0)

  // Grid variant doesn't need collapsible
  if (variant === 'grid') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Box className="h-4 w-4 text-muted-foreground" />
          <span>What&apos;s in the Box</span>
          {totalItems > 0 && (
            <span className="text-muted-foreground">({totalItems}+ pieces)</span>
          )}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((item) => (
            <ComponentItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              count={item.count}
              variant="grid"
            />
          ))}
        </div>
      </div>
    )
  }

  // Collapsible for default and compact
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-2 px-3 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">What&apos;s in the Box</span>
            {totalItems > 0 && (
              <span className="text-sm text-muted-foreground">({totalItems}+ pieces)</span>
            )}
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className={cn(
          variant === 'compact'
            ? 'flex flex-wrap gap-2 px-3'
            : 'space-y-1 px-3'
        )}>
          {items.map((item) => (
            <ComponentItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              count={item.count}
              variant={variant}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
