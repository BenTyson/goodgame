/**
 * Detect and set base_game_id for game families
 *
 * Strategy: Base game is the oldest game in the family that is NOT
 * an expansion or reimplementation of another game.
 *
 * Run with: npx tsx scripts/detect-family-base-games.ts [options]
 *
 * Options:
 *   --dry-run        Don't actually update, just report
 *   --family=SLUG    Only process a specific family by slug
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function detectBaseGames(options: { dryRun: boolean; familySlug?: string }) {
  console.log('=== Detect Base Games for Families ===\n')
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}\n`)

  // Get families
  let familiesQuery = supabase
    .from('game_families')
    .select('id, name, slug, base_game_id')
    .order('name')

  if (options.familySlug) {
    familiesQuery = familiesQuery.eq('slug', options.familySlug)
  }

  const { data: families, error: famError } = await familiesQuery

  if (famError || !families) {
    console.error('Failed to fetch families:', famError?.message)
    return
  }

  if (families.length === 0) {
    console.log('No families found.')
    return
  }

  let updated = 0
  let skipped = 0
  let noGames = 0

  for (const family of families) {
    console.log(`\nProcessing: ${family.name}`)

    // Get all games in this family
    const { data: games } = await supabase
      .from('games')
      .select('id, name, year_published, bgg_id')
      .eq('family_id', family.id)
      .order('year_published', { ascending: true, nullsFirst: false })

    if (!games || games.length === 0) {
      console.log(`  No games in family`)
      noGames++
      continue
    }

    console.log(`  Games in family: ${games.length}`)

    // Get games that have expansion_of or reimplementation_of relations (dependent games)
    const { data: dependentRelations } = await supabase
      .from('game_relations')
      .select('source_game_id')
      .in('source_game_id', games.map(g => g.id))
      .in('relation_type', ['expansion_of', 'reimplementation_of'])

    const dependentGameIds = new Set(
      dependentRelations?.map(r => r.source_game_id) || []
    )

    // Filter to only "independent" games (not expansions/reimplementations)
    let independentGames = games.filter(g => !dependentGameIds.has(g.id))

    if (independentGames.length === 0) {
      console.log(`  No independent games found (all are expansions/reimplementations)`)
      console.log(`  Falling back to oldest game`)
      independentGames = [...games]
    } else {
      console.log(`  Independent games: ${independentGames.length}`)
    }

    // Sort by year_published (ascending), then by bgg_id (lower = older entry)
    independentGames.sort((a, b) => {
      const yearA = a.year_published || 9999
      const yearB = b.year_published || 9999
      if (yearA !== yearB) return yearA - yearB
      return (a.bgg_id || 0) - (b.bgg_id || 0)
    })

    const baseGame = independentGames[0]

    // Check if already set correctly
    if (family.base_game_id === baseGame.id) {
      console.log(`  Already set to: "${baseGame.name}" (${baseGame.year_published || 'N/A'})`)
      skipped++
      continue
    }

    const currentBase = family.base_game_id
      ? games.find(g => g.id === family.base_game_id)?.name || 'Unknown'
      : 'None'

    console.log(`  Current base: ${currentBase}`)
    console.log(`  New base: "${baseGame.name}" (${baseGame.year_published || 'N/A'})`)

    if (!options.dryRun) {
      const { error } = await supabase
        .from('game_families')
        .update({ base_game_id: baseGame.id })
        .eq('id', family.id)

      if (error) {
        console.error(`  Failed to update: ${error.message}`)
        continue
      }
      console.log(`  Updated!`)
    } else {
      console.log(`  [DRY RUN] Would update`)
    }

    updated++
  }

  console.log('\n=== Summary ===')
  console.log(`Families processed: ${families.length}`)
  console.log(`Updated: ${updated}`)
  console.log(`Already correct: ${skipped}`)
  console.log(`No games in family: ${noGames}`)
}

// Parse command line args
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    dryRun: false,
    familySlug: undefined as string | undefined,
  }

  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true
    if (arg.startsWith('--family=')) options.familySlug = arg.split('=')[1]
  }

  return options
}

detectBaseGames(parseArgs()).catch(console.error)
