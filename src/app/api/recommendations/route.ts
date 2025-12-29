/**
 * Game Recommendations API
 * POST /api/recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai/claude'
import { buildSignals, getHardFilters, rankGames } from '@/lib/recommend/scoring'
import { classifyArchetype } from '@/lib/recommend/archetypes'
import {
  buildRecommendationPrompt,
  RECOMMENDATION_SYSTEM_PROMPT,
  generatePersonalizedText,
  type AIResponse,
} from '@/lib/recommend/prompts'
import type { WizardAnswers, GameRecommendation } from '@/lib/recommend/types'
import type { Game } from '@/types/database'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { answers } = body as { answers: WizardAnswers }

    if (!answers) {
      return NextResponse.json(
        { error: 'Missing answers in request body' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Build preference signals from answers
    const signals = buildSignals(answers)
    const hardFilters = getHardFilters(signals)

    // 2. Classify the user's archetype
    const archetype = classifyArchetype(answers)

    // 3. Fetch candidate games with hard filters
    let query = supabase
      .from('games')
      .select('*')
      .eq('is_published', true)
      .order('name')

    // Apply hard filters (permissive to get enough candidates)
    if (hardFilters.playersMin !== undefined) {
      query = query.gte('player_count_max', hardFilters.playersMin)
    }
    if (hardFilters.playersMax !== undefined) {
      query = query.lte('player_count_min', hardFilters.playersMax)
    }
    // Be more permissive on time and weight to get enough candidates
    if (hardFilters.weightMax !== undefined && hardFilters.weightMax < 4) {
      query = query.lte('weight', hardFilters.weightMax + 0.5)
    }
    if (hardFilters.weightMin !== undefined && hardFilters.weightMin > 1.5) {
      query = query.gte('weight', hardFilters.weightMin - 0.5)
    }

    const { data: games, error: gamesError } = await query

    if (gamesError || !games || games.length === 0) {
      console.error('Error fetching games:', gamesError)
      return NextResponse.json(
        { error: 'No games found matching your criteria' },
        { status: 404 }
      )
    }

    // 4. Fetch categories, mechanics, themes, and player experiences for each game
    const gameIds = games.map((g) => g.id)

    const [categoriesResult, mechanicsResult, themesResult, experiencesResult] = await Promise.all([
      supabase
        .from('game_categories')
        .select('game_id, categories(slug, name)')
        .in('game_id', gameIds),
      supabase
        .from('game_mechanics')
        .select('game_id, mechanics(slug, name)')
        .in('game_id', gameIds),
      supabase
        .from('game_themes')
        .select('game_id, themes(slug, name)')
        .in('game_id', gameIds),
      supabase
        .from('game_player_experiences')
        .select('game_id, player_experiences(slug, name)')
        .in('game_id', gameIds),
    ])

    // Build lookup maps
    const gameCategoriesMap = new Map<string, string[]>()
    const gameMechanicsMap = new Map<string, string[]>()
    const gameThemesMap = new Map<string, string[]>()
    const gameExperiencesMap = new Map<string, string[]>()
    const gameCategoryNamesMap = new Map<string, string[]>()
    const gameMechanicNamesMap = new Map<string, string[]>()
    const gameThemeNamesMap = new Map<string, string[]>()
    const gameExperienceNamesMap = new Map<string, string[]>()

    if (categoriesResult.data) {
      for (const row of categoriesResult.data) {
        const existing = gameCategoriesMap.get(row.game_id) || []
        const existingNames = gameCategoryNamesMap.get(row.game_id) || []
        const cat = row.categories as { slug: string; name: string } | null
        if (cat?.slug) {
          existing.push(cat.slug)
          existingNames.push(cat.name)
          gameCategoriesMap.set(row.game_id, existing)
          gameCategoryNamesMap.set(row.game_id, existingNames)
        }
      }
    }

    if (mechanicsResult.data) {
      for (const row of mechanicsResult.data) {
        const existing = gameMechanicsMap.get(row.game_id) || []
        const existingNames = gameMechanicNamesMap.get(row.game_id) || []
        const mech = row.mechanics as { slug: string; name: string } | null
        if (mech?.slug) {
          existing.push(mech.slug)
          existingNames.push(mech.name)
          gameMechanicsMap.set(row.game_id, existing)
          gameMechanicNamesMap.set(row.game_id, existingNames)
        }
      }
    }

    if (themesResult.data) {
      for (const row of themesResult.data) {
        const existing = gameThemesMap.get(row.game_id) || []
        const existingNames = gameThemeNamesMap.get(row.game_id) || []
        const theme = row.themes as { slug: string; name: string } | null
        if (theme?.slug) {
          existing.push(theme.slug)
          existingNames.push(theme.name)
          gameThemesMap.set(row.game_id, existing)
          gameThemeNamesMap.set(row.game_id, existingNames)
        }
      }
    }

    if (experiencesResult.data) {
      for (const row of experiencesResult.data) {
        const existing = gameExperiencesMap.get(row.game_id) || []
        const existingNames = gameExperienceNamesMap.get(row.game_id) || []
        const exp = row.player_experiences as { slug: string; name: string } | null
        if (exp?.slug) {
          existing.push(exp.slug)
          existingNames.push(exp.name)
          gameExperiencesMap.set(row.game_id, existing)
          gameExperienceNamesMap.set(row.game_id, existingNames)
        }
      }
    }

    // 5. Score and rank games
    const rankedGames = rankGames(
      games as Game[],
      signals,
      gameCategoriesMap,
      gameMechanicsMap,
      gameThemesMap,
      gameExperiencesMap
    )

    // 6. Prepare candidates for AI
    const candidates = rankedGames.slice(0, 15).map((r) => ({
      game: r.game,
      score: r.score,
      categories: gameCategoryNamesMap.get(r.game.id) || [],
      mechanics: gameMechanicNamesMap.get(r.game.id) || [],
      themes: gameThemeNamesMap.get(r.game.id) || [],
      experiences: gameExperienceNamesMap.get(r.game.id) || [],
    }))

    // 7. Call Claude for final ranking and explanations
    const prompt = buildRecommendationPrompt(archetype, answers, candidates)

    let recommendations: GameRecommendation[]

    try {
      const aiResult = await generateJSON<AIResponse>(
        RECOMMENDATION_SYSTEM_PROMPT,
        prompt,
        { temperature: 0.7 }
      )

      // Map AI recommendations to full game data
      recommendations = aiResult.data.recommendations.map((rec) => {
        const candidate = candidates.find((c) => c.game.id === rec.gameId)
        const gameData = candidate?.game
        if (!gameData) {
          // Fallback to first candidate if AI returned invalid ID
          const fallback = candidates[0]
          return {
            ...rec,
            game: {
              id: fallback.game.id,
              name: fallback.game.name,
              slug: fallback.game.slug,
              description: fallback.game.description,
              thumbnail_url: fallback.game.thumbnail_url,
              player_count_min: fallback.game.player_count_min,
              player_count_max: fallback.game.player_count_max,
              play_time_min: fallback.game.play_time_min,
              play_time_max: fallback.game.play_time_max,
              weight: fallback.game.weight,
              categories: fallback.categories,
              mechanics: fallback.mechanics,
            },
          }
        }
        return {
          ...rec,
          game: {
            id: gameData.id,
            name: gameData.name,
            slug: gameData.slug,
            description: gameData.description,
            thumbnail_url: gameData.thumbnail_url,
            player_count_min: gameData.player_count_min,
            player_count_max: gameData.player_count_max,
            play_time_min: gameData.play_time_min,
            play_time_max: gameData.play_time_max,
            weight: gameData.weight,
            categories: candidate.categories,
            mechanics: candidate.mechanics,
          },
        }
      })
    } catch (aiError) {
      console.error('AI recommendation failed, using fallback:', aiError)

      // Fallback: Use top 3 scored games with template-based personalization
      recommendations = rankedGames.slice(0, 3).map((r, i) => {
        const categories = gameCategoryNamesMap.get(r.game.id) || []
        const mechanics = gameMechanicNamesMap.get(r.game.id) || []
        const personalized = generatePersonalizedText(
          r.game,
          answers,
          archetype,
          categories,
          mechanics,
          i + 1
        )

        return {
          gameId: r.game.id,
          rank: (i + 1) as 1 | 2 | 3,
          confidence: i === 0 ? 'high' : 'medium' as 'high' | 'medium',
          personalizedReason: personalized.personalizedReason,
          playPitch: personalized.playPitch,
          perfectFor: personalized.perfectFor,
          game: {
            id: r.game.id,
            name: r.game.name,
            slug: r.game.slug,
            description: r.game.description,
            thumbnail_url: r.game.thumbnail_url,
            player_count_min: r.game.player_count_min,
            player_count_max: r.game.player_count_max,
            play_time_min: r.game.play_time_min,
            play_time_max: r.game.play_time_max,
            weight: r.game.weight,
            categories,
            mechanics,
          },
        }
      })
    }

    // 8. Build "also consider" list (next 4 games after top 3)
    const topGameIds = new Set(recommendations.map((r) => r.gameId))
    const alsoConsider = rankedGames
      .filter((r) => !topGameIds.has(r.game.id))
      .slice(0, 4)
      .map((r) => ({
        id: r.game.id,
        name: r.game.name,
        slug: r.game.slug,
        thumbnail_url: r.game.thumbnail_url,
        player_count_min: r.game.player_count_min,
        player_count_max: r.game.player_count_max,
        weight: r.game.weight,
      }))

    // 9. Return response
    return NextResponse.json({
      archetype,
      recommendations,
      alsoConsider,
      meta: {
        totalCandidates: games.length,
        processingTimeMs: Date.now() - startTime,
      },
    })
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
