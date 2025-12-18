import { GameCard } from './GameCard'
import type { Game, Category } from '@/types/database'

interface GameGridProps {
  games: (Game & { categories?: Pick<Category, 'slug' | 'name'>[] })[]
  columns?: 2 | 3 | 4
  showContentBadges?: boolean
}

export function GameGrid({
  games,
  columns = 3,
  showContentBadges = true,
}: GameGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  if (games.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">No games found</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-6 ${gridCols[columns]}`}>
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          showContentBadges={showContentBadges}
        />
      ))}
    </div>
  )
}
