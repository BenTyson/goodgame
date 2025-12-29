/**
 * Migration API: Backfill themes and player experiences for existing games
 * POST /api/admin/migrate-taxonomy
 *
 * This is a one-time migration for games imported before the taxonomy system was added.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { resolveBGGAliases } from '@/lib/supabase/category-queries'
import { getBGGThemeSlugs, getBGGExperienceSlugs } from '@/lib/config/bgg-mappings'
import { ApiErrors } from '@/lib/api/errors'

interface BGGLink {
  id: number
  name: string
}

interface BGGRawData {
  categoryLinks?: BGGLink[]
  mechanicLinks?: BGGLink[]
  categories?: string[]
  mechanics?: string[]
}

interface MigrationResult {
  gameId: string
  gameName: string
  themesAdded: number
  experiencesAdded: number
  skipped: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  // Check admin auth
  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  const supabase = createAdminClient()

  // Parse options from request
  const body = await request.json().catch(() => ({}))
  const dryRun = body.dryRun === true
  const limit = body.limit || 100

  const results: MigrationResult[] = []
  let totalThemes = 0
  let totalExperiences = 0
  let skipped = 0
  let errors = 0

  try {
    // Fetch all games with bgg_raw_data
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, name, bgg_raw_data')
      .not('bgg_raw_data', 'is', null)
      .limit(limit)

    if (gamesError || !games) {
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    // Fetch all themes and experiences upfront
    const [{ data: themes }, { data: experiences }] = await Promise.all([
      supabase.from('themes').select('id, slug'),
      supabase.from('player_experiences').select('id, slug'),
    ])

    if (!themes || !experiences) {
      return NextResponse.json({ error: 'Failed to fetch taxonomy data' }, { status: 500 })
    }

    const themeBySlug = new Map(themes.map(t => [t.slug, t.id]))
    const themeById = new Map(themes.map(t => [t.id, t.slug]))
    const expBySlug = new Map(experiences.map(e => [e.slug, e.id]))
    const expById = new Map(experiences.map(e => [e.id, e.slug]))

    // Check existing links to avoid duplicates
    const gameIds = games.map(g => g.id)
    const [{ data: existingThemeLinks }, { data: existingExpLinks }] = await Promise.all([
      supabase.from('game_themes').select('game_id').in('game_id', gameIds),
      supabase.from('game_player_experiences').select('game_id').in('game_id', gameIds),
    ])

    const gamesWithThemes = new Set(existingThemeLinks?.map(l => l.game_id) || [])
    const gamesWithExps = new Set(existingExpLinks?.map(l => l.game_id) || [])

    // Process each game
    for (const game of games) {
      const result: MigrationResult = {
        gameId: game.id,
        gameName: game.name,
        themesAdded: 0,
        experiencesAdded: 0,
        skipped: false,
      }

      // Skip if already has both themes and experiences
      if (gamesWithThemes.has(game.id) && gamesWithExps.has(game.id)) {
        result.skipped = true
        skipped++
        results.push(result)
        continue
      }

      try {
        const bggData = game.bgg_raw_data as BGGRawData
        if (!bggData) {
          result.skipped = true
          skipped++
          results.push(result)
          continue
        }

        const categoryLinks = bggData.categoryLinks || []
        const categories = bggData.categories || []
        const mechanics = bggData.mechanics || []

        // Process themes (if not already linked)
        if (!gamesWithThemes.has(game.id)) {
          const matchedThemeIds = new Set<string>()

          // Step 1: Resolve via alias system
          if (categoryLinks.length > 0) {
            const bggIds = categoryLinks.map(link => link.id)
            const aliasMap = await resolveBGGAliases(bggIds, 'category', 'theme')
            for (const [, targetId] of aliasMap) {
              if (themeById.has(targetId)) {
                matchedThemeIds.add(targetId)
              }
            }
          }

          // Step 2: Fall back to name-based mapping
          const themeSlugs = getBGGThemeSlugs(categories)
          for (const slug of themeSlugs) {
            if (themeBySlug.has(slug)) {
              matchedThemeIds.add(themeBySlug.get(slug)!)
            }
          }

          if (matchedThemeIds.size > 0 && !dryRun) {
            const themeIdArray = Array.from(matchedThemeIds)
            const links = themeIdArray.map((themeId, index) => ({
              game_id: game.id,
              theme_id: themeId,
              is_primary: index === 0,
            }))
            await supabase.from('game_themes').insert(links)
          }

          result.themesAdded = matchedThemeIds.size
          totalThemes += matchedThemeIds.size
        }

        // Process player experiences (if not already linked)
        if (!gamesWithExps.has(game.id)) {
          const matchedExpIds = new Set<string>()

          // Step 1: Resolve via alias system
          if (categoryLinks.length > 0) {
            const bggIds = categoryLinks.map(link => link.id)
            const aliasMap = await resolveBGGAliases(bggIds, 'category', 'player_experience')
            for (const [, targetId] of aliasMap) {
              if (expById.has(targetId)) {
                matchedExpIds.add(targetId)
              }
            }
          }

          // Step 2: Fall back to name-based mapping
          const experienceSlugs = getBGGExperienceSlugs(categories, mechanics)
          for (const slug of experienceSlugs) {
            if (expBySlug.has(slug)) {
              matchedExpIds.add(expBySlug.get(slug)!)
            }
          }

          if (matchedExpIds.size > 0 && !dryRun) {
            const expIdArray = Array.from(matchedExpIds)
            const links = expIdArray.map((expId, index) => ({
              game_id: game.id,
              player_experience_id: expId,
              is_primary: index === 0,
            }))
            await supabase.from('game_player_experiences').insert(links)
          }

          result.experiencesAdded = matchedExpIds.size
          totalExperiences += matchedExpIds.size
        }

        results.push(result)
      } catch (err) {
        result.error = err instanceof Error ? err.message : 'Unknown error'
        errors++
        results.push(result)
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        totalGames: games.length,
        themesAdded: totalThemes,
        experiencesAdded: totalExperiences,
        skipped,
        errors,
      },
      results,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check current state
export async function GET() {
  // Check admin auth
  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  const supabase = createAdminClient()

  // Get counts
  const [
    { count: totalGames },
    { count: gamesWithBggData },
    { count: gamesWithThemes },
    { count: gamesWithExperiences },
    { count: themeLinks },
    { count: experienceLinks },
  ] = await Promise.all([
    supabase.from('games').select('*', { count: 'exact', head: true }),
    supabase.from('games').select('*', { count: 'exact', head: true }).not('bgg_raw_data', 'is', null),
    supabase.from('game_themes').select('game_id', { count: 'exact', head: true }),
    supabase.from('game_player_experiences').select('game_id', { count: 'exact', head: true }),
    supabase.from('game_themes').select('*', { count: 'exact', head: true }),
    supabase.from('game_player_experiences').select('*', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    totalGames,
    gamesWithBggData,
    gamesWithThemes,
    gamesWithExperiences,
    themeLinks,
    experienceLinks,
    needsMigration: (gamesWithBggData || 0) - Math.min(gamesWithThemes || 0, gamesWithExperiences || 0),
  })
}
