/**
 * Enrich Publishers from BGG
 *
 * This script enriches publisher data from BoardGameGeek:
 * 1. Looks up BGG IDs for publishers that don't have one
 * 2. Fetches website URLs for publishers with BGG IDs
 *
 * Usage: npx tsx scripts/enrich-publishers-from-bgg.ts
 *
 * Legal note: Publisher names, IDs, and website URLs are public factual data.
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
const DELAY_MS = 2000 // BGG asks for ~1 request per second, we're being extra polite

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Search BGG for a publisher by name
 */
async function searchPublisherOnBGG(name: string): Promise<{
  bggId: number
  exactMatch: boolean
} | null> {
  // Use BGG search API
  const encodedName = encodeURIComponent(name)
  const url = `https://boardgamegeek.com/xmlapi2/search?query=${encodedName}&type=boardgamepublisher&exact=1`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Board Nomads Data Enrichment (https://boardnomads.com)',
      },
    })

    if (!response.ok) {
      return null
    }

    const xml = await response.text()

    // Check if we got an exact match
    const exactMatch = xml.match(/<item[^>]*id="(\d+)"/)
    if (exactMatch) {
      return { bggId: parseInt(exactMatch[1], 10), exactMatch: true }
    }

    // Try non-exact search
    const nonExactUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodedName}&type=boardgamepublisher`
    await sleep(DELAY_MS)

    const nonExactResponse = await fetch(nonExactUrl, {
      headers: {
        'User-Agent': 'Board Nomads Data Enrichment (https://boardnomads.com)',
      },
    })

    if (!nonExactResponse.ok) {
      return null
    }

    const nonExactXml = await nonExactResponse.text()
    const firstMatch = nonExactXml.match(/<item[^>]*id="(\d+)"/)

    if (firstMatch) {
      return { bggId: parseInt(firstMatch[1], 10), exactMatch: false }
    }

    return null
  } catch (error) {
    console.error(`  Search error: ${error}`)
    return null
  }
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
      return null
    }

    const xml = await response.text()

    // Parse website URL from XML
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
  console.log('=== Enrich Publishers from BGG ===\n')

  // Get all publishers
  const { data: publishers, error } = await supabase
    .from('publishers')
    .select('id, name, slug, bgg_id, website')
    .order('name')

  if (error) {
    console.error('Failed to fetch publishers:', error)
    process.exit(1)
  }

  console.log(`Found ${publishers.length} publishers\n`)

  const stats = {
    alreadyComplete: 0,
    foundBggId: 0,
    foundWebsite: 0,
    noMatch: 0,
    failed: 0,
  }

  for (const publisher of publishers) {
    // Skip if already has both bgg_id and website
    if (publisher.bgg_id && publisher.website) {
      stats.alreadyComplete++
      continue
    }

    console.log(`\nProcessing: ${publisher.name}`)

    let bggId = publisher.bgg_id

    // Step 1: Find BGG ID if missing
    if (!bggId) {
      console.log('  Looking up BGG ID...')
      const searchResult = await searchPublisherOnBGG(publisher.name)
      await sleep(DELAY_MS)

      if (searchResult) {
        bggId = searchResult.bggId
        console.log(`  -> Found BGG ID: ${bggId}${searchResult.exactMatch ? ' (exact match)' : ' (fuzzy match)'}`)

        // Save the BGG ID
        await supabase
          .from('publishers')
          .update({ bgg_id: bggId })
          .eq('id', publisher.id)

        stats.foundBggId++
      } else {
        console.log('  -> No BGG match found')
        stats.noMatch++
        continue
      }
    }

    // Step 2: Get website if missing
    if (!publisher.website && bggId) {
      console.log('  Fetching details from BGG...')
      const bggData = await fetchPublisherFromBGG(bggId)
      await sleep(DELAY_MS)

      if (bggData?.website) {
        console.log(`  -> Found website: ${bggData.website}`)

        await supabase
          .from('publishers')
          .update({ website: bggData.website })
          .eq('id', publisher.id)

        stats.foundWebsite++
      } else {
        console.log('  -> No website on BGG')
      }
    }
  }

  console.log('\n\n=== Summary ===')
  console.log(`Already complete: ${stats.alreadyComplete}`)
  console.log(`Found BGG IDs: ${stats.foundBggId}`)
  console.log(`Found websites: ${stats.foundWebsite}`)
  console.log(`No BGG match: ${stats.noMatch}`)
  console.log(`Failed: ${stats.failed}`)
  console.log(`Total processed: ${publishers.length}`)
}

main().catch(console.error)
