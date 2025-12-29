/**
 * Migration: Infer themes and player experiences from existing category links
 *
 * Run with: npx tsx scripts/migrate-from-categories.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map our internal categories to themes
const CATEGORY_TO_THEMES: Record<string, string[]> = {
  'strategy': ['economic'],
  'cooperative': [],
  'party-games': ['humor'],
  'family-games': [],
  'thematic': ['fantasy'],
  'economic': ['economic'],
  'deck-building': [],
  'war-game': ['war', 'historical'],
  'abstract': ['abstract'],
  'campaign': ['fantasy'],
}

// Map our internal categories to player experiences
const CATEGORY_TO_EXPERIENCES: Record<string, string[]> = {
  'strategy': ['competitive'],
  'cooperative': ['cooperative'],
  'party-games': ['social'],
  'family-games': ['social'],
  'thematic': ['narrative'],
  'economic': ['competitive'],
  'deck-building': ['competitive'],
  'war-game': ['competitive'],
  'abstract': ['competitive'],
  'campaign': ['narrative', 'cooperative'],
}

// Map our mechanics to player experiences
const MECHANIC_TO_EXPERIENCES: Record<string, string[]> = {
  'cooperative-play': ['cooperative'],
  'solo-play': ['solo'],
  'team-based': ['team-based'],
  'hidden-roles': ['hidden-roles'],
  'storytelling': ['narrative'],
  'variable-player-powers': ['asymmetric'],
  'area-control': ['competitive'],
  'worker-placement': ['competitive'],
  'deck-building': ['competitive'],
  'drafting': ['competitive'],
  'auction-bidding': ['competitive'],
}

async function main() {
  console.log('Starting migration from existing categories...\n')

  // Get all games with their categories and mechanics
  const { data: games, error } = await supabase
    .from('games')
    .select(`
      id,
      name,
      game_categories(categories(id, slug, name)),
      game_mechanics(mechanics(id, slug, name))
    `)

  if (error || !games) {
    console.error('Failed to fetch games:', error)
    process.exit(1)
  }

  console.log(`Found ${games.length} games\n`)

  // Get themes and experiences
  const [{ data: themes }, { data: experiences }] = await Promise.all([
    supabase.from('themes').select('id, slug, name'),
    supabase.from('player_experiences').select('id, slug, name'),
  ])

  if (!themes || !experiences) {
    console.error('Failed to fetch taxonomy')
    process.exit(1)
  }

  const themeBySlug = new Map(themes.map(t => [t.slug, t]))
  const expBySlug = new Map(experiences.map(e => [e.slug, e]))

  console.log('Available themes:', themes.map(t => t.slug).join(', '))
  console.log('Available experiences:', experiences.map(e => e.slug).join(', '))
  console.log()

  // Check existing links
  const gameIds = games.map(g => g.id)
  const [{ data: existingThemes }, { data: existingExps }] = await Promise.all([
    supabase.from('game_themes').select('game_id').in('game_id', gameIds),
    supabase.from('game_player_experiences').select('game_id').in('game_id', gameIds),
  ])

  const gamesWithThemes = new Set(existingThemes?.map(l => l.game_id) || [])
  const gamesWithExps = new Set(existingExps?.map(l => l.game_id) || [])

  let totalThemes = 0
  let totalExperiences = 0
  let skipped = 0

  for (const game of games) {
    if (gamesWithThemes.has(game.id) && gamesWithExps.has(game.id)) {
      skipped++
      continue
    }

    const categories = (game.game_categories as any[])
      ?.map((gc: any) => gc.categories?.slug)
      .filter(Boolean) || []

    const mechanics = (game.game_mechanics as any[])
      ?.map((gm: any) => gm.mechanics?.slug)
      .filter(Boolean) || []

    const inferredThemes = new Set<string>()
    const inferredExps = new Set<string>()

    // Infer from categories
    for (const cat of categories) {
      const themeSlugs = CATEGORY_TO_THEMES[cat] || []
      const expSlugs = CATEGORY_TO_EXPERIENCES[cat] || []
      themeSlugs.forEach(s => inferredThemes.add(s))
      expSlugs.forEach(s => inferredExps.add(s))
    }

    // Infer from mechanics
    for (const mech of mechanics) {
      const expSlugs = MECHANIC_TO_EXPERIENCES[mech] || []
      expSlugs.forEach(s => inferredExps.add(s))
    }

    // Insert theme links
    if (!gamesWithThemes.has(game.id) && inferredThemes.size > 0) {
      const themeLinks = Array.from(inferredThemes)
        .map(slug => themeBySlug.get(slug))
        .filter(Boolean)
        .map((theme, i) => ({
          game_id: game.id,
          theme_id: theme!.id,
          is_primary: i === 0,
        }))

      if (themeLinks.length > 0) {
        const { error } = await supabase.from('game_themes').insert(themeLinks)
        if (!error) {
          totalThemes += themeLinks.length
          console.log(`✓ ${game.name} - Themes: ${Array.from(inferredThemes).join(', ')}`)
        }
      }
    }

    // Insert experience links
    if (!gamesWithExps.has(game.id) && inferredExps.size > 0) {
      const expLinks = Array.from(inferredExps)
        .map(slug => expBySlug.get(slug))
        .filter(Boolean)
        .map((exp, i) => ({
          game_id: game.id,
          player_experience_id: exp!.id,
          is_primary: i === 0,
        }))

      if (expLinks.length > 0) {
        const { error } = await supabase.from('game_player_experiences').insert(expLinks)
        if (!error) {
          totalExperiences += expLinks.length
          if (inferredThemes.size === 0) {
            console.log(`✓ ${game.name} - Experiences: ${Array.from(inferredExps).join(', ')}`)
          } else {
            console.log(`              Experiences: ${Array.from(inferredExps).join(', ')}`)
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('Migration Complete!')
  console.log('='.repeat(50))
  console.log(`Games processed: ${games.length}`)
  console.log(`Theme links added: ${totalThemes}`)
  console.log(`Experience links added: ${totalExperiences}`)
  console.log(`Skipped: ${skipped}`)
}

main().catch(console.error)
