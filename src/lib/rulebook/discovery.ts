/**
 * Rulebook Discovery
 * Semi-automated discovery of publisher rulebook PDFs
 *
 * This module checks common publisher URL patterns to find official rulebooks.
 * It does NOT scrape content - it only checks if PDFs exist at known patterns.
 */

import type { PublisherPattern, RulebookDiscoveryResult } from './types'

// Common rulebook URL patterns relative to publisher websites
const COMMON_RULEBOOK_PATHS = [
  '/games/{slug}/rules/',
  '/games/{slug}/rulebook.pdf',
  '/games/{slug}/rules.pdf',
  '/games/{slug}/{slug}-rulebook.pdf',
  '/games/{slug}/{slug}-rules.pdf',
  '/support/{slug}/',
  '/support/{slug}/rulebook.pdf',
  '/downloads/{slug}.pdf',
  '/downloads/{slug}-rulebook.pdf',
  '/rules/{slug}.pdf',
  '/rulebooks/{slug}.pdf',
  '/files/{slug}-rulebook.pdf',
  '/pdf/{slug}.pdf',
  '/pdf/{slug}-rules.pdf',
  '/{slug}/rules/',
  '/{slug}/rulebook.pdf',
]

/**
 * Known publisher rulebook URL patterns
 * These are manually verified patterns for major publishers
 */
export const PUBLISHER_PATTERNS: PublisherPattern[] = [
  {
    publisherName: 'Stonemaier Games',
    urlPattern: 'https://stonemaiergames.com/games/{game}/rules/',
    patternType: 'direct',
    resourcePageUrl: 'https://stonemaiergames.com/games/',
    isVerified: true,
  },
  {
    publisherName: 'Leder Games',
    urlPattern: 'https://ledergames.com',
    patternType: 'resource_page',
    resourcePageUrl: 'https://ledergames.com/pages/resources',
    isVerified: true,
  },
  {
    publisherName: 'CMON',
    urlPattern: 'https://cmon-files.s3.amazonaws.com/pdf/{game}.pdf',
    patternType: 'direct',
    isVerified: true,
  },
  {
    publisherName: 'Fantasy Flight Games',
    urlPattern: 'https://images-cdn.fantasyflightgames.com/filer_public/',
    patternType: 'search',
    resourcePageUrl: 'https://www.fantasyflightgames.com/en/products/',
    isVerified: true,
  },
  {
    publisherName: 'Czech Games Edition',
    urlPattern: 'https://czechgames.com',
    patternType: 'resource_page',
    resourcePageUrl: 'https://czechgames.com/en/home/',
    isVerified: true,
  },
  {
    publisherName: 'Rio Grande Games',
    urlPattern: 'https://www.riograndegames.com',
    patternType: 'resource_page',
    resourcePageUrl: 'https://riograndegames.com/game-support/',
    isVerified: false,
  },
  {
    publisherName: 'Z-Man Games',
    urlPattern: 'https://www.zmangames.com',
    patternType: 'search',
    isVerified: false,
  },
  {
    publisherName: 'Pandasaurus Games',
    urlPattern: 'https://pandasaurusgames.com',
    patternType: 'search',
    isVerified: false,
  },
  {
    publisherName: 'Restoration Games',
    urlPattern: 'https://restorationgames.com',
    patternType: 'search',
    isVerified: false,
  },
  {
    publisherName: 'Chip Theory Games',
    urlPattern: 'https://chiptheorygames.com',
    patternType: 'search',
    isVerified: false,
  },
  {
    publisherName: 'Asmodee Digital',
    urlPattern: 'https://www.asmodee.com',
    patternType: 'search',
    isVerified: false,
  },
  {
    publisherName: 'Days of Wonder',
    urlPattern: 'https://www.daysofwonder.com',
    patternType: 'search',
    resourcePageUrl: 'https://www.daysofwonder.com/en/support/',
    isVerified: false,
  },
]

/**
 * Common game slug variations to try
 */
function generateSlugVariations(gameName: string): string[] {
  const base = gameName
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const variations = [
    base,
    base.replace(/-/g, '_'),
    base.replace(/-/g, ''),
    gameName.toLowerCase().replace(/\s+/g, ''),
    gameName.toLowerCase().replace(/\s+/g, '-'),
  ]

  // Add version without common suffixes
  const suffixes = ['-board-game', '-game', '-the-board-game', '-card-game']
  for (const suffix of suffixes) {
    if (base.endsWith(suffix)) {
      variations.push(base.slice(0, -suffix.length))
    }
  }

  return [...new Set(variations)]
}

/**
 * Check if a URL returns a valid PDF
 */
async function checkPdfExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Boardmello Rulebook Discovery (https://boardmello.com)',
      },
    })

    if (!response.ok) return false

    const contentType = response.headers.get('content-type')
    return contentType?.includes('pdf') ?? false
  } catch {
    return false
  }
}

/**
 * Extract base URL from a website URL
 */
function getBaseUrl(websiteUrl: string): string {
  try {
    const url = new URL(websiteUrl)
    return `${url.protocol}//${url.host}`
  } catch {
    return websiteUrl.replace(/\/$/, '')
  }
}

/**
 * Discover rulebook from publisher's website URL
 * Tries common patterns on the publisher's domain
 */
export async function discoverFromPublisherWebsite(
  gameName: string,
  publisherWebsite: string
): Promise<RulebookDiscoveryResult> {
  const baseUrl = getBaseUrl(publisherWebsite)
  const slugVariations = generateSlugVariations(gameName)

  // Try each common path pattern with each slug variation
  for (const pathPattern of COMMON_RULEBOOK_PATHS) {
    for (const slug of slugVariations) {
      const path = pathPattern.replace(/{slug}/g, slug)
      const fullUrl = `${baseUrl}${path}`

      if (await checkPdfExists(fullUrl)) {
        return {
          found: true,
          url: fullUrl,
          source: 'publisher_website',
          confidence: 'high',
          notes: `Found at publisher website: ${baseUrl}`,
        }
      }
    }
  }

  // Not found via patterns, return suggestion to check manually
  return {
    found: false,
    source: 'publisher_website',
    confidence: 'low',
    notes: `No rulebook found at ${baseUrl}. Check their website manually.`,
  }
}

/**
 * Try to discover rulebook URL for a game
 */
export async function discoverRulebookUrl(
  gameName: string,
  publisherName?: string,
  publisherWebsite?: string
): Promise<RulebookDiscoveryResult> {
  const slugVariations = generateSlugVariations(gameName)

  // Priority 1: If we have the publisher's website URL, try common patterns on their domain
  if (publisherWebsite) {
    const websiteResult = await discoverFromPublisherWebsite(gameName, publisherWebsite)
    if (websiteResult.found) {
      return websiteResult
    }
  }

  // Priority 2: If we know the publisher name, try their known patterns
  if (publisherName) {
    const publisherPatterns = PUBLISHER_PATTERNS.filter(p =>
      p.publisherName.toLowerCase().includes(publisherName.toLowerCase()) ||
      publisherName.toLowerCase().includes(p.publisherName.toLowerCase())
    )

    for (const pattern of publisherPatterns) {
      if (pattern.patternType === 'direct') {
        for (const slug of slugVariations) {
          const url = pattern.urlPattern.replace('{game}', slug)
          if (await checkPdfExists(url)) {
            return {
              found: true,
              url,
              source: 'publisher_website',
              confidence: pattern.isVerified ? 'high' : 'medium',
              notes: `Found via ${pattern.publisherName} pattern`,
            }
          }
        }
      } else if (pattern.patternType === 'resource_page' && pattern.resourcePageUrl) {
        // For resource pages, we return the page URL for manual verification
        return {
          found: false,
          source: 'publisher_website',
          confidence: 'low',
          notes: `Check resource page: ${pattern.resourcePageUrl}`,
        }
      }
    }
  }

  // Priority 3: Try common direct URL patterns (generic)
  const directPatterns = [
    'https://stonemaiergames.com/games/{game}/rules/{game}-rulebook.pdf',
    'https://cmon-files.s3.amazonaws.com/pdf/{game}.pdf',
    'https://cmon-files.s3.amazonaws.com/pdf/{game}-rulebook.pdf',
  ]

  for (const pattern of directPatterns) {
    for (const slug of slugVariations) {
      const url = pattern.replace(/{game}/g, slug)
      if (await checkPdfExists(url)) {
        return {
          found: true,
          url,
          source: 'publisher_website',
          confidence: 'medium',
          notes: 'Found via common URL pattern',
        }
      }
    }
  }

  return {
    found: false,
    confidence: 'low',
    notes: 'No rulebook found via automated discovery. Manual entry required.',
  }
}

/**
 * Search the web for a game's rulebook
 * This is a fallback when pattern matching fails
 */
export async function searchForRulebook(
  gameName: string,
  publisherName?: string
): Promise<RulebookDiscoveryResult> {
  // Construct search query
  const query = publisherName
    ? `"${gameName}" "${publisherName}" official rulebook PDF filetype:pdf`
    : `"${gameName}" board game official rulebook PDF filetype:pdf`

  // Note: This function returns the search query for the frontend to use
  // The actual web search should be done client-side or via a search API
  // We return a structured result indicating web search is needed

  return {
    found: false,
    confidence: 'low',
    notes: `Web search suggested. Try: ${query}`,
  }
}

/**
 * Full discovery with all methods including web search fallback
 */
export async function discoverRulebookWithFallback(
  gameName: string,
  publisherName?: string,
  publisherWebsite?: string,
  enableWebSearch: boolean = false
): Promise<RulebookDiscoveryResult & { searchQuery?: string }> {
  // First try standard discovery
  const result = await discoverRulebookUrl(gameName, publisherName, publisherWebsite)

  if (result.found) {
    return result
  }

  // If web search is enabled and nothing found, return search suggestions
  if (enableWebSearch) {
    const searchQuery = publisherName
      ? `"${gameName}" "${publisherName}" official rulebook PDF`
      : `"${gameName}" board game official rulebook PDF`

    return {
      ...result,
      searchQuery,
      notes: `No pattern match found. Web search query: ${searchQuery}`,
    }
  }

  return result
}

/**
 * Get resource page URL for a publisher
 * Returns URL where rulebooks might be found for manual discovery
 */
export function getPublisherResourcePage(publisherName: string): string | null {
  const pattern = PUBLISHER_PATTERNS.find(p =>
    p.publisherName.toLowerCase().includes(publisherName.toLowerCase()) ||
    publisherName.toLowerCase().includes(p.publisherName.toLowerCase())
  )

  return pattern?.resourcePageUrl ?? null
}

/**
 * Get all publisher patterns (for admin UI)
 */
export function getPublisherPatterns(): PublisherPattern[] {
  return PUBLISHER_PATTERNS
}

/**
 * Validate that a URL is a valid rulebook PDF
 * - Checks URL responds with PDF content type
 * - Checks reasonable file size (> 100KB, < 50MB)
 */
export async function validateRulebookUrl(url: string): Promise<{
  valid: boolean
  error?: string
  contentLength?: number
}> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Boardmello Rulebook Validator (https://boardmello.com)',
      },
    })

    if (!response.ok) {
      return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('pdf')) {
      return { valid: false, error: `Not a PDF: ${contentType}` }
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10)

    if (contentLength > 0 && contentLength < 100_000) {
      return { valid: false, error: 'File too small to be a rulebook' }
    }

    if (contentLength > 50_000_000) {
      return { valid: false, error: 'File too large (>50MB)' }
    }

    return { valid: true, contentLength }
  } catch (error) {
    return { valid: false, error: `Failed to fetch: ${error}` }
  }
}
