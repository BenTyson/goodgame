import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// Create a new publisher
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { name, slug, description, website, logo_url } = await request.json()

    if (!name || !slug) {
      return ApiErrors.validation('Missing required fields: name, slug')
    }

    const adminClient = createAdminClient()

    // Check if slug already exists
    const { data: existing } = await adminClient
      .from('publishers')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return ApiErrors.conflict('A publisher with this slug already exists')
    }

    const { data: publisher, error } = await adminClient
      .from('publishers')
      .insert({
        name,
        slug,
        description: description || null,
        website: website || null,
        logo_url: logo_url || null,
      })
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'POST /api/admin/publishers' })
    }

    return NextResponse.json({ publisher })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/publishers' })
  }
}

// Update a publisher
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { publisherId, data } = await request.json()

    if (!publisherId || !data) {
      return ApiErrors.validation('Missing required fields: publisherId, data')
    }

    const adminClient = createAdminClient()

    // If changing slug, check it doesn't already exist
    if (data.slug) {
      const { data: existing } = await adminClient
        .from('publishers')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', publisherId)
        .single()

      if (existing) {
        return ApiErrors.conflict('A publisher with this slug already exists')
      }
    }

    const { data: publisher, error } = await adminClient
      .from('publishers')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', publisherId)
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'PATCH /api/admin/publishers' })
    }

    return NextResponse.json({ publisher })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/publishers' })
  }
}

// Delete a publisher
export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { publisherId, logoStoragePath } = await request.json()

    if (!publisherId) {
      return ApiErrors.validation('Missing required field: publisherId')
    }

    const adminClient = createAdminClient()

    // Delete logo from storage if path provided
    if (logoStoragePath) {
      await adminClient.storage.from('publisher-logos').remove([logoStoragePath])
    }

    // game_publishers junction table has CASCADE delete, so links will be removed
    const { error } = await adminClient
      .from('publishers')
      .delete()
      .eq('id', publisherId)

    if (error) {
      return ApiErrors.database(error, { route: 'DELETE /api/admin/publishers' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/admin/publishers' })
  }
}
