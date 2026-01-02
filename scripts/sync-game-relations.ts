/**
 * Sync Game Relations from bgg_raw_data
 *
 * Processes existing games to create implementation/expansion relations
 * from stored bgg_raw_data JSON.
 *
 * Run with: npx tsx scripts/sync-game-relations.ts [options]
 *
 * Options:
 *   --dry-run        Don't actually create relations, just report
 *   --limit=N        Limit number of games to process
 *   --type=TYPE      Only sync specific type: expansions, implementations, all (default: all)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface BGGLink {
  id?: number
  bgg_id?: number
  name: string
  direction?: string
  inbound?: boolean
}

interface BGGRawData {
  // Direct BGG client format
  expandsGame?: BGGLink
  expansions?: BGGLink[]
  implementsGame?: BGGLink
  implementations?: BGGLink[]
  // bgg-extractor format
  source?: string
}

type RelationType = 'expansion_of' | 'reimplementation_of'

async function syncRelationsFromRawData(options: {
  dryRun: boolean
  limit?: number
  type: 'expansions' | 'implementations' | 'all'
  family?: string
}) {
  console.log('=== Sync Game Relations from bgg_raw_data ===\n')
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Type: ${options.type}`)
  if (options.family) console.log(`Family: ${options.family}`)
  console.log()

  // If family specified, get the family ID first
  let familyId: string | null = null
  if (options.family) {
    const { data: family } = await supabase
      .from('game_families')
      .select('id')
      .eq('slug', options.family)
      .single()

    if (!family) {
      // Try by name
      const { data: familyByName } = await supabase
        .from('game_families')
        .select('id')
        .ilike('name', options.family)
        .single()

      if (!familyByName) {
        console.error(`Family not found: ${options.family}`)
        return
      }
      familyId = familyByName.id
    } else {
      familyId = family.id
    }
  }

  // Get games with bgg_raw_data
  let query = supabase
    .from('games')
    .select('id, bgg_id, name, bgg_raw_data')
    .not('bgg_raw_data', 'is', null)
    .order('created_at')

  if (familyId) {
    query = query.eq('family_id', familyId)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data: games, error } = await query

  if (error || !games) {
    console.error('Failed to fetch games:', error?.message)
    return
  }

  console.log(`Processing ${games.length} games with bgg_raw_data\n`)

  let expansionsCreated = 0
  let implementationsCreated = 0
  let skipped = 0

  for (const game of games) {
    const rawData = game.bgg_raw_data as BGGRawData
    if (!rawData) continue

    // Process expansions
    if (options.type === 'all' || options.type === 'expansions') {
      const result = await processExpansions(game.id, game.name, game.bgg_id, rawData, options.dryRun)
      expansionsCreated += result.created
      skipped += result.skipped
    }

    // Process implementations
    if (options.type === 'all' || options.type === 'implementations') {
      const result = await processImplementations(game.id, game.name, game.bgg_id, rawData, options.dryRun)
      implementationsCreated += result.created
      skipped += result.skipped
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Expansion relations created: ${expansionsCreated}`)
  console.log(`Implementation relations created: ${implementationsCreated}`)
  console.log(`Skipped (already exist or target not found): ${skipped}`)
}

async function processExpansions(
  gameId: string,
  gameName: string,
  gameBggId: number | null,
  rawData: BGGRawData,
  dryRun: boolean
): Promise<{ created: number; skipped: number }> {
  let created = 0
  let skipped = 0

  // Handle expandsGame (this game is an expansion of another)
  // This game → expansion_of → target game
  if (rawData.expandsGame) {
    const bggId = rawData.expandsGame.bgg_id || rawData.expandsGame.id
    if (bggId) {
      const result = await createRelation(
        gameId,
        gameName,
        bggId,
        'expansion_of',
        dryRun
      )
      if (result === 'created') created++
      else skipped++
    }
  }

  // Handle expansions array (games that expand THIS game)
  // For each expansion: expansion_game → expansion_of → this game
  if (rawData.expansions && gameBggId) {
    for (const exp of rawData.expansions) {
      const expBggId = exp.bgg_id || exp.id
      if (!expBggId) continue

      // Create reverse relation: expansion points back to this game
      const result = await createReverseRelation(
        expBggId,
        exp.name,
        gameId,
        gameName,
        'expansion_of',
        dryRun
      )
      if (result === 'created') created++
      else skipped++
    }
  }

  return { created, skipped }
}

async function processImplementations(
  gameId: string,
  gameName: string,
  gameBggId: number | null,
  rawData: BGGRawData,
  dryRun: boolean
): Promise<{ created: number; skipped: number }> {
  let created = 0
  let skipped = 0

  // Handle implementsGame (this game reimplements another)
  // This game → reimplementation_of → original game
  if (rawData.implementsGame) {
    const bggId = rawData.implementsGame.bgg_id || rawData.implementsGame.id
    if (bggId) {
      const result = await createRelation(
        gameId,
        gameName,
        bggId,
        'reimplementation_of',
        dryRun
      )
      if (result === 'created') created++
      else skipped++
    }
  }

  // Handle implementations array (games that reimplement THIS game)
  // For each reimplementation: reimpl_game → reimplementation_of → this game
  if (rawData.implementations && gameBggId) {
    for (const impl of rawData.implementations) {
      const implBggId = impl.bgg_id || impl.id
      if (!implBggId) continue

      // Create reverse relation: reimplementation points back to this game
      const result = await createReverseRelation(
        implBggId,
        impl.name,
        gameId,
        gameName,
        'reimplementation_of',
        dryRun
      )
      if (result === 'created') created++
      else skipped++
    }
  }

  return { created, skipped }
}

async function createRelation(
  sourceGameId: string,
  sourceGameName: string,
  targetBggId: number,
  relationType: RelationType,
  dryRun: boolean
): Promise<'created' | 'skipped'> {
  // Find target game by BGG ID
  const { data: targetGame } = await supabase
    .from('games')
    .select('id, name')
    .eq('bgg_id', targetBggId)
    .single()

  if (!targetGame) {
    return 'skipped' // Target game not in our DB
  }

  // Check if relation exists
  const { data: existing } = await supabase
    .from('game_relations')
    .select('id')
    .eq('source_game_id', sourceGameId)
    .eq('target_game_id', targetGame.id)
    .eq('relation_type', relationType)
    .single()

  if (existing) {
    return 'skipped' // Already exists
  }

  if (dryRun) {
    console.log(`  [DRY RUN] "${sourceGameName}" ${relationType} "${targetGame.name}" (BGG ${targetBggId})`)
    return 'created'
  }

  // Create relation
  const { error } = await supabase
    .from('game_relations')
    .insert({
      source_game_id: sourceGameId,
      target_game_id: targetGame.id,
      relation_type: relationType,
    })

  if (error) {
    console.error(`  Failed to create relation: ${error.message}`)
    return 'skipped'
  }

  console.log(`  Created: "${sourceGameName}" ${relationType} "${targetGame.name}"`)
  return 'created'
}

/**
 * Create a relation where SOURCE is looked up by BGG ID
 * Used when processing arrays like "expansions" where the listed games
 * are the source (child) pointing back to the target (parent)
 */
async function createReverseRelation(
  sourceBggId: number,
  sourceName: string,
  targetGameId: string,
  targetGameName: string,
  relationType: RelationType,
  dryRun: boolean
): Promise<'created' | 'skipped'> {
  // Find source game by BGG ID
  const { data: sourceGame } = await supabase
    .from('games')
    .select('id, name')
    .eq('bgg_id', sourceBggId)
    .single()

  if (!sourceGame) {
    return 'skipped' // Source game not in our DB
  }

  // Check if relation exists
  const { data: existing } = await supabase
    .from('game_relations')
    .select('id')
    .eq('source_game_id', sourceGame.id)
    .eq('target_game_id', targetGameId)
    .eq('relation_type', relationType)
    .single()

  if (existing) {
    return 'skipped' // Already exists
  }

  if (dryRun) {
    console.log(`  [DRY RUN] "${sourceGame.name}" ${relationType} "${targetGameName}"`)
    return 'created'
  }

  // Create relation
  const { error } = await supabase
    .from('game_relations')
    .insert({
      source_game_id: sourceGame.id,
      target_game_id: targetGameId,
      relation_type: relationType,
    })

  if (error) {
    console.error(`  Failed to create relation: ${error.message}`)
    return 'skipped'
  }

  console.log(`  Created: "${sourceGame.name}" ${relationType} "${targetGameName}"`)
  return 'created'
}

// Parse command line args and run
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    dryRun: false,
    limit: undefined as number | undefined,
    type: 'all' as 'expansions' | 'implementations' | 'all',
    family: undefined as string | undefined,
  }

  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true
    if (arg.startsWith('--limit=')) options.limit = parseInt(arg.split('=')[1], 10)
    if (arg.startsWith('--type=')) options.type = arg.split('=')[1] as typeof options.type
    if (arg.startsWith('--family=')) options.family = arg.split('=')[1]
  }

  return options
}

syncRelationsFromRawData(parseArgs()).catch(console.error)
