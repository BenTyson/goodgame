import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { parsePdfFromUrl, generateBNCS } from '@/lib/rulebook'
import { generateJSON } from '@/lib/ai/claude'
import { getDataExtractionPrompt, RULEBOOK_SYSTEM_PROMPT } from '@/lib/rulebook/prompts'
import type { ExtractedGameData } from '@/lib/rulebook/types'
import type { Json } from '@/types/database'

/**
 * POST /api/admin/rulebook/parse
 * Parse a rulebook PDF and generate BNCS score
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
    const { gameId, url } = body

    if (!gameId || !url) {
      return NextResponse.json(
        { error: 'Game ID and URL required' },
        { status: 400 }
      )
    }

    // Get game info
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, name, slug, publisher')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const startTime = Date.now()

    // Parse the PDF
    let pdf
    try {
      pdf = await parsePdfFromUrl(url)
    } catch (error) {
      // Log failed attempt
      await supabase.from('rulebook_parse_log').insert({
        game_id: gameId,
        rulebook_url: url,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'PDF parsing failed',
        processing_time_ms: Date.now() - startTime,
      })

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse PDF',
      })
    }

    // Extract game data using AI
    let extractedData: ExtractedGameData | null = null
    try {
      const prompt = getDataExtractionPrompt(pdf.text, game.name)
      const result = await generateJSON<ExtractedGameData>(
        RULEBOOK_SYSTEM_PROMPT,
        prompt,
        { temperature: 0.3, model: 'claude-3-haiku-20240307' }
      )
      extractedData = result.data
      console.log('Extracted data keys:', Object.keys(result.data || {}))
      console.log('Extracted tagline:', extractedData?.tagline)
      console.log('Extracted description:', extractedData?.description?.substring(0, 100))
    } catch (error) {
      console.error('AI extraction failed:', error)
      // Continue without extracted data
    }

    // Generate BNCS score
    let bncs
    let bncsError: string | undefined
    try {
      bncs = await generateBNCS(pdf, game.name)
    } catch (error) {
      console.error('BNCS generation failed:', error)
      bncsError = error instanceof Error ? error.message : 'BNCS generation failed'
      // Continue without BNCS - will still save parsed data
    }

    const processingTime = Date.now() - startTime

    // Log successful parse with the parsed text
    const { data: parseLog } = await supabase.from('rulebook_parse_log').insert({
      game_id: gameId,
      rulebook_url: url,
      status: bncs ? 'success' : 'partial',
      page_count: pdf.pageCount,
      word_count: pdf.wordCount,
      extracted_data: (extractedData ?? null) as Json | null,
      processing_time_ms: processingTime,
      parsed_text: pdf.text, // Store the parsed rulebook text
    }).select('id').single()

    // Update game with parsed data
    const updateData: Record<string, unknown> = {
      rulebook_url: url,
      rulebook_source: 'publisher_website',
      rulebook_parsed_at: new Date().toISOString(),
      ...(parseLog?.id && { latest_parse_log_id: parseLog.id }),
    }

    // Add BNCS if generated
    if (bncs) {
      updateData.bncs_score = bncs.score
      updateData.bncs_breakdown = bncs.breakdown
      updateData.bncs_generated_at = new Date().toISOString()
    }

    // Add component list if extracted
    if (extractedData?.components) {
      updateData.component_list = extractedData.components
    }

    // Add tagline and description if extracted (and not placeholder text)
    if (extractedData?.tagline && !extractedData.tagline.startsWith('<GENERATE')) {
      updateData.tagline = extractedData.tagline
    }
    if (extractedData?.description && !extractedData.description.startsWith('<GENERATE')) {
      updateData.description = extractedData.description
    }

    console.log('Saving update data:', {
      tagline: updateData.tagline,
      description: typeof updateData.description === 'string' ? updateData.description.substring(0, 50) + '...' : undefined,
      hasComponents: !!updateData.component_list,
      hasBncs: !!updateData.bncs_score,
    })

    const { error: updateError } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)

    if (updateError) {
      console.error('Failed to update game:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save parsed data',
      })
    }

    console.log('Successfully saved game update for:', gameId)

    return NextResponse.json({
      success: true,
      pageCount: pdf.pageCount,
      wordCount: pdf.wordCount,
      bncsScore: bncs?.score,
      bncsConfidence: bncs?.confidence,
      bncsError,
      processingTimeMs: processingTime,
    })
  } catch (error) {
    console.error('Rulebook parse error:', error)
    return NextResponse.json(
      { success: false, error: 'Parsing failed' },
      { status: 500 }
    )
  }
}
