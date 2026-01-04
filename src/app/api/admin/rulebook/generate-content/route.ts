import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import {
  parsePdfFromUrl,
  getEnhancedRulesSummaryPrompt,
  getEnhancedSetupGuidePrompt,
  getEnhancedReferenceCardPrompt,
  RULEBOOK_SYSTEM_PROMPT,
} from '@/lib/rulebook'
import type {
  RulesContent,
  SetupContent,
  ReferenceContent,
} from '@/lib/rulebook'
import { generateJSON } from '@/lib/ai/claude'
import { buildAIContext, parseGameContextFromDb, type FamilyContext } from '@/lib/vecna'
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
    const { gameId, contentTypes = ['rules', 'setup', 'reference'], model = 'sonnet' } = body

    // Map model choice to actual model ID
    const modelId = model === 'haiku'
      ? 'claude-3-5-haiku-20241022'
      : 'claude-sonnet-4-20250514'
    const temperature = model === 'haiku' ? 0.4 : 0.6

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID required' },
        { status: 400 }
      )
    }

    // Get game info including rulebook URL and all Wikipedia data
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        id, name, slug, rulebook_url, year_published,
        wikipedia_summary, wikipedia_gameplay, wikipedia_origins,
        wikipedia_reception, wikipedia_awards, wikipedia_infobox,
        latest_parse_log_id
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const latestParseLogId = game.latest_parse_log_id as string | null

    // Check if this game is an expansion and get family context
    let familyContext: FamilyContext | null = null
    let isExpansion = false
    let relationToBase: string | undefined

    // Query game_relations to find if this game is an expansion
    // source_game_id = expansion, target_game_id = base game
    const { data: gameRelation } = await supabase
      .from('game_relations')
      .select('relation_type, target_game_id')
      .eq('source_game_id', gameId)
      .in('relation_type', ['expansion_of', 'standalone_expansion_of'])
      .limit(1)
      .single()

    if (gameRelation?.target_game_id) {
      isExpansion = true
      relationToBase = gameRelation.relation_type

      // Fetch the base game data separately
      const { data: baseGame } = await supabase
        .from('games')
        .select('id, name, rules_content, setup_content, wikipedia_summary, wikipedia_gameplay')
        .eq('id', gameRelation.target_game_id)
        .single()

      if (baseGame) {
        // Build family context from base game
        const rulesContent = baseGame.rules_content as RulesContent | null
        const setupContent = baseGame.setup_content as SetupContent | null
        const wikiSummary = baseGame.wikipedia_summary as { themes?: string[]; mechanics?: string[] } | null

        familyContext = {
          baseGameId: baseGame.id,
          baseGameName: baseGame.name,
          coreMechanics: wikiSummary?.mechanics || rulesContent?.coreRules?.slice(0, 3).map(r => r.title) || [],
          coreTheme: wikiSummary?.themes?.[0] || null,
          baseRulesOverview: rulesContent?.quickStart?.join(' ') || null,
          baseSetupSummary: setupContent?.steps?.slice(0, 3).map(s => s.step).join('. ') || null,
          componentTypes: setupContent?.components?.map(c => c.name) || [],
        }
      }
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

    // Build enhanced AI context using all available data
    const gameContextData = {
      ...parseGameContextFromDb(game as Parameters<typeof parseGameContextFromDb>[0]),
      familyContext,
      isExpansion,
      relationToBase,
    }
    const aiContext = buildAIContext(gameContextData)

    const hasWikipediaContext = !!aiContext.wikipediaContext
    const hasFamilyContext = !!aiContext.familyContext

    if (hasWikipediaContext) {
      console.log('Using enhanced Wikipedia context for content generation')
    }
    if (hasFamilyContext) {
      console.log('Using family context for expansion content generation')
    }

    // Generate content in parallel where possible
    const results: {
      rules?: RulesContent
      setup?: SetupContent
      reference?: ReferenceContent
      errors: { rules?: string; setup?: string; reference?: string }
    } = { errors: {} }

    const generatePromises: Promise<void>[] = []

    // Generate rules content with enhanced prompts
    if (contentTypes.includes('rules')) {
      generatePromises.push(
        (async () => {
          try {
            const prompt = getEnhancedRulesSummaryPrompt(rulebookText, game.name, aiContext)
            const result = await generateJSON<RulesContent>(
              RULEBOOK_SYSTEM_PROMPT,
              prompt,
              { temperature, model: modelId }
            )
            results.rules = result.data
            console.log('Generated rules content keys:', Object.keys(result.data || {}))
          } catch (error) {
            console.error('Rules generation failed:', error)
            results.errors.rules = error instanceof Error ? error.message : 'Failed to generate rules'
          }
        })()
      )
    }

    // Generate setup content with enhanced prompts
    if (contentTypes.includes('setup')) {
      generatePromises.push(
        (async () => {
          try {
            const prompt = getEnhancedSetupGuidePrompt(rulebookText, game.name, aiContext)
            const result = await generateJSON<SetupContent>(
              RULEBOOK_SYSTEM_PROMPT,
              prompt,
              { temperature, model: modelId }
            )
            results.setup = result.data
            console.log('Generated setup content keys:', Object.keys(result.data || {}))
          } catch (error) {
            console.error('Setup generation failed:', error)
            results.errors.setup = error instanceof Error ? error.message : 'Failed to generate setup'
          }
        })()
      )
    }

    // Generate reference content with enhanced prompts
    if (contentTypes.includes('reference')) {
      generatePromises.push(
        (async () => {
          try {
            const prompt = getEnhancedReferenceCardPrompt(rulebookText, game.name, aiContext)
            const result = await generateJSON<ReferenceContent>(
              RULEBOOK_SYSTEM_PROMPT,
              prompt,
              { temperature, model: modelId }
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
      usedWikipediaContext: hasWikipediaContext,
      usedFamilyContext: hasFamilyContext,
      isExpansion,
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
