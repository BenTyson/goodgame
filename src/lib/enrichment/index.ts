/**
 * Enrichment Module
 *
 * Parallel data enrichment from multiple sources (Wikidata, Wikipedia, Commons).
 *
 * Usage:
 * ```typescript
 * import { enrichGameParallel, prepareGameUpdateFromEnrichment } from '@/lib/enrichment'
 *
 * const enrichment = await enrichGameParallel(bggId, gameName, year, designers)
 * const updateData = prepareGameUpdateFromEnrichment(enrichment)
 * await supabase.from('games').update(updateData).eq('id', gameId)
 * ```
 */

export {
  enrichGameParallel,
  prepareGameUpdateFromEnrichment,
  determineVecnaState,
  type ParallelEnrichmentResult,
  type WikidataEnrichmentData,
  type WikipediaEnrichmentData,
  type EnrichmentTiming,
} from './parallel'
