import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// Create a new family
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { name, slug, description, hero_image_url } = await request.json()

    if (!name || !slug) {
      return ApiErrors.validation('Missing required fields: name, slug')
    }

    const adminClient = createAdminClient()

    // Check if slug already exists
    const { data: existing } = await adminClient
      .from('game_families')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return ApiErrors.conflict('A family with this slug already exists')
    }

    const { data: family, error } = await adminClient
      .from('game_families')
      .insert({
        name,
        slug,
        description: description || null,
        hero_image_url: hero_image_url || null,
      })
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'POST /api/admin/families' })
    }

    return NextResponse.json({ family })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/families' })
  }
}

// Update a family
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { familyId, data } = await request.json()

    if (!familyId || !data) {
      return ApiErrors.validation('Missing required fields: familyId, data')
    }

    const adminClient = createAdminClient()

    // If changing slug, check it doesn't already exist
    if (data.slug) {
      const { data: existing } = await adminClient
        .from('game_families')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', familyId)
        .single()

      if (existing) {
        return ApiErrors.conflict('A family with this slug already exists')
      }
    }

    const { data: family, error } = await adminClient
      .from('game_families')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', familyId)
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'PATCH /api/admin/families' })
    }

    return NextResponse.json({ family })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/families' })
  }
}

// Delete a family
export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { familyId } = await request.json()

    if (!familyId) {
      return ApiErrors.validation('Missing required field: familyId')
    }

    const adminClient = createAdminClient()

    // First, remove family_id from all games in this family
    await adminClient
      .from('games')
      .update({ family_id: null })
      .eq('family_id', familyId)

    // Then delete the family
    const { error } = await adminClient
      .from('game_families')
      .delete()
      .eq('id', familyId)

    if (error) {
      return ApiErrors.database(error, { route: 'DELETE /api/admin/families' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/admin/families' })
  }
}
