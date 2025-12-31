/**
 * BGG Extract Importer
 *
 * Imports games from the TypeScript BGG extractor output.
 * Handles enriched data format with BGG IDs, relationships, and entity details.
 *
 * Run with: npx tsx scripts/import-bgg-extract.ts [options]
 *
 * Options:
 *   --input=FILE      Input JSON file (default: tools/bgg-extractor/output/games.json)
 *   --entities=FILE   Entities JSON file (default: tools/bgg-extractor/output/entities.json)
 *   --limit=N         Limit number of games to import
 *   --dry-run         Don't actually import, just report what would happen
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types for extracted data
interface BGGEntity {
  bgg_id: number
  name: string
}

interface ExpansionLink extends BGGEntity {
  direction: 'expands' | 'expanded_by'
}

interface ImplementationLink extends BGGEntity {
  direction: 'reimplements' | 'reimplemented_by'
}

interface RulebookHint {
  filename: string
  language?: string
  type: 'rulebook' | 'faq' | 'reference' | 'other'
}

interface ExtractedGame {
  bgg_id: number
  name: string
  alternate_names: string[]
  year_published: number | null
  min_players: number | null
  max_players: number | null
  min_playtime: number | null
  max_playtime: number | null
  min_age: number | null
  image_url: string | null
  thumbnail_url: string | null
  designers: BGGEntity[]
  publishers: BGGEntity[]
  artists: BGGEntity[]
  categories: BGGEntity[]
  mechanics: BGGEntity[]
  expansions: ExpansionLink[]
  implementations: ImplementationLink[]
  families: BGGEntity[]
  integrations: BGGEntity[]
  rulebook_hints: RulebookHint[]
  extracted_at: string
}

interface ExtractionResult {
  games: ExtractedGame[]
  stats: {
    total_games: number
    extraction_date: string
  }
}

interface EnrichedEntity {
  bgg_id: number
  name: string
  website: string | null
  extracted_at: string
}

interface EntitiesData {
  publishers: EnrichedEntity[]
  designers: EnrichedEntity[]
}

// Import options
interface ImportOptions {
  inputPath: string
  entitiesPath: string
  limit?: number
  dryRun: boolean
}

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2)
  const options: ImportOptions = {
    inputPath: 'tools/bgg-extractor/output/games.json',
    entitiesPath: 'tools/bgg-extractor/output/entities.json',
    dryRun: false,
  }

  for (const arg of args) {
    if (arg.startsWith('--input=')) {
      options.inputPath = arg.split('=')[1]
    } else if (arg.startsWith('--entities=')) {
      options.entitiesPath = arg.split('=')[1]
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10)
    } else if (arg === '--dry-run') {
      options.dryRun = true
    }
  }

  return options
}

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

/**
 * Get unique slug (handle collisions)
 */
async function getUniqueSlug(baseSlug: string): Promise<string> {
  let finalSlug = baseSlug
  let suffix = 0

  while (true) {
    const { data: existing } = await supabase
      .from('games')
      .select('id')
      .eq('slug', finalSlug)
      .single()

    if (!existing) break
    suffix++
    finalSlug = `${baseSlug}-${suffix}`
  }

  return finalSlug
}

/**
 * Upsert a designer with BGG ID and return their ID
 */
async function upsertDesigner(
  designer: BGGEntity,
  websiteLookup: Map<number, string>
): Promise<string | null> {
  const slug = generateSlug(designer.name)

  // Check by BGG ID first
  const { data: existingByBgg } = await supabase
    .from('designers')
    .select('id')
    .eq('bgg_id', designer.bgg_id)
    .single()

  if (existingByBgg) {
    // Update with any new data
    await supabase
      .from('designers')
      .update({
        name: designer.name,
        website: websiteLookup.get(designer.bgg_id) || undefined,
      })
      .eq('id', existingByBgg.id)
    return existingByBgg.id
  }

  // Check by slug
  const { data: existingBySlug } = await supabase
    .from('designers')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingBySlug) {
    // Update with BGG ID
    await supabase
      .from('designers')
      .update({
        bgg_id: designer.bgg_id,
        website: websiteLookup.get(designer.bgg_id) || undefined,
      })
      .eq('id', existingBySlug.id)
    return existingBySlug.id
  }

  // Create new
  const { data: newDesigner, error } = await supabase
    .from('designers')
    .insert({
      slug,
      name: designer.name,
      bgg_id: designer.bgg_id,
      website: websiteLookup.get(designer.bgg_id) || null,
    })
    .select('id')
    .single()

  if (error || !newDesigner) {
    console.error(`  Failed to create designer ${designer.name}:`, error?.message)
    return null
  }
  return newDesigner.id
}

/**
 * Upsert a publisher with BGG ID and return their ID
 */
async function upsertPublisher(
  publisher: BGGEntity,
  websiteLookup: Map<number, string>
): Promise<string | null> {
  const slug = generateSlug(publisher.name)

  // Check by BGG ID first
  const { data: existingByBgg } = await supabase
    .from('publishers')
    .select('id')
    .eq('bgg_id', publisher.bgg_id)
    .single()

  if (existingByBgg) {
    // Update with any new data
    await supabase
      .from('publishers')
      .update({
        name: publisher.name,
        website: websiteLookup.get(publisher.bgg_id) || undefined,
      })
      .eq('id', existingByBgg.id)
    return existingByBgg.id
  }

  // Check by slug
  const { data: existingBySlug } = await supabase
    .from('publishers')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingBySlug) {
    // Update with BGG ID
    await supabase
      .from('publishers')
      .update({
        bgg_id: publisher.bgg_id,
        website: websiteLookup.get(publisher.bgg_id) || undefined,
      })
      .eq('id', existingBySlug.id)
    return existingBySlug.id
  }

  // Create new
  const { data: newPublisher, error } = await supabase
    .from('publishers')
    .insert({
      slug,
      name: publisher.name,
      bgg_id: publisher.bgg_id,
      website: websiteLookup.get(publisher.bgg_id) || null,
    })
    .select('id')
    .single()

  if (error || !newPublisher) {
    console.error(`  Failed to create publisher ${publisher.name}:`, error?.message)
    return null
  }
  return newPublisher.id
}

/**
 * Link game to designers
 */
async function linkDesigners(
  gameId: string,
  designers: BGGEntity[],
  websiteLookup: Map<number, string>
): Promise<void> {
  for (const designer of designers.slice(0, 5)) {
    const designerId = await upsertDesigner(designer, websiteLookup)
    if (designerId) {
      await supabase.from('game_designers').upsert({
        game_id: gameId,
        designer_id: designerId,
      })
    }
  }
}

/**
 * Link game to publishers
 */
async function linkPublishers(
  gameId: string,
  publishers: BGGEntity[],
  websiteLookup: Map<number, string>
): Promise<void> {
  for (const publisher of publishers.slice(0, 5)) {
    const publisherId = await upsertPublisher(publisher, websiteLookup)
    if (publisherId) {
      await supabase.from('game_publishers').upsert({
        game_id: gameId,
        publisher_id: publisherId,
      })
    }
  }
}

/**
 * Import a single game
 */
async function importGame(
  game: ExtractedGame,
  publisherWebsites: Map<number, string>,
  designerWebsites: Map<number, string>
): Promise<{
  success: boolean
  action: 'imported' | 'updated' | 'skipped' | 'failed'
  slug?: string
  error?: string
}> {
  // Check if exists by BGG ID
  const { data: existingByBgg } = await supabase
    .from('games')
    .select('id, slug')
    .eq('bgg_id', game.bgg_id)
    .single()

  if (existingByBgg) {
    // Update existing game with new data
    const updateData = {
      name: game.name,
      year_published: game.year_published,
      player_count_min: game.min_players,
      player_count_max: game.max_players,
      play_time_min: game.min_playtime,
      play_time_max: game.max_playtime,
      min_age: game.min_age,
      bgg_raw_data: {
        source: 'bgg-extractor',
        imported_at: new Date().toISOString(),
        extracted_at: game.extracted_at,
        reference_images: {
          box: game.image_url,
          thumbnail: game.thumbnail_url,
        },
        alternate_names: game.alternate_names,
        categories: game.categories.map(c => ({ bgg_id: c.bgg_id, name: c.name })),
        mechanics: game.mechanics.map(m => ({ bgg_id: m.bgg_id, name: m.name })),
        artists: game.artists.map(a => ({ bgg_id: a.bgg_id, name: a.name })),
        families: game.families.map(f => ({ bgg_id: f.bgg_id, name: f.name })),
        expansions: game.expansions,
        implementations: game.implementations,
        integrations: game.integrations.map(i => ({ bgg_id: i.bgg_id, name: i.name })),
        rulebook_hints: game.rulebook_hints,
      },
      bgg_last_synced: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', existingByBgg.id)

    if (updateError) {
      return { success: false, action: 'failed', slug: existingByBgg.slug, error: updateError.message }
    }

    // Update designer/publisher links
    await linkDesigners(existingByBgg.id, game.designers, designerWebsites)
    await linkPublishers(existingByBgg.id, game.publishers, publisherWebsites)

    return { success: true, action: 'updated', slug: existingByBgg.slug }
  }

  // Check if exists by slug
  const baseSlug = generateSlug(game.name)
  const { data: existingBySlug } = await supabase
    .from('games')
    .select('id, slug')
    .eq('slug', baseSlug)
    .single()

  if (existingBySlug) {
    return { success: true, action: 'skipped', slug: existingBySlug.slug, error: 'Already exists (slug)' }
  }

  // Get unique slug
  const slug = await getUniqueSlug(baseSlug)

  // Prepare game data
  const gameData = {
    slug,
    name: game.name,
    bgg_id: game.bgg_id,
    year_published: game.year_published,
    player_count_min: game.min_players,
    player_count_max: game.max_players,
    play_time_min: game.min_playtime,
    play_time_max: game.max_playtime,
    min_age: game.min_age,
    // Store legacy fields for backwards compatibility
    designers: game.designers.slice(0, 5).map(d => d.name),
    publisher: game.publishers[0]?.name,
    // Import settings
    is_published: false,
    is_featured: false,
    has_score_sheet: false,
    content_status: 'none' as const,
    priority: 3,
    data_source: 'seed' as const,
    // Store reference data including image URLs and relationships
    bgg_raw_data: {
      source: 'bgg-extractor',
      imported_at: new Date().toISOString(),
      extracted_at: game.extracted_at,
      reference_images: {
        box: game.image_url,
        thumbnail: game.thumbnail_url,
      },
      alternate_names: game.alternate_names,
      categories: game.categories.map(c => ({ bgg_id: c.bgg_id, name: c.name })),
      mechanics: game.mechanics.map(m => ({ bgg_id: m.bgg_id, name: m.name })),
      artists: game.artists.map(a => ({ bgg_id: a.bgg_id, name: a.name })),
      families: game.families.map(f => ({ bgg_id: f.bgg_id, name: f.name })),
      expansions: game.expansions,
      implementations: game.implementations,
      integrations: game.integrations.map(i => ({ bgg_id: i.bgg_id, name: i.name })),
      rulebook_hints: game.rulebook_hints,
    },
    bgg_last_synced: new Date().toISOString(),
  }

  // Insert game
  const { data: newGame, error: insertError } = await supabase
    .from('games')
    .insert(gameData)
    .select('id, slug')
    .single()

  if (insertError || !newGame) {
    return {
      success: false,
      action: 'failed',
      error: insertError?.message || 'Insert failed',
    }
  }

  // Link designers
  await linkDesigners(newGame.id, game.designers, designerWebsites)

  // Link publishers
  await linkPublishers(newGame.id, game.publishers, publisherWebsites)

  return { success: true, action: 'imported', slug: newGame.slug }
}

/**
 * Main import function
 */
async function main() {
  const options = parseArgs()

  console.log('=== BGG Extract Importer ===\n')
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Target: ${supabaseUrl}`)
  console.log(`Input: ${options.inputPath}\n`)

  // Load games data
  const inputPath = path.resolve(process.cwd(), options.inputPath)

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`)
    console.error('Run the extractor first: cd tools/bgg-extractor && npm run extract')
    process.exit(1)
  }

  const data: ExtractionResult = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))
  console.log(`Loaded ${data.games.length} games from extract file`)

  // Load entity data if available
  const entitiesPath = path.resolve(process.cwd(), options.entitiesPath)
  const publisherWebsites = new Map<number, string>()
  const designerWebsites = new Map<number, string>()

  if (fs.existsSync(entitiesPath)) {
    const entities: EntitiesData = JSON.parse(fs.readFileSync(entitiesPath, 'utf-8'))

    for (const pub of entities.publishers || []) {
      if (pub.website) publisherWebsites.set(pub.bgg_id, pub.website)
    }
    for (const des of entities.designers || []) {
      if (des.website) designerWebsites.set(des.bgg_id, des.website)
    }

    console.log(`Loaded ${publisherWebsites.size} publisher websites`)
    console.log(`Loaded ${designerWebsites.size} designer websites`)
  } else {
    console.log('No entities file found, skipping website enrichment')
  }

  // Apply limit if specified
  let games = data.games
  if (options.limit) {
    games = games.slice(0, options.limit)
    console.log(`Limited to ${games.length} games`)
  }

  console.log()

  // Stats
  let imported = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  // Process games
  for (let i = 0; i < games.length; i++) {
    const game = games[i]
    const progress = `[${i + 1}/${games.length}]`

    process.stdout.write(`${progress} ${game.name}... `)

    if (options.dryRun) {
      console.log('\x1b[36mDry run\x1b[0m')
      continue
    }

    try {
      const result = await importGame(game, publisherWebsites, designerWebsites)

      if (result.action === 'imported') {
        console.log(`\x1b[32mImported\x1b[0m → /${result.slug}`)
        imported++
      } else if (result.action === 'updated') {
        console.log(`\x1b[34mUpdated\x1b[0m → /${result.slug}`)
        updated++
      } else if (result.action === 'skipped') {
        console.log(`\x1b[33mSkipped\x1b[0m (${result.error})`)
        skipped++
      } else {
        console.log(`\x1b[31mFailed\x1b[0m: ${result.error}`)
        failed++
      }
    } catch (error) {
      console.log(`\x1b[31mError\x1b[0m: ${error instanceof Error ? error.message : 'Unknown'}`)
      failed++
    }

    // Small delay to not overwhelm the database
    if (i < games.length - 1) {
      await new Promise(r => setTimeout(r, 50))
    }
  }

  // Summary
  console.log('\n=== Summary ===')
  console.log(`Total: ${games.length}`)
  console.log(`\x1b[32mImported: ${imported}\x1b[0m`)
  console.log(`\x1b[34mUpdated: ${updated}\x1b[0m`)
  console.log(`\x1b[33mSkipped: ${skipped}\x1b[0m`)
  console.log(`\x1b[31mFailed: ${failed}\x1b[0m`)
  console.log('\nGames are now in admin queue (unpublished).')
  console.log('Use /admin/games to review and publish.')
}

main().catch(console.error)
