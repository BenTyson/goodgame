/**
 * BoardGameGeek API Client
 * Fetches game data from BGG's XML API v2
 * Rate limited to 1 request/second
 */

import { parseStringPromise } from 'xml2js'

// BGG API base URL
const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2'

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
  categories: string[]
  mechanics: string[]
  families: { id: number; name: string }[]
  expansions: { id: number; name: string }[]
  expandsGame: { id: number; name: string } | null // If this is an expansion
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
 * Fetch a single game from BGG by ID
 */
export async function fetchBGGGame(bggId: number): Promise<BGGRawGame | null> {
  await waitForRateLimit()

  const url = `${BGG_API_BASE}/thing?id=${bggId}&stats=1`

  try {
    const response = await fetch(url)

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
      families: parseLinkWithId(item.link, 'boardgamefamily'),
      expansions,
      expandsGame,
    }

    return game

  } catch (error) {
    console.error(`Error fetching BGG game ${bggId}:`, error)
    return null
  }
}

/**
 * Fetch multiple games from BGG by IDs
 * BGG allows up to 20 IDs per request
 */
export async function fetchBGGGames(bggIds: number[]): Promise<Map<number, BGGRawGame>> {
  const results = new Map<number, BGGRawGame>()

  // BGG allows batching up to 20 IDs
  const BATCH_SIZE = 20

  for (let i = 0; i < bggIds.length; i += BATCH_SIZE) {
    const batch = bggIds.slice(i, i + BATCH_SIZE)
    await waitForRateLimit()

    const url = `${BGG_API_BASE}/thing?id=${batch.join(',')}&stats=1`

    try {
      const response = await fetch(url)

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

    const links = item.link as Array<{ $: { type: string; id: string; value: string } }>
    const expandsLinks = parseLinkWithId(links, 'boardgameexpansion')
    const expandsGame = type === 'boardgameexpansion' && expandsLinks.length > 0
      ? expandsLinks[0]
      : null
    const expansions = type === 'boardgame'
      ? parseLinkWithId(links, 'boardgameexpansion')
      : []

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
      families: parseLinkWithId(links, 'boardgamefamily'),
      expansions,
      expandsGame,
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
    const response = await fetch(url)

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
