/**
 * Backfill BGG Reference Images
 *
 * Updates games that are missing reference_images in their bgg_raw_data
 * by fetching fresh data from BGG API.
 *
 * Run with: npx tsx scripts/backfill-bgg-images.ts [options]
 *
 * Options:
 *   --dry-run     Don't actually update, just report
 *   --limit=N     Limit number of games to process
 *   --name=PATTERN  Only process games matching name pattern
 */

import { createClient } from '@supabase/supabase-js'
import { parseStringPromise } from 'xml2js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2'

// Rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1100

async function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    )
  }
  lastRequestTime = Date.now()
}

function getBGGHeaders(): HeadersInit {
  const token = process.env.BGG_API_TOKEN
  if (!token) {
    console.warn('BGG_API_TOKEN not set - API calls may fail')
    return {}
  }
  return { 'Authorization': `Bearer ${token}` }
}

async function backfillImages(options: { dryRun: boolean; limit?: number; namePattern?: string }) {
  console.log('=== Backfill BGG Reference Images ===\n')
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`)
  if (options.limit) console.log(`Limit: ${options.limit}`)
  if (options.namePattern) console.log(`Name pattern: ${options.namePattern}`)
  console.log()

  // Find games missing reference_images
  let query = supabase
    .from('games')
    .select('id, name, bgg_id, bgg_raw_data')
    .not('bgg_id', 'is', null)
    .order('name')

  if (options.namePattern) {
    query = query.ilike('name', `%${options.namePattern}%`)
  }

  if (options.limit) {
    query = query.limit(options.limit * 2) // Get extra in case some already have images
  }

  const { data: games, error } = await query

  if (error || !games) {
    console.error('Failed to fetch games:', error?.message)
    return
  }

  // Filter to games missing reference_images
  const gamesMissingImages = games.filter(g => {
    const raw = g.bgg_raw_data as { reference_images?: { box?: string; thumbnail?: string } } | null
    return !raw?.reference_images?.thumbnail && !raw?.reference_images?.box
  })

  const toProcess = options.limit ? gamesMissingImages.slice(0, options.limit) : gamesMissingImages

  console.log(`Found ${gamesMissingImages.length} games missing images`)
  console.log(`Processing ${toProcess.length} games...\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const game of toProcess) {
    console.log(`[${updated + skipped + failed + 1}/${toProcess.length}] ${game.name}`)

    if (options.dryRun) {
      console.log('  [DRY RUN] Would fetch and update')
      updated++
      continue
    }

    try {
      await waitForRateLimit()
      const url = `${BGG_API_BASE}/thing?id=${game.bgg_id}`
      const response = await fetch(url, { headers: getBGGHeaders() })

      if (!response.ok) {
        throw new Error(`BGG API error: ${response.status}`)
      }

      const xml = await response.text()
      const result = await parseStringPromise(xml)

      if (!result.items?.item?.[0]) {
        throw new Error('Game not found on BGG')
      }

      const bggItem = result.items.item[0]
      const thumbnail = bggItem.thumbnail?.[0] || null
      const boxImage = bggItem.image?.[0] || null

      if (!thumbnail && !boxImage) {
        console.log('  No images on BGG')
        skipped++
        continue
      }

      // Merge with existing raw data
      const existingRaw = (game.bgg_raw_data || {}) as Record<string, unknown>
      const updatedRaw = {
        ...existingRaw,
        reference_images: {
          box: boxImage,
          thumbnail: thumbnail,
        },
      }

      const { error: updateError } = await supabase
        .from('games')
        .update({ bgg_raw_data: updatedRaw })
        .eq('id', game.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      console.log(`  Updated: box=${boxImage ? 'yes' : 'no'}, thumb=${thumbnail ? 'yes' : 'no'}`)
      updated++
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`  Failed: ${message}`)
      failed++
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Updated: ${updated}`)
  console.log(`Skipped (no images on BGG): ${skipped}`)
  console.log(`Failed: ${failed}`)
}

// Parse args
function parseArgs() {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '') || undefined,
    namePattern: args.find(a => a.startsWith('--name='))?.split('=')[1],
  }
}

backfillImages(parseArgs()).catch(console.error)
