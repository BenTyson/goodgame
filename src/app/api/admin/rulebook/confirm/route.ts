import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

/**
 * POST /api/admin/rulebook/confirm
 * Confirm that a rulebook upload completed successfully and update the game record
 *
 * Called after client completes direct upload to Supabase Storage
 */
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.FILE_UPLOAD)
  if (rateLimited) return rateLimited

  // Check admin auth
  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { gameId, publicUrl } = await request.json()

    if (!gameId || !publicUrl) {
      return ApiErrors.validation('Missing required fields: gameId, publicUrl')
    }

    const adminClient = createAdminClient()

    // Update game record with the rulebook URL and reset state
    const { error: updateError } = await adminClient
      .from('games')
      .update({
        rulebook_url: publicUrl,
        rulebook_source: 'user_submitted',
        vecna_state: 'rulebook_ready',
        vecna_error: null,
        vecna_processed_at: new Date().toISOString(),
      })
      .eq('id', gameId)

    if (updateError) {
      console.error('Failed to update game with rulebook URL:', updateError)
      return NextResponse.json(
        { error: 'Failed to update game record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
    })
  } catch (error) {
    console.error('Rulebook confirm error:', error)
    const message = error instanceof Error ? error.message : 'Failed to confirm upload'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
