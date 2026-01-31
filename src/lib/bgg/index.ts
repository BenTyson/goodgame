/**
 * BGG Integration Module
 *
 * This module provides tools for:
 * - Fetching game data from BoardGameGeek's XML API
 * - Importing games into our database
 * - Managing the import queue
 */

// BGG API Client
export {
  fetchBGGGame,
  fetchBGGGameWithStatus,
  fetchBGGGames,
  fetchBGGGamesWithStatus,
  searchBGGGames,
  fetchEnrichedGame,
  type BGGRawGame,
  type BGGFetchResult,
  type BGGBatchFetchResult,
  type ConsolidatedGameData,
  type WikidataResult,
  type WikipediaResult,
  type CommonsImage,
  // Puffin content functions
  fetchPuffinContentFeed,
  fetchPuffinContentBatch,
  fetchPuffinContentSingle,
  type PuffinContentFields,
  type PuffinContentCompleteness,
  type PuffinContentFeedResponse,
  type PuffinContentBatchResponse,
  type PuffinContentSingleResponse,
} from './client'

// Enrichment Mapper
export {
  mapPuffinEnrichmentToGameUpdate,
  extractRelationData,
  determineVecnaStateFromPuffin,
} from './enrichment-mapper'

// Game Importer
export {
  importGameFromBGG,
  importNextBatch,
  syncGameWithBGG,
  transformBGGToGame,
  getQueueStats,
  type ImportResult,
} from './importer'

// Puffin Content Importer
export {
  syncContentFromFeed,
  importContentForGames,
  importContentForSingleGame,
  getContentSyncStatus,
  type ContentImportResult,
  type ContentSyncResult,
  type SyncStatus,
} from './content-importer'

// Queue Seeder
export {
  addToQueue,
  seedFromAwards,
  seedFromBGGTop,
  seedManual,
  resetFailedImports,
  getQueueSummary,
} from './seed-queue'
