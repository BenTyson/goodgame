/**
 * Enrich a game with Wikidata data
 * Usage: npx tsx scripts/enrich-wikidata.ts <bgg_id>
 *
 * First tries to find by BGG ID, then falls back to name search.
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { getGameByBggIdOrName } from '../src/lib/wikidata/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function enrichGame(bggId: number) {
  // Get the game from our database
  const { data: game, error } = await supabase
    .from('games')
    .select('id, name, bgg_id')
    .eq('bgg_id', bggId)
    .single()

  if (error || !game) {
    console.error('Error fetching game:', error)
    return
  }

  console.log(`Enriching: ${game.name} (BGG ${bggId})`)

  // Fetch from Wikidata (tries BGG ID first, then name search)
  const wikidata = await getGameByBggIdOrName(String(bggId), game.name)

  if (!wikidata) {
    console.log('No Wikidata entry found for this game')
    return
  }

  console.log(`Wikidata found: ${wikidata.name} (${wikidata.wikidataId})`)

  // Build update
  const updateData: Record<string, unknown> = {
    wikidata_id: wikidata.wikidataId,
    wikidata_last_synced: new Date().toISOString(),
  }

  if (wikidata.imageUrl) {
    updateData.wikidata_image_url = wikidata.imageUrl
    console.log(`  Image: ${wikidata.imageUrl}`)
  }

  if (wikidata.officialWebsite) {
    updateData.official_website = wikidata.officialWebsite
    console.log(`  Website: ${wikidata.officialWebsite}`)
  }

  if (wikidata.rulebookUrl) {
    updateData.rulebook_url = wikidata.rulebookUrl
    updateData.rulebook_source = 'wikidata'
    console.log(`  Rulebook: ${wikidata.rulebookUrl}`)
  }

  // Update the game
  const { error: updateError } = await supabase
    .from('games')
    .update(updateData)
    .eq('id', game.id)

  if (updateError) {
    console.error('Update error:', updateError)
  } else {
    console.log('Game updated successfully!')
  }
}

// Get BGG ID from command line
const bggId = parseInt(process.argv[2])
if (!bggId) {
  console.error('Usage: npx tsx scripts/enrich-wikidata.ts <bgg_id>')
  process.exit(1)
}

enrichGame(bggId).catch(console.error)
