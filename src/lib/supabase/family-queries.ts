import { createClient } from './server'
import { createStaticClient } from './game-queries'
import type {
  Game,
  GameFamily,
  GameFamilyWithGames,
  GameRelationWithTarget,
  GameRelationWithSource,
  RelationType,
  PromoGame
} from '@/types/database'

// ===========================================
// GAME FAMILIES
// ===========================================

export async function getGameFamilies(): Promise<GameFamily[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_families')
    .select('*')
    .order('name')

  if (error) {
    return []
  }

  return data || []
}

export async function getGameFamilyBySlug(slug: string): Promise<GameFamily | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_families')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesInFamily(familyId: string): Promise<Game[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_published', true)
    .order('year_published', { ascending: true, nullsFirst: false })

  if (error) {
    return []
  }

  return data || []
}

export async function getGameFamilyWithGames(slug: string): Promise<GameFamilyWithGames | null> {
  const supabase = await createClient()

  // First get the family
  const { data: family, error: familyError } = await supabase
    .from('game_families')
    .select('*')
    .eq('slug', slug)
    .single()

  if (familyError || !family) {
    return null
  }

  // Then get the games in this family
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .eq('family_id', family.id)
    .eq('is_published', true)
    .order('year_published', { ascending: true, nullsFirst: false })

  if (gamesError) {
    return { ...family, games: [], game_count: 0 }
  }

  return {
    ...family,
    games: games || [],
    game_count: games?.length || 0
  }
}

export async function getGameFamily(gameId: string): Promise<GameFamily | null> {
  const supabase = await createClient()

  // Get the game's family_id first
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('family_id')
    .eq('id', gameId)
    .single()

  if (gameError || !game || !game.family_id) {
    return null
  }

  // Then get the family
  const { data: family, error: familyError } = await supabase
    .from('game_families')
    .select('*')
    .eq('id', game.family_id)
    .single()

  if (familyError) {
    return null
  }

  return family
}

export async function getAllFamilySlugs(): Promise<string[]> {
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('game_families')
    .select('slug')

  if (error) {
    return []
  }

  return data?.map(f => f.slug) || []
}

export async function getFamiliesWithGameCounts(): Promise<(GameFamily & { game_count: number })[]> {
  const supabase = await createClient()

  // Get all families
  const { data: families, error: familiesError } = await supabase
    .from('game_families')
    .select('*')
    .order('name')

  if (familiesError || !families) {
    return []
  }

  // Get game counts for each family
  const familiesWithCounts = await Promise.all(
    families.map(async (family) => {
      const { count } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', family.id)
        .eq('is_published', true)

      return {
        ...family,
        game_count: count || 0
      }
    })
  )

  // Only return families with at least one published game
  return familiesWithCounts.filter(f => f.game_count > 0)
}

// ===========================================
// GAME RELATIONS
// ===========================================

export async function getGameRelations(gameId: string): Promise<GameRelationWithTarget[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_relations')
    .select(`
      *,
      target_game:games!game_relations_target_game_id_fkey(*)
    `)
    .eq('source_game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  // Filter out relations where target game is not published
  return (data || [])
    .filter(r => r.target_game && (r.target_game as Game).is_published)
    .map(r => ({
      ...r,
      target_game: r.target_game as Game
    }))
}

export async function getInverseGameRelations(gameId: string): Promise<GameRelationWithSource[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_relations')
    .select(`
      *,
      source_game:games!game_relations_source_game_id_fkey(*)
    `)
    .eq('target_game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  // Filter out relations where source game is not published
  return (data || [])
    .filter(r => r.source_game && (r.source_game as Game).is_published)
    .map(r => ({
      ...r,
      source_game: r.source_game as Game
    }))
}

export async function getAllGameRelations(gameId: string): Promise<{
  direct: GameRelationWithTarget[]
  inverse: GameRelationWithSource[]
}> {
  const [direct, inverse] = await Promise.all([
    getGameRelations(gameId),
    getInverseGameRelations(gameId)
  ])

  return { direct, inverse }
}

// ===========================================
// GROUPED RELATIONS FOR DISPLAY
// ===========================================

export interface GroupedGameRelations {
  /** If this game is an expansion, shows the base game */
  baseGame: Game | null
  /** Expansions for this game (if it's a base game) */
  expansions: Game[]
  /** Other related games grouped by relation type */
  otherRelations: {
    type: RelationType
    label: string
    games: Game[]
  }[]
  /** The game's family if it has one */
  family: GameFamily | null
}

/**
 * Gets all game relations organized for display on the public game page.
 * Combines direct and inverse relations into user-friendly groups.
 */
export async function getGameRelationsGrouped(gameId: string): Promise<GroupedGameRelations> {
  const [{ direct, inverse }, family] = await Promise.all([
    getAllGameRelations(gameId),
    getGameFamily(gameId)
  ])

  let baseGame: Game | null = null
  const expansions: Game[] = []
  const otherRelationsMap = new Map<RelationType, Game[]>()

  // Process direct relations (this game -> target)
  for (const relation of direct) {
    if (relation.relation_type === 'expansion_of') {
      // This game is an expansion OF the target (target is base game)
      baseGame = relation.target_game
    } else if (relation.relation_type === 'base_game_of') {
      // This game is the base game OF the target (target is expansion)
      expansions.push(relation.target_game)
    } else {
      // Other relation types
      const existing = otherRelationsMap.get(relation.relation_type as RelationType) || []
      existing.push(relation.target_game)
      otherRelationsMap.set(relation.relation_type as RelationType, existing)
    }
  }

  // Process inverse relations (source -> this game)
  for (const relation of inverse) {
    if (relation.relation_type === 'expansion_of') {
      // Source game is an expansion OF this game (this is base game)
      expansions.push(relation.source_game)
    } else if (relation.relation_type === 'base_game_of') {
      // Source game is base game OF this game (this is expansion)
      if (!baseGame) {
        baseGame = relation.source_game
      }
    } else {
      // Other inverse relations
      const inverseType = getInverseRelationType(relation.relation_type as RelationType)
      const existing = otherRelationsMap.get(inverseType) || []
      existing.push(relation.source_game)
      otherRelationsMap.set(inverseType, existing)
    }
  }

  // Convert map to array with labels
  const relationLabels: Record<RelationType, string> = {
    'expansion_of': 'Expansion of',
    'base_game_of': 'Base Game',
    'sequel_to': 'Sequels',
    'prequel_to': 'Prequels',
    'reimplementation_of': 'Reimplementations',
    'spin_off_of': 'Spin-offs',
    'standalone_in_series': 'Related in Series',
    'promo_of': 'Promos & Extras'
  }

  const otherRelations = Array.from(otherRelationsMap.entries())
    .filter(([, games]) => games.length > 0)
    .map(([type, games]) => ({
      type,
      label: relationLabels[type] || type,
      games
    }))

  return {
    baseGame,
    expansions,
    otherRelations,
    family
  }
}

/** Get the inverse relation type for display purposes */
function getInverseRelationType(type: RelationType): RelationType {
  const inverses: Record<RelationType, RelationType> = {
    'expansion_of': 'base_game_of',
    'base_game_of': 'expansion_of',
    'sequel_to': 'prequel_to',
    'prequel_to': 'sequel_to',
    'reimplementation_of': 'reimplementation_of',
    'spin_off_of': 'spin_off_of',
    'standalone_in_series': 'standalone_in_series',
    'promo_of': 'promo_of'
  }
  return inverses[type] || type
}

// ===========================================
// GAME PROMOS
// ===========================================

/**
 * Get all promo games for a parent game.
 * Queries via game_relations where relation_type = 'promo_of' and target is this game.
 * Also checks parent_game_id for direct references.
 */
export async function getGamePromos(gameId: string): Promise<PromoGame[]> {
  const supabase = await createClient()

  // Get promos via game_relations (promo_of relation where target is this game)
  const { data: relationPromos } = await supabase
    .from('game_relations')
    .select(`
      source_game:games!game_relations_source_game_id_fkey(
        id,
        name,
        slug,
        year_published,
        description,
        box_image_url,
        thumbnail_url,
        bgg_id,
        is_published,
        is_promo
      )
    `)
    .eq('target_game_id', gameId)
    .eq('relation_type', 'promo_of')

  // Also get promos via direct parent_game_id reference
  const { data: directPromos } = await supabase
    .from('games')
    .select('id, name, slug, year_published, description, box_image_url, thumbnail_url, bgg_id')
    .eq('parent_game_id', gameId)
    .eq('is_promo', true)
    .eq('is_published', true)
    .order('name')

  // Combine and deduplicate
  const promoMap = new Map<string, PromoGame>()

  // Add relation-based promos (filter to published promos only)
  if (relationPromos) {
    for (const r of relationPromos) {
      const game = r.source_game as {
        id: string
        name: string
        slug: string
        year_published: number | null
        description: string | null
        box_image_url: string | null
        thumbnail_url: string | null
        bgg_id: number | null
        is_published: boolean | null
        is_promo: boolean | null
      } | null

      if (game && game.is_published && game.is_promo) {
        promoMap.set(game.id, {
          id: game.id,
          name: game.name,
          slug: game.slug,
          year_published: game.year_published,
          description: game.description,
          box_image_url: game.box_image_url,
          thumbnail_url: game.thumbnail_url,
          bgg_id: game.bgg_id,
        })
      }
    }
  }

  // Add direct promos
  if (directPromos) {
    for (const game of directPromos) {
      if (!promoMap.has(game.id)) {
        promoMap.set(game.id, {
          id: game.id,
          name: game.name,
          slug: game.slug,
          year_published: game.year_published,
          description: game.description,
          box_image_url: game.box_image_url,
          thumbnail_url: game.thumbnail_url,
          bgg_id: game.bgg_id,
        })
      }
    }
  }

  // Sort by name
  return Array.from(promoMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}
