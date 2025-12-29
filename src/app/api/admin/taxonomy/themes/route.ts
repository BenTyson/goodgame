import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// Create a new theme
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { name, slug, description, icon, display_order, bgg_id, bgg_name } = await request.json()

    if (!name || !slug) {
      return ApiErrors.validation('Missing required fields: name, slug')
    }

    const adminClient = createAdminClient()

    // Check if slug already exists
    const { data: existing } = await adminClient
      .from('themes')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return ApiErrors.conflict('A theme with this slug already exists')
    }

    const { data: item, error } = await adminClient
      .from('themes')
      .insert({
        name,
        slug,
        description: description || null,
        icon: icon || null,
        display_order: display_order || 0,
        bgg_id: bgg_id || null,
        bgg_name: bgg_name || null,
      })
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'POST /api/admin/taxonomy/themes' })
    }

    return NextResponse.json({ item })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/taxonomy/themes' })
  }
}

// Update a theme
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
        .from('themes')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', id)
        .single()

      if (existing) {
        return ApiErrors.conflict('A theme with this slug already exists')
      }
    }

    const { data: item, error } = await adminClient
      .from('themes')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'PATCH /api/admin/taxonomy/themes' })
    }

    return NextResponse.json({ item })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/taxonomy/themes' })
  }
}

// Delete a theme
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

    // game_themes junction table has CASCADE delete, so links will be removed
    const { error } = await adminClient
      .from('themes')
      .delete()
      .eq('id', id)

    if (error) {
      return ApiErrors.database(error, { route: 'DELETE /api/admin/taxonomy/themes' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/admin/taxonomy/themes' })
  }
}
