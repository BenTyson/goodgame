import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import type { ParsedTextStructured } from '@/lib/rulebook/types'

/**
 * GET /api/admin/rulebook/parsed-text
 * Fetch the parsed rulebook text for a game (raw and structured)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // First try to get from latest_parse_log_id
    const { data: game } = await supabase
      .from('games')
      .select('latest_parse_log_id')
      .eq('id', gameId)
      .single()

    let parsedText: string | null = null
    let parsedTextStructured: ParsedTextStructured | null = null
    let wordCount: number | null = null
    let pageCount: number | null = null
    let parsedAt: string | null = null

    // Cast game to include the new column (types may not be synced)
    const gameData = game as { latest_parse_log_id?: string } | null

    if (gameData?.latest_parse_log_id) {
      const { data: parseLog } = await supabase
        .from('rulebook_parse_log')
        .select('parsed_text, parsed_text_structured, word_count, page_count, created_at')
        .eq('id', gameData.latest_parse_log_id)
        .single()

      if (parseLog) {
        parsedText = parseLog.parsed_text || null
        parsedTextStructured = parseLog.parsed_text_structured as unknown as ParsedTextStructured | null
        wordCount = parseLog.word_count || null
        pageCount = parseLog.page_count || null
        parsedAt = parseLog.created_at || null
      }
    }

    // If no latest_parse_log_id, try to get the most recent successful parse
    if (!parsedText) {
      const { data: recentLog } = await supabase
        .from('rulebook_parse_log')
        .select('parsed_text, parsed_text_structured, word_count, page_count, created_at')
        .eq('game_id', gameId)
        .in('status', ['success', 'partial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (recentLog) {
        parsedText = recentLog.parsed_text || null
        parsedTextStructured = recentLog.parsed_text_structured as unknown as ParsedTextStructured | null
        wordCount = recentLog.word_count || null
        pageCount = recentLog.page_count || null
        parsedAt = recentLog.created_at || null
      }
    }

    if (!parsedText) {
      return NextResponse.json({
        text: null,
        structured: null,
        message: 'No parsed text found. Parse the rulebook first.',
      })
    }

    return NextResponse.json({
      text: parsedText,
      structured: parsedTextStructured,
      wordCount,
      pageCount,
      parsedAt,
      characterCount: parsedText.length,
    })
  } catch (error) {
    console.error('Failed to fetch parsed text:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parsed text' },
      { status: 500 }
    )
  }
}
