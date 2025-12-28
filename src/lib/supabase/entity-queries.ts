import { createClient } from './server'
import { createStaticClient } from './game-queries'
import type { Designer, Publisher, Artist, Game, Award, AwardCategory } from '@/types/database'

// ===========================================
// DESIGNERS
// ===========================================

export async function getDesigners(): Promise<Designer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('designers')
    .select('*')
    .order('name')

  if (error) {
    return []
  }

  return data || []
}

export async function getDesignerBySlug(slug: string): Promise<Designer | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('designers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByDesigner(designerSlug: string): Promise<Game[]> {
  const supabase = await createClient()

  const designer = await getDesignerBySlug(designerSlug)
  if (!designer) return []

  const { data, error } = await supabase
    .from('game_designers')
    .select('game_id, games(*)')
    .eq('designer_id', designer.id)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.games as Game)
    .filter(game => game && game.is_published)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getGameDesigners(gameId: string): Promise<Designer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_designers')
    .select('designer_id, display_order, designers(*)')
    .eq('game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.designers as Designer)
    .filter(d => d !== null)
}

export async function getAllDesignerSlugs(): Promise<string[]> {
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('designers')
    .select('slug')

  if (error) {
    return []
  }

  return data?.map(d => d.slug) || []
}

// ===========================================
// PUBLISHERS
// ===========================================

export async function getPublishers(): Promise<Publisher[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('publishers')
    .select('*')
    .order('name')

  if (error) {
    return []
  }

  return data || []
}

export async function getPublisherBySlug(slug: string): Promise<Publisher | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('publishers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByPublisher(publisherSlug: string): Promise<Game[]> {
  const supabase = await createClient()

  const publisher = await getPublisherBySlug(publisherSlug)
  if (!publisher) return []

  const { data, error } = await supabase
    .from('game_publishers')
    .select('game_id, games(*)')
    .eq('publisher_id', publisher.id)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.games as Game)
    .filter(game => game && game.is_published)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getGamePublishers(gameId: string): Promise<Publisher[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_publishers')
    .select('publisher_id, display_order, publishers(*)')
    .eq('game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.publishers as Publisher)
    .filter(p => p !== null)
}

export async function getAllPublisherSlugs(): Promise<string[]> {
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('publishers')
    .select('slug')

  if (error) {
    return []
  }

  return data?.map(p => p.slug) || []
}

export type PublisherCategory = {
  slug: string
  name: string
  count: number
}

export type PublisherWithGameCount = Publisher & {
  game_count: number
  top_categories: PublisherCategory[]
}

export async function getPublishersWithGameCounts(): Promise<PublisherWithGameCount[]> {
  const supabase = await createClient()

  // Get all publishers
  const { data: publishers, error } = await supabase
    .from('publishers')
    .select('*')
    .order('name')

  if (error || !publishers) {
    return []
  }

  // Get all categories for reference
  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, slug, name')

  const categoryMap = new Map(allCategories?.map(c => [c.id, { slug: c.slug, name: c.name }]) || [])

  // Get game counts and categories for each publisher (only counting published games)
  const publishersWithCounts = await Promise.all(
    publishers.map(async (publisher) => {
      // Get published games for this publisher
      const { data: gameLinks } = await supabase
        .from('game_publishers')
        .select('game_id, games!inner(id, is_published)')
        .eq('publisher_id', publisher.id)
        .eq('games.is_published', true)

      const gameIds = gameLinks?.map(gl => gl.game_id) || []

      // Get categories for these games
      let top_categories: PublisherCategory[] = []
      if (gameIds.length > 0) {
        const { data: gameCategoryLinks } = await supabase
          .from('game_categories')
          .select('category_id')
          .in('game_id', gameIds)

        // Count category occurrences
        const categoryCounts = new Map<string, number>()
        gameCategoryLinks?.forEach(link => {
          const count = categoryCounts.get(link.category_id) || 0
          categoryCounts.set(link.category_id, count + 1)
        })

        // Convert to array and sort by count, take top 3
        top_categories = Array.from(categoryCounts.entries())
          .map(([categoryId, count]) => {
            const cat = categoryMap.get(categoryId)
            return cat ? { slug: cat.slug, name: cat.name, count } : null
          })
          .filter((c): c is PublisherCategory => c !== null)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
      }

      return {
        ...publisher,
        game_count: gameIds.length,
        top_categories
      }
    })
  )

  // Only return publishers with at least one published game
  return publishersWithCounts.filter(p => p.game_count > 0)
}

export type PublisherStats = {
  total_games: number
  average_rating: number | null
  year_range: { earliest: number | null; latest: number | null }
  total_awards: number
}

export async function getPublisherStats(publisherId: string): Promise<PublisherStats> {
  const supabase = await createClient()

  // Get all published games for this publisher
  const { data: gameLinks } = await supabase
    .from('game_publishers')
    .select('game_id, games!inner(id, weight, year_published, is_published)')
    .eq('publisher_id', publisherId)
    .eq('games.is_published', true)

  const games = (gameLinks || []).map(link => link.games).filter(Boolean)
  const total_games = games.length

  // Calculate average rating (using weight as a proxy since we don't have bgg_rating)
  const ratings = games
    .map(g => g.weight)
    .filter((r): r is number => r !== null && r > 0)
  const average_rating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : null

  // Calculate year range
  const years = games
    .map(g => g.year_published)
    .filter((y): y is number => y !== null)
  const year_range = {
    earliest: years.length > 0 ? Math.min(...years) : null,
    latest: years.length > 0 ? Math.max(...years) : null
  }

  // Get total awards for games by this publisher
  const gameIds = games.map(g => g.id)
  let total_awards = 0
  if (gameIds.length > 0) {
    const { count } = await supabase
      .from('game_awards')
      .select('*', { count: 'exact', head: true })
      .in('game_id', gameIds)
    total_awards = count || 0
  }

  return {
    total_games,
    average_rating,
    year_range,
    total_awards
  }
}

export type PublisherAward = {
  game: Game
  award: Award
  category: AwardCategory | null
  year: number
  result: string | null
}

export async function getPublisherAwards(publisherId: string): Promise<PublisherAward[]> {
  const supabase = await createClient()

  // Get all game IDs for this publisher
  const { data: gameLinks } = await supabase
    .from('game_publishers')
    .select('game_id')
    .eq('publisher_id', publisherId)

  if (!gameLinks || gameLinks.length === 0) return []

  const gameIds = gameLinks.map(link => link.game_id)

  // Get awards for these games
  const { data: awards, error } = await supabase
    .from('game_awards')
    .select(`
      year,
      result,
      game:games!inner(*),
      award:awards(*),
      category:award_categories(*)
    `)
    .in('game_id', gameIds)
    .eq('game.is_published', true)
    .order('year', { ascending: false })

  if (error || !awards) return []

  return awards.map(a => ({
    game: a.game as Game,
    award: a.award as Award,
    category: a.category as AwardCategory | null,
    year: a.year,
    result: a.result
  }))
}

// ===========================================
// ARTISTS
// ===========================================

export async function getArtists(): Promise<Artist[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .order('name')

  if (error) {
    return []
  }

  return data || []
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByArtist(artistSlug: string): Promise<Game[]> {
  const supabase = await createClient()

  const artist = await getArtistBySlug(artistSlug)
  if (!artist) return []

  const { data, error } = await supabase
    .from('game_artists')
    .select('game_id, games(*)')
    .eq('artist_id', artist.id)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.games as Game)
    .filter(game => game && game.is_published)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getGameArtists(gameId: string): Promise<Artist[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_artists')
    .select('artist_id, display_order, artists(*)')
    .eq('game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.artists as Artist)
    .filter(a => a !== null)
}
