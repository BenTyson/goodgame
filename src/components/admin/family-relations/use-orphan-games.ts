import { useMemo } from 'react'
import type { Game, GameRelation, RelationType } from '@/types/database'
import type { TreeNode } from './types'

interface UseOrphanGamesOptions {
  games: Game[]
  relations: GameRelation[]
  baseGameId: string | null
}

/**
 * Build tree structure from flat relations to find orphan games.
 * Internal utility - not exported.
 */
function buildFamilyTree(
  games: Game[],
  relations: GameRelation[],
  baseGameId: string | null
): { tree: TreeNode | null; orphans: Game[] } {
  if (games.length === 0) {
    return { tree: null, orphans: [] }
  }

  const gamesMap = new Map(games.map(g => [g.id, g]))

  // Find base game: use provided baseGameId or oldest game
  let rootGame: Game | undefined
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
    return { tree: null, orphans: games }
  }

  // Build adjacency list: parent -> children
  // "expansion_of", "sequel_to", etc. mean: source is X of target
  // So if Game A is "expansion_of" Game B, then B is parent and A is child
  const childrenMap = new Map<string, { game: Game; relationType: RelationType }[]>()

  for (const relation of relations) {
    const sourceGame = gamesMap.get(relation.source_game_id)
    const targetGame = gamesMap.get(relation.target_game_id)

    if (!sourceGame || !targetGame) continue

    // Source is "X of" target, so target is parent, source is child
    const parentId = relation.target_game_id
    const children = childrenMap.get(parentId) || []
    children.push({
      game: sourceGame,
      relationType: relation.relation_type as RelationType,
    })
    childrenMap.set(parentId, children)
  }

  // Build tree recursively from root
  const visited = new Set<string>()

  function buildNode(game: Game, relationType?: RelationType): TreeNode {
    visited.add(game.id)

    const childNodes: TreeNode[] = []
    const children = childrenMap.get(game.id) || []

    // Sort children: expansions first, then by year
    const sortedChildren = [...children].sort((a, b) => {
      // Expansions come first
      if (a.relationType === 'expansion_of' && b.relationType !== 'expansion_of') return -1
      if (b.relationType === 'expansion_of' && a.relationType !== 'expansion_of') return 1
      // Then by year
      if (a.game.year_published && b.game.year_published) {
        return a.game.year_published - b.game.year_published
      }
      return 0
    })

    for (const child of sortedChildren) {
      if (!visited.has(child.game.id)) {
        childNodes.push(buildNode(child.game, child.relationType))
      }
    }

    return {
      game,
      relationType,
      children: childNodes,
    }
  }

  const tree = buildNode(rootGame)

  // Find orphans (games not in tree)
  const orphans = games.filter(g => !visited.has(g.id))

  return { tree, orphans }
}

/**
 * Hook to get orphan games (games in family but with no relations).
 */
export function useOrphanGames({ games, relations, baseGameId }: UseOrphanGamesOptions): Game[] {
  return useMemo(() => {
    const { orphans } = buildFamilyTree(games, relations, baseGameId)
    return orphans
  }, [games, relations, baseGameId])
}
