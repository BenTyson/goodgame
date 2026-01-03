import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// GET /api/admin/games?search=term - Search all games (for admin game picker)
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const adminClient = createAdminClient()

    let query = adminClient
      .from('games')
      .select('id, name, slug, year_published, is_published')
      .order('name')
      .limit(limit)

    if (search.length >= 2) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return ApiErrors.database(error, { route: 'GET /api/admin/games' })
    }

    return NextResponse.json({ games: data || [] })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'GET /api/admin/games' })
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  // Check admin auth
  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { gameId, data } = await request.json()

    if (!gameId || !data) {
      return ApiErrors.validation('Missing required fields')
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('games')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId)

    if (error) {
      return ApiErrors.database(error, { route: 'PATCH /api/admin/games' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/games' })
  }
}
