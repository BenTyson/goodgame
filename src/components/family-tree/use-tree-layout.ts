import { useMemo } from 'react'
import type { Game, GameRelation, RelationType } from '@/types/database'
import type { TreeLayoutNode, TierData } from './types'
import { MAX_DEPTH } from './types'

interface UseTreeLayoutOptions {
  games: Game[]
  relations: GameRelation[]
  baseGameId: string | null
}

interface TreeLayoutResult {
  tiers: TierData[]
  nodes: TreeLayoutNode[]
  baseGame: Game | null
  orphanGames: Game[]
}

/**
 * Calculate the tree layout for a family of games
 */
export function useTreeLayout({
  games,
  relations,
  baseGameId,
}: UseTreeLayoutOptions): TreeLayoutResult {
  return useMemo(() => {
    if (games.length === 0) {
      return { tiers: [], nodes: [], baseGame: null, orphanGames: [] }
    }

    const gamesMap = new Map(games.map(g => [g.id, g]))
    const placedGameIds = new Set<string>()

    // Find base game (specified or oldest)
    let baseGame: Game | null = null
    if (baseGameId && gamesMap.has(baseGameId)) {
      baseGame = gamesMap.get(baseGameId)!
    } else {
      // Find oldest game as base
      const sorted = [...games].sort((a, b) => {
        const yearA = a.year_published ?? 9999
        const yearB = b.year_published ?? 9999
        return yearA - yearB
      })
      baseGame = sorted[0]
    }

    if (!baseGame) {
      return { tiers: [], nodes: [], baseGame: null, orphanGames: games }
    }

    // Build relation maps
    // childrenOf[parentId] = games that are expansions/sequels OF this game
    const childrenOf = new Map<string, { game: Game; relation: GameRelation }[]>()
    // parentOf[childId] = the game this is an expansion/sequel OF
    const parentOf = new Map<string, { game: Game; relation: GameRelation }>()

    for (const rel of relations) {
      const sourceGame = gamesMap.get(rel.source_game_id)
      const targetGame = gamesMap.get(rel.target_game_id)

      if (!sourceGame || !targetGame) continue

      // For "expansion_of", source is child of target
      // For "sequel_to", source is child of target (comes after)
      // For "prequel_to", source comes before target (so target is child of source)
      if (
        rel.relation_type === 'expansion_of' ||
        rel.relation_type === 'sequel_to' ||
        rel.relation_type === 'standalone_in_series' ||
        rel.relation_type === 'spin_off_of' ||
        rel.relation_type === 'reimplementation_of'
      ) {
        // source is "child" of target
        if (!childrenOf.has(rel.target_game_id)) {
          childrenOf.set(rel.target_game_id, [])
        }
        childrenOf.get(rel.target_game_id)!.push({ game: sourceGame, relation: rel })
        parentOf.set(rel.source_game_id, { game: targetGame, relation: rel })
      } else if (rel.relation_type === 'prequel_to') {
        // source is prequel to target, so target comes after source
        // We treat source as parent, target as child for timeline ordering
        if (!childrenOf.has(rel.source_game_id)) {
          childrenOf.set(rel.source_game_id, [])
        }
        childrenOf.get(rel.source_game_id)!.push({ game: targetGame, relation: rel })
        parentOf.set(rel.target_game_id, { game: sourceGame, relation: rel })
      }
    }

    const nodes: TreeLayoutNode[] = []

    // Helper to get line style based on relation type
    function getLineStyle(relationType?: RelationType): 'solid' | 'dashed' | 'dotted' {
      if (!relationType) return 'solid'
      if (relationType === 'standalone_in_series' || relationType === 'spin_off_of') {
        return 'dashed'
      }
      if (relationType === 'reimplementation_of') {
        return 'dotted'
      }
      return 'solid'
    }

    // Tier 0: Sequels/Prequels of base game (horizontal timeline)
    const sequelPrequelGames: TreeLayoutNode[] = []
    const baseChildren = childrenOf.get(baseGame.id) || []

    for (const { game, relation } of baseChildren) {
      if (relation.relation_type === 'sequel_to' || relation.relation_type === 'prequel_to') {
        sequelPrequelGames.push({
          game,
          relationType: relation.relation_type as RelationType,
          tier: 0,
          column: 0, // will be repositioned
          parentId: baseGame.id,
          lineStyle: 'solid',
        })
        placedGameIds.add(game.id)
      }
    }

    // Sort sequels/prequels by year
    sequelPrequelGames.sort((a, b) => {
      const yearA = a.game.year_published ?? 9999
      const yearB = b.game.year_published ?? 9999
      return yearA - yearB
    })

    // Assign columns to tier 0
    sequelPrequelGames.forEach((node, i) => {
      node.column = i
    })

    // Tier 1: Base game + standalones/spinoffs
    const tier1Nodes: TreeLayoutNode[] = []

    // Add base game at center
    const baseNode: TreeLayoutNode = {
      game: baseGame,
      tier: 1,
      column: 0,
      lineStyle: 'solid',
    }
    tier1Nodes.push(baseNode)
    placedGameIds.add(baseGame.id)

    // Add standalones and spinoffs to tier 1 (alongside base)
    const variantTypes: string[] = ['standalone_in_series', 'spin_off_of', 'reimplementation_of']
    let variantColumn = 1

    for (const { game, relation } of baseChildren) {
      if (variantTypes.includes(relation.relation_type)) {
        tier1Nodes.push({
          game,
          relationType: relation.relation_type as RelationType,
          tier: 1,
          column: variantColumn++,
          parentId: baseGame.id,
          lineStyle: getLineStyle(relation.relation_type as RelationType),
        })
        placedGameIds.add(game.id)
      }
    }

    // Tier 2+: Expansions (recursive tree)
    function collectExpansions(
      parentId: string,
      tier: number,
      startColumn: number
    ): { nodes: TreeLayoutNode[]; nextColumn: number } {
      if (tier > MAX_DEPTH) return { nodes: [], nextColumn: startColumn }

      const children = childrenOf.get(parentId) || []
      const expansions = children.filter(c => c.relation.relation_type === 'expansion_of')

      // Sort by year
      expansions.sort((a, b) => {
        const yearA = a.game.year_published ?? 9999
        const yearB = b.game.year_published ?? 9999
        return yearA - yearB
      })

      const resultNodes: TreeLayoutNode[] = []
      let col = startColumn

      for (const { game, relation } of expansions) {
        if (placedGameIds.has(game.id)) continue

        const node: TreeLayoutNode = {
          game,
          relationType: relation.relation_type as RelationType,
          tier,
          column: col,
          parentId,
          lineStyle: 'solid',
        }
        resultNodes.push(node)
        placedGameIds.add(game.id)

        // Recursively collect nested expansions
        const nested = collectExpansions(game.id, tier + 1, col)
        resultNodes.push(...nested.nodes)

        // Move column for next sibling
        col = Math.max(col + 1, nested.nextColumn)
      }

      return { nodes: resultNodes, nextColumn: col }
    }

    const expansionResult = collectExpansions(baseGame.id, 2, 0)

    // Combine all nodes
    nodes.push(...sequelPrequelGames, ...tier1Nodes, ...expansionResult.nodes)

    // Find orphan games (not placed in tree)
    const orphanGames = games.filter(g => !placedGameIds.has(g.id))

    // Group nodes by tier
    const tierMap = new Map<number, TreeLayoutNode[]>()
    for (const node of nodes) {
      if (!tierMap.has(node.tier)) {
        tierMap.set(node.tier, [])
      }
      tierMap.get(node.tier)!.push(node)
    }

    // Sort each tier by column
    for (const tierNodes of tierMap.values()) {
      tierNodes.sort((a, b) => a.column - b.column)
    }

    // Convert to sorted tiers array
    const tiers: TierData[] = Array.from(tierMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([tier, tierNodes]) => ({ tier, nodes: tierNodes }))

    return { tiers, nodes, baseGame, orphanGames }
  }, [games, relations, baseGameId])
}
