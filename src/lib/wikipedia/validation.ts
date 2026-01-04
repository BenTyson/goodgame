/**
 * Wikipedia Article Validation
 *
 * Validates that a Wikipedia article actually refers to the board game we're looking for.
 * Handles disambiguation pages and false positive matches.
 */

import { getPageProperties, getPageExtract, getFirstPage } from './client'
import type { ValidationResult } from './types'

// =====================================================
// Constants
// =====================================================

// Terms that indicate a board game article
const BOARD_GAME_INDICATORS = [
  'board game',
  'tabletop game',
  'card game',
  'dice game',
  'strategy game',
  'party game',
  'cooperative game',
  'deck-building',
  'deck building',
  'worker placement',
  'eurogame',
  'euro-game',
  'ameritrash',
]

// Generic game terms that add small confidence
const GAME_TERMS = [
  'player',
  'players',
  'dice',
  'cards',
  'tiles',
  'board',
  'token',
  'tokens',
  'miniatures',
  'pieces',
  'winner',
  'score',
  'scoring',
  'turn',
  'turns',
  'round',
  'rounds',
  'setup',
  'rules',
  'gameplay',
  'victory',
]

// Terms that suggest this is NOT a board game article
const NEGATIVE_INDICATORS = [
  'video game',
  'computer game',
  'mobile game',
  'console game',
  'television series',
  'tv series',
  'film',
  'movie',
  'novel',
  'book series',
  'album',
  'song',
  'band',
  'musician',
]

// =====================================================
// Disambiguation Detection
// =====================================================

/**
 * Check if a Wikipedia page is a disambiguation page
 *
 * @param title - Article title to check
 * @returns true if the page is a disambiguation page
 */
export async function isDisambiguationPage(title: string): Promise<boolean> {
  try {
    const response = await getPageProperties(title)
    const page = getFirstPage(response)

    if (!page) return false

    // Check for disambiguation property
    if (page.pageprops?.disambiguation !== undefined) {
      return true
    }

    // Also check title suffix as fallback
    if (title.toLowerCase().includes('(disambiguation)')) {
      return true
    }

    return false
  } catch (error) {
    console.warn(`[Wikipedia] Failed to check disambiguation for "${title}":`, error)
    return false
  }
}

// =====================================================
// Article Validation
// =====================================================

/**
 * Validate that a Wikipedia article matches the board game we're looking for
 * Uses multi-factor scoring to determine confidence
 *
 * Scoring system:
 * - Board game indicator terms: +30 points
 * - Year mentioned matches: +25 points
 * - Designer name mentioned: +20 points
 * - Generic game terms: +5 points each (max +25)
 * - Negative indicators: -40 points
 *
 * Threshold: 40 points = match
 *
 * @param articleTitle - Wikipedia article title
 * @param gameName - Name of the game we're looking for
 * @param yearPublished - Year the game was published (optional)
 * @param designers - List of designer names (optional)
 * @returns Validation result with confidence score
 */
export async function validateArticleMatch(
  articleTitle: string,
  gameName: string,
  yearPublished?: number,
  designers?: string[]
): Promise<ValidationResult> {
  const reasons: string[] = []
  let score = 0

  try {
    // First check if it's a disambiguation page
    const isDisambig = await isDisambiguationPage(articleTitle)
    if (isDisambig) {
      return {
        isMatch: false,
        confidence: 'low',
        isDisambiguation: true,
        score: 0,
        reasons: ['Article is a disambiguation page'],
      }
    }

    // Fetch article extract
    const extractResponse = await getPageExtract(articleTitle)
    const page = getFirstPage(extractResponse)

    if (!page || !page.extract) {
      return {
        isMatch: false,
        confidence: 'low',
        isDisambiguation: false,
        score: 0,
        reasons: ['Could not fetch article content'],
      }
    }

    const extract = page.extract
    const lowerExtract = extract.toLowerCase()

    // Check for negative indicators first (video game, movie, etc.)
    for (const negative of NEGATIVE_INDICATORS) {
      if (lowerExtract.includes(negative)) {
        // Check if it's specifically mentioned as different from board game
        const negativeContext = lowerExtract.indexOf(negative)
        const boardGameContext = lowerExtract.indexOf('board game')

        // If board game is mentioned before the negative, still might be valid
        if (boardGameContext === -1 || negativeContext < boardGameContext) {
          score -= 40
          reasons.push(`Contains negative indicator: "${negative}"`)
          break
        }
      }
    }

    // Check for board game indicators (+30)
    for (const indicator of BOARD_GAME_INDICATORS) {
      if (lowerExtract.includes(indicator)) {
        score += 30
        reasons.push(`Contains board game indicator: "${indicator}"`)
        break // Only count once
      }
    }

    // Check for year match (+25)
    if (yearPublished) {
      const yearRegex = new RegExp(`\\b${yearPublished}\\b`)
      if (yearRegex.test(extract)) {
        score += 25
        reasons.push(`Year ${yearPublished} mentioned in article`)
      }
    }

    // Check for designer names (+20)
    if (designers && designers.length > 0) {
      for (const designer of designers) {
        // Normalize designer name for matching
        const designerLower = designer.toLowerCase()
        if (lowerExtract.includes(designerLower)) {
          score += 20
          reasons.push(`Designer "${designer}" mentioned`)
          break // Only count once
        }

        // Try last name only for common patterns like "Klaus Teuber"
        const nameParts = designer.split(' ')
        if (nameParts.length > 1) {
          const lastName = nameParts[nameParts.length - 1].toLowerCase()
          if (lowerExtract.includes(lastName) && lastName.length > 3) {
            score += 15
            reasons.push(`Designer last name "${nameParts[nameParts.length - 1]}" likely mentioned`)
            break
          }
        }
      }
    }

    // Check for generic game terms (+5 each, max +25)
    let gameTermScore = 0
    const foundTerms: string[] = []
    for (const term of GAME_TERMS) {
      if (lowerExtract.includes(term) && gameTermScore < 25) {
        gameTermScore += 5
        foundTerms.push(term)
      }
    }
    if (gameTermScore > 0) {
      score += gameTermScore
      reasons.push(`Contains game terms: ${foundTerms.slice(0, 3).join(', ')}${foundTerms.length > 3 ? '...' : ''}`)
    }

    // Check title similarity with game name (+10 for exact, +5 for partial)
    const normalizedTitle = articleTitle.toLowerCase().replace(/_/g, ' ')
    const normalizedGameName = gameName.toLowerCase()

    if (normalizedTitle === normalizedGameName) {
      score += 10
      reasons.push('Title exactly matches game name')
    } else if (normalizedTitle.includes(normalizedGameName) || normalizedGameName.includes(normalizedTitle)) {
      score += 5
      reasons.push('Title partially matches game name')
    }

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low'
    if (score >= 70) {
      confidence = 'high'
    } else if (score >= 50) {
      confidence = 'medium'
    } else {
      confidence = 'low'
    }

    return {
      isMatch: score >= 40,
      confidence,
      isDisambiguation: false,
      score,
      reasons,
    }
  } catch (error) {
    console.warn(`[Wikipedia] Validation failed for "${articleTitle}":`, error)
    return {
      isMatch: false,
      confidence: 'low',
      isDisambiguation: false,
      score: 0,
      reasons: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    }
  }
}

// =====================================================
// Quick Validation
// =====================================================

/**
 * Quick check if an article title looks like a board game article
 * Useful for filtering search results before full validation
 *
 * @param title - Article title
 * @returns true if the title suggests a board game
 */
export function isLikelyBoardGameTitle(title: string): boolean {
  const lowerTitle = title.toLowerCase()

  // Positive patterns
  if (lowerTitle.includes('(board game)')) return true
  if (lowerTitle.includes('(card game)')) return true
  if (lowerTitle.includes('(game)')) return true
  if (lowerTitle.includes('(tabletop game)')) return true

  // Negative patterns (likely not what we want)
  if (lowerTitle.includes('(video game)')) return false
  if (lowerTitle.includes('(film)')) return false
  if (lowerTitle.includes('(movie)')) return false
  if (lowerTitle.includes('(tv series)')) return false
  if (lowerTitle.includes('(novel)')) return false
  if (lowerTitle.includes('(album)')) return false
  if (lowerTitle.includes('(band)')) return false
  if (lowerTitle.includes('(disambiguation)')) return false

  // No obvious pattern, could be either
  return true
}
