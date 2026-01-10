import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// Get purchase links for a game
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return ApiErrors.validation('Missing required query param: gameId')
    }

    const adminClient = createAdminClient()

    const { data: links, error } = await adminClient
      .from('affiliate_links')
      .select(`
        *,
        retailer:retailers(*)
      `)
      .eq('game_id', gameId)
      .order('display_order', { ascending: true })

    if (error) {
      return ApiErrors.database(error, { route: 'GET /api/admin/purchase-links' })
    }

    return NextResponse.json({ links })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'GET /api/admin/purchase-links' })
  }
}

// Create a new purchase link
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const {
      gameId,
      retailerId,
      url,
      productId,
      label,
      displayOrder,
      isPrimary,
    } = await request.json()

    if (!gameId) {
      return ApiErrors.validation('Missing required field: gameId')
    }

    if (!retailerId && !url) {
      return ApiErrors.validation('Either retailerId or url must be provided')
    }

    const adminClient = createAdminClient()

    // Get retailer info for provider name (backward compatibility)
    let provider = 'custom'
    let finalUrl = url

    if (retailerId) {
      const { data: retailer } = await adminClient
        .from('retailers')
        .select('slug, name, url_pattern, affiliate_tag')
        .eq('id', retailerId)
        .single()

      if (retailer) {
        provider = retailer.slug

        // Build URL from pattern if not provided directly
        if (!url && retailer.url_pattern && productId) {
          finalUrl = retailer.url_pattern
            .replace('{product_id}', productId)
            .replace('{asin}', productId)
            .replace('{affiliate_tag}', retailer.affiliate_tag || '')
        }
      }
    }

    if (!finalUrl) {
      return ApiErrors.validation('Could not determine URL. Provide url or valid productId with retailer pattern.')
    }

    // If setting as primary, unset other primary links for this game
    if (isPrimary) {
      await adminClient
        .from('affiliate_links')
        .update({ is_primary: false })
        .eq('game_id', gameId)
    }

    // Get next display order if not specified
    let order = displayOrder
    if (order === undefined || order === null) {
      const { data: existingLinks } = await adminClient
        .from('affiliate_links')
        .select('display_order')
        .eq('game_id', gameId)
        .order('display_order', { ascending: false })
        .limit(1)

      order = existingLinks?.[0]?.display_order
        ? (existingLinks[0].display_order + 10)
        : 10
    }

    const { data: link, error } = await adminClient
      .from('affiliate_links')
      .insert({
        game_id: gameId,
        retailer_id: retailerId || null,
        provider,
        url: finalUrl,
        product_id: productId || null,
        label: label || null,
        display_order: order,
        is_primary: isPrimary || false,
      })
      .select(`
        *,
        retailer:retailers(*)
      `)
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'POST /api/admin/purchase-links' })
    }

    return NextResponse.json({ link })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/purchase-links' })
  }
}

// Update a purchase link
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { linkId, data } = await request.json()

    if (!linkId || !data) {
      return ApiErrors.validation('Missing required fields: linkId, data')
    }

    const adminClient = createAdminClient()

    // If setting as primary, first get the game_id and unset other primaries
    if (data.is_primary) {
      const { data: existingLink } = await adminClient
        .from('affiliate_links')
        .select('game_id')
        .eq('id', linkId)
        .single()

      if (existingLink?.game_id) {
        await adminClient
          .from('affiliate_links')
          .update({ is_primary: false })
          .eq('game_id', existingLink.game_id)
          .neq('id', linkId)
      }
    }

    // If changing retailer, update provider field for backward compatibility
    if (data.retailer_id) {
      const { data: retailer } = await adminClient
        .from('retailers')
        .select('slug')
        .eq('id', data.retailer_id)
        .single()

      if (retailer) {
        data.provider = retailer.slug
      }
    }

    const { data: link, error } = await adminClient
      .from('affiliate_links')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkId)
      .select(`
        *,
        retailer:retailers(*)
      `)
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'PATCH /api/admin/purchase-links' })
    }

    return NextResponse.json({ link })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/purchase-links' })
  }
}

// Delete a purchase link
export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { linkId } = await request.json()

    if (!linkId) {
      return ApiErrors.validation('Missing required field: linkId')
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('affiliate_links')
      .delete()
      .eq('id', linkId)

    if (error) {
      return ApiErrors.database(error, { route: 'DELETE /api/admin/purchase-links' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/admin/purchase-links' })
  }
}
