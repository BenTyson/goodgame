import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

interface CreateTaxonomyRequest {
  suggestionId: string
  gameId: string
  type: 'theme' | 'player_experience'
  name: string
  description?: string | null
  slug: string
}

/**
 * POST /api/admin/games/taxonomy/create
 * Create a new theme or player experience from an AI suggestion
 */
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const body: CreateTaxonomyRequest = await request.json()
    const { suggestionId, gameId, type, name, description, slug } = body

    if (!suggestionId || !gameId || !type || !name || !slug) {
      return ApiErrors.validation('Missing required fields: suggestionId, gameId, type, name, slug')
    }

    if (type !== 'theme' && type !== 'player_experience') {
      return ApiErrors.validation('Type must be "theme" or "player_experience"')
    }

    const adminClient = createAdminClient()

    // Check if slug already exists
    const table = type === 'theme' ? 'themes' : 'player_experiences'
    const { data: existing } = await adminClient
      .from(table)
      .select('id, name')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({
        error: `A ${type.replace('_', ' ')} with slug "${slug}" already exists: "${existing.name}"`,
      }, { status: 409 })
    }

    // Get the maximum display_order
    const { data: maxOrder } = await adminClient
      .from(table)
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const displayOrder = (maxOrder?.display_order ?? 0) + 1

    // Create the new taxonomy item
    const insertData = {
      slug,
      name,
      description: description || null,
      display_order: displayOrder,
    }

    const { data: newItem, error: insertError } = await adminClient
      .from(table)
      .insert(insertData)
      .select('id, name, slug, description')
      .single()

    if (insertError || !newItem) {
      return ApiErrors.database(insertError || new Error('Insert failed'), {
        route: 'POST /api/admin/games/taxonomy/create',
      })
    }

    // Link the new item to the game
    const junctionTable = type === 'theme' ? 'game_themes' : 'game_player_experiences'
    const junctionData = type === 'theme'
      ? { game_id: gameId, theme_id: newItem.id, is_primary: false, source: 'ai' }
      : { game_id: gameId, player_experience_id: newItem.id, is_primary: false, source: 'ai' }

    const { error: linkError } = await adminClient
      .from(junctionTable)
      .insert(junctionData)

    if (linkError) {
      console.error('Failed to link taxonomy to game:', linkError)
      // Don't fail the whole operation - the taxonomy was created successfully
    }

    // Mark the suggestion as accepted
    await adminClient
      .from('taxonomy_suggestions')
      .update({
        status: 'accepted',
        processed_at: new Date().toISOString(),
        target_id: newItem.id, // Link to the newly created item
      })
      .eq('id', suggestionId)

    return NextResponse.json({
      success: true,
      item: newItem,
    })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/games/taxonomy/create' })
  }
}
