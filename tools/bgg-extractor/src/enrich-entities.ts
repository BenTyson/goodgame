#!/usr/bin/env npx tsx
/**
 * BGG Entity Enrichment Script
 *
 * Enriches extracted game data with additional entity details:
 * - Publisher websites
 * - Designer websites
 *
 * Usage:
 *   npx tsx src/enrich-entities.ts [options]
 *
 * Options:
 *   --input=FILE     Input games JSON file (default: ./output/games.json)
 *   --output=FILE    Output file path (default: ./output/entities.json)
 *   --delay=N        Delay between requests in ms (default: 2000)
 *   --publishers     Enrich publishers only
 *   --designers      Enrich designers only
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'
import { fetchPublisherDetails, fetchDesignerDetails } from './bgg-api.js'
import type { ExtractedPublisher, ExtractedDesigner, ExtractionResult } from './types.js'

const DEFAULT_DELAY_MS = 2000

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface EnrichOptions {
  inputPath: string
  outputPath: string
  delayMs: number
  enrichPublishers: boolean
  enrichDesigners: boolean
}

function parseArgs(): EnrichOptions {
  const args = process.argv.slice(2)
  const options: EnrichOptions = {
    inputPath: './output/games.json',
    outputPath: './output/entities.json',
    delayMs: DEFAULT_DELAY_MS,
    enrichPublishers: true,
    enrichDesigners: true,
  }

  let hasExplicitFilter = false

  for (const arg of args) {
    if (arg.startsWith('--input=')) {
      options.inputPath = arg.split('=')[1]
    } else if (arg.startsWith('--output=')) {
      options.outputPath = arg.split('=')[1]
    } else if (arg.startsWith('--delay=')) {
      options.delayMs = parseInt(arg.split('=')[1], 10)
    } else if (arg === '--publishers') {
      if (!hasExplicitFilter) {
        options.enrichPublishers = true
        options.enrichDesigners = false
      }
      options.enrichPublishers = true
      hasExplicitFilter = true
    } else if (arg === '--designers') {
      if (!hasExplicitFilter) {
        options.enrichPublishers = false
        options.enrichDesigners = true
      }
      options.enrichDesigners = true
      hasExplicitFilter = true
    }
  }

  return options
}

async function enrichPublishers(
  publisherIds: number[],
  delayMs: number
): Promise<ExtractedPublisher[]> {
  console.log(`\nEnriching ${publisherIds.length} publishers...`)

  const publishers: ExtractedPublisher[] = []

  for (let i = 0; i < publisherIds.length; i++) {
    const bggId = publisherIds[i]

    if (i % 50 === 0) {
      console.log(`  Progress: ${i}/${publisherIds.length} (${Math.round(i / publisherIds.length * 100)}%)`)
    }

    try {
      const details = await fetchPublisherDetails(bggId)
      if (details) {
        publishers.push({
          bgg_id: bggId,
          name: details.name,
          website: details.website,
          extracted_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error(`  Error fetching publisher ${bggId}:`, error)
    }

    // Rate limit
    if (i < publisherIds.length - 1) {
      await sleep(delayMs)
    }
  }

  console.log(`  Enriched ${publishers.length} publishers`)
  console.log(`  Publishers with websites: ${publishers.filter(p => p.website).length}`)

  return publishers
}

async function enrichDesigners(
  designerIds: number[],
  delayMs: number
): Promise<ExtractedDesigner[]> {
  console.log(`\nEnriching ${designerIds.length} designers...`)

  const designers: ExtractedDesigner[] = []

  for (let i = 0; i < designerIds.length; i++) {
    const bggId = designerIds[i]

    if (i % 50 === 0) {
      console.log(`  Progress: ${i}/${designerIds.length} (${Math.round(i / designerIds.length * 100)}%)`)
    }

    try {
      const details = await fetchDesignerDetails(bggId)
      if (details) {
        designers.push({
          bgg_id: bggId,
          name: details.name,
          website: details.website,
          extracted_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error(`  Error fetching designer ${bggId}:`, error)
    }

    // Rate limit
    if (i < designerIds.length - 1) {
      await sleep(delayMs)
    }
  }

  console.log(`  Enriched ${designers.length} designers`)
  console.log(`  Designers with websites: ${designers.filter(d => d.website).length}`)

  return designers
}

async function main(): Promise<void> {
  const startTime = Date.now()
  const options = parseArgs()

  console.log('='.repeat(60))
  console.log('BGG Entity Enrichment')
  console.log('='.repeat(60))
  console.log(`\nConfiguration:`)
  console.log(`  Input: ${options.inputPath}`)
  console.log(`  Output: ${options.outputPath}`)
  console.log(`  Delay: ${options.delayMs}ms`)
  console.log(`  Enrich publishers: ${options.enrichPublishers}`)
  console.log(`  Enrich designers: ${options.enrichDesigners}`)

  // Load games data
  if (!existsSync(options.inputPath)) {
    console.error(`\nError: Input file not found: ${options.inputPath}`)
    console.error('Run the extraction first: npx tsx src/extract.ts')
    process.exit(1)
  }

  const data: ExtractionResult = JSON.parse(readFileSync(options.inputPath, 'utf-8'))
  console.log(`\nLoaded ${data.games.length} games from ${options.inputPath}`)

  // Collect unique entity IDs
  const publisherIds = new Set<number>()
  const designerIds = new Set<number>()

  for (const game of data.games) {
    game.publishers.forEach(p => publisherIds.add(p.bgg_id))
    game.designers.forEach(d => designerIds.add(d.bgg_id))
  }

  console.log(`\nUnique entities found:`)
  console.log(`  Publishers: ${publisherIds.size}`)
  console.log(`  Designers: ${designerIds.size}`)

  // Enrich entities
  const result: {
    publishers: ExtractedPublisher[]
    designers: ExtractedDesigner[]
    stats: {
      total_publishers: number
      publishers_with_websites: number
      total_designers: number
      designers_with_websites: number
      enrichment_date: string
      enrichment_duration_ms: number
    }
  } = {
    publishers: [],
    designers: [],
    stats: {
      total_publishers: 0,
      publishers_with_websites: 0,
      total_designers: 0,
      designers_with_websites: 0,
      enrichment_date: new Date().toISOString(),
      enrichment_duration_ms: 0,
    },
  }

  if (options.enrichPublishers) {
    result.publishers = await enrichPublishers([...publisherIds], options.delayMs)
    result.stats.total_publishers = result.publishers.length
    result.stats.publishers_with_websites = result.publishers.filter(p => p.website).length
  }

  if (options.enrichDesigners) {
    result.designers = await enrichDesigners([...designerIds], options.delayMs)
    result.stats.total_designers = result.designers.length
    result.stats.designers_with_websites = result.designers.filter(d => d.website).length
  }

  result.stats.enrichment_duration_ms = Date.now() - startTime

  // Ensure output directory exists
  const outputDir = dirname(options.outputPath)
  if (outputDir && !existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  // Write output
  writeFileSync(options.outputPath, JSON.stringify(result, null, 2))

  // Print summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('Enrichment Complete!')
  console.log('='.repeat(60))
  console.log(`\nStatistics:`)
  console.log(`  Publishers enriched: ${result.stats.total_publishers}`)
  console.log(`  Publishers with websites: ${result.stats.publishers_with_websites}`)
  console.log(`  Designers enriched: ${result.stats.total_designers}`)
  console.log(`  Designers with websites: ${result.stats.designers_with_websites}`)
  console.log(`  Duration: ${(result.stats.enrichment_duration_ms / 1000 / 60).toFixed(1)} minutes`)
  console.log(`\nOutput saved to: ${options.outputPath}`)
}

main().catch(console.error)
