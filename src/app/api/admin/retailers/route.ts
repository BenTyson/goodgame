import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// Get all retailers
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let query = adminClient
      .from('retailers')
      .select('*')
      .order('display_order', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: retailers, error } = await query

    if (error) {
      return ApiErrors.database(error, { route: 'GET /api/admin/retailers' })
    }

    return NextResponse.json({ retailers })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'GET /api/admin/retailers' })
  }
}

// Create a new retailer
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const {
      name,
      slug,
      logo_url,
      brand_color,
      url_pattern,
      affiliate_tag,
      retailer_type,
      display_order,
    } = await request.json()

    if (!name || !slug) {
      return ApiErrors.validation('Missing required fields: name, slug')
    }

    const adminClient = createAdminClient()

    // Check if slug already exists
    const { data: existing } = await adminClient
      .from('retailers')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return ApiErrors.conflict('A retailer with this slug already exists')
    }

    const { data: retailer, error } = await adminClient
      .from('retailers')
      .insert({
        name,
        slug,
        logo_url: logo_url || null,
        brand_color: brand_color || null,
        url_pattern: url_pattern || null,
        affiliate_tag: affiliate_tag || null,
        retailer_type: retailer_type || 'online',
        display_order: display_order ?? 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'POST /api/admin/retailers' })
    }

    return NextResponse.json({ retailer })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/retailers' })
  }
}

// Update a retailer
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { retailerId, data } = await request.json()

    if (!retailerId || !data) {
      return ApiErrors.validation('Missing required fields: retailerId, data')
    }

    const adminClient = createAdminClient()

    // If changing slug, check it doesn't already exist
    if (data.slug) {
      const { data: existing } = await adminClient
        .from('retailers')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', retailerId)
        .single()

      if (existing) {
        return ApiErrors.conflict('A retailer with this slug already exists')
      }
    }

    const { data: retailer, error } = await adminClient
      .from('retailers')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', retailerId)
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'PATCH /api/admin/retailers' })
    }

    return NextResponse.json({ retailer })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/retailers' })
  }
}

// Soft delete a retailer (set is_active = false)
export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { retailerId, hardDelete } = await request.json()

    if (!retailerId) {
      return ApiErrors.validation('Missing required field: retailerId')
    }

    const adminClient = createAdminClient()

    if (hardDelete) {
      // Hard delete - only for retailers with no affiliate links
      const { data: links } = await adminClient
        .from('affiliate_links')
        .select('id')
        .eq('retailer_id', retailerId)
        .limit(1)

      if (links && links.length > 0) {
        return ApiErrors.conflict('Cannot delete retailer with existing purchase links. Use soft delete instead.')
      }

      const { error } = await adminClient
        .from('retailers')
        .delete()
        .eq('id', retailerId)

      if (error) {
        return ApiErrors.database(error, { route: 'DELETE /api/admin/retailers (hard)' })
      }
    } else {
      // Soft delete - set is_active = false
      const { error } = await adminClient
        .from('retailers')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', retailerId)

      if (error) {
        return ApiErrors.database(error, { route: 'DELETE /api/admin/retailers (soft)' })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/admin/retailers' })
  }
}
