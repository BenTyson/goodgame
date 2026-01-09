import { createClient } from './server'
import { createStaticClient } from './game-queries'
import { createAdminClient } from './admin'
import type { Award, AwardCategory, GameAward, Game } from '@/types/database'
import type { WikipediaAward } from '@/lib/wikipedia/types'

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

// ===========================================
// AWARD SYNC FROM WIKIPEDIA
// ===========================================

/**
 * Mapping from Wikipedia award names to our database slugs
 * Wikipedia names are case-insensitive matched
 */
const WIKIPEDIA_TO_SLUG_MAP: Record<string, string> = {
  // German awards
  'spiel des jahres': 'spiel-des-jahres',
  'kennerspiel des jahres': 'kennerspiel-des-jahres',
  'kinderspiel des jahres': 'kinderspiel-des-jahres',
  'deutscher spiele preis': 'deutscher-spiele-preis',

  // American awards
  'golden geek': 'golden-geek',
  'golden geek award': 'golden-geek',
  'golden geek awards': 'golden-geek',
  'dice tower': 'dice-tower',
  'dice tower award': 'dice-tower',
  'dice tower awards': 'dice-tower',
  'american tabletop award': 'american-tabletop',
  'american tabletop awards': 'american-tabletop',
  'origins award': 'origins-awards',
  'origins awards': 'origins-awards',
  'mensa select': 'mensa-select',

  // French awards
  "as d'or": 'as-dor',
  'as dor': 'as-dor',

  // International
  'international gamers award': 'international-gamers-award',
}

/**
 * Match a Wikipedia award name to our database slug
 */
function matchAwardSlug(wikipediaName: string): string | null {
  const normalizedName = wikipediaName.toLowerCase().trim()

  // Direct match
  if (WIKIPEDIA_TO_SLUG_MAP[normalizedName]) {
    return WIKIPEDIA_TO_SLUG_MAP[normalizedName]
  }

  // Partial match - check if any key is contained in the name
  for (const [key, slug] of Object.entries(WIKIPEDIA_TO_SLUG_MAP)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return slug
    }
  }

  return null
}

/**
 * Sync Wikipedia awards to the game_awards table
 *
 * @param gameId - The game's UUID
 * @param wikipediaAwards - Awards extracted from Wikipedia
 * @returns Number of awards synced
 */
export async function syncGameAwardsFromWikipedia(
  gameId: string,
  wikipediaAwards: WikipediaAward[]
): Promise<{ synced: number; skipped: number; errors: string[] }> {
  // Use admin client since this is only called from admin routes
  const supabase = createAdminClient()
  const errors: string[] = []
  let synced = 0
  let skipped = 0

  if (!wikipediaAwards || wikipediaAwards.length === 0) {
    return { synced: 0, skipped: 0, errors: [] }
  }

  // Fetch all awards from database for matching
  const { data: allAwards } = await supabase
    .from('awards')
    .select('id, slug, name, short_name')
    .eq('is_active', true)

  if (!allAwards || allAwards.length === 0) {
    return { synced: 0, skipped: 0, errors: ['No awards found in database'] }
  }

  // Create a map for quick lookup
  const awardsBySlug = new Map(allAwards.map(a => [a.slug, a]))

  for (const wikiAward of wikipediaAwards) {
    // Skip awards without a year
    if (!wikiAward.year) {
      skipped++
      continue
    }

    // Match to our database
    const slug = matchAwardSlug(wikiAward.name)
    if (!slug) {
      skipped++
      continue
    }

    const dbAward = awardsBySlug.get(slug)
    if (!dbAward) {
      skipped++
      continue
    }

    // Map Wikipedia result to our result format
    const result = wikiAward.result === 'winner' ? 'winner'
      : wikiAward.result === 'nominated' ? 'nominated'
      : wikiAward.result === 'finalist' ? 'finalist'
      : wikiAward.result === 'recommended' ? 'recommended'
      : 'nominated' // Default to nominated for unknown

    // Upsert the game_award record (without category_id for now)
    const { error } = await supabase
      .from('game_awards')
      .upsert({
        game_id: gameId,
        award_id: dbAward.id,
        category_id: null, // Wikipedia doesn't give us specific category
        year: wikiAward.year,
        result,
      }, {
        onConflict: 'game_id,award_id,category_id,year',
        ignoreDuplicates: false, // Update if exists
      })

    if (error) {
      errors.push(`Failed to sync ${wikiAward.name} ${wikiAward.year}: ${error.message}`)
    } else {
      synced++
    }
  }

  console.log(`  [Awards] Synced ${synced} awards, skipped ${skipped}`)
  return { synced, skipped, errors }
}
