import { createClient } from './server'
import { createStaticClient } from './game-queries'
import type {
  Game,
  GameFamily,
  GameFamilyWithGames,
  GameRelationWithTarget,
  GameRelationWithSource
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
