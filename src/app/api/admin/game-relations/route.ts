import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// Create a new game relation
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { sourceGameId, targetGameId, relationType } = await request.json()

    if (!sourceGameId || !targetGameId || !relationType) {
      return ApiErrors.validation('Missing required fields: sourceGameId, targetGameId, relationType')
    }

    if (sourceGameId === targetGameId) {
      return ApiErrors.validation('Cannot create a relation to the same game')
    }

    const adminClient = createAdminClient()

    // Check if relation already exists
    const { data: existing } = await adminClient
      .from('game_relations')
      .select('id')
      .eq('source_game_id', sourceGameId)
      .eq('target_game_id', targetGameId)
      .single()

    if (existing) {
      return ApiErrors.conflict('A relation between these games already exists')
    }

    const { data: relation, error } = await adminClient
      .from('game_relations')
      .insert({
        source_game_id: sourceGameId,
        target_game_id: targetGameId,
        relation_type: relationType,
      })
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'POST /api/admin/game-relations' })
    }

    return NextResponse.json({ relation })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/game-relations' })
  }
}

// Delete a game relation
export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { relationId } = await request.json()

    if (!relationId) {
      return ApiErrors.validation('Missing required field: relationId')
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('game_relations')
      .delete()
      .eq('id', relationId)

    if (error) {
      return ApiErrors.database(error, { route: 'DELETE /api/admin/game-relations' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/admin/game-relations' })
  }
}

// Update a game relation
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { relationId, relationType } = await request.json()

    if (!relationId || !relationType) {
      return ApiErrors.validation('Missing required fields: relationId, relationType')
    }

    const adminClient = createAdminClient()

    const { data: relation, error } = await adminClient
      .from('game_relations')
      .update({ relation_type: relationType })
      .eq('id', relationId)
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'PATCH /api/admin/game-relations' })
    }

    return NextResponse.json({ relation })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/game-relations' })
  }
}
