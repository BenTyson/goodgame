/**
 * Wikimedia Commons Integration
 *
 * Direct search and retrieval of CC-licensed images from Wikimedia Commons.
 * Supplements existing Wikipedia/Wikidata integration by searching Commons directly.
 *
 * Usage:
 * ```typescript
 * import { searchCommonsImages, quickSearchBoardGameImages } from '@/lib/wikimedia-commons'
 *
 * // Full search with options
 * const result = await searchCommonsImages('Catan', { limit: 10, requireCC: true })
 *
 * // Quick search with defaults
 * const images = await quickSearchBoardGameImages('Catan')
 * ```
 */

// Types
export type {
  CommonsImage,
  CommonsSearchResult,
  CommonsSearchOptions,
  CommonsQueryResponse,
  CommonsSearchHit,
  CommonsPageInfo,
  CommonsImageInfo,
  CommonsExtMetadata,
} from './types'

// Client functions
export {
  searchCommonsImages,
  searchCommonsByCategory,
  getCommonsImageInfo,
  quickSearchBoardGameImages,
  getCommonsSearchUrl,
} from './client'
