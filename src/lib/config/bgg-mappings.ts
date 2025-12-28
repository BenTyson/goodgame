/**
 * BGG (BoardGameGeek) Mapping Configuration
 *
 * Maps BGG categories to our internal category slugs.
 * Edit this file to adjust how BGG imports map to your categories.
 */

/**
 * Map BGG category names to our internal category slugs.
 * When importing from BGG, these mappings determine which category a game is assigned to.
 *
 * Key: BGG category name (exact match)
 * Value: Our internal category slug
 */
export const BGG_CATEGORY_MAP: Record<string, string> = {
  // Strategy games
  'Abstract Strategy': 'strategy',
  'Economic': 'strategy',
  'City Building': 'strategy',
  'Territory Building': 'strategy',

  // Family games
  'Family Game': 'family-games',
  "Children's Game": 'family-games',

  // Party games
  'Party Game': 'party-games',

  // Thematic games
  'Adventure': 'thematic',
  'Horror': 'thematic',
  'Fantasy': 'thematic',
  'Science Fiction': 'thematic',
  'Exploration': 'thematic',

  // Card games
  'Card Game': 'card-games',
  'Collectible Components': 'card-games',

  // Cooperative games
  'Cooperative': 'cooperative',
  'Solo / Solitaire Game': 'cooperative',

  // Word/Trivia games
  'Word Game': 'word-games',
  'Trivia': 'word-games',
  'Deduction': 'word-games',

  // Dice games
  'Dice': 'dice-games',
} as const

/**
 * Type for our category slugs
 */
export type CategorySlug = (typeof BGG_CATEGORY_MAP)[keyof typeof BGG_CATEGORY_MAP]

/**
 * Get our category slug for a BGG category name
 */
export function getBGGCategorySlug(bggCategory: string): string | undefined {
  return BGG_CATEGORY_MAP[bggCategory]
}

/**
 * Check if a BGG category has a mapping
 */
export function hasBGGCategoryMapping(bggCategory: string): boolean {
  return bggCategory in BGG_CATEGORY_MAP
}
