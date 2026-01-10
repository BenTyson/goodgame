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
  GAMES_IN_SERIES_QUERY,
  GAME_ASIN_QUERY,
  GAME_ASIN_BY_BGG_ID_QUERY,
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
  rulebookUrl?: string; // P953: full work available at URL
  bggId?: string;
  designers: string[];
  publishers: string[];
  // New fields for family/series detection
  wikipediaUrl?: string; // English Wikipedia article URL
  seriesId?: string; // Wikidata Q-number for the series (P179)
  seriesName?: string; // Name of the series
  // Sequel relationships
  followsId?: string; // Q-number of game this is a sequel to (P155)
  followsName?: string;
  followsBggId?: string;
  followedById?: string; // Q-number of game that is a sequel to this (P156)
  followedByName?: string;
  followedByBggId?: string;
}

/**
 * Series member from Wikidata
 */
export interface WikidataSeriesMember {
  wikidataId: string;
  name: string;
  bggId?: string;
  yearPublished?: number;
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
  const seriesUri = binding.series?.value;
  const followsUri = binding.follows?.value;
  const followedByUri = binding.followedBy?.value;

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
    rulebookUrl: binding.rulebookUrl?.value,
    bggId: binding.bggId?.value,
    designers: binding.designers?.value
      ? binding.designers.value.split(', ').filter(Boolean)
      : [],
    publishers: binding.publishers?.value
      ? binding.publishers.value.split(', ').filter(Boolean)
      : [],
    // New fields
    wikipediaUrl: binding.wikipediaUrl?.value,
    seriesId: seriesUri ? extractQNumber(seriesUri) : undefined,
    seriesName: binding.seriesLabel?.value,
    followsId: followsUri ? extractQNumber(followsUri) : undefined,
    followsName: binding.followsLabel?.value,
    followsBggId: binding.followsBggId?.value,
    followedById: followedByUri ? extractQNumber(followedByUri) : undefined,
    followedByName: binding.followedByLabel?.value,
    followedByBggId: binding.followedByBggId?.value,
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
 * Get all games in a Wikidata series
 * @param seriesId - Wikidata Q-number for the series (e.g., "Q23899819")
 */
export async function getGamesInSeries(
  seriesId: string
): Promise<WikidataSeriesMember[]> {
  const query = buildQuery(GAMES_IN_SERIES_QUERY, { SERIES_ID: seriesId });
  const result = await executeQuery(query);

  return result.results.bindings.map((binding) => ({
    wikidataId: extractQNumber(binding.game?.value || ''),
    name: binding.gameLabel?.value || 'Unknown',
    bggId: binding.bggId?.value,
    yearPublished: parseValue(binding, 'yearPublished') as number | undefined,
  }));
}

// ============================================================================
// Publisher Enrichment
// ============================================================================

const WIKIDATA_SEARCH_API = 'https://www.wikidata.org/w/api.php'

/**
 * Publisher data from Wikidata
 */
export interface WikidataPublisher {
  wikidataId: string
  name: string
  website: string | null
  logoUrl: string | null
  description: string | null
  foundedYear: number | null
  country: string | null
}

/**
 * Search Wikidata for an entity by name using the search API
 */
async function searchEntityByName(
  name: string,
  limit = 5
): Promise<Array<{ id: string; label: string; description: string }>> {
  await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS))
  lastRequestTime = Date.now()

  const url = `${WIKIDATA_SEARCH_API}?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&limit=${limit}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'BoardNomads/1.0 (https://boardnomads.com)',
    },
  })

  if (!response.ok) return []

  const data = await response.json()
  return (data.search || []).map(
    (r: { id: string; label: string; description?: string }) => ({
      id: r.id,
      label: r.label,
      description: r.description || '',
    })
  )
}

/**
 * Search for a publisher on Wikidata and get enrichment data
 */
export async function enrichPublisher(
  publisherName: string
): Promise<WikidataPublisher | null> {
  // Search for the publisher
  const searchResults = await searchEntityByName(publisherName, 5)

  if (searchResults.length === 0) {
    return null
  }

  // Try each result until we find one with a website (likely the real publisher)
  for (const result of searchResults) {
    const query = `
      SELECT ?website ?logo ?description ?foundedYear ?countryLabel WHERE {
        OPTIONAL { wd:${result.id} wdt:P856 ?website . }
        OPTIONAL { wd:${result.id} wdt:P154 ?logo . }
        OPTIONAL { wd:${result.id} schema:description ?description . FILTER(LANG(?description) = "en") }
        OPTIONAL { wd:${result.id} wdt:P571 ?founded . BIND(YEAR(?founded) AS ?foundedYear) }
        OPTIONAL { wd:${result.id} wdt:P17 ?country . }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 1
    `

    try {
      const queryResult = await executeQuery(query)
      const data = queryResult.results.bindings[0]

      // If we found a website, this is likely the right entity
      if (data?.website?.value) {
        return {
          wikidataId: result.id,
          name: result.label,
          website: data.website.value,
          logoUrl: data.logo?.value || null,
          description: data.description?.value || null,
          foundedYear: data.foundedYear?.value
            ? parseInt(data.foundedYear.value)
            : null,
          country: data.countryLabel?.value || null,
        }
      }
    } catch {
      // Continue to next result
    }
  }

  // Return first result even without website
  const firstResult = searchResults[0]
  return {
    wikidataId: firstResult.id,
    name: firstResult.label,
    website: null,
    logoUrl: null,
    description: firstResult.description || null,
    foundedYear: null,
    country: null,
  }
}

/**
 * Batch enrich multiple publishers
 * Returns a map of publisher name -> WikidataPublisher
 */
export async function enrichPublishers(
  publisherNames: string[]
): Promise<Map<string, WikidataPublisher>> {
  const results = new Map<string, WikidataPublisher>()

  for (const name of publisherNames) {
    const enriched = await enrichPublisher(name)
    if (enriched) {
      results.set(name, enriched)
    }
  }

  return results
}

/**
 * Get publisher websites for a game from Wikidata
 * Uses the game's BGG ID or name to find it, then gets publisher info
 */
export async function getPublisherWebsitesForGame(
  bggId: string | null,
  gameName: string
): Promise<Array<{ name: string; website: string; wikidataId: string }>> {
  // First try to find the game
  let gameWikidataId: string | null = null

  if (bggId) {
    const game = await getGameByBggId(bggId)
    if (game) {
      gameWikidataId = game.wikidataId
    }
  }

  if (!gameWikidataId) {
    // Try searching by name
    const searchResults = await searchEntityByName(gameName, 3)
    for (const result of searchResults) {
      if (
        result.description.toLowerCase().includes('board game') ||
        result.description.toLowerCase().includes('card game') ||
        result.description.toLowerCase().includes('tabletop game')
      ) {
        gameWikidataId = result.id
        break
      }
    }
  }

  if (!gameWikidataId) {
    return []
  }

  // Query for publishers with websites
  const query = `
    SELECT ?publisher ?publisherLabel ?website WHERE {
      wd:${gameWikidataId} wdt:P123 ?publisher .
      ?publisher wdt:P856 ?website .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `

  const result = await executeQuery(query)

  return result.results.bindings
    .filter((b) => b.website?.value)
    .map((b) => ({
      name: b.publisherLabel?.value || 'Unknown',
      website: b.website!.value,
      wikidataId: extractQNumber(b.publisher?.value || ''),
    }))
}

/**
 * Get a game by BGG ID, falling back to name search if not found
 * Useful when Wikidata entry exists but doesn't have P2339 (BGG ID) set
 */
export async function getGameByBggIdOrName(
  bggId: string,
  gameName: string
): Promise<WikidataBoardGame | null> {
  // First try by BGG ID
  const byId = await getGameByBggId(bggId)
  if (byId) {
    return byId
  }

  console.log(`  [Wikidata] No BGG ID match, trying name search: "${gameName}"`)

  // Fall back to name search
  const searchResults = await searchEntityByName(gameName, 5)

  for (const result of searchResults) {
    // Check if this is a board/card/tabletop game
    const desc = result.description.toLowerCase()
    if (
      desc.includes('board game') ||
      desc.includes('card game') ||
      desc.includes('tabletop game') ||
      desc.includes('party game')
    ) {
      console.log(`  [Wikidata] Found by name: ${result.label} (${result.id})`)

      // Fetch full game data
      const query = `
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
          ?rulebookUrl
          ?bggId
          (GROUP_CONCAT(DISTINCT ?designerLabel; separator=", ") AS ?designers)
          (GROUP_CONCAT(DISTINCT ?publisherLabel; separator=", ") AS ?publishers)
        WHERE {
          BIND(wd:${result.id} AS ?game)

          OPTIONAL { ?game wdt:P571 ?inception . BIND(YEAR(?inception) AS ?yearPublished) }
          OPTIONAL { ?game wdt:P1872 ?minPlayers . }
          OPTIONAL { ?game wdt:P1873 ?maxPlayers . }
          OPTIONAL { ?game wdt:P2047 ?playTime . }
          OPTIONAL { ?game wdt:P18 ?image . }
          OPTIONAL { ?game wdt:P856 ?officialWebsite . }
          OPTIONAL { ?game wdt:P953 ?rulebookUrl . }
          OPTIONAL { ?game wdt:P2339 ?bggId . }

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
        GROUP BY ?game ?gameLabel ?gameDescription ?yearPublished ?minPlayers ?maxPlayers ?playTime ?image ?officialWebsite ?rulebookUrl ?bggId
      `

      try {
        const queryResult = await executeQuery(query)
        if (queryResult.results.bindings.length > 0) {
          return parseBinding(queryResult.results.bindings[0])
        }
      } catch (err) {
        console.warn(`  [Wikidata] Error fetching game data:`, err)
      }
    }
  }

  return null
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

// ============================================================================
// Amazon ASIN Enrichment
// ============================================================================

/**
 * Get Amazon ASIN for a game by its Wikidata ID
 * @param wikidataId - Wikidata Q-number (e.g., "Q123456")
 * @returns ASIN string or null if not found
 */
export async function getGameASINByWikidataId(
  wikidataId: string
): Promise<string | null> {
  const query = buildQuery(GAME_ASIN_QUERY, { WIKIDATA_ID: wikidataId });

  try {
    const result = await executeQuery(query);
    const asin = result.results.bindings[0]?.asin?.value;
    return asin || null;
  } catch (error) {
    console.warn(`[Wikidata] Error fetching ASIN for ${wikidataId}:`, error);
    return null;
  }
}

/**
 * Get Amazon ASIN for a game by its BGG ID
 * @param bggId - BoardGameGeek game ID
 * @returns ASIN string or null if not found
 */
export async function getGameASINByBggId(
  bggId: string
): Promise<string | null> {
  const query = buildQuery(GAME_ASIN_BY_BGG_ID_QUERY, { BGG_ID: bggId });

  try {
    const result = await executeQuery(query);
    const asin = result.results.bindings[0]?.asin?.value;
    if (asin) {
      console.log(`  [Wikidata] Found ASIN ${asin} for BGG ID ${bggId}`);
    }
    return asin || null;
  } catch (error) {
    console.warn(`[Wikidata] Error fetching ASIN for BGG ${bggId}:`, error);
    return null;
  }
}

/**
 * Get Amazon ASIN with fallback chain:
 * 1. Try by BGG ID (direct P2339 -> P5749 lookup)
 * 2. If not found, search by game name, find board game entity, fetch ASIN
 *
 * @param bggId - BoardGameGeek game ID
 * @param gameName - Game name for fallback search
 * @returns Object with ASIN and source, or null values if not found
 */
export async function getGameASINWithFallback(
  bggId: string,
  gameName: string
): Promise<{ asin: string | null; source: 'bgg_id' | 'name_search' | null }> {
  // Step 1: Try by BGG ID (existing function)
  const asinByBggId = await getGameASINByBggId(bggId);
  if (asinByBggId) {
    return { asin: asinByBggId, source: 'bgg_id' };
  }

  console.log(`  [Wikidata ASIN] No ASIN by BGG ID, trying name search: "${gameName}"`);

  // Step 2: Search by name and find board game entity
  try {
    const searchResults = await searchEntityByName(gameName, 5);

    for (const result of searchResults) {
      const desc = result.description.toLowerCase();
      // Check if this looks like a board game
      if (
        desc.includes('board game') ||
        desc.includes('card game') ||
        desc.includes('tabletop game') ||
        desc.includes('party game') ||
        desc.includes('strategy game') ||
        desc.includes('dice game')
      ) {
        console.log(`  [Wikidata ASIN] Found game by name: ${result.label} (${result.id})`);

        // Step 3: Fetch ASIN for this entity
        const asin = await getGameASINByWikidataId(result.id);
        if (asin) {
          console.log(`  [Wikidata ASIN] Found ASIN ${asin} via name search`);
          return { asin, source: 'name_search' };
        }
      }
    }
  } catch (error) {
    console.warn(`[Wikidata ASIN] Name search failed for "${gameName}":`, error);
  }

  console.log(`  [Wikidata ASIN] No ASIN found for "${gameName}"`);
  return { asin: null, source: null };
}
