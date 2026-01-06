import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import type { VecnaState, FamilyContext, ProcessingMode, ProcessingResult } from '@/lib/vecna'
import {
  runParseStep,
  runGenerateStep,
  rebuildFamilyContext,
} from '@/lib/vecna/processing'

interface GameForProcessing {
  id: string
  name: string
  slug: string
  year_published: number | null
  vecna_state: VecnaState
  rulebook_url: string | null
  rules_content: unknown
  setup_content: unknown
  reference_content: unknown
  wikipedia_url: string | null
  wikidata_id: string | null
  wikipedia_gameplay: string | null
  isExpansion: boolean
}

/**
 * POST /api/admin/vecna/family/[familyId]/process
 *
 * Process all games in a family through the pipeline.
 * Processes base game first, then expansions using family context.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get cookies from original request to forward to internal API calls
    const cookieHeader = request.headers.get('cookie') || ''

    const { familyId } = await params
    const body = await request.json()
    const {
      mode = 'from-current' as ProcessingMode,
      stopOnError = false,
      skipBlocked = true,
    } = body

    const supabase = createAdminClient()

    // Get the family
    const { data: family, error: familyError } = await supabase
      .from('game_families')
      .select('id, name, slug, base_game_id, family_context')
      .eq('id', familyId)
      .single()

    if (familyError || !family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    // Get all games in the family with their current state
    const { data: familyGames, error: gamesError } = await supabase
      .from('games')
      .select(`
        id, name, slug, year_published,
        vecna_state, rulebook_url,
        rules_content, setup_content, reference_content,
        wikipedia_url, wikidata_id, wikipedia_gameplay
      `)
      .eq('family_id', familyId)
      .order('year_published', { ascending: true })

    if (gamesError || !familyGames || familyGames.length === 0) {
      return NextResponse.json({
        error: 'No games found in family',
        familyId,
        familyName: family.name,
      }, { status: 400 })
    }

    // Get expansion relations to identify base vs expansion games
    const gameIds = familyGames.map(g => g.id)
    const { data: expansionRelations } = await supabase
      .from('game_relations')
      .select('source_game_id')
      .in('source_game_id', gameIds)
      .in('relation_type', ['expansion_of', 'standalone_expansion_of'])

    const expansionGameIds = new Set(expansionRelations?.map(r => r.source_game_id) || [])

    // Annotate games and sort (base games first, then expansions by year)
    const gamesForProcessing: GameForProcessing[] = familyGames.map(g => ({
      ...g,
      vecna_state: (g.vecna_state || 'imported') as VecnaState,
      isExpansion: expansionGameIds.has(g.id),
    }))

    // Sort: base games first, then expansions by year
    gamesForProcessing.sort((a, b) => {
      // Base games before expansions
      if (!a.isExpansion && b.isExpansion) return -1
      if (a.isExpansion && !b.isExpansion) return 1
      // Then by year
      const yearA = a.year_published || 9999
      const yearB = b.year_published || 9999
      return yearA - yearB
    })

    const results: ProcessingResult[] = []
    let familyContext: FamilyContext | null = family.family_context as FamilyContext | null

    // Process each game
    for (const game of gamesForProcessing) {
      const previousState = game.vecna_state

      try {
        // Check if game should be skipped
        const skipResult = shouldSkipGame(game, mode, skipBlocked)
        if (skipResult.skip) {
          results.push({
            gameId: game.id,
            gameName: game.name,
            previousState,
            newState: game.vecna_state,
            success: true,
            skipped: true,
            skipReason: skipResult.reason,
          })
          continue
        }

        // Process the game based on mode and current state
        const processResult = await processGame(
          supabase,
          game,
          mode,
          familyContext,
          game.isExpansion,
          cookieHeader
        )

        results.push({
          gameId: game.id,
          gameName: game.name,
          previousState,
          newState: processResult.newState,
          success: processResult.success,
          error: processResult.error,
        })

        // If this is the base game and it was successfully processed,
        // rebuild family context for expansions
        if (!game.isExpansion && processResult.success && processResult.newState === 'generated') {
          familyContext = await rebuildFamilyContext(supabase, familyId, game.id)
        }

        // Stop on error if requested
        if (!processResult.success && stopOnError) {
          break
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          gameId: game.id,
          gameName: game.name,
          previousState,
          newState: game.vecna_state,
          success: false,
          error: errorMessage,
        })

        if (stopOnError) {
          break
        }
      }
    }

    // Calculate summary stats
    const totalGames = gamesForProcessing.length
    const processedCount = results.filter(r => !r.skipped && r.success).length
    const skippedCount = results.filter(r => r.skipped).length
    const errorCount = results.filter(r => !r.success && !r.skipped).length

    return NextResponse.json({
      success: errorCount === 0,
      familyId: family.id,
      familyName: family.name,
      mode,
      summary: {
        totalGames,
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
      results,
    })
  } catch (error) {
    console.error('Family batch processing error:', error)
    return NextResponse.json({
      error: 'Batch processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * Determine if a game should be skipped based on its state and mode
 */
function shouldSkipGame(
  game: GameForProcessing,
  mode: ProcessingMode,
  skipBlocked: boolean
): { skip: boolean; reason?: string } {
  // Always skip published games
  if (game.vecna_state === 'published') {
    return { skip: true, reason: 'Already published' }
  }

  // Skip games already in review
  if (game.vecna_state === 'review_pending') {
    return { skip: true, reason: 'Awaiting review' }
  }

  // Skip games already generated (they just need review)
  if (game.vecna_state === 'generated') {
    return { skip: true, reason: 'Already generated - needs review' }
  }

  // Mode-specific skips
  switch (mode) {
    case 'parse-only':
      // Skip if already parsed or beyond
      if (['parsed', 'taxonomy_assigned', 'generating', 'generated', 'review_pending', 'published'].includes(game.vecna_state)) {
        return { skip: true, reason: 'Already parsed' }
      }
      // Skip if no rulebook
      if (!game.rulebook_url) {
        return { skip: true, reason: 'No rulebook to parse' }
      }
      break

    case 'generate-only':
      // Skip if already generated or beyond
      if (['generated', 'review_pending', 'published'].includes(game.vecna_state)) {
        return { skip: true, reason: 'Already has content' }
      }
      break

    case 'full':
    case 'from-current':
      // For full pipeline modes, we need a rulebook to proceed past enrichment
      // Skip games without rulebooks unless they're still in early stages that don't need it
      if (!game.rulebook_url) {
        // Games without rulebooks can only progress to 'enriched' state
        // If already enriched or beyond, they're blocked
        if (['enriched', 'rulebook_missing', 'rulebook_ready', 'parsing', 'parsed', 'taxonomy_assigned', 'generating'].includes(game.vecna_state)) {
          if (skipBlocked) {
            return { skip: true, reason: 'No rulebook URL' }
          }
        }
        // If in 'imported' state, check if we can at least update to enriched
        if (game.vecna_state === 'imported') {
          if (!(game.wikidata_id || game.wikipedia_url)) {
            // No enrichment data and no rulebook - nothing to do
            if (skipBlocked) {
              return { skip: true, reason: 'No enrichment data or rulebook' }
            }
          }
          // Has enrichment data, can at least progress to enriched
        }
      }
      break
  }

  return { skip: false }
}

/**
 * Process a single game through the pipeline
 */
async function processGame(
  supabase: ReturnType<typeof createAdminClient>,
  game: GameForProcessing,
  mode: ProcessingMode,
  familyContext: FamilyContext | null,
  isExpansion: boolean,
  cookieHeader: string
): Promise<{ success: boolean; newState: VecnaState; error?: string }> {
  let currentState = game.vecna_state

  // Determine which steps to run based on mode
  const steps = getProcessingSteps(currentState, mode, game)

  for (const step of steps) {
    try {
      const result = await runProcessingStep(supabase, game.id, step, familyContext, isExpansion, cookieHeader)
      if (!result.success) {
        // Update state with error
        await supabase
          .from('games')
          .update({
            vecna_error: result.error,
            vecna_processed_at: new Date().toISOString(),
          })
          .eq('id', game.id)

        return { success: false, newState: currentState, error: result.error }
      }
      currentState = result.newState
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Step failed'
      return { success: false, newState: currentState, error: errorMessage }
    }
  }

  return { success: true, newState: currentState }
}

type ProcessingStep = 'enrich' | 'set-rulebook-ready' | 'parse' | 'assign-taxonomy' | 'generate'

/**
 * Get the processing steps needed based on current state and mode
 */
function getProcessingSteps(
  currentState: VecnaState,
  mode: ProcessingMode,
  game: GameForProcessing
): ProcessingStep[] {
  const steps: ProcessingStep[] = []

  if (mode === 'parse-only') {
    // Just parse if not already parsed
    if (['imported', 'enriched', 'rulebook_missing', 'rulebook_ready'].includes(currentState)) {
      if (currentState !== 'rulebook_ready' && game.rulebook_url) {
        steps.push('set-rulebook-ready')
      }
      steps.push('parse')
    }
    return steps
  }

  if (mode === 'generate-only') {
    // Just generate if not already generated
    if (!['generated', 'review_pending', 'published'].includes(currentState)) {
      if (!['taxonomy_assigned', 'generating'].includes(currentState)) {
        steps.push('assign-taxonomy')
      }
      steps.push('generate')
    }
    return steps
  }

  // Full or from-current mode
  // Progress from current state through the pipeline
  switch (currentState) {
    case 'imported':
      // Check if already enriched
      if (game.wikidata_id || game.wikipedia_url) {
        steps.push('enrich') // Update state to enriched
      }
      // Fall through to next steps
      if (game.rulebook_url) {
        steps.push('set-rulebook-ready')
        steps.push('parse')
        steps.push('assign-taxonomy')
        steps.push('generate')
      }
      break

    case 'enriched':
      if (game.rulebook_url) {
        steps.push('set-rulebook-ready')
        steps.push('parse')
        steps.push('assign-taxonomy')
        steps.push('generate')
      }
      break

    case 'rulebook_missing':
      if (game.rulebook_url) {
        steps.push('set-rulebook-ready')
        steps.push('parse')
        steps.push('assign-taxonomy')
        steps.push('generate')
      }
      break

    case 'rulebook_ready':
      steps.push('parse')
      steps.push('assign-taxonomy')
      steps.push('generate')
      break

    case 'parsing':
      // Stuck in parsing - try to continue
      steps.push('parse')
      steps.push('assign-taxonomy')
      steps.push('generate')
      break

    case 'parsed':
      steps.push('assign-taxonomy')
      steps.push('generate')
      break

    case 'taxonomy_assigned':
      steps.push('generate')
      break

    case 'generating':
      // Stuck in generating - try to continue
      steps.push('generate')
      break
  }

  return steps
}

/**
 * Run a single processing step
 */
async function runProcessingStep(
  supabase: ReturnType<typeof createAdminClient>,
  gameId: string,
  step: ProcessingStep,
  familyContext: FamilyContext | null,
  isExpansion: boolean,
  cookieHeader: string
): Promise<{ success: boolean; newState: VecnaState; error?: string }> {
  switch (step) {
    case 'enrich':
      // Just update state - enrichment already happened during import
      await supabase
        .from('games')
        .update({
          vecna_state: 'enriched',
          vecna_processed_at: new Date().toISOString(),
          vecna_error: null,
        })
        .eq('id', gameId)
      return { success: true, newState: 'enriched' }

    case 'set-rulebook-ready':
      await supabase
        .from('games')
        .update({
          vecna_state: 'rulebook_ready',
          vecna_processed_at: new Date().toISOString(),
          vecna_error: null,
        })
        .eq('id', gameId)
      return { success: true, newState: 'rulebook_ready' }

    case 'parse':
      return await runParseStep(supabase, gameId, cookieHeader)

    case 'assign-taxonomy':
      await supabase
        .from('games')
        .update({
          vecna_state: 'taxonomy_assigned',
          vecna_processed_at: new Date().toISOString(),
          vecna_error: null,
        })
        .eq('id', gameId)
      return { success: true, newState: 'taxonomy_assigned' }

    case 'generate':
      return await runGenerateStep(supabase, gameId, familyContext, isExpansion, cookieHeader)

    default:
      return { success: false, newState: 'imported', error: `Unknown step: ${step}` }
  }
}

/**
 * GET /api/admin/vecna/family/[familyId]/process
 *
 * Get the current processing status of a family
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { familyId } = await params
    const supabase = createAdminClient()

    // Get family with games
    const { data: family } = await supabase
      .from('game_families')
      .select('id, name, family_context')
      .eq('id', familyId)
      .single()

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    // Get all games and their states
    const { data: games } = await supabase
      .from('games')
      .select('id, name, vecna_state, rulebook_url, vecna_error')
      .eq('family_id', familyId)
      .order('year_published')

    if (!games) {
      return NextResponse.json({ error: 'No games found' }, { status: 404 })
    }

    // Calculate stats
    const stateBreakdown: Record<VecnaState, number> = {
      imported: 0,
      enriched: 0,
      rulebook_missing: 0,
      rulebook_ready: 0,
      parsing: 0,
      parsed: 0,
      taxonomy_assigned: 0,
      generating: 0,
      generated: 0,
      review_pending: 0,
      published: 0,
    }

    for (const game of games) {
      const state = (game.vecna_state || 'imported') as VecnaState
      stateBreakdown[state]++
    }

    const gamesWithErrors = games.filter(g => g.vecna_error)
    const gamesMissingRulebook = games.filter(g => !g.rulebook_url && g.vecna_state !== 'published')

    return NextResponse.json({
      familyId: family.id,
      familyName: family.name,
      hasFamilyContext: !!family.family_context,
      totalGames: games.length,
      stateBreakdown,
      readyForProcessing: games.filter(g =>
        !['published', 'review_pending', 'generated'].includes(g.vecna_state || 'imported')
      ).length,
      gamesWithErrors: gamesWithErrors.map(g => ({
        id: g.id,
        name: g.name,
        error: g.vecna_error,
      })),
      gamesMissingRulebook: gamesMissingRulebook.map(g => ({
        id: g.id,
        name: g.name,
      })),
    })
  } catch (error) {
    console.error('Get family process status error:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}
