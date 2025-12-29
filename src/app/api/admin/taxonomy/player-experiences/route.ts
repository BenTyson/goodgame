import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// Create a new player experience
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { name, slug, description, icon, display_order } = await request.json()

    if (!name || !slug) {
      return ApiErrors.validation('Missing required fields: name, slug')
    }

    const adminClient = createAdminClient()

    // Check if slug already exists
    const { data: existing } = await adminClient
      .from('player_experiences')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return ApiErrors.conflict('A player experience with this slug already exists')
    }

    const { data: item, error } = await adminClient
      .from('player_experiences')
      .insert({
        name,
        slug,
        description: description || null,
        icon: icon || null,
        display_order: display_order || 0,
      })
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'POST /api/admin/taxonomy/player-experiences' })
    }

    return NextResponse.json({ item })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/taxonomy/player-experiences' })
  }
}

// Update a player experience
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { id, data } = await request.json()

    if (!id || !data) {
      return ApiErrors.validation('Missing required fields: id, data')
    }

    const adminClient = createAdminClient()

    // If changing slug, check it doesn't already exist
    if (data.slug) {
      const { data: existing } = await adminClient
        .from('player_experiences')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', id)
        .single()

      if (existing) {
        return ApiErrors.conflict('A player experience with this slug already exists')
      }
    }

    const { data: item, error } = await adminClient
      .from('player_experiences')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'PATCH /api/admin/taxonomy/player-experiences' })
    }

    return NextResponse.json({ item })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/taxonomy/player-experiences' })
  }
}

// Delete a player experience
export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { id } = await request.json()

    if (!id) {
      return ApiErrors.validation('Missing required field: id')
    }

    const adminClient = createAdminClient()

    // game_player_experiences junction table has CASCADE delete, so links will be removed
    const { error } = await adminClient
      .from('player_experiences')
      .delete()
      .eq('id', id)

    if (error) {
      return ApiErrors.database(error, { route: 'DELETE /api/admin/taxonomy/player-experiences' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/admin/taxonomy/player-experiences' })
  }
}
