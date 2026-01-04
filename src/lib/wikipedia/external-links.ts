/**
 * Wikipedia External Links Extraction
 *
 * Extracts and categorizes external links from Wikipedia articles.
 * Identifies official websites, rulebook PDFs, publisher sites, and more.
 */

import {
  getExternalLinks,
  extractTitleFromUrl,
  getFirstPage,
} from './client'
import type { WikipediaExternalLink } from './types'

// =====================================================
// External Link Extraction
// =====================================================

/**
 * Extract and categorize external links from a Wikipedia article
 *
 * @param articleUrl - Wikipedia article URL
 * @returns Array of categorized external links
 */
export async function extractExternalLinks(
  articleUrl: string
): Promise<WikipediaExternalLink[]> {
  const links: WikipediaExternalLink[] = []

  try {
    const title = extractTitleFromUrl(articleUrl)
    if (!title) return links

    const response = await getExternalLinks(title, 100)
    const page = getFirstPage(response)
    if (!page?.extlinks) return links

    const seenDomains = new Set<string>()

    for (const link of page.extlinks) {
      const url = link.url
      if (!url) continue

      // Skip non-http links
      if (!url.startsWith('http://') && !url.startsWith('https://')) continue

      const domain = extractDomain(url)
      if (!domain) continue

      // Skip Wikipedia/Wikimedia internal links
      if (isWikimediaLink(domain)) continue

      // Skip archived versions (prefer original)
      if (isArchiveLink(domain)) continue

      // Categorize the link
      const type = categorizeLink(url, domain)

      // For certain types, only keep one per domain
      if (type === 'store' || type === 'review') {
        if (seenDomains.has(domain)) continue
        seenDomains.add(domain)
      }

      links.push({
        url,
        type,
        domain,
      })
    }

    // Sort by type priority: official > rulebook > publisher > store > video > review > other
    links.sort((a, b) => {
      const priority = ['official', 'rulebook', 'publisher', 'store', 'video', 'review', 'other']
      return priority.indexOf(a.type) - priority.indexOf(b.type)
    })

    console.log(`  [Wikipedia] Extracted ${links.length} external links`)
    return links
  } catch (error) {
    console.warn(`[Wikipedia] External link extraction failed:`, error)
    return links
  }
}

// =====================================================
// Link Categorization
// =====================================================

/**
 * Categorize a link based on URL and domain
 */
function categorizeLink(
  url: string,
  domain: string
): WikipediaExternalLink['type'] {
  const lowerUrl = url.toLowerCase()
  const lowerDomain = domain.toLowerCase()

  // Rulebook detection (highest priority)
  if (isRulebookLink(lowerUrl, lowerDomain)) {
    return 'rulebook'
  }

  // Video content
  if (isVideoLink(lowerDomain)) {
    return 'video'
  }

  // Review sites
  if (isReviewLink(lowerDomain)) {
    return 'review'
  }

  // Store links
  if (isStoreLink(lowerDomain)) {
    return 'store'
  }

  // Publisher detection
  if (isPublisherLink(lowerDomain)) {
    return 'publisher'
  }

  // Official site detection (game-specific domains, product pages)
  if (isOfficialLink(lowerUrl, lowerDomain)) {
    return 'official'
  }

  return 'other'
}

/**
 * Check if URL is a rulebook/rules PDF
 */
function isRulebookLink(url: string, domain: string): boolean {
  // Direct PDF links
  if (url.endsWith('.pdf')) {
    return (
      url.includes('rule') ||
      url.includes('manual') ||
      url.includes('instruction') ||
      url.includes('how-to-play') ||
      url.includes('quickstart')
    )
  }

  // Rulebook page patterns
  const rulebookPatterns = [
    '/rules',
    '/rulebook',
    '/manual',
    '/instructions',
    '/how-to-play',
    '/learn-to-play',
    'support/rules',
    'downloads/rules',
  ]

  return rulebookPatterns.some((pattern) => url.includes(pattern))
}

/**
 * Check if domain is a video platform
 */
function isVideoLink(domain: string): boolean {
  const videoDomains = [
    'youtube.com',
    'youtu.be',
    'vimeo.com',
    'twitch.tv',
    'dailymotion.com',
  ]
  return videoDomains.some((d) => domain.includes(d))
}

/**
 * Check if domain is a review site
 */
function isReviewLink(domain: string): boolean {
  const reviewDomains = [
    'boardgamegeek.com',
    'dicetower.com',
    'shutupandsitdown.com',
    'arstechnica.com',
    'polygon.com',
    'kotaku.com',
    'ign.com',
    'gamespot.com',
    'theguardian.com',
    'nytimes.com',
    'wired.com',
    'slate.com',
    'metacritic.com',
  ]
  return reviewDomains.some((d) => domain.includes(d))
}

/**
 * Check if domain is a store
 */
function isStoreLink(domain: string): boolean {
  const storeDomains = [
    'amazon.',
    'target.com',
    'walmart.com',
    'barnesandnoble.com',
    'miniaturemarket.com',
    'coolstuffinc.com',
    'cardhaus.com',
    'gamenerdz.com',
    'boardlandia.com',
    'shop.',
    'store.',
  ]
  return storeDomains.some((d) => domain.includes(d))
}

/**
 * Check if domain is a known publisher
 */
function isPublisherLink(domain: string): boolean {
  const publisherDomains = [
    'zmangames.com',
    'fantasyflightgames.com',
    'catan.com',
    'catanstudio.com',
    'asmodee.com',
    'riograndegames.com',
    'czechgames.com',
    'stonemaiergames.com',
    'plaidhatgames.com',
    'renegadegamestudios.com',
    'ravensburger.com',
    'hasbro.com',
    'mattel.com',
    'dfrnt.com', // Game publishers often have product-specific domains
  ]
  return publisherDomains.some((d) => domain.includes(d))
}

/**
 * Check if URL appears to be an official game site
 */
function isOfficialLink(url: string, domain: string): boolean {
  // Product page patterns
  const officialPatterns = [
    '/products/',
    '/games/',
    '/game/',
    '/en/product',
    '/boardgame',
  ]

  if (officialPatterns.some((p) => url.includes(p))) {
    return true
  }

  // Single-game domains (e.g., catan.com, pandemicthegame.com)
  const gameSpecificDomains = [
    'catan.com',
    'tickettoride',
    'pandemic',
    'dominion',
    'wingspan',
    'scythe',
    'gloomhaven',
  ]

  return gameSpecificDomains.some((d) => domain.includes(d))
}

/**
 * Check if domain is Wikimedia
 */
function isWikimediaLink(domain: string): boolean {
  const wikimediaDomains = [
    'wikipedia.org',
    'wikimedia.org',
    'wikidata.org',
    'wikiquote.org',
    'wiktionary.org',
    'wikisource.org',
    'wikinews.org',
  ]
  return wikimediaDomains.some((d) => domain.includes(d))
}

/**
 * Check if domain is an archive service
 */
function isArchiveLink(domain: string): boolean {
  const archiveDomains = [
    'web.archive.org',
    'archive.org',
    'archive.is',
    'archive.today',
    'webcache.googleusercontent.com',
  ]
  return archiveDomains.some((d) => domain.includes(d))
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Get links of a specific type
 */
export function getLinksByType(
  links: WikipediaExternalLink[],
  type: WikipediaExternalLink['type']
): WikipediaExternalLink[] {
  return links.filter((link) => link.type === type)
}

/**
 * Get the first official or publisher link (best candidate for "official site")
 */
export function getOfficialSiteLink(
  links: WikipediaExternalLink[]
): WikipediaExternalLink | null {
  return (
    links.find((link) => link.type === 'official') ||
    links.find((link) => link.type === 'publisher') ||
    null
  )
}

/**
 * Get all rulebook links
 */
export function getRulebookLinks(
  links: WikipediaExternalLink[]
): WikipediaExternalLink[] {
  return links.filter((link) => link.type === 'rulebook')
}
