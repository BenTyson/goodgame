import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import {
  parsePdfFromUrl,
  getRulesSummaryPrompt,
  getSetupGuidePrompt,
  getReferenceCardPrompt,
  RULEBOOK_SYSTEM_PROMPT,
} from '@/lib/rulebook'
import type {
  RulesContent,
  SetupContent,
  ReferenceContent,
} from '@/lib/rulebook'
import { generateJSON } from '@/lib/ai/claude'
import type { Json } from '@/types/database'

/**
 * POST /api/admin/rulebook/generate-content
 * Generate rules, setup, and reference content from a parsed rulebook
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const body = await request.json()
    const { gameId, contentTypes = ['rules', 'setup', 'reference'] } = body

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID required' },
        { status: 400 }
      )
    }

    // Get game info including rulebook URL
    // Note: latest_parse_log_id is selected but cast to unknown due to type sync issues
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, name, slug, rulebook_url')
      .eq('id', gameId)
      .single() as { data: { id: string; name: string; slug: string; rulebook_url: string | null; latest_parse_log_id?: string } | null; error: unknown }

    // Get latest_parse_log_id separately since types may not be synced
    let latestParseLogId: string | null = null
    if (game?.id) {
      const { data: gameWithLog } = await supabase
        .from('games')
        .select('latest_parse_log_id')
        .eq('id', gameId)
        .single()
      latestParseLogId = (gameWithLog as { latest_parse_log_id?: string } | null)?.latest_parse_log_id ?? null
    }

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    if (!game.rulebook_url) {
      return NextResponse.json(
        { error: 'No rulebook URL set for this game. Please add a rulebook URL first.' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Try to get stored parsed text first (more efficient than re-parsing)
    let rulebookText: string | null = null

    if (latestParseLogId) {
      const { data: parseLog } = await supabase
        .from('rulebook_parse_log')
        .select('parsed_text')
        .eq('id', latestParseLogId)
        .single()

      const parsedText = (parseLog as { parsed_text?: string } | null)?.parsed_text
      if (parsedText) {
        rulebookText = parsedText
        console.log('Using stored parsed text from parse log')
      }
    }

    // If no stored text, parse the PDF
    if (!rulebookText) {
      try {
        console.log('No stored text found, parsing PDF...')
        const pdf = await parsePdfFromUrl(game.rulebook_url)
        rulebookText = pdf.text
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: `Failed to parse rulebook PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }

    // Generate content in parallel where possible
    const results: {
      rules?: RulesContent
      setup?: SetupContent
      reference?: ReferenceContent
      errors: { rules?: string; setup?: string; reference?: string }
    } = { errors: {} }

    const generatePromises: Promise<void>[] = []

    // Generate rules content
    if (contentTypes.includes('rules')) {
      generatePromises.push(
        (async () => {
          try {
            const prompt = getRulesSummaryPrompt(rulebookText, game.name)
            const result = await generateJSON<RulesContent>(
              RULEBOOK_SYSTEM_PROMPT,
              prompt,
              { temperature: 0.4, model: 'claude-3-haiku-20240307' }
            )
            results.rules = result.data
            console.log('Generated rules content keys:', Object.keys(result.data || {}))
            console.log('endGameConditions:', (result.data as RulesContent)?.endGameConditions)
            console.log('winCondition:', (result.data as RulesContent)?.winCondition)
          } catch (error) {
            console.error('Rules generation failed:', error)
            results.errors.rules = error instanceof Error ? error.message : 'Failed to generate rules'
          }
        })()
      )
    }

    // Generate setup content
    if (contentTypes.includes('setup')) {
      generatePromises.push(
        (async () => {
          try {
            const prompt = getSetupGuidePrompt(rulebookText, game.name)
            const result = await generateJSON<SetupContent>(
              RULEBOOK_SYSTEM_PROMPT,
              prompt,
              { temperature: 0.4, model: 'claude-3-haiku-20240307' }
            )
            results.setup = result.data
            console.log('Generated setup content keys:', Object.keys(result.data || {}))
            console.log('firstPlayerRule:', (result.data as SetupContent)?.firstPlayerRule)
            console.log('quickTips:', (result.data as SetupContent)?.quickTips)
          } catch (error) {
            console.error('Setup generation failed:', error)
            results.errors.setup = error instanceof Error ? error.message : 'Failed to generate setup'
          }
        })()
      )
    }

    // Generate reference content
    if (contentTypes.includes('reference')) {
      generatePromises.push(
        (async () => {
          try {
            const prompt = getReferenceCardPrompt(rulebookText, game.name)
            const result = await generateJSON<ReferenceContent>(
              RULEBOOK_SYSTEM_PROMPT,
              prompt,
              { temperature: 0.4, model: 'claude-3-haiku-20240307' }
            )
            results.reference = result.data
          } catch (error) {
            console.error('Reference generation failed:', error)
            results.errors.reference = error instanceof Error ? error.message : 'Failed to generate reference'
          }
        })()
      )
    }

    // Wait for all generations to complete
    await Promise.all(generatePromises)

    const processingTime = Date.now() - startTime

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (results.rules) {
      updateData.rules_content = results.rules as unknown as Json
      updateData.has_rules = true
    }

    if (results.setup) {
      updateData.setup_content = results.setup as unknown as Json
      updateData.has_setup_guide = true
    }

    if (results.reference) {
      updateData.reference_content = results.reference as unknown as Json
      updateData.has_reference = true
    }

    // Only update if we have content to save
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId)

      if (updateError) {
        console.error('Failed to update game:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to save generated content',
        })
      }
    }

    // Determine overall success
    const hasErrors = Object.keys(results.errors).length > 0
    const hasContent = results.rules || results.setup || results.reference

    return NextResponse.json({
      success: hasContent,
      generated: {
        rules: !!results.rules,
        setup: !!results.setup,
        reference: !!results.reference,
      },
      // Include content summaries for the modal
      content: {
        rules: results.rules ? {
          quickStartCount: results.rules.quickStart?.length || 0,
          coreRulesCount: results.rules.coreRules?.length || 0,
          turnStructureCount: results.rules.turnStructure?.length || 0,
          hasEndGameConditions: (results.rules.endGameConditions?.length || 0) > 0,
          hasWinCondition: !!results.rules.winCondition,
          tipsCount: results.rules.tips?.length || 0,
        } : null,
        setup: results.setup ? {
          stepsCount: results.setup.steps?.length || 0,
          componentsCount: results.setup.components?.length || 0,
          hasFirstPlayerRule: !!results.setup.firstPlayerRule,
          quickTipsCount: results.setup.quickTips?.length || 0,
          commonMistakesCount: results.setup.commonMistakes?.length || 0,
        } : null,
        reference: results.reference ? {
          turnPhasesCount: results.reference.turnSummary?.length || 0,
          keyActionsCount: results.reference.keyActions?.length || 0,
          importantRulesCount: results.reference.importantRules?.length || 0,
          hasEndGame: !!results.reference.endGame,
          scoringCount: results.reference.scoringSummary?.length || 0,
        } : null,
      },
      errors: hasErrors ? results.errors : undefined,
      processingTimeMs: processingTime,
    })
  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Content generation failed' },
      { status: 500 }
    )
  }
}
