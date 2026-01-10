/**
 * Parallel Enrichment Module
 *
 * Fetches data from multiple sources (Wikidata, Wikipedia, Commons) in parallel
 * to speed up game imports. Previously sequential enrichment took 3-5 seconds
 * per game; parallel fetching reduces this to ~1.5 seconds.
 *
 * Data flow:
 * 1. Launch all fetches in parallel (Wikidata, Wikipedia, Commons)
 * 2. Wait for all to complete (with individual error handling)
 * 3. Merge results, handling fallbacks (e.g., Wikidata wikipedia_url → Wikipedia retry)
 * 4. Return unified enrichment result for database update
 */

import { getGameByBggId, getGameASINWithFallback, type WikidataBoardGame } from '@/lib/wikidata'
import {
  enrichGameFromWikipedia,
  prepareWikipediaStorageData,
  type WikipediaEnrichmentResult,
} from '@/lib/wikipedia'
import {
  quickSearchBoardGameImages,
  type CommonsImage,
} from '@/lib/wikimedia-commons'
import type { Json } from '@/types/supabase'

// =====================================================
// Types
// =====================================================

/**
 * Combined enrichment result from all sources
 */
export interface ParallelEnrichmentResult {
  /** Whether any enrichment succeeded */
  success: boolean

  /** Wikidata enrichment data */
  wikidata: WikidataEnrichmentData | null

  /** Wikipedia enrichment data */
  wikipedia: WikipediaEnrichmentData | null

  /** Commons images found */
  commonsImages: CommonsImage[]

  /** Amazon ASIN (fetched via Wikidata with name fallback) */
  asin: {
    value: string | null
    source: 'bgg_id' | 'name_search' | null
  } | null

  /** Timing information for performance tracking */
  timing: EnrichmentTiming

  /** Any errors encountered (non-fatal) */
  errors: string[]
}

/**
 * Wikidata-specific enrichment data ready for database update
 */
export interface WikidataEnrichmentData {
  wikidata_id: string
  wikidata_image_url?: string
  wikipedia_url?: string
  official_website?: string
  rulebook_url?: string
  rulebook_source?: 'wikidata'
  wikidata_series_id?: string
  wikidata_last_synced: string

  // Raw data for downstream processing (family linking, sequel relations)
  raw: WikidataBoardGame
}

/**
 * Wikipedia-specific enrichment data ready for database update
 */
export interface WikipediaEnrichmentData {
  wikipedia_url?: string
  wikipedia_infobox?: Json
  wikipedia_summary?: Json
  wikipedia_origins?: string
  wikipedia_reception?: string
  wikipedia_gameplay?: string
  wikipedia_images?: Json
  wikipedia_external_links?: Json
  wikipedia_awards?: Json
  wikipedia_fetched_at?: string
  wikipedia_search_confidence?: 'high' | 'medium' | 'low'

  // Extracted rulebook URL (if no Wikidata rulebook)
  extracted_rulebook_url?: string

  // Raw result for downstream processing (category mapping, relations)
  raw: WikipediaEnrichmentResult
}

/**
 * Timing information for performance tracking
 */
export interface EnrichmentTiming {
  startTime: number
  endTime: number
  durationMs: number
  wikidataMs?: number
  wikipediaMs?: number
  commonsMs?: number
  asinMs?: number
}

// =====================================================
// Main Function
// =====================================================

/**
 * Enrich a game from all sources in parallel
 *
 * @param bggId - BoardGameGeek ID for Wikidata lookup
 * @param gameName - Game name for Wikipedia and Commons search
 * @param yearPublished - Year for Wikipedia validation
 * @param designers - Designer names for Wikipedia validation
 * @param options - Optional configuration
 */
export async function enrichGameParallel(
  bggId: number,
  gameName: string,
  yearPublished?: number,
  designers?: string[],
  options: {
    /** Skip Commons search (default: false) */
    skipCommons?: boolean
    /** Max Commons images to fetch (default: 8) */
    commonsLimit?: number
  } = {}
): Promise<ParallelEnrichmentResult> {
  const { skipCommons = false, commonsLimit = 8 } = options
  const startTime = Date.now()
  const errors: string[] = []

  console.log(`[Enrichment] Starting parallel enrichment for: ${gameName} (BGG ${bggId})`)

  // =====================================================
  // Phase 1: Launch all fetches in parallel
  // =====================================================

  const wikidataStart = Date.now()
  const wikipediaStart = Date.now()
  const commonsStart = Date.now()
  const asinStart = Date.now()

  // Create promises for each source
  const wikidataPromise = fetchWikidataData(bggId).then((result) => {
    const duration = Date.now() - wikidataStart
    console.log(`  [Wikidata] Completed in ${duration}ms`)
    return { result, duration }
  })

  const wikipediaPromise = fetchWikipediaData(
    gameName,
    yearPublished,
    designers
  ).then((result) => {
    const duration = Date.now() - wikipediaStart
    console.log(`  [Wikipedia] Completed in ${duration}ms`)
    return { result, duration }
  })

  const commonsPromise = skipCommons
    ? Promise.resolve({ result: [] as CommonsImage[], duration: 0 })
    : fetchCommonsData(gameName, commonsLimit).then((result) => {
        const duration = Date.now() - commonsStart
        console.log(`  [Commons] Completed in ${duration}ms - found ${result.length} images`)
        return { result, duration }
      })

  // ASIN fetch with BGG ID + name fallback
  const asinPromise = getGameASINWithFallback(String(bggId), gameName).then((result) => {
    const duration = Date.now() - asinStart
    if (result.asin) {
      console.log(`  [ASIN] Completed in ${duration}ms - found via ${result.source}`)
    } else {
      console.log(`  [ASIN] Completed in ${duration}ms - not found`)
    }
    return { result, duration }
  })

  // Wait for all to complete (with error handling per source)
  const [wikidataResult, wikipediaResult, commonsResult, asinResult] = await Promise.all([
    wikidataPromise.catch((err) => {
      errors.push(`Wikidata: ${err.message}`)
      return { result: null, duration: Date.now() - wikidataStart }
    }),
    wikipediaPromise.catch((err) => {
      errors.push(`Wikipedia: ${err.message}`)
      return { result: null, duration: Date.now() - wikipediaStart }
    }),
    commonsPromise.catch((err) => {
      errors.push(`Commons: ${err.message}`)
      return { result: [] as CommonsImage[], duration: Date.now() - commonsStart }
    }),
    asinPromise.catch((err) => {
      errors.push(`ASIN: ${err.message}`)
      return { result: { asin: null, source: null }, duration: Date.now() - asinStart }
    }),
  ])

  // =====================================================
  // Phase 2: Handle Wikipedia fallback
  // =====================================================

  // If Wikipedia search failed but Wikidata has a Wikipedia URL, retry
  let finalWikipediaResult = wikipediaResult.result
  let wikipediaRetryDuration = 0

  if (
    !finalWikipediaResult?.raw.found &&
    wikidataResult.result?.raw.wikipediaUrl
  ) {
    console.log(`  [Wikipedia] Retrying with Wikidata URL: ${wikidataResult.result.raw.wikipediaUrl}`)
    const retryStart = Date.now()

    try {
      const retryResult = await fetchWikipediaData(
        gameName,
        yearPublished,
        designers,
        wikidataResult.result.raw.wikipediaUrl
      )
      if (retryResult?.raw.found) {
        finalWikipediaResult = retryResult
        wikipediaRetryDuration = Date.now() - retryStart
        console.log(`  [Wikipedia] Retry succeeded in ${wikipediaRetryDuration}ms`)
      }
    } catch (err) {
      // Retry failed, keep original result
      console.log(`  [Wikipedia] Retry failed`)
    }
  }

  // =====================================================
  // Phase 3: Build result
  // =====================================================

  const endTime = Date.now()
  const success =
    wikidataResult.result !== null ||
    finalWikipediaResult !== null ||
    commonsResult.result.length > 0

  const result: ParallelEnrichmentResult = {
    success,
    wikidata: wikidataResult.result,
    wikipedia: finalWikipediaResult,
    commonsImages: commonsResult.result,
    asin: asinResult.result.asin ? { value: asinResult.result.asin, source: asinResult.result.source } : null,
    timing: {
      startTime,
      endTime,
      durationMs: endTime - startTime,
      wikidataMs: wikidataResult.duration,
      wikipediaMs: wikipediaResult.duration + wikipediaRetryDuration,
      commonsMs: commonsResult.duration,
      asinMs: asinResult.duration,
    },
    errors,
  }

  console.log(
    `[Enrichment] Completed in ${result.timing.durationMs}ms ` +
    `(Wikidata: ${wikidataResult.result ? 'found' : 'none'}, ` +
    `Wikipedia: ${finalWikipediaResult?.raw.found ? 'found' : 'none'}, ` +
    `Commons: ${commonsResult.result.length} images, ` +
    `ASIN: ${asinResult.result.asin || 'none'})`
  )

  return result
}

// =====================================================
// Individual Source Fetchers
// =====================================================

/**
 * Fetch and transform Wikidata data
 */
async function fetchWikidataData(
  bggId: number
): Promise<WikidataEnrichmentData | null> {
  const wikidata = await getGameByBggId(String(bggId))

  if (!wikidata) {
    return null
  }

  const result: WikidataEnrichmentData = {
    wikidata_id: wikidata.wikidataId,
    wikidata_last_synced: new Date().toISOString(),
    raw: wikidata,
  }

  // Wikipedia URL
  if (wikidata.wikipediaUrl) {
    result.wikipedia_url = wikidata.wikipediaUrl
  }

  // Wikidata image (CC-licensed)
  if (wikidata.imageUrl) {
    result.wikidata_image_url = wikidata.imageUrl
  }

  // Official website
  if (wikidata.officialWebsite) {
    result.official_website = wikidata.officialWebsite
  }

  // Rulebook URL (P953)
  if (wikidata.rulebookUrl) {
    result.rulebook_url = wikidata.rulebookUrl
    result.rulebook_source = 'wikidata'
  }

  // Series membership
  if (wikidata.seriesId) {
    result.wikidata_series_id = wikidata.seriesId
  }

  return result
}

/**
 * Fetch and transform Wikipedia data
 */
async function fetchWikipediaData(
  gameName: string,
  yearPublished?: number,
  designers?: string[],
  existingWikipediaUrl?: string
): Promise<WikipediaEnrichmentData | null> {
  const wikipediaResult = await enrichGameFromWikipedia(
    gameName,
    yearPublished,
    designers,
    existingWikipediaUrl
  )

  if (!wikipediaResult.found) {
    return null
  }

  // Use existing storage data preparation
  const storageData = prepareWikipediaStorageData(wikipediaResult)

  // Check for rulebook in external links
  let extractedRulebookUrl: string | undefined
  if (wikipediaResult.externalLinks) {
    const rulebookLink = wikipediaResult.externalLinks.find(
      (link) => link.type === 'rulebook'
    )
    if (rulebookLink) {
      extractedRulebookUrl = rulebookLink.url
    }
  }

  return {
    ...storageData,
    extracted_rulebook_url: extractedRulebookUrl,
    raw: wikipediaResult,
  }
}

/**
 * Fetch Commons images
 */
async function fetchCommonsData(
  gameName: string,
  limit: number
): Promise<CommonsImage[]> {
  return quickSearchBoardGameImages(gameName, limit)
}

// =====================================================
// Database Update Helper
// =====================================================

/**
 * Prepare game update data from enrichment result
 *
 * Merges all enrichment sources into a single update object,
 * handling priority (e.g., Wikidata rulebook > Wikipedia rulebook)
 */
export function prepareGameUpdateFromEnrichment(
  enrichment: ParallelEnrichmentResult
): Record<string, unknown> {
  const update: Record<string, unknown> = {}

  // =====================================================
  // Wikidata fields (highest priority for metadata)
  // =====================================================
  if (enrichment.wikidata) {
    update.wikidata_id = enrichment.wikidata.wikidata_id
    update.wikidata_last_synced = enrichment.wikidata.wikidata_last_synced

    if (enrichment.wikidata.wikidata_image_url) {
      update.wikidata_image_url = enrichment.wikidata.wikidata_image_url
    }

    if (enrichment.wikidata.wikipedia_url) {
      update.wikipedia_url = enrichment.wikidata.wikipedia_url
    }

    if (enrichment.wikidata.official_website) {
      update.official_website = enrichment.wikidata.official_website
    }

    if (enrichment.wikidata.rulebook_url) {
      update.rulebook_url = enrichment.wikidata.rulebook_url
      update.rulebook_source = 'wikidata'
    }

    if (enrichment.wikidata.wikidata_series_id) {
      update.wikidata_series_id = enrichment.wikidata.wikidata_series_id
    }
  }

  // =====================================================
  // Wikipedia fields
  // =====================================================
  if (enrichment.wikipedia) {
    // Wikipedia URL (may override Wikidata if more specific)
    if (enrichment.wikipedia.wikipedia_url) {
      update.wikipedia_url = enrichment.wikipedia.wikipedia_url
    }

    // Wikipedia content fields
    if (enrichment.wikipedia.wikipedia_infobox) {
      update.wikipedia_infobox = enrichment.wikipedia.wikipedia_infobox
    }
    if (enrichment.wikipedia.wikipedia_summary) {
      update.wikipedia_summary = enrichment.wikipedia.wikipedia_summary
    }
    if (enrichment.wikipedia.wikipedia_origins) {
      update.wikipedia_origins = enrichment.wikipedia.wikipedia_origins
    }
    if (enrichment.wikipedia.wikipedia_reception) {
      update.wikipedia_reception = enrichment.wikipedia.wikipedia_reception
    }
    if (enrichment.wikipedia.wikipedia_gameplay) {
      update.wikipedia_gameplay = enrichment.wikipedia.wikipedia_gameplay
    }
    if (enrichment.wikipedia.wikipedia_images) {
      update.wikipedia_images = enrichment.wikipedia.wikipedia_images
    }
    if (enrichment.wikipedia.wikipedia_external_links) {
      update.wikipedia_external_links = enrichment.wikipedia.wikipedia_external_links
    }
    if (enrichment.wikipedia.wikipedia_awards) {
      update.wikipedia_awards = enrichment.wikipedia.wikipedia_awards
    }
    if (enrichment.wikipedia.wikipedia_fetched_at) {
      update.wikipedia_fetched_at = enrichment.wikipedia.wikipedia_fetched_at
    }
    if (enrichment.wikipedia.wikipedia_search_confidence) {
      update.wikipedia_search_confidence = enrichment.wikipedia.wikipedia_search_confidence
    }

    // Rulebook URL from Wikipedia (only if no Wikidata rulebook)
    if (
      !update.rulebook_url &&
      enrichment.wikipedia.extracted_rulebook_url
    ) {
      update.rulebook_url = enrichment.wikipedia.extracted_rulebook_url
      update.rulebook_source = 'wikipedia'
    }
  }

  // =====================================================
  // Commons images (stored in wikipedia_images for now, or could be separate)
  // =====================================================
  // Note: Commons images are returned separately for the caller to handle
  // They can be stored in game_images table or added to wikipedia_images

  // =====================================================
  // Amazon ASIN
  // =====================================================
  if (enrichment.asin?.value) {
    update.amazon_asin = enrichment.asin.value
  }

  return update
}

/**
 * Determine the appropriate vecna_state based on enrichment
 */
export function determineVecnaState(
  enrichment: ParallelEnrichmentResult
): 'imported' | 'enriched' | 'rulebook_ready' {
  // Check for rulebook URL (highest priority)
  if (
    enrichment.wikidata?.rulebook_url ||
    enrichment.wikipedia?.extracted_rulebook_url
  ) {
    return 'rulebook_ready'
  }

  // Check for any enrichment data
  if (
    enrichment.wikidata?.wikidata_id ||
    enrichment.wikipedia?.raw.found
  ) {
    return 'enriched'
  }

  return 'imported'
}
