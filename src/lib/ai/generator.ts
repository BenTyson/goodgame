/**
 * AI Content Generator
 * Orchestrates content generation for games
 */

import { createClient } from '@/lib/supabase/server'
import { generateJSON, type GenerationResult } from './claude'
import {
  SYSTEM_PROMPT,
  PROMPT_VERSION,
  getRulesPrompt,
  getSetupPrompt,
  getReferencePrompt,
} from './prompts'
import type { RulesContent, SetupContent, ReferenceContent } from '@/types/database'

export type ContentType = 'rules' | 'setup' | 'reference' | 'all'

export interface GenerationStats {
  gameId: string
  gameName: string
  contentType: ContentType
  success: boolean
  tokensInput: number
  tokensOutput: number
  costUsd: number
  durationMs: number
  error?: string
}

/**
 * Log generation attempt to database
 */
async function logGeneration(
  gameId: string,
  contentType: string,
  model: string,
  status: 'success' | 'failed',
  tokensInput: number,
  tokensOutput: number,
  costUsd: number,
  durationMs: number,
  generatedContent: unknown,
  errorMessage?: string
): Promise<void> {
  const supabase = await createClient()

  await supabase.from('content_generation_log').insert({
    game_id: gameId,
    content_type: contentType,
    model_used: model,
    prompt_version: PROMPT_VERSION,
    status,
    tokens_input: tokensInput,
    tokens_output: tokensOutput,
    cost_usd: costUsd,
    generation_time_ms: durationMs,
    generated_content: generatedContent ? JSON.parse(JSON.stringify(generatedContent)) : null,
    error_message: errorMessage || null,
  })
}

/**
 * Generate rules content for a game
 */
export async function generateRulesContent(
  gameId: string
): Promise<GenerationStats> {
  const supabase = await createClient()

  // Get game data
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (gameError || !game) {
    throw new Error(`Game not found: ${gameId}`)
  }

  const startTime = Date.now()

  try {
    const prompt = getRulesPrompt(game)
    const result = await generateJSON<RulesContent>(SYSTEM_PROMPT, prompt)

    // Update game with generated content
    await supabase
      .from('games')
      .update({
        rules_content: JSON.parse(JSON.stringify(result.data)),
        has_rules: true,
      })
      .eq('id', gameId)

    // Log success
    await logGeneration(
      gameId,
      'rules',
      result.meta.model,
      'success',
      result.meta.tokensInput,
      result.meta.tokensOutput,
      result.meta.costUsd,
      result.meta.durationMs,
      result.data
    )

    return {
      gameId,
      gameName: game.name,
      contentType: 'rules',
      success: true,
      tokensInput: result.meta.tokensInput,
      tokensOutput: result.meta.tokensOutput,
      costUsd: result.meta.costUsd,
      durationMs: result.meta.durationMs,
    }

  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await logGeneration(
      gameId,
      'rules',
      'claude-3-haiku-20240307',
      'failed',
      0,
      0,
      0,
      durationMs,
      null,
      errorMessage
    )

    return {
      gameId,
      gameName: game.name,
      contentType: 'rules',
      success: false,
      tokensInput: 0,
      tokensOutput: 0,
      costUsd: 0,
      durationMs,
      error: errorMessage,
    }
  }
}

/**
 * Generate setup content for a game
 */
export async function generateSetupContent(
  gameId: string
): Promise<GenerationStats> {
  const supabase = await createClient()

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (gameError || !game) {
    throw new Error(`Game not found: ${gameId}`)
  }

  const startTime = Date.now()

  try {
    const prompt = getSetupPrompt(game)
    const result = await generateJSON<SetupContent>(SYSTEM_PROMPT, prompt)

    await supabase
      .from('games')
      .update({
        setup_content: JSON.parse(JSON.stringify(result.data)),
        has_setup_guide: true,
      })
      .eq('id', gameId)

    await logGeneration(
      gameId,
      'setup',
      result.meta.model,
      'success',
      result.meta.tokensInput,
      result.meta.tokensOutput,
      result.meta.costUsd,
      result.meta.durationMs,
      result.data
    )

    return {
      gameId,
      gameName: game.name,
      contentType: 'setup',
      success: true,
      tokensInput: result.meta.tokensInput,
      tokensOutput: result.meta.tokensOutput,
      costUsd: result.meta.costUsd,
      durationMs: result.meta.durationMs,
    }

  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await logGeneration(
      gameId,
      'setup',
      'claude-3-haiku-20240307',
      'failed',
      0,
      0,
      0,
      durationMs,
      null,
      errorMessage
    )

    return {
      gameId,
      gameName: game.name,
      contentType: 'setup',
      success: false,
      tokensInput: 0,
      tokensOutput: 0,
      costUsd: 0,
      durationMs,
      error: errorMessage,
    }
  }
}

/**
 * Generate reference content for a game
 */
export async function generateReferenceContent(
  gameId: string
): Promise<GenerationStats> {
  const supabase = await createClient()

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (gameError || !game) {
    throw new Error(`Game not found: ${gameId}`)
  }

  const startTime = Date.now()

  try {
    const prompt = getReferencePrompt(game)
    const result = await generateJSON<ReferenceContent>(SYSTEM_PROMPT, prompt)

    await supabase
      .from('games')
      .update({
        reference_content: JSON.parse(JSON.stringify(result.data)),
        has_reference: true,
      })
      .eq('id', gameId)

    await logGeneration(
      gameId,
      'reference',
      result.meta.model,
      'success',
      result.meta.tokensInput,
      result.meta.tokensOutput,
      result.meta.costUsd,
      result.meta.durationMs,
      result.data
    )

    return {
      gameId,
      gameName: game.name,
      contentType: 'reference',
      success: true,
      tokensInput: result.meta.tokensInput,
      tokensOutput: result.meta.tokensOutput,
      costUsd: result.meta.costUsd,
      durationMs: result.meta.durationMs,
    }

  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await logGeneration(
      gameId,
      'reference',
      'claude-3-haiku-20240307',
      'failed',
      0,
      0,
      0,
      durationMs,
      null,
      errorMessage
    )

    return {
      gameId,
      gameName: game.name,
      contentType: 'reference',
      success: false,
      tokensInput: 0,
      tokensOutput: 0,
      costUsd: 0,
      durationMs,
      error: errorMessage,
    }
  }
}

/**
 * Generate all content for a game
 */
export async function generateAllContent(
  gameId: string
): Promise<GenerationStats[]> {
  const results: GenerationStats[] = []

  // Generate all three content types
  results.push(await generateRulesContent(gameId))
  results.push(await generateSetupContent(gameId))
  results.push(await generateReferenceContent(gameId))

  // Update content status
  const supabase = await createClient()
  const allSuccess = results.every(r => r.success)

  await supabase
    .from('games')
    .update({
      content_status: allSuccess ? 'draft' : 'none',
      content_generated_at: new Date().toISOString(),
      content_version: 1,
    })
    .eq('id', gameId)

  return results
}

/**
 * Generate content for the next game in queue
 * Picks the highest priority game with content_status = 'none'
 */
export async function generateContentForNextGame(): Promise<GenerationStats[] | null> {
  const supabase = await createClient()

  // Find next game needing content
  const { data: game, error } = await supabase
    .from('games')
    .select('id, name')
    .eq('content_status', 'none')
    .eq('is_published', false)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error || !game) {
    return null
  }

  // Mark as generating
  await supabase
    .from('games')
    .update({ content_status: 'importing' })
    .eq('id', game.id)

  const results = await generateAllContent(game.id)

  return results
}

/**
 * Get generation statistics
 */
export async function getGenerationStats(): Promise<{
  totalGenerations: number
  successfulGenerations: number
  failedGenerations: number
  totalCost: number
  totalTokens: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('content_generation_log')
    .select('status, cost_usd, tokens_input, tokens_output')

  if (error || !data) {
    return {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalCost: 0,
      totalTokens: 0,
    }
  }

  return {
    totalGenerations: data.length,
    successfulGenerations: data.filter(d => d.status === 'success').length,
    failedGenerations: data.filter(d => d.status === 'failed').length,
    totalCost: data.reduce((sum, d) => sum + (d.cost_usd || 0), 0),
    totalTokens: data.reduce((sum, d) => sum + (d.tokens_input || 0) + (d.tokens_output || 0), 0),
  }
}
