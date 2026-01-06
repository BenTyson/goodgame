/**
 * Vecna Processing Utilities
 *
 * Shared functions for pipeline processing used by both
 * auto-process and family batch processing endpoints.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { VecnaState, FamilyContext } from './types'
import type { RulesContent, SetupContent } from '@/lib/rulebook'
import type { Json } from '@/types/database'

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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3399'
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3399'
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
      await supabase
        .from('games')
        .update({
          vecna_state: 'taxonomy_assigned',
          vecna_error: result.error || 'Generation failed',
        })
        .eq('id', gameId)
      return { success: false, newState: 'taxonomy_assigned', error: result.error || 'Generation failed' }
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
 * Rebuild family context after base game processing
 */
export async function rebuildFamilyContext(
  supabase: SupabaseClient,
  familyId: string,
  baseGameId: string
): Promise<FamilyContext | null> {
  const { data: baseGame } = await supabase
    .from('games')
    .select(`
      id, name,
      rules_content, setup_content,
      wikipedia_summary, wikipedia_origins,
      wikipedia_reception, wikipedia_awards,
      wikipedia_infobox
    `)
    .eq('id', baseGameId)
    .single()

  if (!baseGame) return null

  const rulesContent = baseGame.rules_content as RulesContent | null
  const setupContent = baseGame.setup_content as SetupContent | null
  const wikiSummary = baseGame.wikipedia_summary as {
    themes?: string[]
    mechanics?: string[]
    summary?: string
  } | null
  const wikiAwards = baseGame.wikipedia_awards as Array<{ name: string; status?: string }> | null
  const wikiInfobox = baseGame.wikipedia_infobox as {
    designers?: string[]
    publishers?: Array<{ name: string }> | string[]
  } | null

  const awardNames = wikiAwards
    ?.filter(a => a.status === 'winner' || !a.status)
    .map(a => a.name) || null

  const publisherNames = wikiInfobox?.publishers
    ? wikiInfobox.publishers.map(p => typeof p === 'string' ? p : p.name)
    : null

  const familyContext: FamilyContext = {
    baseGameId: baseGame.id,
    baseGameName: baseGame.name,
    coreMechanics: wikiSummary?.mechanics ||
      rulesContent?.coreRules?.slice(0, 5).map(r => r.title) ||
      [],
    coreTheme: wikiSummary?.themes?.[0] || null,
    baseRulesOverview: rulesContent?.quickStart?.join(' ') ||
      wikiSummary?.summary?.slice(0, 500) ||
      null,
    baseSetupSummary: setupContent?.steps?.slice(0, 5).map(s => s.step).join('. ') || null,
    componentTypes: setupContent?.components?.map(c => c.name) || [],
    baseGameOrigins: baseGame.wikipedia_origins as string | null,
    baseGameReception: baseGame.wikipedia_reception as string | null,
    baseGameAwards: awardNames,
    baseGameDesigners: wikiInfobox?.designers || null,
    baseGamePublishers: publisherNames,
  }

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
