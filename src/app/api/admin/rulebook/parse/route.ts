import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { parsePdfFromUrl, generateCrunchScore, parseStructuredRulebook } from '@/lib/rulebook'
import { generateRulebookThumbnail } from '@/lib/rulebook/thumbnail'
import { generateJSON } from '@/lib/ai/claude'
import { getDataExtractionPrompt, getTaxonomyExtractionPrompt, RULEBOOK_SYSTEM_PROMPT } from '@/lib/rulebook/prompts'
import type { ExtractedGameData } from '@/lib/rulebook/types'
import type { Json, TaxonomyExtractionResult, TaxonomySuggestionInsert } from '@/types/database'

/**
 * POST /api/admin/rulebook/parse
 * Parse a rulebook PDF and generate Crunch Score
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

    // Get game info including BGG weight for calibration
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, name, slug, publisher, weight')
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
        { temperature: 0.3, model: 'claude-3-5-haiku-20241022' }
      )
      extractedData = result.data
      console.log('Extracted data keys:', Object.keys(result.data || {}))
      console.log('Extracted tagline:', extractedData?.tagline)
      console.log('Extracted description:', extractedData?.description?.substring(0, 100))
    } catch (error) {
      console.error('AI extraction failed:', error)
      // Continue without extracted data
    }

    // Generate Crunch Score (with BGG weight calibration if available)
    let crunch
    let crunchError: string | undefined
    try {
      crunch = await generateCrunchScore(pdf, game.name, game.weight)
    } catch (error) {
      console.error('Crunch Score generation failed:', error)
      crunchError = error instanceof Error ? error.message : 'Crunch Score generation failed'
      // Continue without Crunch Score - will still save parsed data
    }

    // Extract taxonomy suggestions (themes and player experiences)
    let taxonomySuggestions: TaxonomyExtractionResult | null = null
    let taxonomyError: string | undefined
    try {
      console.log('Starting taxonomy extraction...')

      // Fetch all themes and player experiences
      const [themesResult, experiencesResult] = await Promise.all([
        supabase.from('themes').select('id, name, description').order('display_order'),
        supabase.from('player_experiences').select('id, name, description').order('display_order'),
      ])

      console.log('Fetched taxonomy options:', {
        themes: themesResult.data?.length ?? 0,
        themesError: themesResult.error?.message,
        experiences: experiencesResult.data?.length ?? 0,
        experiencesError: experiencesResult.error?.message,
      })

      if (themesResult.data && experiencesResult.data) {
        const prompt = getTaxonomyExtractionPrompt(
          pdf.text,
          game.name,
          themesResult.data,
          experiencesResult.data
        )
        console.log('Calling AI for taxonomy extraction...')
        const result = await generateJSON<TaxonomyExtractionResult>(
          RULEBOOK_SYSTEM_PROMPT,
          prompt,
          { temperature: 0.2, model: 'claude-3-5-haiku-20241022', maxTokens: 2048 }
        )
        taxonomySuggestions = result.data
        console.log('AI taxonomy extraction result:', JSON.stringify(taxonomySuggestions, null, 2))
        console.log('Extracted taxonomy summary:', {
          themes: taxonomySuggestions?.themes?.length ?? 0,
          experiences: taxonomySuggestions?.playerExperiences?.length ?? 0,
          newSuggestions: taxonomySuggestions?.newSuggestions?.length ?? 0,
        })

        // Clear any existing pending suggestions for this game
        await supabase
          .from('taxonomy_suggestions')
          .delete()
          .eq('game_id', gameId)
          .eq('status', 'pending')

        // Store suggestions in database
        if (taxonomySuggestions) {
          const suggestions: TaxonomySuggestionInsert[] = []

          // Add theme suggestions
          for (const theme of taxonomySuggestions.themes || []) {
            suggestions.push({
              game_id: gameId,
              suggestion_type: 'theme',
              target_id: theme.id,
              confidence: theme.confidence,
              reasoning: theme.reasoning,
              is_primary: theme.isPrimary,
              status: 'pending',
            })
          }

          // Add player experience suggestions
          for (const exp of taxonomySuggestions.playerExperiences || []) {
            suggestions.push({
              game_id: gameId,
              suggestion_type: 'player_experience',
              target_id: exp.id,
              confidence: exp.confidence,
              reasoning: exp.reasoning,
              is_primary: false,
              status: 'pending',
            })
          }

          // Add new taxonomy suggestions
          for (const newSugg of taxonomySuggestions.newSuggestions || []) {
            suggestions.push({
              game_id: gameId,
              suggestion_type: newSugg.type === 'theme' ? 'new_theme' : 'new_experience',
              target_id: null,
              suggested_name: newSugg.name,
              suggested_description: newSugg.description,
              confidence: null,
              reasoning: newSugg.reasoning,
              is_primary: false,
              status: 'pending',
            })
          }

          if (suggestions.length > 0) {
            console.log(`Inserting ${suggestions.length} taxonomy suggestions into database...`)
            const { error: insertError } = await supabase
              .from('taxonomy_suggestions')
              .insert(suggestions)
            if (insertError) {
              console.error('Failed to store taxonomy suggestions:', insertError)
            } else {
              console.log('Successfully stored taxonomy suggestions')
            }
          } else {
            console.log('No taxonomy suggestions to insert')
          }
        }
      }
    } catch (error) {
      console.error('Taxonomy extraction failed:', error)
      taxonomyError = error instanceof Error ? error.message : 'Taxonomy extraction failed'
      // Continue without taxonomy - not critical
    }

    const processingTime = Date.now() - startTime

    // Generate structured/cleaned text for AI Q&A feature
    const structuredText = parseStructuredRulebook(pdf.text)
    console.log('Structured text generated:', {
      sections: structuredText.sections.length,
      totalWords: structuredText.metadata.totalWords,
      cleaningApplied: structuredText.metadata.cleaningApplied,
    })

    // Generate rulebook thumbnail (first page preview)
    let thumbnailResult: { thumbnailUrl: string; storagePath: string } | null = null
    try {
      thumbnailResult = await generateRulebookThumbnail(url, game.slug)
      if (thumbnailResult) {
        console.log('Thumbnail generated:', thumbnailResult.thumbnailUrl)
      }
    } catch (error) {
      console.error('Thumbnail generation failed:', error)
      // Continue without thumbnail - not critical
    }

    // Log successful parse with the parsed text
    const { data: parseLog } = await supabase.from('rulebook_parse_log').insert({
      game_id: gameId,
      rulebook_url: url,
      status: crunch ? 'success' : 'partial',
      page_count: pdf.pageCount,
      word_count: pdf.wordCount,
      extracted_data: (extractedData ?? null) as Json | null,
      processing_time_ms: processingTime,
      parsed_text: pdf.text, // Store the raw parsed text
      parsed_text_structured: structuredText as unknown as Json, // Store the structured version
    }).select('id').single()

    // Update game with parsed data
    const updateData: Record<string, unknown> = {
      rulebook_url: url,
      rulebook_source: 'publisher_website',
      rulebook_parsed_at: new Date().toISOString(),
      ...(parseLog?.id && { latest_parse_log_id: parseLog.id }),
      ...(thumbnailResult && { rulebook_thumbnail_url: thumbnailResult.thumbnailUrl }),
    }

    // Add Crunch Score if generated
    if (crunch) {
      updateData.crunch_score = crunch.score
      updateData.crunch_breakdown = crunch.breakdown
      updateData.crunch_generated_at = new Date().toISOString()
      if (crunch.bggReference !== null) {
        updateData.crunch_bgg_reference = crunch.bggReference
      }
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
      hasCrunchScore: !!updateData.crunch_score,
      bggReference: updateData.crunch_bgg_reference,
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
      crunchScore: crunch?.score,
      crunchConfidence: crunch?.confidence,
      crunchBggReference: crunch?.bggReference,
      crunchError,
      // Legacy fields for backward compatibility
      bncsScore: crunch?.score,
      bncsConfidence: crunch?.confidence,
      bncsError: crunchError,
      taxonomy: taxonomySuggestions ? {
        themesCount: taxonomySuggestions.themes?.length ?? 0,
        experiencesCount: taxonomySuggestions.playerExperiences?.length ?? 0,
        newSuggestionsCount: taxonomySuggestions.newSuggestions?.length ?? 0,
      } : null,
      taxonomyError,
      // Structured text info
      structuredText: {
        sectionsCount: structuredText.sections.length,
        totalWords: structuredText.metadata.totalWords,
        cleaningApplied: structuredText.metadata.cleaningApplied,
      },
      // Thumbnail info
      thumbnail: thumbnailResult ? {
        url: thumbnailResult.thumbnailUrl,
        storagePath: thumbnailResult.storagePath,
      } : null,
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
