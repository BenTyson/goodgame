import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

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
