import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

interface ResetOptions {
  resetRulebook?: boolean      // Clear rulebook URL and source
  resetCrunch?: boolean        // Clear Crunch Score and breakdown
  resetBNCS?: boolean          // Legacy alias for resetCrunch
  resetContent?: boolean       // Clear rules, setup, reference content
  resetTaxonomy?: boolean      // Clear taxonomy suggestions
  resetAll?: boolean           // Clear everything
}

/**
 * POST /api/admin/games/[id]/reset-content
 * Reset parsed content for a game to allow re-parsing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { id: gameId } = await params
    const body: ResetOptions = await request.json().catch(() => ({}))

    // Default to reset all if no specific options provided
    const {
      resetRulebook = false,
      resetCrunch = false,
      resetBNCS = false,  // Legacy alias
      resetContent = false,
      resetTaxonomy = false,
      resetAll = false,
    } = body

    // Support legacy resetBNCS as alias for resetCrunch
    const shouldResetCrunch = resetCrunch || resetBNCS
    const shouldResetAll = resetAll || (!resetRulebook && !shouldResetCrunch && !resetContent && !resetTaxonomy)

    const adminClient = createAdminClient()

    // Build update object based on options
    const updateData: Record<string, unknown> = {}

    if (shouldResetAll || resetRulebook) {
      updateData.rulebook_url = null
      updateData.rulebook_source = null
      updateData.rulebook_parsed_at = null
      updateData.latest_parse_log_id = null
    }

    if (shouldResetAll || shouldResetCrunch) {
      updateData.crunch_score = null
      updateData.crunch_breakdown = null
      updateData.crunch_generated_at = null
      updateData.crunch_bgg_reference = null
    }

    if (shouldResetAll || resetContent) {
      updateData.rules_content = null
      updateData.setup_content = null
      updateData.reference_content = null
      updateData.has_rules = false
      updateData.has_setup_guide = false
      updateData.has_reference = false
      updateData.tagline = null
      updateData.component_list = null
    }

    // Update game record
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await adminClient
        .from('games')
        .update(updateData)
        .eq('id', gameId)

      if (updateError) {
        return ApiErrors.database(updateError, { route: 'POST /api/admin/games/[id]/reset-content' })
      }
    }

    // Clear related records
    if (shouldResetAll || resetTaxonomy) {
      await adminClient
        .from('taxonomy_suggestions')
        .delete()
        .eq('game_id', gameId)

      // Also clear game_themes and game_player_experiences assignments
      await adminClient
        .from('game_themes')
        .delete()
        .eq('game_id', gameId)

      await adminClient
        .from('game_player_experiences')
        .delete()
        .eq('game_id', gameId)
    }

    if (shouldResetAll || resetRulebook) {
      await adminClient
        .from('rulebook_parse_log')
        .delete()
        .eq('game_id', gameId)
    }

    if (shouldResetAll || resetContent) {
      await adminClient
        .from('content_generation_log')
        .delete()
        .eq('game_id', gameId)
    }

    return NextResponse.json({
      success: true,
      reset: {
        rulebook: shouldResetAll || resetRulebook,
        crunch: shouldResetAll || shouldResetCrunch,
        bncs: shouldResetAll || shouldResetCrunch,  // Legacy alias
        content: shouldResetAll || resetContent,
        taxonomy: shouldResetAll || resetTaxonomy,
      },
    })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/games/[id]/reset-content' })
  }
}
