/**
 * Wikidata Board Game Data Module
 *
 * Provides access to CC0-licensed board game data from Wikidata.
 * This is a legally safe alternative to scraping BGG.
 *
 * Usage:
 *
 * // Search for a game
 * import { searchGameByName } from '@/lib/wikidata';
 * const games = await searchGameByName('Catan');
 *
 * // Import a game to our database
 * import { importGameFromWikidata } from '@/lib/wikidata';
 * const result = await importGameFromWikidata(games[0]);
 *
 * // Batch import
 * import { batchImportFromWikidata } from '@/lib/wikidata';
 * const results = await batchImportFromWikidata(100);
 */

// Client exports
export {
  executeQuery,
  getAllBoardGames,
  searchGameByName,
  getGameByBggId,
  getAwardWinningGames,
  getBoardGameCount,
  getGamesByBggIds,
  type WikidataBoardGame,
  type WikidataSparqlResult,
  type WikidataBinding,
} from './client';

// Importer exports
export {
  importGameFromWikidata,
  searchAndImportByName,
  importByBggId,
  batchImportFromWikidata,
  importByNameList,
  transformWikidataToGame,
  type WikidataImportResult,
} from './importer';

// Query exports (for custom queries)
export {
  BOARD_GAMES_QUERY,
  GAME_BY_NAME_QUERY,
  GAME_BY_BGG_ID_QUERY,
  AWARD_WINNING_GAMES_QUERY,
  BOARD_GAME_COUNT_QUERY,
  GAMES_WITH_MECHANICS_QUERY,
  buildQuery,
} from './queries';
