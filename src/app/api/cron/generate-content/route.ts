/**
 * Content Generation Cron Endpoint
 *
 * POST /api/cron/generate-content
 *
 * Triggered by cron-job.org to generate AI content for games.
 * Processes 1 game per run to stay within API limits.
 *
 * Headers:
 *   x-cron-secret: Required, must match CRON_SECRET env var
 *
 * Query params:
 *   gameId: Optional specific game ID to generate content for
 */

import { NextRequest } from 'next/server'
import { verifyCronAuth, unauthorizedResponse, jsonResponse, errorResponse } from '@/lib/api/auth'
import {
  generateContentForNextGame,
  generateAllContent,
  getGenerationStats,
} from '@/lib/ai'

export const maxDuration = 120 // Allow up to 2 minutes for AI generation

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyCronAuth(request)) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    let results

    if (gameId) {
      // Generate content for specific game
      results = await generateAllContent(gameId)
    } else {
      // Generate content for next game in queue
      results = await generateContentForNextGame()
    }

    if (!results) {
      return jsonResponse({
        success: true,
        message: 'No games pending content generation',
        generated: 0,
        timestamp: new Date().toISOString(),
      })
    }

    // Calculate totals
    const totalCost = results.reduce((sum, r) => sum + r.costUsd, 0)
    const totalTokens = results.reduce((sum, r) => sum + r.tokensInput + r.tokensOutput, 0)
    const allSuccess = results.every(r => r.success)

    return jsonResponse({
      success: allSuccess,
      gameId: results[0].gameId,
      gameName: results[0].gameName,
      generated: results.length,
      results: results.map(r => ({
        contentType: r.contentType,
        success: r.success,
        tokensInput: r.tokensInput,
        tokensOutput: r.tokensOutput,
        costUsd: r.costUsd,
        durationMs: r.durationMs,
        error: r.error,
      })),
      totals: {
        costUsd: totalCost,
        tokens: totalTokens,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Content generation error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Generation failed'
    )
  }
}

// GET endpoint for stats
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return unauthorizedResponse()
  }

  try {
    const stats = await getGenerationStats()

    return jsonResponse({
      status: 'ready',
      stats,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Stats error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Stats check failed'
    )
  }
}
