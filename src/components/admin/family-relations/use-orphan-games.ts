import { useMemo } from 'react'
import type { Game, GameRelation } from '@/types/database'
import { calculateOrphanGames } from '@/lib/families'

interface UseOrphanGamesOptions {
  games: Game[]
  relations: GameRelation[]
  baseGameId: string | null
}

/**
 * Hook to get orphan games (games in family but with no relations).
 * Uses the shared orphan calculation utility.
 */
export function useOrphanGames({ games, relations, baseGameId }: UseOrphanGamesOptions): Game[] {
  return useMemo(() => {
    return calculateOrphanGames(games, relations, baseGameId)
  }, [games, relations, baseGameId])
}
