import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import {
  fetchWikipediaContent,
  summarizeWikipediaContent,
  formatSummaryForPrompt,
  isValidWikipediaUrl,
  type WikipediaSummary,
} from '@/lib/wikipedia'
import type { Json } from '@/types/database'

interface WikipediaStatusResponse {
  hasWikipediaUrl: boolean
  wikipediaUrl: string | null
  hasSummary: boolean
  summary: WikipediaSummary | null
  formattedSummary: string | null
  fetchedAt: string | null
  isStale: boolean // True if fetched > 30 days ago
}

interface WikipediaFetchResponse {
  success: boolean
  summary: WikipediaSummary
  formattedSummary: string
  fetchedAt: string
  articleTitle: string
  wordCount: number
  usage: {
    model: string
    tokensInput: number
    tokensOutput: number
    costUsd: number
  }
}

/**
 * GET /api/admin/games/[id]/wikipedia
 * Get current Wikipedia summary status for a game
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!(await isAdmin())) {
    return ApiErrors.unauthorized()
  }

  try {
    const { id: gameId } = await params
    const adminClient = createAdminClient()

    const { data: game, error } = await adminClient
      .from('games')
      .select('id, name, wikipedia_url, wikipedia_summary, wikipedia_fetched_at')
      .eq('id', gameId)
      .single()

    if (error || !game) {
      return ApiErrors.notFound('Game', error)
    }

    // Check if summary is stale (> 30 days old)
    const isStale =
      game.wikipedia_fetched_at &&
      new Date(game.wikipedia_fetched_at) <
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const summary = game.wikipedia_summary as WikipediaSummary | null

    const response: WikipediaStatusResponse = {
      hasWikipediaUrl: !!game.wikipedia_url,
      wikipediaUrl: game.wikipedia_url,
      hasSummary: !!summary,
      summary,
      formattedSummary: summary ? formatSummaryForPrompt(summary) : null,
      fetchedAt: game.wikipedia_fetched_at,
      isStale: !!isStale,
    }

    return NextResponse.json(response)
  } catch (error) {
    return ApiErrors.internal(error, {
      route: 'GET /api/admin/games/[id]/wikipedia',
    })
  }
}

/**
 * POST /api/admin/games/[id]/wikipedia
 * Fetch Wikipedia content, summarize with AI, and store in database
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!(await isAdmin())) {
    return ApiErrors.unauthorized()
  }

  try {
    const { id: gameId } = await params
    const adminClient = createAdminClient()

    // Get game with Wikipedia URL
    const { data: game, error: gameError } = await adminClient
      .from('games')
      .select('id, name, wikipedia_url')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return ApiErrors.notFound('Game', gameError)
    }

    if (!game.wikipedia_url) {
      return ApiErrors.validation('Game does not have a Wikipedia URL')
    }

    if (!isValidWikipediaUrl(game.wikipedia_url)) {
      return ApiErrors.validation('Invalid Wikipedia URL format')
    }

    // Fetch Wikipedia article content
    const wikiResult = await fetchWikipediaContent(game.wikipedia_url)

    if (!wikiResult.rawContent || wikiResult.wordCount < 50) {
      return ApiErrors.validation(
        'Wikipedia article content too short or empty'
      )
    }

    // Summarize with AI
    const summaryResult = await summarizeWikipediaContent(
      wikiResult.rawContent,
      game.name
    )

    const fetchedAt = new Date().toISOString()

    // Store in database
    const { error: updateError } = await adminClient
      .from('games')
      .update({
        wikipedia_summary: summaryResult.data as unknown as Json,
        wikipedia_fetched_at: fetchedAt,
      })
      .eq('id', gameId)

    if (updateError) {
      return ApiErrors.database(updateError, {
        route: 'POST /api/admin/games/[id]/wikipedia',
      })
    }

    const response: WikipediaFetchResponse = {
      success: true,
      summary: summaryResult.data,
      formattedSummary: formatSummaryForPrompt(summaryResult.data),
      fetchedAt,
      articleTitle: wikiResult.articleTitle,
      wordCount: wikiResult.wordCount,
      usage: {
        model: summaryResult.meta.model,
        tokensInput: summaryResult.meta.tokensInput,
        tokensOutput: summaryResult.meta.tokensOutput,
        costUsd: summaryResult.meta.costUsd,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    // Handle specific Wikipedia errors
    if (error instanceof Error) {
      if (error.message.includes('Wikipedia article not found')) {
        return ApiErrors.notFound('Wikipedia article', error)
      }
      if (error.message.includes('Invalid Wikipedia URL')) {
        return ApiErrors.validation(error.message)
      }
    }

    return ApiErrors.internal(error, {
      route: 'POST /api/admin/games/[id]/wikipedia',
    })
  }
}
