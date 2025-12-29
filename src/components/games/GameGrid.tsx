import { GameCard } from './GameCard'
import type { GameRow, Category } from '@/types/database'

interface GameGridProps {
  games: (GameRow & { categories?: Pick<Category, 'slug' | 'name'>[] })[]
  columns?: 2 | 3 | 4 | 5
  /** When true, uses expanded sidebar column layout (fewer columns) */
  sidebarExpanded?: boolean
}

export function GameGrid({
  games,
  columns,
  sidebarExpanded = true,
}: GameGridProps) {
  // Dynamic column classes based on sidebar state
  // Expanded sidebar: 3 cols on lg, 4 cols on xl
  // Collapsed sidebar: 4 cols on lg, 5 cols on xl
  const dynamicGridCols = sidebarExpanded
    ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

  // Static column options (for backwards compatibility)
  const staticGridCols: Record<number, string> = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  }

  // Use static columns if explicitly provided, otherwise use dynamic
  const gridColsClass = columns ? staticGridCols[columns] : dynamicGridCols

  if (games.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">No games found</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-6 ${gridColsClass}`}>
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  )
}
