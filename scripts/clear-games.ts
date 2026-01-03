/**
 * Script to clear all games data from the database
 * Run with: npx tsx scripts/clear-games.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Use any type to avoid strict table typing for this utility script
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function clearGamesData() {
  console.log('Starting database cleanup...\n')

  // Tables to clear (in order to respect foreign key constraints)
  // Most will cascade from games, but we'll be explicit
  const tablesToClear = [
    // Game relations and content (will cascade from games, but let's be safe)
    'game_relations',
    'game_awards',
    'game_categories',
    'game_mechanics',
    'game_themes',
    'game_player_experiences',
    'game_designers',
    'game_publishers',
    'game_artists',
    'game_images',
    'affiliate_links',
    'score_sheet_configs',
    'collection_games',
    'user_top_games',
    'marketplace_listings',
    // Main tables
    'games',
    'import_queue',
    // Entity tables (optional - comment out if you want to keep these)
    'designers',
    'publishers',
    'artists',
    'game_families',
  ]

  for (const table of tablesToClear) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000') // Match all UUIDs

      if (error) {
        // Try with different column for non-UUID tables
        const { error: error2 } = await supabase
          .from(table)
          .delete()
          .gte('created_at', '1970-01-01')

        if (error2) {
          console.log(`  ⚠ ${table}: ${error2.message}`)
        } else {
          console.log(`  ✓ ${table}: cleared`)
        }
      } else {
        console.log(`  ✓ ${table}: cleared`)
      }
    } catch (err) {
      console.log(`  ⚠ ${table}: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
  }

  console.log('\n✅ Database cleanup complete!')
  console.log('\nNote: Taxonomy tables (categories, mechanics, themes, player_experiences) were preserved.')
}

clearGamesData().catch(console.error)
