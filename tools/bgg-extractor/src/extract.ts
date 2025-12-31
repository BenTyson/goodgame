#!/usr/bin/env npx tsx
/**
 * BGG Game Data Extractor
 *
 * Extracts factual game data from BoardGameGeek's public API.
 * All data extracted is legally permissible public information.
 *
 * Usage:
 *   npx tsx src/extract.ts [options]
 *
 * Options:
 *   --count=N         Number of games to extract (default: 500)
 *   --batch-size=N    Batch size for API requests (default: 20)
 *   --delay=N         Delay between requests in ms (default: 2000)
 *   --output=FILE     Output file path (default: ./output/games.json)
 *   --with-rulebooks  Also fetch rulebook filename hints (slower)
 *   --ids=1,2,3       Extract specific game IDs instead of top games
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'
import {
  fetchTopRatedGameIds,
  fetchMostReviewedGameIds,
  fetchGameDetailsBatch,
  fetchRulebookHints,
} from './bgg-api.js'
import { parseGamesXml } from './parser.js'
import type { ExtractedGame, ExtractionResult } from './types.js'

// Rate limiting
const DEFAULT_DELAY_MS = 2000

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface ExtractOptions {
  count: number
  batchSize: number
  delayMs: number
  outputPath: string
  withRulebooks: boolean
  specificIds?: number[]
}

function parseArgs(): ExtractOptions {
  const args = process.argv.slice(2)
  const options: ExtractOptions = {
    count: 500,
    batchSize: 20,
    delayMs: DEFAULT_DELAY_MS,
    outputPath: './output/games.json',
    withRulebooks: false,
  }

  for (const arg of args) {
    if (arg.startsWith('--count=')) {
      options.count = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--delay=')) {
      options.delayMs = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--output=')) {
      options.outputPath = arg.split('=')[1]
    } else if (arg === '--with-rulebooks') {
      options.withRulebooks = true
    } else if (arg.startsWith('--ids=')) {
      options.specificIds = arg.split('=')[1].split(',').map(id => parseInt(id, 10))
    }
  }

  return options
}

async function fetchAllGameDetails(
  gameIds: number[],
  batchSize: number,
  delayMs: number
): Promise<ExtractedGame[]> {
  const games: ExtractedGame[] = []
  const totalBatches = Math.ceil(gameIds.length / batchSize)

  console.log(`\nFetching details for ${gameIds.length} games in ${totalBatches} batches...`)

  for (let i = 0; i < gameIds.length; i += batchSize) {
    const batch = gameIds.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1

    console.log(`  Batch ${batchNum}/${totalBatches} (IDs: ${batch[0]}...${batch[batch.length - 1]})`)

    try {
      const xml = await fetchGameDetailsBatch(batch)
      const parsedGames = parseGamesXml(xml)

      console.log(`    Retrieved ${parsedGames.length} games`)
      games.push(...parsedGames)

      // Delay between batches (except for the last one)
      if (i + batchSize < gameIds.length) {
        await sleep(delayMs)
      }
    } catch (error) {
      console.error(`    Error fetching batch:`, error)
    }
  }

  return games
}

async function enrichWithRulebookHints(
  games: ExtractedGame[],
  delayMs: number
): Promise<void> {
  console.log(`\nFetching rulebook hints for ${games.length} games...`)

  for (let i = 0; i < games.length; i++) {
    const game = games[i]

    if (i % 50 === 0) {
      console.log(`  Progress: ${i}/${games.length} (${Math.round(i / games.length * 100)}%)`)
    }

    try {
      const hints = await fetchRulebookHints(game.bgg_id)
      game.rulebook_hints = hints
    } catch {
      // Silently continue on errors
    }

    // Rate limit
    if (i < games.length - 1) {
      await sleep(delayMs)
    }
  }

  console.log(`  Completed rulebook hints enrichment`)
}

function collectStats(games: ExtractedGame[]): ExtractionResult['stats'] {
  const designerIds = new Set<number>()
  const publisherIds = new Set<number>()
  const artistIds = new Set<number>()
  const familyIds = new Set<number>()
  let totalExpansions = 0

  for (const game of games) {
    game.designers.forEach(d => designerIds.add(d.bgg_id))
    game.publishers.forEach(p => publisherIds.add(p.bgg_id))
    game.artists.forEach(a => artistIds.add(a.bgg_id))
    game.families.forEach(f => familyIds.add(f.bgg_id))
    totalExpansions += game.expansions.length
  }

  return {
    total_games: games.length,
    total_designers: designerIds.size,
    total_publishers: publisherIds.size,
    total_artists: artistIds.size,
    total_families: familyIds.size,
    total_expansions: totalExpansions,
    extraction_date: new Date().toISOString(),
    extraction_duration_ms: 0, // Will be updated
  }
}

async function main(): Promise<void> {
  const startTime = Date.now()
  const options = parseArgs()

  console.log('='.repeat(60))
  console.log('BGG Game Data Extractor (TypeScript)')
  console.log('='.repeat(60))
  console.log(`\nConfiguration:`)
  console.log(`  Count: ${options.specificIds ? options.specificIds.length : options.count}`)
  console.log(`  Batch size: ${options.batchSize}`)
  console.log(`  Delay: ${options.delayMs}ms`)
  console.log(`  Output: ${options.outputPath}`)
  console.log(`  With rulebooks: ${options.withRulebooks}`)

  // Get game IDs to extract
  let gameIds: number[]

  if (options.specificIds) {
    gameIds = options.specificIds
    console.log(`\nUsing ${gameIds.length} specific game IDs`)
  } else {
    // Fetch from browse pages
    const topRated = await fetchTopRatedGameIds(options.count, options.delayMs)
    await sleep(3000) // Extra delay between different fetch types
    const mostReviewed = await fetchMostReviewedGameIds(options.count, options.delayMs)

    // Combine and deduplicate
    const allIds = new Set([...topRated, ...mostReviewed])
    gameIds = [...allIds]
    console.log(`\nTotal unique game IDs: ${gameIds.length}`)
  }

  // Fetch game details
  const games = await fetchAllGameDetails(gameIds, options.batchSize, options.delayMs)

  // Optionally fetch rulebook hints
  if (options.withRulebooks) {
    await enrichWithRulebookHints(games, options.delayMs)
  }

  // Sort by name for consistent output
  games.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

  // Collect stats
  const stats = collectStats(games)
  stats.extraction_duration_ms = Date.now() - startTime

  // Prepare output
  const result: ExtractionResult = { games, stats }

  // Ensure output directory exists
  const outputDir = dirname(options.outputPath)
  if (outputDir && !existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  // Write output
  writeFileSync(options.outputPath, JSON.stringify(result, null, 2))

  // Print summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('Extraction Complete!')
  console.log('='.repeat(60))
  console.log(`\nStatistics:`)
  console.log(`  Total games: ${stats.total_games}`)
  console.log(`  Unique designers: ${stats.total_designers}`)
  console.log(`  Unique publishers: ${stats.total_publishers}`)
  console.log(`  Unique artists: ${stats.total_artists}`)
  console.log(`  Unique families: ${stats.total_families}`)
  console.log(`  Total expansions: ${stats.total_expansions}`)
  console.log(`  Duration: ${(stats.extraction_duration_ms / 1000 / 60).toFixed(1)} minutes`)
  console.log(`\nOutput saved to: ${options.outputPath}`)
}

main().catch(console.error)
