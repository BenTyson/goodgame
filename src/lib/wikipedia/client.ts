/**
 * Wikipedia MediaWiki API Client
 *
 * Rate-limited HTTP client for Wikipedia's MediaWiki API.
 * Follows Wikimedia's API etiquette with proper User-Agent and rate limiting.
 *
 * Endpoint: https://en.wikipedia.org/w/api.php
 * Documentation: https://www.mediawiki.org/wiki/API:Main_page
 */

import type {
  MediaWikiOpenSearchResponse,
  MediaWikiQueryResponse,
  MediaWikiParseResponse,
} from './types'

// =====================================================
// Constants
// =====================================================

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php'
const USER_AGENT =
  'BoardNomads/1.0 (https://boardnomads.com; contact@boardnomads.com)'

// Rate limiting: Be respectful to Wikipedia's servers
const REQUEST_DELAY_MS = 1000 // 1 second between requests
let lastRequestTime = 0

// =====================================================
// Rate-Limited Fetch
// =====================================================

/**
 * Rate-limited fetch with proper headers for Wikimedia API
 * Implements 1-second delay between requests
 */
async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < REQUEST_DELAY_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, REQUEST_DELAY_MS - timeSinceLastRequest)
    )
  }

  lastRequestTime = Date.now()

  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    Accept: 'application/json',
  }

  // Add authorization if token is configured
  if (process.env.WIKIMEDIA_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.WIKIMEDIA_ACCESS_TOKEN}`
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(
      `Wikipedia API request failed: ${response.status} ${response.statusText}`
    )
  }

  return response
}

// =====================================================
// URL Builder
// =====================================================

/**
 * Build MediaWiki API URL with query parameters
 */
export function buildApiUrl(params: Record<string, string>): string {
  const searchParams = new URLSearchParams({
    format: 'json',
    origin: '*', // Enable CORS
    ...params,
  })
  return `${WIKIPEDIA_API_BASE}?${searchParams.toString()}`
}

// =====================================================
// OpenSearch API
// =====================================================

/**
 * Search for Wikipedia articles by title prefix
 * Uses the OpenSearch API for fast prefix matching
 *
 * @param query - Search query (game name)
 * @param limit - Maximum number of results (default 5)
 * @returns Array of [query, titles[], descriptions[], urls[]]
 */
export async function openSearch(
  query: string,
  limit: number = 5
): Promise<MediaWikiOpenSearchResponse> {
  const url = buildApiUrl({
    action: 'opensearch',
    search: query,
    limit: String(limit),
    namespace: '0', // Main namespace only
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

// =====================================================
// Full-Text Search API
// =====================================================

/**
 * Full-text search across Wikipedia articles
 * Uses the Query API with list=search
 *
 * @param query - Search query
 * @param limit - Maximum results (default 10)
 * @returns Search results with snippets
 */
export async function fullTextSearch(
  query: string,
  limit: number = 10
): Promise<MediaWikiQueryResponse> {
  const url = buildApiUrl({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: String(limit),
    srnamespace: '0', // Main namespace only
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

// =====================================================
// Query API - Page Properties
// =====================================================

/**
 * Get page properties (disambiguation status, Wikibase item, etc.)
 *
 * @param title - Article title
 * @returns Query response with page properties
 */
export async function getPageProperties(
  title: string
): Promise<MediaWikiQueryResponse> {
  const url = buildApiUrl({
    action: 'query',
    titles: title,
    prop: 'pageprops',
    ppprop: 'disambiguation|wikibase_item',
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

// =====================================================
// Query API - Page Content
// =====================================================

/**
 * Get plain text extract of article content
 *
 * @param title - Article title
 * @returns Query response with extract
 */
export async function getPageExtract(
  title: string
): Promise<MediaWikiQueryResponse> {
  const url = buildApiUrl({
    action: 'query',
    titles: title,
    prop: 'extracts',
    explaintext: 'true',
    exsectionformat: 'plain',
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

// =====================================================
// Query API - Categories
// =====================================================

/**
 * Get categories for an article
 *
 * @param title - Article title
 * @param limit - Maximum categories (default 50)
 * @returns Query response with categories
 */
export async function getPageCategories(
  title: string,
  limit: number = 50
): Promise<MediaWikiQueryResponse> {
  const url = buildApiUrl({
    action: 'query',
    titles: title,
    prop: 'categories',
    cllimit: String(limit),
    clshow: '!hidden', // Exclude hidden categories
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

// =====================================================
// Query API - Links
// =====================================================

/**
 * Get internal links from an article
 *
 * @param title - Article title
 * @param limit - Maximum links (default 100)
 * @returns Query response with links
 */
export async function getPageLinks(
  title: string,
  limit: number = 100
): Promise<MediaWikiQueryResponse> {
  const url = buildApiUrl({
    action: 'query',
    titles: title,
    prop: 'links',
    pllimit: String(limit),
    plnamespace: '0', // Main namespace only
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

/**
 * Get external links from an article
 *
 * @param title - Article title
 * @param limit - Maximum links (default 50)
 * @returns Query response with external links
 */
export async function getExternalLinks(
  title: string,
  limit: number = 50
): Promise<MediaWikiQueryResponse> {
  const url = buildApiUrl({
    action: 'query',
    titles: title,
    prop: 'extlinks',
    ellimit: String(limit),
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

// =====================================================
// Query API - Images
// =====================================================

/**
 * Get images used in an article
 *
 * @param title - Article title
 * @param limit - Maximum images (default 20)
 * @returns Query response with image file names
 */
export async function getPageImages(
  title: string,
  limit: number = 20
): Promise<MediaWikiQueryResponse> {
  const url = buildApiUrl({
    action: 'query',
    titles: title,
    prop: 'images',
    imlimit: String(limit),
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

/**
 * Get image info (URL, dimensions, license) for specific image files
 *
 * @param filenames - Array of image filenames (e.g., ["File:Catan.jpg"])
 * @param thumbWidth - Thumbnail width (default 400)
 * @returns Query response with image info
 */
export async function getImageInfo(
  filenames: string[],
  thumbWidth: number = 400
): Promise<MediaWikiQueryResponse> {
  const url = buildApiUrl({
    action: 'query',
    titles: filenames.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: String(thumbWidth),
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

// =====================================================
// Parse API - Wikitext
// =====================================================

/**
 * Get raw wikitext for an article (for infobox parsing)
 *
 * @param title - Article title
 * @returns Parse response with wikitext
 */
export async function getPageWikitext(
  title: string
): Promise<MediaWikiParseResponse> {
  const url = buildApiUrl({
    action: 'parse',
    page: title,
    prop: 'wikitext',
    redirects: 'true', // Follow redirects to get actual content
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

// =====================================================
// Parse API - Sections
// =====================================================

/**
 * Get section list for an article
 *
 * @param title - Article title
 * @returns Parse response with sections
 */
export async function getPageSections(
  title: string
): Promise<MediaWikiParseResponse> {
  const url = buildApiUrl({
    action: 'parse',
    page: title,
    prop: 'sections',
    redirects: 'true', // Follow redirects to get actual content
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

/**
 * Get content of a specific section
 *
 * @param title - Article title
 * @param sectionIndex - Section index (from getPageSections)
 * @returns Parse response with section wikitext
 */
export async function getSectionWikitext(
  title: string,
  sectionIndex: number
): Promise<MediaWikiParseResponse> {
  const url = buildApiUrl({
    action: 'parse',
    page: title,
    prop: 'wikitext',
    section: String(sectionIndex),
    redirects: 'true', // Follow redirects to get actual content
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

/**
 * Get rendered HTML of a specific section
 *
 * @param title - Article title
 * @param sectionIndex - Section index
 * @returns Parse response with HTML text
 */
export async function getSectionHtml(
  title: string,
  sectionIndex: number
): Promise<MediaWikiParseResponse> {
  const url = buildApiUrl({
    action: 'parse',
    page: title,
    prop: 'text',
    section: String(sectionIndex),
    redirects: 'true', // Follow redirects to get actual content
  })

  const response = await rateLimitedFetch(url)
  return response.json()
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Extract article title from Wikipedia URL
 */
export function extractTitleFromUrl(wikipediaUrl: string): string | null {
  try {
    const url = new URL(wikipediaUrl)
    if (!url.hostname.endsWith('wikipedia.org')) {
      return null
    }
    const match = url.pathname.match(/\/wiki\/(.+)$/)
    if (!match) {
      return null
    }
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

/**
 * Build Wikipedia URL from article title
 */
export function buildWikipediaUrl(title: string): string {
  const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'))
  return `https://en.wikipedia.org/wiki/${encodedTitle}`
}

/**
 * Get first page from query response (utility helper)
 */
export function getFirstPage(
  response: MediaWikiQueryResponse
): MediaWikiQueryResponse['query']['pages'][string] | null {
  const pages = response.query?.pages
  if (!pages) return null

  const pageIds = Object.keys(pages)
  if (pageIds.length === 0) return null

  const page = pages[pageIds[0]]
  if (page.missing) return null

  return page
}
