/**
 * Puffin Enrichment Mapper
 *
 * Maps Puffin's ConsolidatedGameData to Boardmello's database update format.
 * Used during game import to apply pre-enriched data from Puffin.
 */

import type { ConsolidatedGameData, CommonsImage } from './client'
import type { Json } from '@/types/supabase'

/**
 * Game update fields from Puffin enrichment
 */
export interface GameEnrichmentUpdate {
  wikidata_id?: string
  wikidata_image_url?: string
  wikipedia_url?: string
  official_website?: string
  rulebook_url?: string
  rulebook_source?: 'wikidata' | 'wikipedia'
  wikidata_series_id?: string
  amazon_asin?: string
  wikipedia_summary?: Json
  wikipedia_gameplay?: string
  wikipedia_reception?: string
  wikipedia_origins?: string
  wikipedia_awards?: Json
  wikipedia_images?: Json
  wikipedia_external_links?: Json
  wikipedia_infobox?: Json
  wikipedia_search_confidence?: string
  wikipedia_fetched_at?: string
  wikidata_last_synced?: string
}

/**
 * Map Puffin enrichment data to game update fields
 */
export function mapPuffinEnrichmentToGameUpdate(data: ConsolidatedGameData): GameEnrichmentUpdate {
  const update: GameEnrichmentUpdate = {}

  if (data.wikidata) {
    update.wikidata_id = data.wikidata.id
    update.wikidata_image_url = data.wikidata.imageUrl
    update.wikipedia_url = data.wikidata.wikipediaUrl
    update.official_website = data.wikidata.officialWebsite
    update.wikidata_series_id = data.wikidata.seriesId
    update.amazon_asin = data.wikidata.amazonAsin
    update.wikidata_last_synced = data.wikidata.fetchedAt

    if (data.wikidata.rulebookUrl) {
      update.rulebook_url = data.wikidata.rulebookUrl
      update.rulebook_source = 'wikidata'
    }
  }

  if (data.wikipedia) {
    // Wikipedia URL may override Wikidata's if available
    update.wikipedia_url = update.wikipedia_url || data.wikipedia.url
    update.wikipedia_summary = data.wikipedia.summary as Json
    update.wikipedia_gameplay = data.wikipedia.gameplay
    update.wikipedia_reception = data.wikipedia.reception
    update.wikipedia_origins = data.wikipedia.origins
    update.wikipedia_awards = data.wikipedia.awards as Json
    update.wikipedia_images = data.wikipedia.images as Json
    update.wikipedia_external_links = data.wikipedia.externalLinks as Json
    update.wikipedia_infobox = data.wikipedia.infobox as Json
    update.wikipedia_search_confidence = data.wikipedia.searchConfidence
    update.wikipedia_fetched_at = data.wikipedia.fetchedAt
  }

  return update
}

/**
 * Relation data extracted from Puffin for post-processing
 */
export interface RelationData {
  seriesId?: string
  seriesName?: string
  followsBggId?: number
  followedByBggId?: number
  commonsImages: CommonsImage[]
}

/**
 * Extract relation data for post-processing (family linking, sequel relations)
 */
export function extractRelationData(data: ConsolidatedGameData): RelationData {
  return {
    seriesId: data.wikidata?.seriesId,
    seriesName: data.wikidata?.seriesName,
    followsBggId: data.wikidata?.followsBggId,
    followedByBggId: data.wikidata?.followedByBggId,
    commonsImages: data.commonsImages || [],
  }
}

/**
 * Determine vecna_state based on Puffin enrichment data
 */
export function determineVecnaStateFromPuffin(data: ConsolidatedGameData): 'imported' | 'enriched' | 'rulebook_ready' {
  // Check for rulebook URL (highest priority)
  if (data.wikidata?.rulebookUrl) {
    return 'rulebook_ready'
  }

  // Check for any enrichment data
  if (data.wikidata?.id || data.wikipedia?.url) {
    return 'enriched'
  }

  return 'imported'
}
