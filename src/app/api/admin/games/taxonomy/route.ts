import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import type { Theme, PlayerExperience, TaxonomySuggestion } from '@/types/database'

interface TaxonomyResponse {
  themes: Theme[]
  playerExperiences: PlayerExperience[]
  currentThemes: { theme_id: string; is_primary: boolean | null }[]
  currentExperiences: { player_experience_id: string; is_primary: boolean | null }[]
  suggestions: TaxonomySuggestion[]
}

/**
 * GET /api/admin/games/taxonomy?gameId=xxx
 * Fetch all themes/experiences + game's current assignments + AI suggestions
 */
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
      return ApiErrors.validation('Missing required parameter: gameId')
    }

    const adminClient = createAdminClient()

    // Fetch all data in parallel
    const [
      themesResult,
      experiencesResult,
      currentThemesResult,
      currentExperiencesResult,
      suggestionsResult,
    ] = await Promise.all([
      adminClient.from('themes').select('*').order('display_order'),
      adminClient.from('player_experiences').select('*').order('display_order'),
      adminClient.from('game_themes').select('theme_id, is_primary').eq('game_id', gameId),
      adminClient.from('game_player_experiences').select('player_experience_id, is_primary').eq('game_id', gameId),
      adminClient
        .from('taxonomy_suggestions')
        .select('*')
        .eq('game_id', gameId)
        .eq('status', 'pending')
        .order('confidence', { ascending: false }),
    ])

    const response: TaxonomyResponse = {
      themes: themesResult.data || [],
      playerExperiences: experiencesResult.data || [],
      currentThemes: currentThemesResult.data || [],
      currentExperiences: currentExperiencesResult.data || [],
      suggestions: suggestionsResult.data || [],
    }

    return NextResponse.json(response)
  } catch (error) {
    return ApiErrors.internal(error, { route: 'GET /api/admin/games/taxonomy' })
  }
}

interface SaveTaxonomyRequest {
  gameId: string
  themes: { themeId: string; isPrimary: boolean }[]
  experiences: { experienceId: string; isPrimary: boolean }[]
  acceptedSuggestionIds?: string[]
  rejectedSuggestionIds?: string[]
}

/**
 * POST /api/admin/games/taxonomy
 * Save game's taxonomy assignments
 */
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const body: SaveTaxonomyRequest = await request.json()
    const { gameId, themes, experiences, acceptedSuggestionIds, rejectedSuggestionIds } = body

    if (!gameId) {
      return ApiErrors.validation('Missing required field: gameId')
    }

    const adminClient = createAdminClient()

    // Start a transaction-like operation
    // 1. Delete existing theme assignments
    const { error: deleteThemesError } = await adminClient
      .from('game_themes')
      .delete()
      .eq('game_id', gameId)

    if (deleteThemesError) {
      return ApiErrors.database(deleteThemesError, { route: 'POST /api/admin/games/taxonomy - delete themes' })
    }

    // 2. Insert new theme assignments
    if (themes && themes.length > 0) {
      const themeInserts = themes.map(t => ({
        game_id: gameId,
        theme_id: t.themeId,
        is_primary: t.isPrimary,
      }))

      const { error: insertThemesError } = await adminClient
        .from('game_themes')
        .insert(themeInserts)

      if (insertThemesError) {
        return ApiErrors.database(insertThemesError, { route: 'POST /api/admin/games/taxonomy - insert themes' })
      }
    }

    // 3. Delete existing experience assignments
    const { error: deleteExperiencesError } = await adminClient
      .from('game_player_experiences')
      .delete()
      .eq('game_id', gameId)

    if (deleteExperiencesError) {
      return ApiErrors.database(deleteExperiencesError, { route: 'POST /api/admin/games/taxonomy - delete experiences' })
    }

    // 4. Insert new experience assignments
    if (experiences && experiences.length > 0) {
      const experienceInserts = experiences.map(e => ({
        game_id: gameId,
        player_experience_id: e.experienceId,
        is_primary: e.isPrimary,
      }))

      const { error: insertExperiencesError } = await adminClient
        .from('game_player_experiences')
        .insert(experienceInserts)

      if (insertExperiencesError) {
        return ApiErrors.database(insertExperiencesError, { route: 'POST /api/admin/games/taxonomy - insert experiences' })
      }
    }

    // 5. Update suggestion statuses
    const now = new Date().toISOString()

    if (acceptedSuggestionIds && acceptedSuggestionIds.length > 0) {
      await adminClient
        .from('taxonomy_suggestions')
        .update({ status: 'accepted', processed_at: now })
        .in('id', acceptedSuggestionIds)
    }

    if (rejectedSuggestionIds && rejectedSuggestionIds.length > 0) {
      await adminClient
        .from('taxonomy_suggestions')
        .update({ status: 'rejected', processed_at: now })
        .in('id', rejectedSuggestionIds)
    }

    // Mark any remaining pending suggestions as rejected (user skipped them)
    await adminClient
      .from('taxonomy_suggestions')
      .update({ status: 'rejected', processed_at: now })
      .eq('game_id', gameId)
      .eq('status', 'pending')

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/games/taxonomy' })
  }
}

interface UpdateSuggestionRequest {
  suggestionId: string
  status: 'accepted' | 'rejected'
}

/**
 * PATCH /api/admin/games/taxonomy
 * Update a single suggestion status
 */
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const body: UpdateSuggestionRequest = await request.json()
    const { suggestionId, status } = body

    if (!suggestionId || !status) {
      return ApiErrors.validation('Missing required fields: suggestionId, status')
    }

    if (status !== 'accepted' && status !== 'rejected') {
      return ApiErrors.validation('Status must be "accepted" or "rejected"')
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('taxonomy_suggestions')
      .update({
        status,
        processed_at: new Date().toISOString(),
      })
      .eq('id', suggestionId)
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'PATCH /api/admin/games/taxonomy' })
    }

    return NextResponse.json({ suggestion: data })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/games/taxonomy' })
  }
}
