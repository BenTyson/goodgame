/**
 * BoardGameGeek API Client
 * Fetches game data from BGG's XML API v2 OR Puffin cache service
 * Rate limited to 1 request/second when hitting BGG directly
 *
 * Puffin Integration:
 * - Set PUFFIN_ENABLED=true to use Puffin as primary data source
 * - Set PUFFIN_API_URL to your Puffin instance URL
 * - Set PUFFIN_API_KEY for authentication
 * - Falls back to direct BGG if Puffin is unavailable or missing data
 *
 * BGG Direct:
 * - Requires BGG_API_TOKEN environment variable for authentication.
 * - Register at: https://boardgamegeek.com/applications
 */

import { parseStringPromise } from 'xml2js'

// BGG API base URL
const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2'

// Puffin configuration
const PUFFIN_ENABLED = process.env.PUFFIN_ENABLED === 'true'
const PUFFIN_API_URL = process.env.PUFFIN_API_URL || ''
const PUFFIN_API_KEY = process.env.PUFFIN_API_KEY || ''

// Puffin health tracking
let puffinHealthy = true
let lastPuffinHealthCheck = 0
const PUFFIN_HEALTH_CHECK_INTERVAL = 60000 // Re-check health after 60s

/**
 * Get BGG API headers with authorization
 */
function getBGGHeaders(): HeadersInit {
  const token = process.env.BGG_API_TOKEN
  if (!token) {
    console.warn('BGG_API_TOKEN not set - API calls will fail')
    return {}
  }
  return {
    'Authorization': `Bearer ${token}`,
  }
}

// Rate limiting - track last request time
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1100 // 1.1 seconds between requests

/**
 * Wait to respect rate limits
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    )
  }

  lastRequestTime = Date.now()
}

/**
 * Raw BGG game data structure from XML API
 */
// BGG link with ID for category/mechanic/family mappings
export interface BGGLink {
  id: number
  name: string
}

export interface BGGRawGame {
  id: number
  type: string
  name: string
  alternateNames: string[]
  yearPublished: number | null
  description: string
  thumbnail: string | null
  image: string | null
  minPlayers: number
  maxPlayers: number
  playingTime: number
  minPlayTime: number
  maxPlayTime: number
  minAge: number
  weight: number // Average weight/complexity from BGG
  rating: number // Average rating from BGG
  numRatings: number
  rank: number | null // BGG overall rank
  designers: string[]
  artists: string[]
  publishers: string[]
  categories: string[]  // Kept for backwards compatibility
  mechanics: string[]   // Kept for backwards compatibility
  categoryLinks: BGGLink[]  // Categories with BGG IDs
  mechanicLinks: BGGLink[]  // Mechanics with BGG IDs
  families: BGGLink[]
  expansions: BGGLink[]
  expandsGame: BGGLink | null // If this is an expansion
  implementations: BGGLink[]  // Games that are reimplementations of this one
  implementsGame: BGGLink | null // The game this reimplements (if this is a newer edition)
}

/**
 * Extract text value from BGG XML structure
 */
function extractValue(obj: unknown): string {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  if (Array.isArray(obj) && obj.length > 0) {
    const first = obj[0]
    if (typeof first === 'string') return first
    if (first && typeof first === 'object' && '_' in first) return String(first._)
    if (first && typeof first === 'object' && '$' in first && first.$.value) return String(first.$.value)
  }
  if (typeof obj === 'object' && obj !== null) {
    if ('_' in obj) return String((obj as { _: unknown })._)
    if ('$' in obj && (obj as { $: { value?: unknown } }).$.value) {
      return String((obj as { $: { value: unknown } }).$.value)
    }
  }
  return ''
}

/**
 * Extract numeric value from BGG XML structure
 */
function extractNumber(obj: unknown, defaultValue: number = 0): number {
  const str = extractValue(obj)
  const num = parseFloat(str)
  return isNaN(num) ? defaultValue : num
}

/**
 * Extract attribute value from BGG XML structure
 */
function extractAttr(obj: unknown, attr: string): string {
  if (!obj) return ''
  if (Array.isArray(obj) && obj.length > 0) {
    const first = obj[0]
    if (first && typeof first === 'object' && '$' in first) {
      return String((first as { $: Record<string, unknown> }).$[attr] || '')
    }
  }
  if (typeof obj === 'object' && obj !== null && '$' in obj) {
    return String((obj as { $: Record<string, unknown> }).$[attr] || '')
  }
  return ''
}

/**
 * Parse links by type from BGG XML
 */
function parseLinks(
  links: Array<{ $: { type: string; id: string; value: string } }> | undefined,
  type: string
): string[] {
  if (!links || !Array.isArray(links)) return []
  return links
    .filter(link => link.$ && link.$.type === type)
    .map(link => link.$.value)
}

/**
 * Parse family/expansion links with IDs
 */
function parseLinkWithId(
  links: Array<{ $: { type: string; id: string; value: string } }> | undefined,
  type: string
): { id: number; name: string }[] {
  if (!links || !Array.isArray(links)) return []
  return links
    .filter(link => link.$ && link.$.type === type)
    .map(link => ({
      id: parseInt(link.$.id, 10),
      name: link.$.value
    }))
}

/**
 * Parse links with inbound attribute (for implementation links)
 * BGG marks links as inbound="true" when the link points TO this game
 */
function parseLinkWithInbound(
  links: Array<{ $: { type: string; id: string; value: string; inbound?: string } }> | undefined,
  type: string
): { id: number; name: string; inbound: boolean }[] {
  if (!links || !Array.isArray(links)) return []
  return links
    .filter(link => link.$ && link.$.type === type)
    .map(link => ({
      id: parseInt(link.$.id, 10),
      name: link.$.value,
      inbound: link.$.inbound === 'true'
    }))
}

// ============================================================================
// PUFFIN INTEGRATION
// ============================================================================

/**
 * Check if Puffin should be used (enabled and healthy)
 */
function shouldUsePuffin(): boolean {
  if (!PUFFIN_ENABLED || !PUFFIN_API_URL) return false

  // If marked unhealthy, check if we should re-test
  if (!puffinHealthy) {
    const now = Date.now()
    if (now - lastPuffinHealthCheck >= PUFFIN_HEALTH_CHECK_INTERVAL) {
      puffinHealthy = true // Optimistically re-enable
      lastPuffinHealthCheck = now
    }
  }

  return puffinHealthy
}

/**
 * Mark Puffin as unhealthy after a failure
 */
function markPuffinUnhealthy(): void {
  puffinHealthy = false
  lastPuffinHealthCheck = Date.now()
  console.warn('Puffin marked as unhealthy, will retry in 60s')
}

/**
 * Fetch a single game from Puffin cache
 */
async function fetchFromPuffin(bggId: number): Promise<BGGRawGame | null> {
  try {
    const response = await fetch(`${PUFFIN_API_URL}/game/${bggId}`, {
      headers: {
        'Authorization': `Bearer ${PUFFIN_API_KEY}`,
        'X-Client': 'boardmello',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (response.status === 404) {
      // Game not in cache - request Puffin to fetch it
      await requestPuffinFetch([bggId])
      return null
    }

    if (!response.ok) {
      markPuffinUnhealthy()
      return null
    }

    const data = await response.json()
    return data.game as BGGRawGame
  } catch (error) {
    console.warn(`Puffin fetch failed for ${bggId}:`, error)
    markPuffinUnhealthy()
    return null
  }
}

/**
 * Batch fetch games from Puffin cache
 */
async function fetchFromPuffinBatch(bggIds: number[]): Promise<Map<number, BGGRawGame>> {
  const results = new Map<number, BGGRawGame>()

  if (bggIds.length === 0) return results

  try {
    const response = await fetch(`${PUFFIN_API_URL}/games?ids=${bggIds.join(',')}`, {
      headers: {
        'Authorization': `Bearer ${PUFFIN_API_KEY}`,
        'X-Client': 'boardmello',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      markPuffinUnhealthy()
      return results
    }

    const data = await response.json()

    // Add found games to results
    for (const [id, game] of Object.entries(data.games || {})) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gameData = game as any
      // Remove _meta from game object if present
      if (gameData._meta) {
        delete gameData._meta
      }
      results.set(parseInt(id), gameData as BGGRawGame)
    }

    // Queue missing games for Puffin to fetch
    if (data.missing && data.missing.length > 0) {
      await requestPuffinFetch(data.missing)
    }

    return results
  } catch (error) {
    console.warn('Puffin batch fetch failed:', error)
    markPuffinUnhealthy()
    return results
  }
}

/**
 * Request Puffin to fetch specific games (fire-and-forget)
 */
async function requestPuffinFetch(bggIds: number[]): Promise<void> {
  if (bggIds.length === 0) return

  try {
    await fetch(`${PUFFIN_API_URL}/games/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PUFFIN_API_KEY}`,
        'X-Client': 'boardmello',
      },
      body: JSON.stringify({ bggIds, priority: 'high' }),
      signal: AbortSignal.timeout(2000),
    })
  } catch {
    // Ignore errors - this is fire-and-forget
  }
}

// ============================================================================
// DIRECT BGG FETCHING (fallback when Puffin unavailable)
// ============================================================================

/**
 * Fetch a single game directly from BGG by ID
 */
async function fetchBGGGameDirect(bggId: number): Promise<BGGRawGame | null> {
  await waitForRateLimit()

  const url = `${BGG_API_BASE}/thing?id=${bggId}&stats=1`

  try {
    const response = await fetch(url, { headers: getBGGHeaders() })

    if (!response.ok) {
      console.error(`BGG API error: ${response.status} ${response.statusText}`)
      return null
    }

    const xml = await response.text()
    const result = await parseStringPromise(xml)

    if (!result.items?.item?.[0]) {
      console.error(`No game found for BGG ID: ${bggId}`)
      return null
    }

    const item = result.items.item[0]
    const type = item.$.type

    // Get primary name and alternate names
    const names = item.name || []
    const primaryName = names.find(
      (n: { $: { type: string; value: string } }) => n.$.type === 'primary'
    )
    const altNames = names
      .filter((n: { $: { type: string; value: string } }) => n.$.type === 'alternate')
      .map((n: { $: { value: string } }) => n.$.value)

    // Get statistics
    const stats = item.statistics?.[0]?.ratings?.[0]
    const ranks = stats?.ranks?.[0]?.rank || []
    const overallRank = ranks.find(
      (r: { $: { name: string } }) => r.$.name === 'boardgame'
    )

    // Get expansion relationship
    const expandsLinks = parseLinkWithId(item.link, 'boardgameexpansion')
    const expandsGame = type === 'boardgameexpansion' && expandsLinks.length > 0
      ? expandsLinks[0]
      : null

    // Get expansions (games that expand this one)
    const expansions = type === 'boardgame'
      ? parseLinkWithId(item.link, 'boardgameexpansion')
      : []

    // Get implementation relationship (reimplementations/editions)
    // inbound=true means that game reimplements THIS game
    // inbound=false/missing means THIS game reimplements that game
    const implLinks = parseLinkWithInbound(item.link, 'boardgameimplementation')

    // This game reimplements another (outgoing - we're the newer version)
    const implementsGame = implLinks.find(link => !link.inbound)
      ? { id: implLinks.find(link => !link.inbound)!.id, name: implLinks.find(link => !link.inbound)!.name }
      : null

    // Games that reimplement this one (inbound - we're the original)
    const implementations = implLinks
      .filter(link => link.inbound)
      .map(({ id, name }) => ({ id, name }))

    const game: BGGRawGame = {
      id: parseInt(item.$.id, 10),
      type,
      name: primaryName?.$.value || 'Unknown',
      alternateNames: altNames,
      yearPublished: extractNumber(item.yearpublished) || null,
      description: extractValue(item.description),
      thumbnail: extractValue(item.thumbnail) || null,
      image: extractValue(item.image) || null,
      minPlayers: extractNumber(item.minplayers, 1),
      maxPlayers: extractNumber(item.maxplayers, 1),
      playingTime: extractNumber(item.playingtime, 30),
      minPlayTime: extractNumber(item.minplaytime, 30),
      maxPlayTime: extractNumber(item.maxplaytime, 60),
      minAge: extractNumber(item.minage, 8),
      weight: extractNumber(stats?.averageweight, 2.5),
      rating: extractNumber(stats?.average, 0),
      numRatings: extractNumber(stats?.usersrated, 0),
      rank: overallRank ? parseInt(extractAttr(overallRank, 'value'), 10) || null : null,
      designers: parseLinks(item.link, 'boardgamedesigner'),
      artists: parseLinks(item.link, 'boardgameartist'),
      publishers: parseLinks(item.link, 'boardgamepublisher'),
      categories: parseLinks(item.link, 'boardgamecategory'),
      mechanics: parseLinks(item.link, 'boardgamemechanic'),
      categoryLinks: parseLinkWithId(item.link, 'boardgamecategory'),
      mechanicLinks: parseLinkWithId(item.link, 'boardgamemechanic'),
      families: parseLinkWithId(item.link, 'boardgamefamily'),
      expansions,
      expandsGame,
      implementations,
      implementsGame,
    }

    return game

  } catch (error) {
    console.error(`Error fetching BGG game ${bggId}:`, error)
    return null
  }
}

// ============================================================================
// PUBLIC API - Routes through Puffin only (no BGG fallback)
// ============================================================================

/**
 * Result type for BGG fetch operations
 */
export interface BGGFetchResult {
  game: BGGRawGame | null
  status: 'found' | 'pending' | 'error'
  message?: string
}

/**
 * Fetch a single game by BGG ID
 * Uses Puffin cache exclusively - no direct BGG access
 * If game not in Puffin, it's queued for fetching and status='pending' is returned
 */
export async function fetchBGGGame(bggId: number): Promise<BGGRawGame | null> {
  if (!shouldUsePuffin()) {
    console.warn('Puffin is not enabled or unhealthy - cannot fetch BGG data')
    return null
  }

  return fetchFromPuffin(bggId)
}

/**
 * Fetch a single game with detailed status information
 * Returns status indicating whether game was found, is pending, or errored
 */
export async function fetchBGGGameWithStatus(bggId: number): Promise<BGGFetchResult> {
  if (!shouldUsePuffin()) {
    return {
      game: null,
      status: 'error',
      message: 'Puffin service is not available. Please try again later.'
    }
  }

  const game = await fetchFromPuffin(bggId)

  if (game) {
    return { game, status: 'found' }
  }

  // Game was not in Puffin - it has been queued automatically by fetchFromPuffin
  return {
    game: null,
    status: 'pending',
    message: `Game ${bggId} is not yet cached. It has been queued and should be available within 30 seconds.`
  }
}

/**
 * Fetch multiple games by BGG IDs
 * Uses Puffin cache exclusively - no direct BGG access
 * Missing games are automatically queued in Puffin for future requests
 */
export async function fetchBGGGames(bggIds: number[]): Promise<Map<number, BGGRawGame>> {
  const results = new Map<number, BGGRawGame>()

  if (bggIds.length === 0) return results

  if (!shouldUsePuffin()) {
    console.warn('Puffin is not enabled or unhealthy - cannot fetch BGG data')
    return results
  }

  const puffinResults = await fetchFromPuffinBatch(bggIds)

  for (const [id, game] of puffinResults) {
    results.set(id, game)
  }

  // Missing IDs have been automatically queued by fetchFromPuffinBatch
  return results
}

/**
 * Batch fetch with detailed status for each game
 */
export interface BGGBatchFetchResult {
  found: Map<number, BGGRawGame>
  pending: number[]
  errors: number[]
}

export async function fetchBGGGamesWithStatus(bggIds: number[]): Promise<BGGBatchFetchResult> {
  const result: BGGBatchFetchResult = {
    found: new Map(),
    pending: [],
    errors: []
  }

  if (bggIds.length === 0) return result

  if (!shouldUsePuffin()) {
    // All games error when Puffin is unavailable
    result.errors = [...bggIds]
    return result
  }

  const puffinResults = await fetchFromPuffinBatch(bggIds)

  for (const id of bggIds) {
    const game = puffinResults.get(id)
    if (game) {
      result.found.set(id, game)
    } else {
      // Game was queued by fetchFromPuffinBatch
      result.pending.push(id)
    }
  }

  return result
}

/**
 * Fetch multiple games directly from BGG by IDs (internal)
 * BGG allows up to 20 IDs per request
 */
async function fetchBGGGamesDirect(bggIds: number[]): Promise<Map<number, BGGRawGame>> {
  const results = new Map<number, BGGRawGame>()

  // BGG allows batching up to 20 IDs
  const BATCH_SIZE = 20

  for (let i = 0; i < bggIds.length; i += BATCH_SIZE) {
    const batch = bggIds.slice(i, i + BATCH_SIZE)
    await waitForRateLimit()

    const url = `${BGG_API_BASE}/thing?id=${batch.join(',')}&stats=1`

    try {
      const response = await fetch(url, { headers: getBGGHeaders() })

      if (!response.ok) {
        console.error(`BGG API error: ${response.status}`)
        continue
      }

      const xml = await response.text()
      const result = await parseStringPromise(xml)

      const items = result.items?.item || []

      for (const item of items) {
        const game = await parseBGGItem(item)
        if (game) {
          results.set(game.id, game)
        }
      }

    } catch (error) {
      console.error(`Error fetching BGG batch:`, error)
    }
  }

  return results
}

/**
 * Parse a single BGG item from XML (helper for batch fetching)
 */
async function parseBGGItem(item: Record<string, unknown>): Promise<BGGRawGame | null> {
  try {
    const type = (item.$ as { type: string }).type

    const names = (item.name as Array<{ $: { type: string; value: string } }>) || []
    const primaryName = names.find(n => n.$.type === 'primary')
    const altNames = names
      .filter(n => n.$.type === 'alternate')
      .map(n => n.$.value)

    const stats = (item.statistics as Array<{ ratings: Array<Record<string, unknown>> }>)?.[0]?.ratings?.[0]
    const ranks = (stats?.ranks as Array<{ rank: Array<{ $: { name: string; value: string } }> }>)?.[0]?.rank || []
    const overallRank = ranks.find(r => r.$.name === 'boardgame')

    const links = item.link as Array<{ $: { type: string; id: string; value: string; inbound?: string } }>
    const expandsLinks = parseLinkWithId(links, 'boardgameexpansion')
    const expandsGame = type === 'boardgameexpansion' && expandsLinks.length > 0
      ? expandsLinks[0]
      : null
    const expansions = type === 'boardgame'
      ? parseLinkWithId(links, 'boardgameexpansion')
      : []

    // Parse implementation links
    const implLinks = parseLinkWithInbound(links, 'boardgameimplementation')
    const implementsGame = implLinks.find(link => !link.inbound)
      ? { id: implLinks.find(link => !link.inbound)!.id, name: implLinks.find(link => !link.inbound)!.name }
      : null
    const implementations = implLinks
      .filter(link => link.inbound)
      .map(({ id, name }) => ({ id, name }))

    return {
      id: parseInt((item.$ as { id: string }).id, 10),
      type,
      name: primaryName?.$.value || 'Unknown',
      alternateNames: altNames,
      yearPublished: extractNumber(item.yearpublished) || null,
      description: extractValue(item.description),
      thumbnail: extractValue(item.thumbnail) || null,
      image: extractValue(item.image) || null,
      minPlayers: extractNumber(item.minplayers, 1),
      maxPlayers: extractNumber(item.maxplayers, 1),
      playingTime: extractNumber(item.playingtime, 30),
      minPlayTime: extractNumber(item.minplaytime, 30),
      maxPlayTime: extractNumber(item.maxplaytime, 60),
      minAge: extractNumber(item.minage, 8),
      weight: extractNumber((stats as Record<string, unknown>)?.averageweight, 2.5),
      rating: extractNumber((stats as Record<string, unknown>)?.average, 0),
      numRatings: extractNumber((stats as Record<string, unknown>)?.usersrated, 0),
      rank: overallRank ? parseInt(overallRank.$.value, 10) || null : null,
      designers: parseLinks(links, 'boardgamedesigner'),
      artists: parseLinks(links, 'boardgameartist'),
      publishers: parseLinks(links, 'boardgamepublisher'),
      categories: parseLinks(links, 'boardgamecategory'),
      mechanics: parseLinks(links, 'boardgamemechanic'),
      categoryLinks: parseLinkWithId(links, 'boardgamecategory'),
      mechanicLinks: parseLinkWithId(links, 'boardgamemechanic'),
      families: parseLinkWithId(links, 'boardgamefamily'),
      expansions,
      expandsGame,
      implementations,
      implementsGame,
    }
  } catch (error) {
    console.error('Error parsing BGG item:', error)
    return null
  }
}

/**
 * Search for games on BGG by name
 */
export async function searchBGGGames(
  query: string,
  exact: boolean = false
): Promise<Array<{ id: number; name: string; yearPublished: number | null }>> {
  await waitForRateLimit()

  const url = `${BGG_API_BASE}/search?query=${encodeURIComponent(query)}&type=boardgame${exact ? '&exact=1' : ''}`

  try {
    const response = await fetch(url, { headers: getBGGHeaders() })

    if (!response.ok) {
      console.error(`BGG search error: ${response.status}`)
      return []
    }

    const xml = await response.text()
    const result = await parseStringPromise(xml)

    const items = result.items?.item || []

    return items.map((item: Record<string, unknown>) => ({
      id: parseInt((item.$ as { id: string }).id, 10),
      name: extractAttr(item.name, 'value'),
      yearPublished: extractNumber(item.yearpublished) || null,
    }))

  } catch (error) {
    console.error('Error searching BGG:', error)
    return []
  }
}
