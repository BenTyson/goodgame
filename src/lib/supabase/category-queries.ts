import { createClient } from './server'
import { createStaticClient } from './game-queries'
import type { Category, Game, Mechanic } from '@/types/database'

// ===========================================
// CATEGORIES
// ===========================================

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order')

  if (error) {
    return []
  }

  return data || []
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByCategory(categorySlug: string): Promise<Game[]> {
  const supabase = await createClient()

  // First get the category
  const category = await getCategoryBySlug(categorySlug)
  if (!category) return []

  // Get games in this category via junction table
  const { data, error } = await supabase
    .from('game_categories')
    .select('game_id, games(*)')
    .eq('category_id', category.id)

  if (error) {
    return []
  }

  // Extract and filter published games
  const games = data
    ?.map(item => item.games)
    .filter((game): game is Game => game !== null && (game as Game).is_published === true)
    .sort((a, b) => a.name.localeCompare(b.name))

  return games || []
}

export async function getAllCategorySlugs(): Promise<string[]> {
  // Use static client for generateStaticParams (no cookies)
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('categories')
    .select('slug')

  if (error) {
    return []
  }

  return data?.map(c => c.slug) || []
}

// ===========================================
// MECHANICS
// ===========================================

export async function getMechanics(): Promise<Mechanic[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .order('name')

  if (error) {
    return []
  }

  return data || []
}

export async function getMechanicBySlug(slug: string): Promise<Mechanic | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByMechanic(mechanicSlug: string): Promise<Game[]> {
  const supabase = await createClient()

  const mechanic = await getMechanicBySlug(mechanicSlug)
  if (!mechanic) return []

  const { data, error } = await supabase
    .from('game_mechanics')
    .select('game_id, games(*)')
    .eq('mechanic_id', mechanic.id)

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.games as Game)
    .filter(game => game && game.is_published)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getGameMechanics(gameId: string): Promise<Mechanic[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_mechanics')
    .select('mechanic_id, mechanics(*)')
    .eq('game_id', gameId)

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.mechanics as Mechanic)
    .filter(m => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}
