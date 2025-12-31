/**
 * Wikidata SPARQL API Client
 *
 * Fetches board game data from Wikidata's public SPARQL endpoint.
 * Data is CC0 licensed (public domain).
 *
 * Endpoint: https://query.wikidata.org/sparql
 * Documentation: https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service
 */

import {
  BOARD_GAMES_QUERY,
  GAME_BY_NAME_QUERY,
  GAME_BY_BGG_ID_QUERY,
  AWARD_WINNING_GAMES_QUERY,
  BOARD_GAME_COUNT_QUERY,
  buildQuery,
} from './queries';

const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

// Rate limiting: Be respectful to Wikidata's servers
const REQUEST_DELAY_MS = 1000; // 1 second between requests
let lastRequestTime = 0;

/**
 * Raw result from Wikidata SPARQL query
 */
export interface WikidataSparqlResult {
  head: {
    vars: string[];
  };
  results: {
    bindings: WikidataBinding[];
  };
}

export interface WikidataBinding {
  [key: string]: {
    type: 'uri' | 'literal' | 'bnode';
    value: string;
    'xml:lang'?: string;
    datatype?: string;
  };
}

/**
 * Parsed board game data from Wikidata
 */
export interface WikidataBoardGame {
  wikidataId: string; // Q-number (e.g., "Q1234567")
  name: string;
  description?: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playTimeMinutes?: number;
  imageUrl?: string;
  officialWebsite?: string;
  bggId?: string;
  designers: string[];
  publishers: string[];
}

/**
 * Rate-limited fetch with proper headers
 */
async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, REQUEST_DELAY_MS - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();

  return fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'BoardNomads/1.0 (https://boardnomads.com; contact@boardnomads.com)',
    },
  });
}

/**
 * Execute a SPARQL query against Wikidata
 */
export async function executeQuery(
  query: string
): Promise<WikidataSparqlResult> {
  const url = `${WIKIDATA_SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`;

  const response = await rateLimitedFetch(url);

  if (!response.ok) {
    throw new Error(
      `Wikidata query failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Parse a binding value to the appropriate type
 */
function parseValue(
  binding: WikidataBinding,
  key: string
): string | number | undefined {
  const item = binding[key];
  if (!item) return undefined;

  // Check if it's a numeric type
  if (
    item.datatype === 'http://www.w3.org/2001/XMLSchema#integer' ||
    item.datatype === 'http://www.w3.org/2001/XMLSchema#decimal'
  ) {
    return parseInt(item.value, 10);
  }

  return item.value;
}

/**
 * Extract Q-number from Wikidata URI
 */
function extractQNumber(uri: string): string {
  const match = uri.match(/Q\d+$/);
  return match ? match[0] : uri;
}

/**
 * Normalize Wikimedia image URLs to use HTTPS
 */
function normalizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // Wikimedia Commons URLs come as http:// but support https://
  return url.replace(/^http:\/\//, 'https://');
}

/**
 * Parse a single binding into a WikidataBoardGame
 */
function parseBinding(binding: WikidataBinding): WikidataBoardGame {
  const gameUri = binding.game?.value || '';

  return {
    wikidataId: extractQNumber(gameUri),
    name: binding.gameLabel?.value || 'Unknown',
    description: binding.gameDescription?.value,
    yearPublished: parseValue(binding, 'yearPublished') as number | undefined,
    minPlayers: parseValue(binding, 'minPlayers') as number | undefined,
    maxPlayers: parseValue(binding, 'maxPlayers') as number | undefined,
    playTimeMinutes: parseValue(binding, 'playTime') as number | undefined,
    imageUrl: normalizeImageUrl(binding.image?.value),
    officialWebsite: binding.officialWebsite?.value,
    bggId: binding.bggId?.value,
    designers: binding.designers?.value
      ? binding.designers.value.split(', ').filter(Boolean)
      : [],
    publishers: binding.publishers?.value
      ? binding.publishers.value.split(', ').filter(Boolean)
      : [],
  };
}

/**
 * Fetch all board games from Wikidata (limited to 1000)
 */
export async function getAllBoardGames(): Promise<WikidataBoardGame[]> {
  const result = await executeQuery(BOARD_GAMES_QUERY);
  return result.results.bindings.map(parseBinding);
}

/**
 * Search for a game by name
 */
export async function searchGameByName(
  name: string
): Promise<WikidataBoardGame[]> {
  const query = buildQuery(GAME_BY_NAME_QUERY, { GAME_NAME: name });
  const result = await executeQuery(query);
  return result.results.bindings.map(parseBinding);
}

/**
 * Get a game by its BGG ID
 */
export async function getGameByBggId(
  bggId: string
): Promise<WikidataBoardGame | null> {
  const query = buildQuery(GAME_BY_BGG_ID_QUERY, { BGG_ID: bggId });
  const result = await executeQuery(query);

  if (result.results.bindings.length === 0) {
    return null;
  }

  return parseBinding(result.results.bindings[0]);
}

/**
 * Get award-winning games
 */
export async function getAwardWinningGames(): Promise<
  Array<WikidataBoardGame & { award?: string; awardYear?: number }>
> {
  const result = await executeQuery(AWARD_WINNING_GAMES_QUERY);

  return result.results.bindings.map((binding) => ({
    ...parseBinding(binding),
    award: binding.awardLabel?.value,
    awardYear: parseValue(binding, 'awardYear') as number | undefined,
  }));
}

/**
 * Get total count of board games in Wikidata
 */
export async function getBoardGameCount(): Promise<number> {
  const result = await executeQuery(BOARD_GAME_COUNT_QUERY);
  const countValue = result.results.bindings[0]?.count?.value;
  return countValue ? parseInt(countValue, 10) : 0;
}

/**
 * Batch fetch games by a list of BGG IDs
 * Returns a map of BGG ID -> WikidataBoardGame
 */
export async function getGamesByBggIds(
  bggIds: string[]
): Promise<Map<string, WikidataBoardGame>> {
  const results = new Map<string, WikidataBoardGame>();

  // Process in batches to avoid overwhelming Wikidata
  const BATCH_SIZE = 10;

  for (let i = 0; i < bggIds.length; i += BATCH_SIZE) {
    const batch = bggIds.slice(i, i + BATCH_SIZE);

    // Build a query that fetches multiple BGG IDs at once
    const valuesClause = batch.map((id) => `"${id}"`).join(' ');
    const batchQuery = `
      SELECT DISTINCT
        ?game
        ?gameLabel
        ?gameDescription
        ?yearPublished
        ?minPlayers
        ?maxPlayers
        ?playTime
        ?image
        ?officialWebsite
        ?bggId
        (GROUP_CONCAT(DISTINCT ?designerLabel; separator=", ") AS ?designers)
        (GROUP_CONCAT(DISTINCT ?publisherLabel; separator=", ") AS ?publishers)
      WHERE {
        ?game wdt:P31/wdt:P279* wd:Q131436 .
        ?game wdt:P2339 ?bggId .
        VALUES ?bggId { ${valuesClause} }

        OPTIONAL { ?game wdt:P571 ?inception . BIND(YEAR(?inception) AS ?yearPublished) }
        OPTIONAL { ?game wdt:P1872 ?minPlayers . }
        OPTIONAL { ?game wdt:P1873 ?maxPlayers . }
        OPTIONAL { ?game wdt:P2047 ?playTime . }
        OPTIONAL { ?game wdt:P18 ?image . }
        OPTIONAL { ?game wdt:P856 ?officialWebsite . }

        OPTIONAL {
          ?game wdt:P287 ?designer .
          ?designer rdfs:label ?designerLabel .
          FILTER(LANG(?designerLabel) = "en")
        }

        OPTIONAL {
          ?game wdt:P123 ?publisher .
          ?publisher rdfs:label ?publisherLabel .
          FILTER(LANG(?publisherLabel) = "en")
        }

        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
      }
      GROUP BY ?game ?gameLabel ?gameDescription ?yearPublished ?minPlayers ?maxPlayers ?playTime ?image ?officialWebsite ?bggId
    `;

    try {
      const result = await executeQuery(batchQuery);
      for (const binding of result.results.bindings) {
        const game = parseBinding(binding);
        if (game.bggId) {
          results.set(game.bggId, game);
        }
      }
    } catch (error) {
      console.error(`Error fetching batch starting at index ${i}:`, error);
      // Continue with next batch
    }
  }

  return results;
}
