import { NextRequest } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import type { VecnaState, FamilyContext } from '@/lib/vecna'
import {
  runParseStep,
  runTaxonomyStep,
  runGenerateStep,
  rebuildFamilyContext,
  shouldSkipGame,
  acquireProcessingLock,
  releaseProcessingLock,
} from '@/lib/vecna/processing'

/**
 * Request body for auto-process endpoint
 */
interface AutoProcessRequest {
  mode: 'single' | 'family'
  gameId?: string           // Required for single mode
  familyId?: string         // Required for family mode
  skipBlocked?: boolean     // Default: true
  stopOnError?: boolean     // Default: false
  model?: 'haiku' | 'sonnet' | 'opus'  // Default: sonnet
}

/**
 * SSE Event types for progress streaming
 */
interface StartEvent {
  type: 'start'
  totalGames: number
  gameNames: string[]
}

interface GameStartEvent {
  type: 'game_start'
  gameId: string
  gameName: string
  gameIndex: number
  totalGames: number
  thumbnailUrl?: string
}

interface StepEvent {
  type: 'step'
  gameId: string
  step: 'parsing' | 'taxonomy' | 'generating'
  status: 'running' | 'complete' | 'error'
  error?: string
}

interface GameCompleteEvent {
  type: 'game_complete'
  gameId: string
  gameName: string
  success: boolean
  previousState: VecnaState
  newState: VecnaState
  error?: string
}

interface GameSkipEvent {
  type: 'game_skip'
  gameId: string
  gameName: string
  reason: string
}

interface CompleteEvent {
  type: 'complete'
  summary: {
    total: number
    processed: number
    skipped: number
    errors: number
    duration: number
  }
}

type SSEEvent = StartEvent | GameStartEvent | StepEvent | GameCompleteEvent | GameSkipEvent | CompleteEvent

interface GameForProcessing {
  id: string
  name: string
  slug: string
  thumbnail_url: string | null
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
 * POST /api/admin/vecna/auto-process
 *
 * Streaming endpoint for automated pipeline processing.
 * Supports both single game and family batch modes.
 */
export async function POST(request: NextRequest) {
  // Check admin status
  if (!await isAdmin()) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: AutoProcessRequest
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const {
    mode,
    gameId,
    familyId,
    skipBlocked = true,
    stopOnError = false,
    model = 'sonnet',
  } = body

  // Validate request
  if (mode === 'single' && !gameId) {
    return new Response(JSON.stringify({ error: 'gameId required for single mode' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (mode === 'family' && !familyId) {
    return new Response(JSON.stringify({ error: 'familyId required for family mode' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get cookies from original request to forward to internal API calls
  const cookieHeader = request.headers.get('cookie') || ''

  // Create streaming response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: SSEEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      const startTime = Date.now()
      let processed = 0
      let skipped = 0
      let errors = 0
      let currentFamilyId: string | null = null  // Declared outside try for error handling

      const supabase = createAdminClient()

      try {
        // Get games to process
        let gamesForProcessing: GameForProcessing[] = []
        let familyContext: FamilyContext | null = null

        if (mode === 'single' && gameId) {
          // Single game mode
          const { data: game, error: gameError } = await supabase
            .from('games')
            .select(`
              id, name, slug, thumbnail_url, year_published,
              vecna_state, rulebook_url,
              rules_content, setup_content, reference_content,
              wikipedia_url, wikidata_id, wikipedia_gameplay,
              family_id
            `)
            .eq('id', gameId)
            .single()

          if (gameError || !game) {
            sendEvent({
              type: 'complete',
              summary: { total: 0, processed: 0, skipped: 0, errors: 1, duration: 0 },
            })
            controller.close()
            return
          }

          // Check if game is an expansion
          const { data: expansionRel } = await supabase
            .from('game_relations')
            .select('source_game_id')
            .eq('source_game_id', game.id)
            .in('relation_type', ['expansion_of', 'standalone_expansion_of'])
            .maybeSingle()

          gamesForProcessing = [{
            ...game,
            vecna_state: (game.vecna_state || 'imported') as VecnaState,
            isExpansion: !!expansionRel,
          }]

          // Get family context if expansion
          if (expansionRel && game.family_id) {
            const { data: family } = await supabase
              .from('game_families')
              .select('family_context')
              .eq('id', game.family_id)
              .single()
            familyContext = family?.family_context as FamilyContext | null
            currentFamilyId = game.family_id
          }
        } else if (mode === 'family' && familyId) {
          // Family batch mode
          const { data: family, error: familyError } = await supabase
            .from('game_families')
            .select('id, name, slug, base_game_id, family_context')
            .eq('id', familyId)
            .single()

          if (familyError || !family) {
            sendEvent({
              type: 'complete',
              summary: { total: 0, processed: 0, skipped: 0, errors: 1, duration: 0 },
            })
            controller.close()
            return
          }

          currentFamilyId = family.id
          familyContext = family.family_context as FamilyContext | null

          // Acquire processing lock to prevent concurrent processing
          const lockId = `auto-process-${Date.now()}`
          const lockAcquired = await acquireProcessingLock(supabase, familyId, lockId)
          if (!lockAcquired) {
            sendEvent({
              type: 'complete',
              summary: { total: 0, processed: 0, skipped: 0, errors: 1, duration: 0 },
            })
            // Note: Could also send a specific error event here
            console.warn(`Failed to acquire lock for family ${familyId} - already being processed`)
            controller.close()
            return
          }

          // Get all games in family
          const { data: familyGames, error: gamesError } = await supabase
            .from('games')
            .select(`
              id, name, slug, thumbnail_url, year_published,
              vecna_state, rulebook_url,
              rules_content, setup_content, reference_content,
              wikipedia_url, wikidata_id, wikipedia_gameplay
            `)
            .eq('family_id', familyId)
            .order('year_published', { ascending: true })

          if (gamesError || !familyGames || familyGames.length === 0) {
            sendEvent({
              type: 'complete',
              summary: { total: 0, processed: 0, skipped: 0, errors: 1, duration: 0 },
            })
            controller.close()
            return
          }

          // Get expansion relations
          const gameIds = familyGames.map(g => g.id)
          const { data: expansionRelations } = await supabase
            .from('game_relations')
            .select('source_game_id')
            .in('source_game_id', gameIds)
            .in('relation_type', ['expansion_of', 'standalone_expansion_of'])

          const expansionGameIds = new Set(expansionRelations?.map(r => r.source_game_id) || [])

          // Annotate games
          gamesForProcessing = familyGames.map(g => ({
            ...g,
            vecna_state: (g.vecna_state || 'imported') as VecnaState,
            isExpansion: expansionGameIds.has(g.id),
          }))

          // Sort: base games first, then expansions by year
          gamesForProcessing.sort((a, b) => {
            if (!a.isExpansion && b.isExpansion) return -1
            if (a.isExpansion && !b.isExpansion) return 1
            const yearA = a.year_published || 9999
            const yearB = b.year_published || 9999
            return yearA - yearB
          })

          // Pre-check: If base game already has content but family context is missing/stale,
          // rebuild it before processing expansions
          if (!familyContext && family.base_game_id) {
            const baseGame = gamesForProcessing.find(g => g.id === family.base_game_id)
            if (baseGame && baseGame.vecna_state === 'generated') {
              // Base game is already generated but no cached context - rebuild it
              familyContext = await rebuildFamilyContext(supabase, familyId, baseGame.id)
              console.log('Pre-built family context from existing base game content')
            }
          }
        }

        // Send start event
        sendEvent({
          type: 'start',
          totalGames: gamesForProcessing.length,
          gameNames: gamesForProcessing.map(g => g.name),
        })

        // Process each game
        for (let i = 0; i < gamesForProcessing.length; i++) {
          const game = gamesForProcessing[i]
          const previousState = game.vecna_state

          // Check if should skip
          const skipResult = shouldSkipGame(game, { skipBlocked })
          if (skipResult.skip) {
            sendEvent({
              type: 'game_skip',
              gameId: game.id,
              gameName: game.name,
              reason: skipResult.reason!,
            })
            skipped++
            continue
          }

          // Send game start event
          sendEvent({
            type: 'game_start',
            gameId: game.id,
            gameName: game.name,
            gameIndex: i + 1,
            totalGames: gamesForProcessing.length,
            thumbnailUrl: game.thumbnail_url || undefined,
          })

          // Determine steps to run
          const steps = getProcessingSteps(game)

          let currentState = previousState
          let gameSuccess = true
          let gameError: string | undefined

          // Run each step
          for (const step of steps) {
            // Send step running event
            sendEvent({
              type: 'step',
              gameId: game.id,
              step: step as 'parsing' | 'taxonomy' | 'generating',
              status: 'running',
            })

            try {
              const result = await runProcessingStep(
                supabase,
                game.id,
                step,
                familyContext,
                game.isExpansion,
                cookieHeader,
                model
              )

              if (!result.success) {
                sendEvent({
                  type: 'step',
                  gameId: game.id,
                  step: step as 'parsing' | 'taxonomy' | 'generating',
                  status: 'error',
                  error: result.error,
                })
                gameSuccess = false
                gameError = result.error
                break
              }

              currentState = result.newState

              sendEvent({
                type: 'step',
                gameId: game.id,
                step: step as 'parsing' | 'taxonomy' | 'generating',
                status: 'complete',
              })
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Step failed'
              sendEvent({
                type: 'step',
                gameId: game.id,
                step: step as 'parsing' | 'taxonomy' | 'generating',
                status: 'error',
                error: errorMessage,
              })
              gameSuccess = false
              gameError = errorMessage
              break
            }
          }

          // Send game complete event
          sendEvent({
            type: 'game_complete',
            gameId: game.id,
            gameName: game.name,
            success: gameSuccess,
            previousState,
            newState: currentState,
            error: gameError,
          })

          if (gameSuccess) {
            processed++

            // Rebuild family context after base game completes
            if (!game.isExpansion && currentState === 'generated' && currentFamilyId) {
              familyContext = await rebuildFamilyContext(supabase, currentFamilyId, game.id)
            }
          } else {
            errors++
            if (stopOnError) {
              break
            }
          }
        }

        // Send complete event
        const duration = Math.round((Date.now() - startTime) / 100) / 10
        sendEvent({
          type: 'complete',
          summary: {
            total: gamesForProcessing.length,
            processed,
            skipped,
            errors,
            duration,
          },
        })

        // Release processing lock if we acquired one (family mode)
        if (mode === 'family' && currentFamilyId) {
          await releaseProcessingLock(supabase, currentFamilyId)
        }
      } catch (error) {
        console.error('Auto-process error:', error)

        // Release processing lock on error
        if (mode === 'family' && currentFamilyId) {
          await releaseProcessingLock(supabase, currentFamilyId)
        }

        sendEvent({
          type: 'complete',
          summary: {
            total: 0,
            processed: 0,
            skipped: 0,
            errors: 1,
            duration: Math.round((Date.now() - startTime) / 100) / 10,
          },
        })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

type ProcessingStep = 'parsing' | 'taxonomy' | 'generating'

/**
 * Get the processing steps needed based on current state
 * For auto-process, we always run: parse -> taxonomy -> generate
 */
function getProcessingSteps(game: GameForProcessing): ProcessingStep[] {
  const steps: ProcessingStep[] = []
  const state = game.vecna_state

  // Determine starting point based on current state
  if (['imported', 'enriched', 'rulebook_missing', 'rulebook_ready', 'parsing'].includes(state)) {
    if (game.rulebook_url) {
      steps.push('parsing')
    }
    steps.push('taxonomy')
    steps.push('generating')
  } else if (state === 'parsed') {
    steps.push('taxonomy')
    steps.push('generating')
  } else if (['taxonomy_assigned', 'generating'].includes(state)) {
    steps.push('generating')
  }

  return steps
}

/**
 * Run a single processing step with streaming-friendly updates
 */
async function runProcessingStep(
  supabase: ReturnType<typeof createAdminClient>,
  gameId: string,
  step: ProcessingStep,
  familyContext: FamilyContext | null,
  isExpansion: boolean,
  cookieHeader: string,
  model: 'haiku' | 'sonnet' | 'opus'
): Promise<{ success: boolean; newState: VecnaState; error?: string }> {
  switch (step) {
    case 'parsing':
      return await runParseStep(supabase, gameId, cookieHeader)

    case 'taxonomy':
      return await runTaxonomyStep(supabase, gameId)

    case 'generating':
      return await runGenerateStep(supabase, gameId, familyContext, isExpansion, cookieHeader, model)

    default:
      return { success: false, newState: 'imported', error: `Unknown step: ${step}` }
  }
}
