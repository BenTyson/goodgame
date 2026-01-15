/**
 * Wikimedia Commons API Client
 *
 * Direct search and retrieval of CC-licensed images from Wikimedia Commons.
 * This supplements the Wikipedia integration by searching Commons directly,
 * finding images that may not be linked in Wikipedia articles or Wikidata.
 *
 * Endpoint: https://commons.wikimedia.org/w/api.php
 * Documentation: https://www.mediawiki.org/wiki/API:Main_page
 */

import type {
  CommonsQueryResponse,
  CommonsImage,
  CommonsSearchResult,
  CommonsSearchOptions,
  CommonsImageInfo,
  CommonsExtMetadata,
} from './types'

// =====================================================
// Constants
// =====================================================

const COMMONS_API_BASE = 'https://commons.wikimedia.org/w/api.php'
const USER_AGENT =
  'Boardmello/1.0 (https://boardmello.com; contact@boardmello.com)'

// Rate limiting: Be respectful to Wikimedia servers
const REQUEST_DELAY_MS = 1000 // 1 second between requests
let lastRequestTime = 0

// Default patterns to exclude (icons, logos, etc.)
const DEFAULT_EXCLUDE_PATTERNS = [
  'icon',
  'logo',
  'symbol',
  'flag of',
  'commons-logo',
  'wiki',
  'pictogram',
  'stub',
  'disambig',
  'ambox',
  'padlock',
  'edit-clear',
  'question_book',
  'nuvola',
  'gnome-',
  'gtk-',
  'emblem-',
  'button',
  'arrow',
  'portal',
]

// Patterns that suggest a primary/cover image
const PRIMARY_IMAGE_PATTERNS = [
  'box',
  'cover',
  'packaging',
  'game_box',
  'board_game',
  'boardgame',
  'edition',
  'components',
  'board',
]

// =====================================================
// Rate-Limited Fetch
// =====================================================

/**
 * Rate-limited fetch with proper headers for Wikimedia API
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

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Commons API request failed: ${response.status} ${response.statusText}`
    )
  }

  return response
}

// =====================================================
// URL Builder
// =====================================================

/**
 * Build Commons API URL with query parameters
 */
function buildCommonsUrl(params: Record<string, string>): string {
  const searchParams = new URLSearchParams({
    format: 'json',
    origin: '*', // Enable CORS
    ...params,
  })
  return `${COMMONS_API_BASE}?${searchParams.toString()}`
}

// =====================================================
// Search Functions
// =====================================================

/**
 * Search Commons for images by game name
 *
 * @param gameName - Name of the board game
 * @param options - Search options
 * @returns Search results with processed images
 */
export async function searchCommonsImages(
  gameName: string,
  options: CommonsSearchOptions = {}
): Promise<CommonsSearchResult> {
  const {
    limit = 10,
    thumbWidth = 400,
    excludePatterns = DEFAULT_EXCLUDE_PATTERNS,
    requireCC = false,
  } = options

  // Build search query - include "board game" for better results
  const searchQuery = `${gameName} board game`

  console.log(`[Commons] Searching for: "${searchQuery}"`)

  // Step 1: Search for file names
  const searchUrl = buildCommonsUrl({
    action: 'query',
    list: 'search',
    srsearch: searchQuery,
    srnamespace: '6', // File namespace
    srlimit: String(limit * 2), // Get extra to filter
    srinfo: 'totalhits',
  })

  const searchResponse = await rateLimitedFetch(searchUrl)
  const searchData: CommonsQueryResponse = await searchResponse.json()

  const searchHits = searchData.query?.search || []
  const totalHits = searchHits.length

  if (searchHits.length === 0) {
    console.log(`[Commons] No results found for: "${gameName}"`)
    return {
      images: [],
      totalHits: 0,
      hasMore: false,
      query: searchQuery,
    }
  }

  // Filter out unwanted images
  const filteredTitles = searchHits
    .map((hit) => hit.title)
    .filter((title) => !shouldExcludeImage(title, excludePatterns))
    .slice(0, limit + 2) // Get a few extra in case some fail

  if (filteredTitles.length === 0) {
    console.log(`[Commons] All results filtered out for: "${gameName}"`)
    return {
      images: [],
      totalHits,
      hasMore: false,
      query: searchQuery,
    }
  }

  // Step 2: Get detailed image info
  const images = await getImageDetails(filteredTitles, thumbWidth)

  // Filter by license if required
  const finalImages = requireCC
    ? images.filter((img) => isCCLicense(img.license))
    : images

  // Mark primary image
  markPrimaryImage(finalImages, gameName)

  console.log(
    `[Commons] Found ${finalImages.length} images for: "${gameName}"`
  )

  return {
    images: finalImages.slice(0, limit),
    totalHits,
    hasMore: totalHits > limit,
    query: searchQuery,
  }
}

/**
 * Search Commons by category
 *
 * @param categoryName - Category name (without "Category:" prefix)
 * @param options - Search options
 * @returns Search results with processed images
 */
export async function searchCommonsByCategory(
  categoryName: string,
  options: CommonsSearchOptions = {}
): Promise<CommonsSearchResult> {
  const {
    limit = 10,
    thumbWidth = 400,
    excludePatterns = DEFAULT_EXCLUDE_PATTERNS,
  } = options

  console.log(`[Commons] Searching category: "${categoryName}"`)

  // Get category members (files)
  const categoryUrl = buildCommonsUrl({
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Category:${categoryName}`,
    cmtype: 'file',
    cmlimit: String(limit * 2),
  })

  const categoryResponse = await rateLimitedFetch(categoryUrl)
  const categoryData: CommonsQueryResponse = await categoryResponse.json()

  // Note: categorymembers is on a different query path
  const members =
    (categoryData.query as unknown as { categorymembers?: { title: string }[] })
      ?.categorymembers || []
  const titles = members
    .map((m) => m.title)
    .filter((title) => !shouldExcludeImage(title, excludePatterns))

  if (titles.length === 0) {
    return {
      images: [],
      totalHits: 0,
      hasMore: false,
      query: categoryName,
    }
  }

  const images = await getImageDetails(titles.slice(0, limit + 2), thumbWidth)
  markPrimaryImage(images, categoryName)

  return {
    images: images.slice(0, limit),
    totalHits: members.length,
    hasMore: members.length > limit,
    query: categoryName,
  }
}

// =====================================================
// Image Details
// =====================================================

/**
 * Get detailed image info for a list of file titles
 */
async function getImageDetails(
  titles: string[],
  thumbWidth: number
): Promise<CommonsImage[]> {
  if (titles.length === 0) return []

  const infoUrl = buildCommonsUrl({
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo|categories',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: String(thumbWidth),
    cllimit: '10',
  })

  const infoResponse = await rateLimitedFetch(infoUrl)
  const infoData: CommonsQueryResponse = await infoResponse.json()

  const pages = infoData.query?.pages
  if (!pages) return []

  const images: CommonsImage[] = []

  for (const pageId of Object.keys(pages)) {
    const page = pages[pageId]
    if (page.missing || !page.imageinfo?.[0]) continue

    const info = page.imageinfo[0]
    const meta = info.extmetadata || {}

    images.push(processImageInfo(page.title, info, meta, page.categories))
  }

  return images
}

/**
 * Get info for a single image by filename
 */
export async function getCommonsImageInfo(
  filename: string,
  thumbWidth: number = 400
): Promise<CommonsImage | null> {
  const images = await getImageDetails([filename], thumbWidth)
  return images[0] || null
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Process raw image info into clean CommonsImage
 */
function processImageInfo(
  title: string,
  info: CommonsImageInfo,
  meta: CommonsExtMetadata,
  categories?: { title: string }[]
): CommonsImage {
  return {
    filename: title,
    url: info.url,
    thumbUrl: info.thumburl || info.url,
    width: info.width,
    height: info.height,
    size: info.size,
    mime: info.mime,
    license: meta.LicenseShortName?.value || meta.License?.value || 'Unknown',
    licenseUrl: meta.LicenseUrl?.value,
    author: cleanHtml(meta.Artist?.value),
    credit: cleanHtml(meta.Credit?.value),
    description: cleanHtml(meta.ImageDescription?.value),
    categories: categories?.map((c) => c.title.replace('Category:', '')),
    commonsUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
  }
}

/**
 * Check if filename should be excluded
 */
function shouldExcludeImage(
  filename: string,
  excludePatterns: string[]
): boolean {
  const lower = filename.toLowerCase()

  // Exclude SVGs (usually icons)
  if (lower.endsWith('.svg')) return true

  // Check exclude patterns
  for (const pattern of excludePatterns) {
    if (lower.includes(pattern.toLowerCase())) {
      return true
    }
  }

  return false
}

/**
 * Check if license is Creative Commons
 */
function isCCLicense(license: string): boolean {
  const lower = license.toLowerCase()
  return (
    lower.includes('cc') ||
    lower.includes('creative commons') ||
    lower.includes('public domain') ||
    lower.includes('pd') ||
    lower === 'cc0'
  )
}

/**
 * Mark the most likely primary/cover image
 */
function markPrimaryImage(images: CommonsImage[], gameName: string): void {
  if (images.length === 0) return

  // Try to find a primary image based on filename patterns
  let primaryIndex = -1
  let bestScore = 0

  const gameNameLower = gameName.toLowerCase()

  for (let i = 0; i < images.length; i++) {
    const filename = images[i].filename.toLowerCase()
    let score = 0

    // Check for primary patterns
    for (const pattern of PRIMARY_IMAGE_PATTERNS) {
      if (filename.includes(pattern)) {
        score += 2
      }
    }

    // Bonus if filename contains game name
    if (filename.includes(gameNameLower.replace(/\s+/g, '_'))) {
      score += 3
    }
    if (filename.includes(gameNameLower.replace(/\s+/g, '-'))) {
      score += 3
    }

    // Prefer larger images (likely box art)
    if (images[i].width >= 500 && images[i].height >= 500) {
      score += 1
    }

    // Prefer JPG/PNG over other formats
    if (filename.endsWith('.jpg') || filename.endsWith('.png')) {
      score += 1
    }

    if (score > bestScore) {
      bestScore = score
      primaryIndex = i
    }
  }

  // Mark the best candidate (or first if no patterns matched)
  const indexToMark = primaryIndex >= 0 ? primaryIndex : 0
  images[indexToMark].isPrimary = true
}

/**
 * Clean HTML from string
 */
function cleanHtml(html?: string): string | undefined {
  if (!html) return undefined
  return html
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500) // Limit length
}

// =====================================================
// Convenience Functions
// =====================================================

/**
 * Quick search for board game images with sensible defaults
 */
export async function quickSearchBoardGameImages(
  gameName: string,
  limit: number = 8
): Promise<CommonsImage[]> {
  const result = await searchCommonsImages(gameName, {
    limit,
    thumbWidth: 400,
    requireCC: false, // Include all, let admin decide
  })
  return result.images
}

/**
 * Build a direct link to Commons search page (for manual exploration)
 */
export function getCommonsSearchUrl(gameName: string): string {
  const query = encodeURIComponent(`${gameName} board game`)
  return `https://commons.wikimedia.org/w/index.php?search=${query}&title=Special:MediaSearch&go=Go&type=image`
}
