import { createClient } from './server'
import { createStaticClient } from './game-queries'
import type { Collection, Game } from '@/types/database'

// ===========================================
// COLLECTIONS
// ===========================================

export async function getCollections(options?: {
  featured?: boolean
  limit?: number
}): Promise<Collection[]> {
  const supabase = await createClient()

  let query = supabase
    .from('collections')
    .select('*')
    .eq('is_published', true)
    .order('display_order')

  if (options?.featured) {
    query = query.eq('is_featured', true)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    return []
  }

  return data || []
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesInCollection(collectionSlug: string): Promise<(Game & { note?: string | null })[]> {
  const supabase = await createClient()

  // First get the collection
  const collection = await getCollectionBySlug(collectionSlug)
  if (!collection) return []

  // Get games in this collection via junction table
  const { data, error } = await supabase
    .from('collection_games')
    .select('note, display_order, games(*)')
    .eq('collection_id', collection.id)
    .order('display_order')

  if (error) {
    return []
  }

  // Extract games with note
  const games = data
    ?.map(item => ({
      ...(item.games as Game),
      note: item.note
    }))
    .filter(game => game.is_published)

  return games || []
}

export async function getAllCollectionSlugs(): Promise<string[]> {
  // Use static client for generateStaticParams (no cookies)
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('collections')
    .select('slug')
    .eq('is_published', true)

  if (error) {
    return []
  }

  return data?.map(c => c.slug) || []
}
