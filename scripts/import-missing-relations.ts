/**
 * Import Missing Related Games
 *
 * Scans existing games' bgg_raw_data to find referenced games (expansions,
 * implementations, base games) that are not yet in our database, then imports them.
 *
 * Run with: npx tsx scripts/import-missing-relations.ts [options]
 *
 * Options:
 *   --dry-run         Don't actually import, just report what would be imported
 *   --limit=N         Limit number of games to import (for testing)
 *   --family=SLUG     Only process games from a specific family
 *   --game=BGG_ID     Only process relations from a specific game
 *   --skip-fan        Skip fan-made expansions (unofficial content)
 *   --skip-promos     Skip promo cards/packs (small promotional items)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

// We need to import the importer dynamically since it uses server-side createClient
// For scripts, we'll make direct BGG API calls and DB inserts

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface BGGRawData {
  id?: number
  name?: string
  // This game expands another (this is an expansion)
  expandsGame?: { id?: number; bgg_id?: number; name: string }
  // Games that are expansions of this one
  expansions?: { id?: number; bgg_id?: number; name: string }[]
  // This game reimplements another (this is a newer edition)
  implementsGame?: { id?: number; bgg_id?: number; name: string }
  // Games that reimplement this one (newer editions of this game)
  implementations?: { id?: number; bgg_id?: number; name: string }[]
}

interface MissingGame {
  bggId: number
  name: string
  reason: string
  referencedBy: string
}

// Patterns that indicate fan-made/unofficial content
const FAN_CONTENT_PATTERNS = [
  /\bfan\s+expansion\b/i,
  /\bfan\s+made\b/i,
  /\bfan-made\b/i,
  /\bunofficial\b/i,
  /\bhomebrew\b/i,
  /\bhome-brew\b/i,
  /\bprint\s*&?\s*play\b/i,
  /\bpnp\b/i,
  /\bprint\s+and\s+play\b/i,
]

// Patterns that indicate promo cards/items (not full expansions)
const PROMO_PATTERNS = [
  /\bpromo\b/i,
  /\bpromotional\b/i,
  /\bbonus\s*card/i,
  /\bmini[\s-]*expansion\b/i,
  /\bmicro[\s-]*expansion\b/i,
  /\bcompanion\s*app\b/i,
  /\bsolo\s*variant\b/i,
  // Single named cards (e.g., "Game: Expansion – CardName")
  /[–-]\s*[A-Z][a-z]+\s*$/,
]

function isFanContent(name: string): boolean {
  return FAN_CONTENT_PATTERNS.some(pattern => pattern.test(name))
}

function isPromoContent(name: string): boolean {
  return PROMO_PATTERNS.some(pattern => pattern.test(name))
}

async function findMissingGames(options: {
  familySlug?: string
  gameBggId?: number
  skipFan?: boolean
  skipPromos?: boolean
}): Promise<MissingGame[]> {
  console.log('=== Scanning for Missing Related Games ===\n')

  // Get all games with bgg_raw_data
  let query = supabase
    .from('games')
    .select('id, name, bgg_id, bgg_raw_data, family_id')
    .not('bgg_raw_data', 'is', null)
    .order('name')

  if (options.gameBggId) {
    query = query.eq('bgg_id', options.gameBggId)
  }

  const { data: games, error } = await query

  if (error || !games) {
    console.error('Failed to fetch games:', error?.message)
    return []
  }

  // If filtering by family, get the family ID first
  let familyId: string | null = null
  if (options.familySlug) {
    const { data: family } = await supabase
      .from('game_families')
      .select('id')
      .eq('slug', options.familySlug)
      .single()

    if (!family) {
      console.error(`Family not found: ${options.familySlug}`)
      return []
    }
    familyId = family.id
  }

  // Filter games by family if specified
  const filteredGames = familyId
    ? games.filter(g => g.family_id === familyId)
    : games

  console.log(`Processing ${filteredGames.length} games...\n`)

  // Get all existing BGG IDs in our database
  const { data: allGames } = await supabase
    .from('games')
    .select('bgg_id')
    .not('bgg_id', 'is', null)

  const existingBggIds = new Set(allGames?.map(g => g.bgg_id) || [])

  // Collect all missing games
  const missingGamesMap = new Map<number, MissingGame>()

  for (const game of filteredGames) {
    const rawData = game.bgg_raw_data as BGGRawData | null
    if (!rawData) continue

    // Helper to get BGG ID from various formats
    const getBggId = (obj: { id?: number; bgg_id?: number } | undefined): number | null => {
      if (!obj) return null
      return obj.bgg_id || obj.id || null
    }

    // Helper to check if we should add this game
    const shouldAdd = (bggId: number, name: string): boolean => {
      if (!bggId || existingBggIds.has(bggId) || missingGamesMap.has(bggId)) return false
      if (options.skipFan && isFanContent(name)) return false
      if (options.skipPromos && isPromoContent(name)) return false
      return true
    }

    // Check expandsGame (this game is an expansion of another)
    const expandsBggId = getBggId(rawData.expandsGame)
    if (expandsBggId && shouldAdd(expandsBggId, rawData.expandsGame!.name)) {
      missingGamesMap.set(expandsBggId, {
        bggId: expandsBggId,
        name: rawData.expandsGame!.name,
        reason: 'base game',
        referencedBy: game.name,
      })
    }

    // Check implementsGame (this game reimplements another)
    const implementsBggId = getBggId(rawData.implementsGame)
    if (implementsBggId && shouldAdd(implementsBggId, rawData.implementsGame!.name)) {
      missingGamesMap.set(implementsBggId, {
        bggId: implementsBggId,
        name: rawData.implementsGame!.name,
        reason: 'original game',
        referencedBy: game.name,
      })
    }

    // Check expansions (games that expand this one)
    if (rawData.expansions) {
      for (const exp of rawData.expansions) {
        const expBggId = getBggId(exp)
        if (expBggId && shouldAdd(expBggId, exp.name)) {
          missingGamesMap.set(expBggId, {
            bggId: expBggId,
            name: exp.name,
            reason: 'expansion',
            referencedBy: game.name,
          })
        }
      }
    }

    // Check implementations (games that reimplement this one)
    if (rawData.implementations) {
      for (const impl of rawData.implementations) {
        const implBggId = getBggId(impl)
        if (implBggId && shouldAdd(implBggId, impl.name)) {
          missingGamesMap.set(implBggId, {
            bggId: implBggId,
            name: impl.name,
            reason: 'reimplementation',
            referencedBy: game.name,
          })
        }
      }
    }
  }

  return Array.from(missingGamesMap.values())
}

async function importMissingGames(
  missingGames: MissingGame[],
  options: { dryRun: boolean; limit?: number }
): Promise<void> {
  const gamesToImport = options.limit
    ? missingGames.slice(0, options.limit)
    : missingGames

  console.log(`\n=== ${options.dryRun ? '[DRY RUN] ' : ''}Importing ${gamesToImport.length} Missing Games ===\n`)

  if (gamesToImport.length === 0) {
    console.log('No missing games to import!')
    return
  }

  // Group by reason for nice output
  const byReason = new Map<string, MissingGame[]>()
  for (const game of gamesToImport) {
    const list = byReason.get(game.reason) || []
    list.push(game)
    byReason.set(game.reason, list)
  }

  for (const [reason, games] of byReason) {
    console.log(`${reason.toUpperCase()}S (${games.length}):`)
    for (const game of games) {
      console.log(`  - "${game.name}" (BGG ${game.bggId}) - referenced by "${game.referencedBy}"`)
    }
    console.log()
  }

  if (options.dryRun) {
    console.log('=== DRY RUN - No games were imported ===')
    console.log(`\nTo import these games, run without --dry-run`)
    return
  }

  // Import games by adding to the import queue
  // This ensures proper rate limiting and uses the full import pipeline
  console.log('Adding games to import queue...\n')

  let added = 0
  let skipped = 0

  for (const game of gamesToImport) {
    // Check if already in queue
    const { data: existing } = await supabase
      .from('import_queue')
      .select('id')
      .eq('bgg_id', game.bggId)
      .single()

    if (existing) {
      console.log(`  [SKIP] "${game.name}" already in queue`)
      skipped++
      continue
    }

    // Add to queue with high priority
    const { error } = await supabase
      .from('import_queue')
      .insert({
        bgg_id: game.bggId,
        name: game.name,
        status: 'pending',
        priority: 1, // High priority for completing family trees
        source: 'missing-relations-script',
      })

    if (error) {
      console.error(`  [ERROR] Failed to queue "${game.name}": ${error.message}`)
    } else {
      console.log(`  [QUEUED] "${game.name}" (BGG ${game.bggId})`)
      added++
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Added to queue: ${added}`)
  console.log(`Already in queue: ${skipped}`)
  console.log(`\nTo process the queue, run: npx tsx scripts/process-import-queue.ts`)
  console.log(`Or trigger via API: POST /api/cron/import-bgg`)
}

// Parse command line args
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    dryRun: false,
    limit: undefined as number | undefined,
    familySlug: undefined as string | undefined,
    gameBggId: undefined as number | undefined,
    skipFan: false,
    skipPromos: false,
  }

  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true
    if (arg === '--skip-fan') options.skipFan = true
    if (arg === '--skip-promos') options.skipPromos = true
    if (arg.startsWith('--limit=')) options.limit = parseInt(arg.split('=')[1], 10)
    if (arg.startsWith('--family=')) options.familySlug = arg.split('=')[1]
    if (arg.startsWith('--game=')) options.gameBggId = parseInt(arg.split('=')[1], 10)
  }

  return options
}

async function main() {
  const options = parseArgs()

  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`)
  if (options.limit) console.log(`Limit: ${options.limit} games`)
  if (options.familySlug) console.log(`Family filter: ${options.familySlug}`)
  if (options.gameBggId) console.log(`Game filter: BGG ${options.gameBggId}`)
  if (options.skipFan) console.log(`Skip fan content: YES`)
  if (options.skipPromos) console.log(`Skip promos: YES`)
  console.log()

  const missingGames = await findMissingGames({
    familySlug: options.familySlug,
    gameBggId: options.gameBggId,
    skipFan: options.skipFan,
    skipPromos: options.skipPromos,
  })

  console.log(`Found ${missingGames.length} missing related games\n`)

  await importMissingGames(missingGames, {
    dryRun: options.dryRun,
    limit: options.limit,
  })
}

main().catch(console.error)
