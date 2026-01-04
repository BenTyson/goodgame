/**
 * Wikipedia Awards Extraction
 *
 * Parses structured award information from Wikipedia Reception sections.
 * Identifies major board game awards like Spiel des Jahres, Kennerspiel, etc.
 */

import type { WikipediaAward } from './types'

// =====================================================
// Award Extraction from Text
// =====================================================

/**
 * Extract structured awards from Wikipedia Reception/Awards text
 *
 * @param receptionText - Text from Reception or Awards section
 * @returns Array of parsed awards
 */
export function extractAwardsFromText(
  receptionText: string | null | undefined
): WikipediaAward[] {
  if (!receptionText) return []

  const awards: WikipediaAward[] = []
  const seenAwards = new Set<string>()

  // Pattern 1: "Award Name (Year) - Winner/Nominated"
  // Example: "Spiel des Jahres (2020) - Winner"
  const pattern1 = /\[\[([^\]]+)\]\]\s*\((\d{4})\)\s*[-–—:]\s*(winner|won|nominated|nominee|finalist|recommended)/gi
  let match

  while ((match = pattern1.exec(receptionText)) !== null) {
    const name = cleanAwardName(match[1])
    const year = parseInt(match[2], 10)
    const result = parseResult(match[3])
    const key = `${name}-${year}`

    if (!seenAwards.has(key)) {
      seenAwards.add(key)
      awards.push({ name, year, result })
    }
  }

  // Pattern 2: "won the Award Name in Year" or "nominated for Award Name in Year"
  const pattern2 = /(won|received|awarded|nominated for|finalist for)\s+(?:the\s+)?(?:\[\[)?([^\]]+?)(?:\]\])?\s+(?:award\s+)?(?:in\s+)?(\d{4})/gi

  while ((match = pattern2.exec(receptionText)) !== null) {
    const result = parseResult(match[1])
    const name = cleanAwardName(match[2])
    const year = parseInt(match[3], 10)
    const key = `${name}-${year}`

    if (!seenAwards.has(key) && isKnownAward(name)) {
      seenAwards.add(key)
      awards.push({ name, year, result })
    }
  }

  // Pattern 3: Year followed by award name
  // Example: "2020 Spiel des Jahres winner"
  const pattern3 = /(\d{4})\s+(?:\[\[)?([^\]]+?)(?:\]\])?\s+(winner|won|nominated|nominee|finalist|recommended)/gi

  while ((match = pattern3.exec(receptionText)) !== null) {
    const year = parseInt(match[1], 10)
    const name = cleanAwardName(match[2])
    const result = parseResult(match[3])
    const key = `${name}-${year}`

    if (!seenAwards.has(key) && isKnownAward(name)) {
      seenAwards.add(key)
      awards.push({ name, year, result })
    }
  }

  // Pattern 4: Just check for known award names with context
  for (const knownAward of KNOWN_AWARDS) {
    const awardPattern = new RegExp(
      `(?:\\[\\[)?${escapeRegExp(knownAward)}(?:\\]\\])?[^.]*?(\\d{4})?[^.]*?(winner|won|nominated|nominee|finalist|recommended)?`,
      'gi'
    )

    while ((match = awardPattern.exec(receptionText)) !== null) {
      const year = match[1] ? parseInt(match[1], 10) : undefined
      const result = match[2] ? parseResult(match[2]) : 'unknown'
      const key = `${knownAward}-${year || 'no-year'}`

      if (!seenAwards.has(key)) {
        seenAwards.add(key)
        awards.push({ name: knownAward, year, result })
      }
    }
  }

  // Sort by year (descending) then by name
  awards.sort((a, b) => {
    if (a.year && b.year) return b.year - a.year
    if (a.year) return -1
    if (b.year) return 1
    return a.name.localeCompare(b.name)
  })

  console.log(`  [Wikipedia] Extracted ${awards.length} awards`)
  return awards
}

// =====================================================
// Known Board Game Awards
// =====================================================

const KNOWN_AWARDS = [
  // German awards
  'Spiel des Jahres',
  'Kennerspiel des Jahres',
  'Kinderspiel des Jahres',
  'Deutscher Spiele Preis',
  'Essener Feder',

  // International
  'International Gamers Award',
  'Golden Geek Award',
  'Mensa Select',
  'Origins Award',
  'Diana Jones Award',

  // UK awards
  'UK Games Expo Award',

  // French awards
  'As d\'Or',
  'Jeu de l\'Année',

  // Dutch/Belgian
  'Nederlandse Spellenprijs',

  // US awards
  'Dice Tower Award',

  // Other notable
  'Fairplay Award',
  'Japan Boardgame Prize',
  'Guldbrikken',
  'Årets Spel',
  'Juego del Año',
  'Gioco dell\'Anno',
  'Hra roku',
  'Gra Roku',
]

// =====================================================
// Helper Functions
// =====================================================

/**
 * Clean award name from wikitext
 */
function cleanAwardName(name: string): string {
  return name
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$2$1') // Handle wiki links
    .replace(/\|[^|]+$/, '') // Remove trailing pipe content
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parse result string to enum value
 */
function parseResult(resultStr: string): WikipediaAward['result'] {
  const lower = resultStr.toLowerCase()

  if (lower.includes('winner') || lower.includes('won') || lower === 'awarded') {
    return 'winner'
  }
  if (lower.includes('nominated') || lower.includes('nominee')) {
    return 'nominated'
  }
  if (lower.includes('finalist')) {
    return 'finalist'
  }
  if (lower.includes('recommended')) {
    return 'recommended'
  }
  return 'unknown'
}

/**
 * Check if award name is a known board game award
 */
function isKnownAward(name: string): boolean {
  const lower = name.toLowerCase()
  return KNOWN_AWARDS.some((award) => lower.includes(award.toLowerCase()))
}

/**
 * Escape special regex characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Get awards by result type
 */
export function getWinningAwards(awards: WikipediaAward[]): WikipediaAward[] {
  return awards.filter((a) => a.result === 'winner')
}

/**
 * Get the most notable award (winner > nominated > finalist)
 */
export function getMostNotableAward(awards: WikipediaAward[]): WikipediaAward | null {
  const winner = awards.find((a) => a.result === 'winner')
  if (winner) return winner

  const nominated = awards.find((a) => a.result === 'nominated')
  if (nominated) return nominated

  const finalist = awards.find((a) => a.result === 'finalist')
  if (finalist) return finalist

  return awards[0] || null
}
