/**
 * Update has_unimported_relations flag for all existing games
 *
 * This script checks each game's bgg_raw_data for expansions and implementations
 * that are not yet in our database, and sets the flag accordingly.
 *
 * Run with: npx tsx scripts/update-unimported-relations-flag.ts [options]
 *
 * Options:
 *   --dry-run    Don't actually update, just report
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface BGGRawData {
  expansions?: { id: number; name: string }[]
  implementations?: { id: number; name: string }[]
}

async function updateFlags(options: { dryRun: boolean }) {
  console.log('=== Update has_unimported_relations Flags ===\n')
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}\n`)

  // Get all games with bgg_raw_data
  const { data: games, error } = await supabase
    .from('games')
    .select('id, name, bgg_id, bgg_raw_data, has_unimported_relations')
    .not('bgg_raw_data', 'is', null)
    .order('name')

  if (error || !games) {
    console.error('Failed to fetch games:', error?.message)
    return
  }

  console.log(`Processing ${games.length} games with bgg_raw_data\n`)

  // Get all BGG IDs that exist in our database
  const { data: allGames } = await supabase
    .from('games')
    .select('bgg_id')
    .not('bgg_id', 'is', null)

  const existingBggIds = new Set(allGames?.map(g => g.bgg_id) || [])

  let flaggedTrue = 0
  let flaggedFalse = 0
  let unchanged = 0

  for (const game of games) {
    const rawData = game.bgg_raw_data as BGGRawData | null
    if (!rawData) continue

    // Collect all related BGG IDs
    const relatedBggIds: number[] = []

    if (rawData.expansions && rawData.expansions.length > 0) {
      relatedBggIds.push(...rawData.expansions.map(e => e.id))
    }

    if (rawData.implementations && rawData.implementations.length > 0) {
      relatedBggIds.push(...rawData.implementations.map(i => i.id))
    }

    // Check if any are missing
    const hasUnimported = relatedBggIds.some(id => !existingBggIds.has(id))
    const currentFlag = game.has_unimported_relations || false

    if (hasUnimported === currentFlag) {
      unchanged++
      continue
    }

    if (hasUnimported) {
      const unimportedCount = relatedBggIds.filter(id => !existingBggIds.has(id)).length
      console.log(`  ${game.name}: ${unimportedCount} unimported relations → TRUE`)
      flaggedTrue++
    } else {
      console.log(`  ${game.name}: all relations imported → FALSE`)
      flaggedFalse++
    }

    if (!options.dryRun) {
      await supabase
        .from('games')
        .update({ has_unimported_relations: hasUnimported })
        .eq('id', game.id)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Games processed: ${games.length}`)
  console.log(`Flagged as having unimported relations: ${flaggedTrue}`)
  console.log(`Flagged as fully imported: ${flaggedFalse}`)
  console.log(`Unchanged: ${unchanged}`)
}

// Parse command line args
function parseArgs() {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
  }
}

updateFlags(parseArgs()).catch(console.error)
