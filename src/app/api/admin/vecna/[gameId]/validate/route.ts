/**
 * Vecna Content Validation Endpoint
 *
 * GET /api/admin/vecna/[gameId]/validate
 *
 * Validates generated content quality before publication.
 * Returns quality scores and issues that need attention.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  validateAllContent,
  getQualitySummary,
  type ContentQualityConfig,
} from '@/lib/vecna/quality'
import type { RulesContent, SetupContent, ReferenceContent } from '@/lib/rulebook'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
    const supabase = createAdminClient()

    // Fetch game with content
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        id, name, slug,
        rules_content, setup_content, reference_content,
        vecna_state
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Check if game has generated content
    if (!game.rules_content && !game.setup_content && !game.reference_content) {
      return NextResponse.json({
        gameId: game.id,
        gameName: game.name,
        hasContent: false,
        message: 'No generated content to validate',
        validation: null,
      })
    }

    // Parse URL params for config overrides
    const url = new URL(request.url)
    const isComplexGame = url.searchParams.get('complex') === 'true'

    const config: Partial<ContentQualityConfig> = {
      isComplexGame,
    }

    // Run validation
    const validation = validateAllContent(
      game.rules_content as RulesContent | null,
      game.setup_content as SetupContent | null,
      game.reference_content as ReferenceContent | null,
      config
    )

    return NextResponse.json({
      gameId: game.id,
      gameName: game.name,
      vecnaState: game.vecna_state,
      hasContent: true,
      validation: {
        passed: validation.overall.passed,
        score: validation.overall.score,
        summary: getQualitySummary(validation.overall),
        issueCounts: validation.overall.summary,
        sections: {
          rules: {
            passed: validation.rules.passed,
            score: validation.rules.score,
            issues: validation.rules.issues,
          },
          setup: {
            passed: validation.setup.passed,
            score: validation.setup.score,
            issues: validation.setup.issues,
          },
          reference: {
            passed: validation.reference.passed,
            score: validation.reference.score,
            issues: validation.reference.issues,
          },
        },
        allIssues: validation.overall.issues,
      },
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({
      error: 'Validation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/vecna/[gameId]/validate
 *
 * Validate and optionally update game state based on quality.
 * If validation passes and autoApprove is true, moves game to review_pending.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
    const body = await request.json()
    const { autoApprove = false } = body

    const supabase = createAdminClient()

    // Fetch game with content
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        id, name, slug,
        rules_content, setup_content, reference_content,
        vecna_state
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Run validation
    const validation = validateAllContent(
      game.rules_content as RulesContent | null,
      game.setup_content as SetupContent | null,
      game.reference_content as ReferenceContent | null
    )

    // If validation passed and autoApprove requested, update state
    let stateUpdated = false
    if (validation.overall.passed && autoApprove && game.vecna_state === 'generated') {
      const { error: updateError } = await supabase
        .from('games')
        .update({
          vecna_state: 'review_pending',
          vecna_processed_at: new Date().toISOString(),
        })
        .eq('id', gameId)

      if (!updateError) {
        stateUpdated = true
      }
    }

    return NextResponse.json({
      gameId: game.id,
      gameName: game.name,
      validation: {
        passed: validation.overall.passed,
        score: validation.overall.score,
        summary: getQualitySummary(validation.overall),
        issueCounts: validation.overall.summary,
      },
      stateUpdated,
      newState: stateUpdated ? 'review_pending' : game.vecna_state,
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({
      error: 'Validation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
