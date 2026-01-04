/**
 * Wikipedia Article Search
 *
 * Multi-stage search to find Wikipedia articles for board games.
 * Uses fallback strategies to maximize match rate while avoiding false positives.
 */

import {
  openSearch,
  fullTextSearch,
  buildWikipediaUrl,
  extractTitleFromUrl,
} from './client'
import {
  validateArticleMatch,
  isLikelyBoardGameTitle,
} from './validation'
import type { WikipediaSearchResult } from './types'

// =====================================================
// Search Strategies
// =====================================================

/**
 * Search for a Wikipedia article about a board game
 * Uses multi-stage fallback strategy:
 *
 * 1. Use existing Wikipedia URL from Wikidata if available
 * 2. Try opensearch with exact game name
 * 3. Try opensearch with "(board game)" suffix
 * 4. Try opensearch with "(game)" suffix
 * 5. Fallback to full-text search with "board game" context
 *
 * Each result is validated to ensure it's actually about the right game.
 *
 * @param gameName - Name of the board game
 * @param yearPublished - Year the game was published (optional, for validation)
 * @param designers - List of designer names (optional, for validation)
 * @param existingUrl - Wikipedia URL from Wikidata (optional, skip search if provided)
 * @returns Search result with URL and confidence, or null if not found
 */
export async function searchWikipediaArticle(
  gameName: string,
  yearPublished?: number,
  designers?: string[],
  existingUrl?: string
): Promise<WikipediaSearchResult | null> {
  // Strategy 1: Use existing URL from Wikidata
  if (existingUrl) {
    const title = extractTitleFromUrl(existingUrl)
    if (title) {
      console.log(`  [Wikipedia] Using existing URL for "${gameName}": ${existingUrl}`)
      const validation = await validateArticleMatch(title, gameName, yearPublished, designers)

      if (validation.isMatch) {
        return {
          title,
          url: existingUrl,
          snippet: '',
          confidence: validation.confidence,
        }
      } else {
        console.log(`  [Wikipedia] Existing URL failed validation: ${validation.reasons.join(', ')}`)
        // Continue to search in case the Wikidata link is wrong
      }
    }
  }

  // Strategy 2: Exact name match via opensearch
  const exactResult = await tryOpenSearch(gameName, gameName, yearPublished, designers)
  if (exactResult) {
    console.log(`  [Wikipedia] Found via exact match: ${exactResult.url}`)
    return exactResult
  }

  // Strategy 3: Try with "(board game)" suffix
  const boardGameResult = await tryOpenSearch(
    `${gameName} (board game)`,
    gameName,
    yearPublished,
    designers
  )
  if (boardGameResult) {
    console.log(`  [Wikipedia] Found via "(board game)" suffix: ${boardGameResult.url}`)
    return boardGameResult
  }

  // Strategy 4: Try with "(game)" suffix
  const gameResult = await tryOpenSearch(
    `${gameName} (game)`,
    gameName,
    yearPublished,
    designers
  )
  if (gameResult) {
    console.log(`  [Wikipedia] Found via "(game)" suffix: ${gameResult.url}`)
    return gameResult
  }

  // Strategy 5: Try with "(card game)" for card games
  const cardGameResult = await tryOpenSearch(
    `${gameName} (card game)`,
    gameName,
    yearPublished,
    designers
  )
  if (cardGameResult) {
    console.log(`  [Wikipedia] Found via "(card game)" suffix: ${cardGameResult.url}`)
    return cardGameResult
  }

  // Strategy 6: Full-text search with context
  const searchResult = await tryFullTextSearch(gameName, yearPublished, designers)
  if (searchResult) {
    console.log(`  [Wikipedia] Found via full-text search: ${searchResult.url}`)
    return searchResult
  }

  console.log(`  [Wikipedia] No article found for: ${gameName}`)
  return null
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Try opensearch with validation
 */
async function tryOpenSearch(
  query: string,
  gameName: string,
  yearPublished?: number,
  designers?: string[]
): Promise<WikipediaSearchResult | null> {
  try {
    const [, titles, descriptions, urls] = await openSearch(query, 5)

    if (!titles || titles.length === 0) {
      return null
    }

    // Try each result until we find a valid match
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i]
      const url = urls[i]
      const snippet = descriptions[i] || ''

      // Quick filter on title
      if (!isLikelyBoardGameTitle(title)) {
        continue
      }

      // Full validation
      const validation = await validateArticleMatch(title, gameName, yearPublished, designers)

      if (validation.isMatch) {
        return {
          title,
          url,
          snippet,
          confidence: validation.confidence,
        }
      }
    }

    return null
  } catch (error) {
    console.warn(`[Wikipedia] OpenSearch failed for "${query}":`, error)
    return null
  }
}

/**
 * Try full-text search with validation
 */
async function tryFullTextSearch(
  gameName: string,
  yearPublished?: number,
  designers?: string[]
): Promise<WikipediaSearchResult | null> {
  try {
    // Add context to improve search relevance
    const query = `"${gameName}" board game`
    const response = await fullTextSearch(query, 10)

    const results = response.query?.search
    if (!results || results.length === 0) {
      return null
    }

    // Try each result until we find a valid match
    for (const result of results) {
      // Quick filter on title
      if (!isLikelyBoardGameTitle(result.title)) {
        continue
      }

      // Full validation
      const validation = await validateArticleMatch(
        result.title,
        gameName,
        yearPublished,
        designers
      )

      if (validation.isMatch) {
        return {
          title: result.title,
          url: buildWikipediaUrl(result.title),
          snippet: stripHtmlTags(result.snippet),
          confidence: validation.confidence,
        }
      }
    }

    return null
  } catch (error) {
    console.warn(`[Wikipedia] Full-text search failed for "${gameName}":`, error)
    return null
  }
}

/**
 * Strip HTML tags from search snippet
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<span class="searchmatch">/g, '')
    .replace(/<\/span>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

// =====================================================
// Batch Search
// =====================================================

/**
 * Search for multiple games in batch
 * Respects rate limiting automatically
 *
 * @param games - Array of game info objects
 * @returns Map of game names to search results
 */
export async function batchSearchWikipediaArticles(
  games: Array<{
    name: string
    yearPublished?: number
    designers?: string[]
    existingUrl?: string
  }>
): Promise<Map<string, WikipediaSearchResult | null>> {
  const results = new Map<string, WikipediaSearchResult | null>()

  for (const game of games) {
    const result = await searchWikipediaArticle(
      game.name,
      game.yearPublished,
      game.designers,
      game.existingUrl
    )
    results.set(game.name, result)
  }

  return results
}
