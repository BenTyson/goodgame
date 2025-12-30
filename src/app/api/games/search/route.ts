import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/games/search
 * Search for games by name
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    if (!query || query.length < 2) {
      return NextResponse.json({ games: [] })
    }

    const supabase = await createClient()

    // Try RPC function first, fall back to simple search
    const { data: rpcData, error: rpcError } = await supabase.rpc('search_games', {
      search_query: query
    })

    if (!rpcError && rpcData) {
      const games = rpcData.slice(0, limit).map((game: Record<string, unknown>) => ({
        id: game.id,
        name: game.name,
        slug: game.slug,
        thumbnail_url: game.thumbnail_url,
        year_published: game.year_published,
      }))
      return NextResponse.json({ games })
    }

    // Fallback: simple ilike search
    const { data, error } = await supabase
      .from('games')
      .select('id, name, slug, thumbnail_url, year_published')
      .ilike('name', `%${query}%`)
      .order('bgg_rank', { ascending: true, nullsFirst: false })
      .limit(limit)

    if (error) {
      console.error('Error searching games:', error)
      return NextResponse.json({ games: [] })
    }

    return NextResponse.json({ games: data || [] })
  } catch (error) {
    console.error('Error in GET /api/games/search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
