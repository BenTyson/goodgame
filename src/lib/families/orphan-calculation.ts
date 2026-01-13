import type { RelationType } from '@/types/database'

/**
 * Minimal game type for orphan calculation - works with both full Game objects
 * and partial query results
 */
interface GameLike {
  id: string
  name: string
  year_published: number | null
}

interface RelationLike {
  source_game_id: string
  target_game_id: string
  relation_type: string
}

/**
 * Calculate orphan games in a family.
 * An orphan is a game that's in the family but not connected to the tree
 * (not reachable from the base game via relations).
 */
export function calculateOrphanGames<T extends GameLike>(
  games: T[],
  relations: RelationLike[],
  baseGameId: string | null
): T[] {
  if (games.length === 0) {
    return []
  }

  const gamesMap = new Map(games.map(g => [g.id, g]))

  // Find base game: use provided baseGameId or oldest game
  let rootGame: T | undefined
  if (baseGameId && gamesMap.has(baseGameId)) {
    rootGame = gamesMap.get(baseGameId)
  } else {
    // Find oldest game (by year, then by shortest name as proxy for "base" name)
    rootGame = [...games].sort((a, b) => {
      if (a.year_published && b.year_published) {
        if (a.year_published !== b.year_published) return a.year_published - b.year_published
      } else if (a.year_published) {
        return -1
      } else if (b.year_published) {
        return 1
      }
      return a.name.length - b.name.length
    })[0]
  }

  if (!rootGame) {
    return games
  }

  // Build adjacency list: parent -> children
  // "expansion_of", "sequel_to", etc. mean: source is X of target
  // So if Game A is "expansion_of" Game B, then B is parent and A is child
  const childrenMap = new Map<string, string[]>()

  for (const relation of relations) {
    // Only process relations where both games are in this family
    if (!gamesMap.has(relation.source_game_id) || !gamesMap.has(relation.target_game_id)) {
      continue
    }

    // Source is "X of" target, so target is parent, source is child
    const parentId = relation.target_game_id
    const children = childrenMap.get(parentId) || []
    children.push(relation.source_game_id)
    childrenMap.set(parentId, children)
  }

  // BFS/DFS to find all reachable games from root
  const visited = new Set<string>()
  const queue = [rootGame.id]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    const children = childrenMap.get(currentId) || []
    for (const childId of children) {
      if (!visited.has(childId)) {
        queue.push(childId)
      }
    }
  }

  // Orphans are games not visited (not reachable from root)
  return games.filter(g => !visited.has(g.id))
}

/**
 * Calculate orphan count for a single family.
 * Returns 0 for single-game families (the one game is the base).
 */
export function calculateOrphanCount<T extends GameLike>(
  games: T[],
  relations: RelationLike[],
  baseGameId: string | null
): number {
  if (games.length <= 1) {
    return 0
  }
  return calculateOrphanGames(games, relations, baseGameId).length
}
