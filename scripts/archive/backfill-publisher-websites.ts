/**
 * Backfill Publisher Websites from BGG
 *
 * This script fetches publisher website URLs from BoardGameGeek
 * for publishers in our database that have a bgg_id but no website.
 *
 * Usage: npx tsx scripts/backfill-publisher-websites.ts
 *
 * Legal note: Publisher website URLs are public factual data.
 * We are not scraping BGG content, just accessing public API data.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/supabase'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// Rate limiting
const DELAY_MS = 1500 // BGG asks for ~1 request per second

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch publisher details from BGG API
 */
async function fetchPublisherFromBGG(bggId: number): Promise<{
  name: string
  website: string | null
} | null> {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&type=boardgamepublisher`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Board Nomads Data Enrichment (https://boardnomads.com)',
      },
    })

    if (!response.ok) {
      console.error(`  BGG API error: ${response.status}`)
      return null
    }

    const xml = await response.text()

    // Parse website URL from XML
    // Format: <link type="website" id="..." value="https://..."/>
    const websiteMatch = xml.match(/<link[^>]*type="website"[^>]*value="([^"]+)"/)
    const website = websiteMatch ? websiteMatch[1] : null

    // Get name
    const nameMatch = xml.match(/<name[^>]*type="primary"[^>]*value="([^"]+)"/)
    const name = nameMatch ? nameMatch[1] : ''

    return { name, website }
  } catch (error) {
    console.error(`  Fetch error: ${error}`)
    return null
  }
}

async function main() {
  console.log('=== Backfill Publisher Websites from BGG ===\n')

  // Get publishers with bgg_id but no website
  const { data: publishers, error } = await supabase
    .from('publishers')
    .select('id, name, slug, bgg_id, website')
    .not('bgg_id', 'is', null)
    .is('website', null)
    .order('name')

  if (error) {
    console.error('Failed to fetch publishers:', error)
    process.exit(1)
  }

  console.log(`Found ${publishers.length} publishers to update\n`)

  if (publishers.length === 0) {
    console.log('All publishers already have websites or no BGG IDs.')
    return
  }

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const publisher of publishers) {
    console.log(`Processing: ${publisher.name} (BGG ID: ${publisher.bgg_id})`)

    const bggData = await fetchPublisherFromBGG(publisher.bgg_id!)

    if (!bggData) {
      console.log('  -> Failed to fetch from BGG')
      failed++
      await sleep(DELAY_MS)
      continue
    }

    if (!bggData.website) {
      console.log('  -> No website listed on BGG')
      skipped++
      await sleep(DELAY_MS)
      continue
    }

    // Update the publisher
    const { error: updateError } = await supabase
      .from('publishers')
      .update({ website: bggData.website })
      .eq('id', publisher.id)

    if (updateError) {
      console.log(`  -> Update failed: ${updateError.message}`)
      failed++
    } else {
      console.log(`  -> Updated: ${bggData.website}`)
      updated++
    }

    // Rate limiting
    await sleep(DELAY_MS)
  }

  console.log('\n=== Summary ===')
  console.log(`Updated: ${updated}`)
  console.log(`Skipped (no website on BGG): ${skipped}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total processed: ${publishers.length}`)
}

main().catch(console.error)
