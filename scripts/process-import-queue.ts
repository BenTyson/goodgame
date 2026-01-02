/**
 * Process Import Queue
 *
 * Processes pending games in the import queue, importing them from BGG.
 * Uses the full import pipeline with cascading parent imports.
 *
 * Run with: npx tsx scripts/process-import-queue.ts [options]
 *
 * Options:
 *   --limit=N     Limit number of games to process (default: 10)
 *   --all         Process all pending games (ignores limit)
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

async function processQueue(options: { limit: number; all: boolean }) {
  console.log('=== Processing Import Queue ===\n')

  // Get pending items
  let query = supabase
    .from('import_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })

  if (!options.all) {
    query = query.limit(options.limit)
  }

  const { data: queue, error } = await query

  if (error) {
    console.error('Failed to fetch queue:', error.message)
    return
  }

  if (!queue || queue.length === 0) {
    console.log('No pending games in queue!')
    return
  }

  console.log(`Processing ${queue.length} games...\n`)

  let imported = 0
  let failed = 0
  let skipped = 0

  for (const item of queue) {
    console.log(`\n[${imported + failed + skipped + 1}/${queue.length}] ${item.name || `BGG ${item.bgg_id}`}`)

    // Check if already imported
    const { data: existing } = await supabase
      .from('games')
      .select('id, slug')
      .eq('bgg_id', item.bgg_id)
      .single()

    if (existing) {
      console.log(`  Already exists: ${existing.slug}`)
      await supabase
        .from('import_queue')
        .update({ status: 'imported', imported_game_id: existing.id })
        .eq('id', item.id)
      skipped++
      continue
    }

    // Mark as importing
    await supabase
      .from('import_queue')
      .update({ status: 'importing', attempts: (item.attempts || 0) + 1 })
      .eq('id', item.id)

    try {
      // Fetch from BGG
      await waitForRateLimit()
      const url = `${BGG_API_BASE}/thing?id=${item.bgg_id}&stats=1`
      const response = await fetch(url, { headers: getBGGHeaders() })

      if (!response.ok) {
        throw new Error(`BGG API error: ${response.status}`)
      }

      const xml = await response.text()
      const result = await parseStringPromise(xml)

      if (!result.items?.item?.[0]) {
        throw new Error('Game not found on BGG')
      }

      // Parse and import the game
      const bggItem = result.items.item[0]
      const gameId = await importGame(bggItem, item.bgg_id)

      if (gameId) {
        console.log(`  Imported successfully!`)
        await supabase
          .from('import_queue')
          .update({ status: 'imported', imported_game_id: gameId })
          .eq('id', item.id)
        imported++
      } else {
        throw new Error('Import returned no game ID')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`  Failed: ${message}`)

      const shouldRetry = (item.attempts || 0) < 3
      await supabase
        .from('import_queue')
        .update({
          status: shouldRetry ? 'pending' : 'failed',
          error_message: message,
        })
        .eq('id', item.id)
      failed++
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Imported: ${imported}`)
  console.log(`Skipped (already exist): ${skipped}`)
  console.log(`Failed: ${failed}`)
}

async function importGame(bggItem: any, bggId: number): Promise<string | null> {
  // Extract basic data
  const names = bggItem.name || []
  const primaryName = names.find((n: any) => n.$.type === 'primary')
  const name = primaryName?.$.value || 'Unknown'

  // Detect and get/create family
  const familyName = detectFamilyName(name)
  const familyId = familyName ? await getOrCreateFamily(familyName) : null

  const slug = generateSlug(name)

  // Check for slug collision
  let finalSlug = slug
  let suffix = 0
  while (true) {
    const { data } = await supabase
      .from('games')
      .select('id')
      .eq('slug', finalSlug)
      .single()
    if (!data) break
    suffix++
    finalSlug = `${slug}-${suffix}`
  }

  const stats = bggItem.statistics?.[0]?.ratings?.[0]
  const type = bggItem.$.type

  // Parse links
  const links = bggItem.link || []
  const designers = links
    .filter((l: any) => l.$.type === 'boardgamedesigner')
    .map((l: any) => l.$.value)
    .slice(0, 5)
  const publishers = links
    .filter((l: any) => l.$.type === 'boardgamepublisher')
    .map((l: any) => l.$.value)
  const categories = links
    .filter((l: any) => l.$.type === 'boardgamecategory')
    .map((l: any) => ({ id: parseInt(l.$.id), name: l.$.value }))
  const mechanics = links
    .filter((l: any) => l.$.type === 'boardgamemechanic')
    .map((l: any) => l.$.value)
  const families = links
    .filter((l: any) => l.$.type === 'boardgamefamily')
    .map((l: any) => ({ id: parseInt(l.$.id), name: l.$.value }))
  const expansionLinks = links
    .filter((l: any) => l.$.type === 'boardgameexpansion')
    .map((l: any) => ({ id: parseInt(l.$.id), name: l.$.value }))
  const implementationLinks = links
    .filter((l: any) => l.$.type === 'boardgameimplementation')
    .map((l: any) => ({
      id: parseInt(l.$.id),
      name: l.$.value,
      inbound: l.$.inbound === 'true'
    }))

  // Determine expansion/implementation relationships
  const expandsGame = type === 'boardgameexpansion' && expansionLinks.length > 0
    ? expansionLinks[0]
    : null
  const expansions = type === 'boardgame' ? expansionLinks : []
  const implementsGame = implementationLinks.find((l: any) => !l.inbound) || null
  const implementations = implementationLinks
    .filter((l: any) => l.inbound)
    .map(({ id, name }: any) => ({ id, name }))

  // Extract image URLs
  const thumbnail = bggItem.thumbnail?.[0] || null
  const boxImage = bggItem.image?.[0] || null

  // Build raw data for storage
  const rawData = {
    id: bggId,
    type,
    name,
    expandsGame,
    expansions,
    implementsGame,
    implementations,
    families,
    categories,
    mechanics,
    reference_images: {
      box: boxImage,
      thumbnail: thumbnail,
    },
  }

  // Extract values helper
  const extractValue = (obj: any): string => {
    if (!obj) return ''
    if (Array.isArray(obj) && obj[0]) {
      const first = obj[0]
      if (typeof first === 'string') return first
      if (first._ !== undefined) return String(first._)
      if (first.$ && first.$.value) return String(first.$.value)
    }
    return ''
  }

  const extractNumber = (obj: any, defaultVal = 0): number => {
    const str = extractValue(obj)
    const num = parseFloat(str)
    return isNaN(num) ? defaultVal : num
  }

  // Clamp weight to valid range (1-5), default 2.5 if out of range
  const clampWeight = (weight: number): number => {
    if (weight < 1 || weight > 5) return 2.5
    return Math.round(weight * 10) / 10 // Round to 1 decimal place
  }

  // Insert game
  const { data: newGame, error } = await supabase
    .from('games')
    .insert({
      slug: finalSlug,
      name,
      bgg_id: bggId,
      family_id: familyId,
      description: extractValue(bggItem.description),
      tagline: extractValue(bggItem.description).substring(0, 200),
      player_count_min: extractNumber(bggItem.minplayers, 1),
      player_count_max: extractNumber(bggItem.maxplayers, 1),
      play_time_min: extractNumber(bggItem.minplaytime, 30),
      play_time_max: extractNumber(bggItem.maxplaytime, 60),
      min_age: extractNumber(bggItem.minage, 8),
      weight: clampWeight(extractNumber(stats?.averageweight, 0)),
      year_published: extractNumber(bggItem.yearpublished) || null,
      designers,
      publisher: publishers[0] || null,
      is_published: false,
      content_status: 'none',
      priority: 3,
      bgg_raw_data: rawData,
      bgg_last_synced: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !newGame) {
    console.error(`  Insert error: ${error?.message}`)
    return null
  }

  // Link mechanics
  for (const mechName of mechanics) {
    const mechSlug = generateSlug(mechName)
    let { data: mech } = await supabase
      .from('mechanics')
      .select('id')
      .eq('slug', mechSlug)
      .single()

    if (!mech) {
      const { data: newMech } = await supabase
        .from('mechanics')
        .insert({ slug: mechSlug, name: mechName })
        .select('id')
        .single()
      mech = newMech
    }

    if (mech) {
      await supabase
        .from('game_mechanics')
        .upsert({ game_id: newGame.id, mechanic_id: mech.id })
    }
  }

  // Link designers
  for (const [index, designerName] of designers.entries()) {
    const designerSlug = generateSlug(designerName)
    let { data: designer } = await supabase
      .from('designers')
      .select('id')
      .eq('slug', designerSlug)
      .single()

    if (!designer) {
      const { data: newDesigner } = await supabase
        .from('designers')
        .insert({ slug: designerSlug, name: designerName })
        .select('id')
        .single()
      designer = newDesigner
    }

    if (designer) {
      await supabase
        .from('game_designers')
        .upsert({
          game_id: newGame.id,
          designer_id: designer.id,
          is_primary: index === 0,
          display_order: index,
        })
    }
  }

  // Link publishers
  for (const [index, pubName] of publishers.slice(0, 3).entries()) {
    const pubSlug = generateSlug(pubName)
    let { data: pub } = await supabase
      .from('publishers')
      .select('id')
      .eq('slug', pubSlug)
      .single()

    if (!pub) {
      const { data: newPub } = await supabase
        .from('publishers')
        .insert({ slug: pubSlug, name: pubName })
        .select('id')
        .single()
      pub = newPub
    }

    if (pub) {
      await supabase
        .from('game_publishers')
        .upsert({
          game_id: newGame.id,
          publisher_id: pub.id,
          is_primary: index === 0,
          display_order: index,
        })
    }
  }

  // Create expansion relation if applicable
  if (expandsGame) {
    const { data: baseGame } = await supabase
      .from('games')
      .select('id')
      .eq('bgg_id', expandsGame.id)
      .single()

    if (baseGame) {
      await supabase
        .from('game_relations')
        .upsert({
          source_game_id: newGame.id,
          target_game_id: baseGame.id,
          relation_type: 'expansion_of',
        })
    }
  }

  // Create implementation relation if applicable
  if (implementsGame) {
    const { data: originalGame } = await supabase
      .from('games')
      .select('id')
      .eq('bgg_id', implementsGame.id)
      .single()

    if (originalGame) {
      await supabase
        .from('game_relations')
        .upsert({
          source_game_id: newGame.id,
          target_game_id: originalGame.id,
          relation_type: 'reimplementation_of',
        })
    }
  }

  // Update has_unimported_relations flag
  const relatedBggIds = [
    ...expansions.map((e: any) => e.id),
    ...implementations.map((i: any) => i.id),
  ]

  if (relatedBggIds.length > 0) {
    const { data: existingRelated } = await supabase
      .from('games')
      .select('bgg_id')
      .in('bgg_id', relatedBggIds)

    const existingIds = new Set(existingRelated?.map(g => g.bgg_id) || [])
    const hasUnimported = relatedBggIds.some((id: number) => !existingIds.has(id))

    await supabase
      .from('games')
      .update({ has_unimported_relations: hasUnimported })
      .eq('id', newGame.id)
  }

  return newGame.id
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

/**
 * Detect family name from game name
 * Examples:
 *   "7 Wonders: Cities" → "7 Wonders"
 *   "7 Wonders (Second Edition)" → "7 Wonders"
 *   "Catan: Seafarers" → "Catan"
 *   "Pandemic Legacy: Season 1" → "Pandemic"
 */
function detectFamilyName(gameName: string): string | null {
  // Try colon separator first (most common)
  if (gameName.includes(':')) {
    const baseName = gameName.split(':')[0].trim()
    // Only use as family if the base name is substantial (not just an article)
    if (baseName.length >= 3) {
      return baseName
    }
  }

  // Try parentheses (edition indicators)
  const parenMatch = gameName.match(/^(.+?)\s*\(/)
  if (parenMatch) {
    const baseName = parenMatch[1].trim()
    if (baseName.length >= 3) {
      return baseName
    }
  }

  // Try en-dash separator
  if (gameName.includes(' – ')) {
    const baseName = gameName.split(' – ')[0].trim()
    if (baseName.length >= 3) {
      return baseName
    }
  }

  return null
}

/**
 * Get or create a game family
 */
async function getOrCreateFamily(familyName: string): Promise<string | null> {
  const familySlug = generateSlug(familyName)

  // Check if family exists
  const { data: existing } = await supabase
    .from('game_families')
    .select('id')
    .eq('slug', familySlug)
    .single()

  if (existing) {
    return existing.id
  }

  // Create new family
  const { data: newFamily, error } = await supabase
    .from('game_families')
    .insert({
      slug: familySlug,
      name: familyName,
    })
    .select('id')
    .single()

  if (error) {
    console.log(`  Could not create family "${familyName}": ${error.message}`)
    return null
  }

  console.log(`  Created family: ${familyName}`)
  return newFamily.id
}

// Parse args and run
function parseArgs() {
  const args = process.argv.slice(2)
  return {
    limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '10'),
    all: args.includes('--all'),
  }
}

processQueue(parseArgs()).catch(console.error)
