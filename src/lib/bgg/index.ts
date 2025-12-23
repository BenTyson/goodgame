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
  fetchBGGGames,
  searchBGGGames,
  type BGGRawGame,
} from './client'

// Game Importer
export {
  importGameFromBGG,
  importNextBatch,
  syncGameWithBGG,
  transformBGGToGame,
  getQueueStats,
  type ImportResult,
} from './importer'

// Queue Seeder
export {
  addToQueue,
  seedFromAwards,
  seedFromBGGTop,
  seedManual,
  resetFailedImports,
  getQueueSummary,
} from './seed-queue'
