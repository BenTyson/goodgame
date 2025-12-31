/**
 * BGG API Client
 *
 * Handles communication with BoardGameGeek's API.
 * Respects rate limits and implements polite fetching.
 */

import { config } from 'dotenv'
config({ path: '.env' })

const BGG_API_URL = 'https://boardgamegeek.com/xmlapi2'
const BGG_BASE_URL = 'https://boardgamegeek.com'

const BGG_API_TOKEN = process.env.BGG_API_TOKEN
if (!BGG_API_TOKEN) {
  console.warn('Warning: BGG_API_TOKEN not found in environment. API calls may fail.')
}

const HEADERS: Record<string, string> = {
  'User-Agent': 'BoardNomads/1.0 (https://boardnomads.com; Factual data extraction)',
  'Accept': 'text/xml, application/xml, text/html',
  ...(BGG_API_TOKEN ? { 'Authorization': `Bearer ${BGG_API_TOKEN}` } : {}),
}

// Rate limiting
const DEFAULT_DELAY_MS = 2000  // 2 seconds between requests

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch with retry logic for BGG's 202 "please wait" responses
 */
async function fetchWithRetry(
  url: string,
  maxRetries: number = 5,
  retryDelay: number = 3000
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, { headers: HEADERS })

    // BGG returns 202 when data is being prepared
    if (response.status === 202) {
      console.log(`  Received 202, waiting ${retryDelay}ms (attempt ${attempt}/${maxRetries})...`)
      await sleep(retryDelay)
      continue
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.text()
  }

  throw new Error(`Failed after ${maxRetries} retries`)
}

/**
 * Fetch game IDs from BGG browse page
 */
export async function fetchGameIdsFromBrowsePage(
  page: number,
  sortBy: 'rank' | 'numvoters' = 'rank'
): Promise<number[]> {
  const sort = sortBy === 'numvoters' ? '?sort=numvoters&sortdir=desc' : ''
  const url = `${BGG_BASE_URL}/browse/boardgame/page/${page}${sort}`

  const html = await fetchWithRetry(url)

  // Extract game IDs from /boardgame/ID/ pattern
  const pattern = /\/boardgame\/(\d+)/g
  const matches = [...html.matchAll(pattern)]
  const ids = [...new Set(matches.map(m => parseInt(m[1], 10)))]

  return ids
}

/**
 * Fetch top N game IDs by rating
 */
export async function fetchTopRatedGameIds(
  count: number = 500,
  delayMs: number = DEFAULT_DELAY_MS
): Promise<Set<number>> {
  const gameIds = new Set<number>()
  let page = 1

  console.log(`Fetching top ${count} rated games...`)

  while (gameIds.size < count) {
    console.log(`  Page ${page}... (${gameIds.size} IDs so far)`)

    try {
      const ids = await fetchGameIdsFromBrowsePage(page, 'rank')
      if (ids.length === 0) break

      ids.forEach(id => gameIds.add(id))
      page++

      if (gameIds.size < count) {
        await sleep(delayMs)
      }
    } catch (error) {
      console.error(`  Error on page ${page}:`, error)
      break
    }
  }

  // Limit to requested count
  const result = new Set([...gameIds].slice(0, count))
  console.log(`  Found ${result.size} top rated game IDs`)
  return result
}

/**
 * Fetch top N game IDs by number of ratings/reviews
 */
export async function fetchMostReviewedGameIds(
  count: number = 500,
  delayMs: number = DEFAULT_DELAY_MS
): Promise<Set<number>> {
  const gameIds = new Set<number>()
  let page = 1

  console.log(`Fetching top ${count} most reviewed games...`)

  while (gameIds.size < count) {
    console.log(`  Page ${page}... (${gameIds.size} IDs so far)`)

    try {
      const ids = await fetchGameIdsFromBrowsePage(page, 'numvoters')
      if (ids.length === 0) break

      ids.forEach(id => gameIds.add(id))
      page++

      if (gameIds.size < count) {
        await sleep(delayMs)
      }
    } catch (error) {
      console.error(`  Error on page ${page}:`, error)
      break
    }
  }

  const result = new Set([...gameIds].slice(0, count))
  console.log(`  Found ${result.size} most reviewed game IDs`)
  return result
}

/**
 * Fetch game details in batch from BGG XML API
 */
export async function fetchGameDetailsBatch(gameIds: number[]): Promise<string> {
  const idsStr = gameIds.join(',')
  const url = `${BGG_API_URL}/thing?id=${idsStr}&stats=1`

  return fetchWithRetry(url)
}

/**
 * Fetch rulebook hints from BGG files page
 * Returns only filenames (not URLs) for legal pattern matching
 */
export async function fetchRulebookHints(gameId: number): Promise<{
  filename: string
  language?: string
  type: 'rulebook' | 'faq' | 'reference' | 'other'
}[]> {
  const url = `${BGG_BASE_URL}/boardgame/${gameId}/files`

  try {
    const html = await fetchWithRetry(url, 3)

    const hints: { filename: string; language?: string; type: 'rulebook' | 'faq' | 'reference' | 'other' }[] = []

    // Look for file links - typically in format:
    // <a href="/filepage/...">filename.pdf</a>
    // We only extract the filename, not the BGG URL

    // Pattern to find PDF filenames in file listings
    const filenamePattern = />([\w\-_]+(?:rulebook|rules|regeln|manual|instructions)[\w\-_]*\.pdf)</gi
    const matches = [...html.matchAll(filenamePattern)]

    for (const match of matches) {
      const filename = match[1]

      // Determine language from filename
      let language: string | undefined
      if (/[-_](en|eng|english)/i.test(filename)) language = 'en'
      else if (/[-_](de|deu|german)/i.test(filename)) language = 'de'
      else if (/[-_](fr|fra|french)/i.test(filename)) language = 'fr'
      else if (/[-_](es|esp|spanish)/i.test(filename)) language = 'es'
      else if (/[-_](it|ita|italian)/i.test(filename)) language = 'it'

      // Determine type from filename
      let type: 'rulebook' | 'faq' | 'reference' | 'other' = 'rulebook'
      if (/faq|errata/i.test(filename)) type = 'faq'
      else if (/reference|summary|aid/i.test(filename)) type = 'reference'

      hints.push({ filename, language, type })
    }

    return hints
  } catch {
    // Files page might not exist or be accessible
    return []
  }
}

/**
 * Fetch publisher details to get website URL
 */
export async function fetchPublisherDetails(bggId: number): Promise<{
  name: string
  website: string | null
} | null> {
  const url = `${BGG_API_URL}/thing?id=${bggId}&type=boardgamepublisher`

  try {
    const xml = await fetchWithRetry(url)

    // Extract name
    const nameMatch = xml.match(/<name[^>]*type="primary"[^>]*value="([^"]+)"/)
    const name = nameMatch ? nameMatch[1] : ''

    // Extract website
    const websiteMatch = xml.match(/<link[^>]*type="website"[^>]*value="([^"]+)"/)
    const website = websiteMatch ? websiteMatch[1] : null

    return { name, website }
  } catch {
    return null
  }
}

/**
 * Fetch designer details to get website URL
 */
export async function fetchDesignerDetails(bggId: number): Promise<{
  name: string
  website: string | null
} | null> {
  const url = `${BGG_API_URL}/thing?id=${bggId}&type=boardgamedesigner`

  try {
    const xml = await fetchWithRetry(url)

    const nameMatch = xml.match(/<name[^>]*type="primary"[^>]*value="([^"]+)"/)
    const name = nameMatch ? nameMatch[1] : ''

    const websiteMatch = xml.match(/<link[^>]*type="website"[^>]*value="([^"]+)"/)
    const website = websiteMatch ? websiteMatch[1] : null

    return { name, website }
  } catch {
    return null
  }
}
