/**
 * Vecna Processing Utilities
 *
 * Shared functions for pipeline processing used by both
 * auto-process and family batch processing endpoints.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { VecnaState, FamilyContext, ProcessingMode } from './types'
import type { Json } from '@/types/database'
import { buildFamilyContextFromDb } from './context'

/**
 * Result of a processing step
 */
export interface ProcessingStepResult {
  success: boolean
  newState: VecnaState
  error?: string
}

/**
 * Run the parse step - calls the rulebook parse API
 */
export async function runParseStep(
  supabase: SupabaseClient,
  gameId: string,
  cookieHeader: string
): Promise<ProcessingStepResult> {
  // Get game's rulebook URL
  const { data: game } = await supabase
    .from('games')
    .select('rulebook_url')
    .eq('id', gameId)
    .single()

  if (!game?.rulebook_url) {
    return { success: false, newState: 'rulebook_ready', error: 'No rulebook URL' }
  }

  // Set state to parsing
  await supabase
    .from('games')
    .update({
      vecna_state: 'parsing',
      vecna_processed_at: new Date().toISOString(),
      vecna_error: null,
    })
    .eq('id', gameId)

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3399'
    const response = await fetch(`${baseUrl}/api/admin/rulebook/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({ gameId, url: game.rulebook_url }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      await supabase
        .from('games')
        .update({
          vecna_state: 'rulebook_ready',
          vecna_error: result.error || 'Parse failed',
        })
        .eq('id', gameId)
      return { success: false, newState: 'rulebook_ready', error: result.error || 'Parse failed' }
    }

    // Update state to parsed
    await supabase
      .from('games')
      .update({
        vecna_state: 'parsed',
        vecna_processed_at: new Date().toISOString(),
        vecna_error: null,
      })
      .eq('id', gameId)

    return { success: true, newState: 'parsed' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Parse request failed'
    await supabase
      .from('games')
      .update({
        vecna_state: 'rulebook_ready',
        vecna_error: errorMessage,
      })
      .eq('id', gameId)
    return { success: false, newState: 'rulebook_ready', error: errorMessage }
  }
}

/**
 * Run the generate step - calls the content generation API
 *
 * @param model - Optional model override. Defaults to 'sonnet' if not specified.
 */
export async function runGenerateStep(
  supabase: SupabaseClient,
  gameId: string,
  familyContext: FamilyContext | null,
  isExpansion: boolean,
  cookieHeader: string,
  model: 'haiku' | 'sonnet' | 'opus' = 'sonnet'
): Promise<ProcessingStepResult> {
  // Set state to generating
  await supabase
    .from('games')
    .update({
      vecna_state: 'generating',
      vecna_processed_at: new Date().toISOString(),
      vecna_error: null,
    })
    .eq('id', gameId)

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3399'
    const response = await fetch(`${baseUrl}/api/admin/rulebook/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({
        gameId,
        contentTypes: ['rules', 'setup', 'reference'],
        model,
        ...(isExpansion && familyContext ? { familyContext } : {}),
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      // Construct error message from response
      let errorMessage = result.error || 'Generation failed'

      // If there's a detailed errors object, include the first error
      if (result.errors && typeof result.errors === 'object') {
        const errorKeys = Object.keys(result.errors)
        if (errorKeys.length > 0) {
          const firstError = result.errors[errorKeys[0]]
          errorMessage = `Content generation failed (${errorKeys.join(', ')}): ${firstError}`
        }
      }

      await supabase
        .from('games')
        .update({
          vecna_state: 'taxonomy_assigned',
          vecna_error: errorMessage,
        })
        .eq('id', gameId)
      return { success: false, newState: 'taxonomy_assigned', error: errorMessage }
    }

    // Update state to generated
    await supabase
      .from('games')
      .update({
        vecna_state: 'generated',
        vecna_processed_at: new Date().toISOString(),
        vecna_error: null,
        content_generated_at: new Date().toISOString(),
      })
      .eq('id', gameId)

    return { success: true, newState: 'generated' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Generate request failed'
    await supabase
      .from('games')
      .update({
        vecna_state: 'taxonomy_assigned',
        vecna_error: errorMessage,
      })
      .eq('id', gameId)
    return { success: false, newState: 'taxonomy_assigned', error: errorMessage }
  }
}

/**
 * Run the taxonomy step - auto-accept high-confidence suggestions and link to junction tables.
 * This step actually applies the taxonomy suggestions generated during the parse step.
 *
 * @param supabase - Supabase client instance
 * @param gameId - Game ID to process
 * @param confidenceThreshold - Minimum confidence to auto-accept (default: 0.7)
 */
export async function runTaxonomyStep(
  supabase: SupabaseClient,
  gameId: string,
  confidenceThreshold: number = 0.7
): Promise<ProcessingStepResult> {
  // 1. Fetch pending suggestions with confidence >= threshold
  // Only process existing taxonomy (theme/player_experience), not new suggestions
  const { data: suggestions, error: fetchError } = await supabase
    .from('taxonomy_suggestions')
    .select('*')
    .eq('game_id', gameId)
    .eq('status', 'pending')
    .in('suggestion_type', ['theme', 'player_experience'])
    .gte('confidence', confidenceThreshold)

  if (fetchError) {
    console.error('Failed to fetch taxonomy suggestions:', fetchError)
    return { success: false, newState: 'parsed', error: fetchError.message }
  }

  if (!suggestions?.length) {
    // No high-confidence suggestions to apply, just update state
    await supabase.from('games').update({
      vecna_state: 'taxonomy_assigned',
      vecna_processed_at: new Date().toISOString(),
      vecna_error: null,
    }).eq('id', gameId)
    return { success: true, newState: 'taxonomy_assigned' }
  }

  // 2. Group by type and prepare inserts
  const themeInserts = suggestions
    .filter(s => s.suggestion_type === 'theme' && s.target_id)
    .map(s => ({
      game_id: gameId,
      theme_id: s.target_id,
      is_primary: s.is_primary ?? false,
      source: 'ai',
    }))

  const experienceInserts = suggestions
    .filter(s => s.suggestion_type === 'player_experience' && s.target_id)
    .map(s => ({
      game_id: gameId,
      player_experience_id: s.target_id,
      is_primary: s.is_primary ?? false,
      source: 'ai',
    }))

  // 3. Check for existing entries and only insert new ones
  if (themeInserts.length > 0) {
    const { data: existingThemes } = await supabase
      .from('game_themes')
      .select('theme_id')
      .eq('game_id', gameId)
    const existingThemeIds = new Set(existingThemes?.map(t => t.theme_id) || [])

    const newThemeInserts = themeInserts.filter(t => !existingThemeIds.has(t.theme_id))
    if (newThemeInserts.length > 0) {
      const { error: themeError } = await supabase.from('game_themes').insert(newThemeInserts)
      if (themeError) {
        console.error('Failed to insert themes:', themeError)
      } else {
        console.log(`Auto-accepted ${newThemeInserts.length} theme(s) for game ${gameId}`)
      }
    }
  }

  if (experienceInserts.length > 0) {
    const { data: existingExps } = await supabase
      .from('game_player_experiences')
      .select('player_experience_id')
      .eq('game_id', gameId)
    const existingExpIds = new Set(existingExps?.map(e => e.player_experience_id) || [])

    const newExpInserts = experienceInserts.filter(e => !existingExpIds.has(e.player_experience_id))
    if (newExpInserts.length > 0) {
      const { error: expError } = await supabase.from('game_player_experiences').insert(newExpInserts)
      if (expError) {
        console.error('Failed to insert player experiences:', expError)
      } else {
        console.log(`Auto-accepted ${newExpInserts.length} player experience(s) for game ${gameId}`)
      }
    }
  }

  // 4. Mark suggestions as auto-accepted
  const acceptedIds = suggestions.map(s => s.id)
  await supabase
    .from('taxonomy_suggestions')
    .update({ status: 'accepted', processed_at: new Date().toISOString() })
    .in('id', acceptedIds)

  // 5. Update game state
  await supabase.from('games').update({
    vecna_state: 'taxonomy_assigned',
    vecna_processed_at: new Date().toISOString(),
    vecna_error: null,
  }).eq('id', gameId)

  return { success: true, newState: 'taxonomy_assigned' }
}

/**
 * Rebuild family context after base game processing.
 * Uses the canonical buildFamilyContextFromDb() and stores the result in game_families.
 */
export async function rebuildFamilyContext(
  supabase: SupabaseClient,
  familyId: string,
  baseGameId: string
): Promise<FamilyContext | null> {
  const familyContext = await buildFamilyContextFromDb(supabase, baseGameId)

  if (!familyContext) return null

  await supabase
    .from('game_families')
    .update({ family_context: familyContext as unknown as Json })
    .eq('id', familyId)

  return familyContext
}

/**
 * Base URL for internal API calls
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3399'
}

// =====================================================
// Processing Lock Functions
// =====================================================

/**
 * Attempt to acquire a processing lock for a family.
 * The lock expires after 30 minutes (safety net for crashed processes).
 *
 * @param supabase - Supabase client instance
 * @param familyId - Family ID to lock
 * @param lockHolder - Identifier for the process (e.g., 'auto-process-123')
 * @returns true if lock acquired, false if already locked by another process
 */
export async function acquireProcessingLock(
  supabase: SupabaseClient,
  familyId: string,
  lockHolder: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('acquire_family_processing_lock', {
    p_family_id: familyId,
    p_lock_holder: lockHolder,
  })

  if (error) {
    console.error('Failed to acquire processing lock:', error)
    return false
  }

  return !!data
}

/**
 * Release a processing lock for a family.
 *
 * @param supabase - Supabase client instance
 * @param familyId - Family ID to unlock
 */
export async function releaseProcessingLock(
  supabase: SupabaseClient,
  familyId: string
): Promise<void> {
  const { error } = await supabase.rpc('release_family_processing_lock', {
    p_family_id: familyId,
  })

  if (error) {
    console.error('Failed to release processing lock:', error)
  }
}

/**
 * Result of skip check
 */
export interface SkipResult {
  skip: boolean
  reason?: string
}

/**
 * Game fields needed for skip checking
 */
export interface SkipCheckGame {
  vecna_state: VecnaState
  rulebook_url: string | null
  wikidata_id?: string | null
  wikipedia_url?: string | null
}

/**
 * Shared utility to determine if a game should be skipped during processing.
 * Consolidates skip logic from auto-process and family batch processing.
 *
 * @param game - Game with state and rulebook info
 * @param options - Processing options
 * @param options.mode - Processing mode (default: 'from-current')
 * @param options.skipBlocked - Skip games without rulebooks (default: true)
 */
export function shouldSkipGame(
  game: SkipCheckGame,
  options: {
    mode?: ProcessingMode
    skipBlocked?: boolean
  } = {}
): SkipResult {
  const { mode = 'from-current', skipBlocked = true } = options

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
    return { skip: true, reason: 'Already generated' }
  }

  // Mode-specific skips
  switch (mode) {
    case 'parse-only':
      // Skip if already parsed or beyond
      if (['parsed', 'taxonomy_assigned', 'generating'].includes(game.vecna_state)) {
        return { skip: true, reason: 'Already parsed' }
      }
      // Skip if no rulebook
      if (!game.rulebook_url) {
        return { skip: true, reason: 'No rulebook to parse' }
      }
      break

    case 'generate-only':
      // No additional skips for generate-only beyond the defaults
      break

    case 'full':
    case 'from-current':
    default:
      // For full pipeline modes, we need a rulebook to proceed past enrichment
      if (!game.rulebook_url && skipBlocked) {
        // Games without rulebooks can only progress to 'enriched' state
        if (['enriched', 'rulebook_missing', 'rulebook_ready', 'parsing', 'parsed', 'taxonomy_assigned', 'generating'].includes(game.vecna_state)) {
          return { skip: true, reason: 'No rulebook URL' }
        }
        // If in 'imported' state, check if we can at least update to enriched
        if (game.vecna_state === 'imported') {
          if (!(game.wikidata_id || game.wikipedia_url)) {
            return { skip: true, reason: 'No enrichment data or rulebook' }
          }
          // Has enrichment data, can at least progress to enriched
        }
      }
      break
  }

  return { skip: false }
}
