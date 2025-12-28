import { createClient } from './server'
import { createStaticClient } from './game-queries'
import type { Award, AwardCategory, GameAward, Game } from '@/types/database'

// ===========================================
// AWARDS
// ===========================================

export async function getAwards(): Promise<Award[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('awards')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  if (error) {
    return []
  }

  return data || []
}

export async function getAwardBySlug(slug: string): Promise<Award | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('awards')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getAwardCategories(awardId: string): Promise<AwardCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('award_categories')
    .select('*')
    .eq('award_id', awardId)
    .order('display_order')

  if (error) {
    return []
  }

  return data || []
}

export async function getAwardWithCategories(slug: string) {
  const award = await getAwardBySlug(slug)
  if (!award) return null

  const categories = await getAwardCategories(award.id)

  return {
    ...award,
    categories
  }
}

export type GameAwardWithDetails = GameAward & {
  award: Award
  category: AwardCategory | null
}

export async function getGameAwards(gameId: string): Promise<GameAwardWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_awards')
    .select(`
      *,
      award:awards(*),
      category:award_categories(*)
    `)
    .eq('game_id', gameId)
    .order('year', { ascending: false })

  if (error) {
    return []
  }

  // Transform nested data
  return (data || []).map(item => ({
    ...item,
    award: item.award as Award,
    category: item.category as AwardCategory | null
  }))
}

export type AwardWinner = {
  game: Game
  category: AwardCategory | null
  year: number
  result: string | null
  notes: string | null
}

export async function getAwardWinners(awardSlug: string, options?: {
  year?: number
  categorySlug?: string
  limit?: number
}): Promise<AwardWinner[]> {
  const supabase = await createClient()

  // First get the award
  const award = await getAwardBySlug(awardSlug)
  if (!award) return []

  let query = supabase
    .from('game_awards')
    .select(`
      year,
      result,
      notes,
      game:games(*),
      category:award_categories(*)
    `)
    .eq('award_id', award.id)
    .order('year', { ascending: false })

  if (options?.year) {
    query = query.eq('year', options.year)
  }

  if (options?.categorySlug) {
    // Get category ID first
    const { data: catData } = await supabase
      .from('award_categories')
      .select('id')
      .eq('award_id', award.id)
      .eq('slug', options.categorySlug)
      .single()

    if (catData) {
      query = query.eq('category_id', catData.id)
    }
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    return []
  }

  // Filter published games and transform
  return (data || [])
    .filter(item => item.game && (item.game as Game).is_published)
    .map(item => ({
      game: item.game as Game,
      category: item.category as AwardCategory | null,
      year: item.year,
      result: item.result,
      notes: item.notes
    }))
}

export async function getAllAwardSlugs(): Promise<string[]> {
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('awards')
    .select('slug')
    .eq('is_active', true)

  if (error) {
    return []
  }

  return data?.map(a => a.slug) || []
}
