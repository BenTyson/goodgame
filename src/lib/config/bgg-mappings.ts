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
  'Economic': 'economic',
  'City Building': 'strategy',
  'Territory Building': 'strategy',
  'Civilization': 'strategy',
  'Wargame': 'strategy',

  // Family games
  'Family Game': 'family',
  "Children's Game": 'family',

  // Party games
  'Party Game': 'party',
  'Humor': 'party',

  // Thematic games
  'Adventure': 'thematic',
  'Horror': 'thematic',
  'Fantasy': 'thematic',
  'Science Fiction': 'thematic',
  'Exploration': 'thematic',
  'Animals': 'thematic',
  'Environmental': 'thematic',
  'Zombies': 'thematic',
  'Pirates': 'thematic',
  'Mythology': 'thematic',
  'Medieval': 'thematic',

  // Cooperative games
  'Cooperative': 'cooperative',
  'Solo / Solitaire Game': 'cooperative',

  // Two-player games
  'Two-Player Only': 'two-player',

  // Abstract games
  'Abstract': 'abstract',
  'Puzzle': 'abstract',

  // Deck building
  'Card Game': 'deck-building',
  'Collectible Components': 'deck-building',

  // Campaign games
  'Campaign / Battle Card Driven': 'campaign',
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

/**
 * Map BGG categories to our internal theme slugs.
 * Many BGG "categories" are actually themes (settings/worlds/flavors).
 *
 * Key: BGG category name (exact match)
 * Value: Our internal theme slug
 */
export const BGG_THEME_MAP: Record<string, string> = {
  // Fantasy theme
  'Fantasy': 'fantasy',
  'Arabian': 'fantasy',

  // Sci-Fi theme
  'Science Fiction': 'sci-fi',
  'Space Exploration': 'sci-fi',

  // Historical theme
  'Ancient': 'historical',
  'Age of Reason': 'historical',
  'American Revolutionary War': 'historical',
  'American West': 'historical',
  'Civilization': 'historical',
  'Modern Warfare': 'historical',
  'Napoleonic': 'historical',
  'Political': 'historical',
  'Post-Napoleonic': 'historical',
  'Renaissance': 'historical',

  // Horror theme
  'Horror': 'horror',
  'Zombies': 'horror',
  'Mature / Adult': 'horror',

  // Nature theme
  'Animals': 'nature',
  'Farming': 'nature',
  'Environmental': 'nature',

  // Mystery theme
  'Deduction': 'mystery',
  'Murder/Mystery': 'mystery',
  'Spies/Secret Agents': 'mystery',

  // War/Conflict theme
  'Wargame': 'war',
  'Fighting': 'war',
  'Aviation / Flight': 'war',
  'American Civil War': 'war',
  'World War I': 'war',
  'World War II': 'war',
  'Vietnam War': 'war',
  'Korean War': 'war',

  // Economic theme
  'Economic': 'economic',
  'Industry / Manufacturing': 'economic',
  'Negotiation': 'economic',

  // Pirates/Nautical theme
  'Pirates': 'pirates',
  'Nautical': 'pirates',

  // Medieval theme
  'Medieval': 'medieval',
  'City Building': 'medieval',

  // Post-apocalyptic theme
  'Post-Apocalyptic': 'post-apocalyptic',

  // Abstract theme
  'Abstract Strategy': 'abstract',
  'Puzzle': 'abstract',

  // Humor theme
  'Humor': 'humor',
  'Party Game': 'humor',
  'Comic Book / Strip': 'humor',

  // Mythology theme
  'Mythology': 'mythology',
  'Greek Mythology': 'mythology',
  'Norse Mythology': 'mythology',
} as const

/**
 * Type for our theme slugs
 */
export type ThemeSlug = (typeof BGG_THEME_MAP)[keyof typeof BGG_THEME_MAP]

/**
 * Get our theme slug for a BGG category name
 */
export function getBGGThemeSlug(bggCategory: string): string | undefined {
  return BGG_THEME_MAP[bggCategory]
}

/**
 * Check if a BGG category maps to a theme
 */
export function hasBGGThemeMapping(bggCategory: string): boolean {
  return bggCategory in BGG_THEME_MAP
}

/**
 * Get all theme slugs for an array of BGG categories
 * Returns unique theme slugs (de-duplicated)
 */
export function getBGGThemeSlugs(bggCategories: string[]): string[] {
  const themes = new Set<string>()
  for (const cat of bggCategories) {
    const theme = getBGGThemeSlug(cat)
    if (theme) {
      themes.add(theme)
    }
  }
  return Array.from(themes)
}

/**
 * Map BGG categories/mechanics to player experience slugs.
 * Player experiences describe how players interact with the game.
 *
 * Key: BGG category or mechanic name (exact match)
 * Value: Our internal player experience slug
 */
export const BGG_EXPERIENCE_MAP: Record<string, string> = {
  // Competitive (default for most games, so keep minimal)
  'Racing': 'competitive',
  'Fighting': 'competitive',

  // Cooperative
  'Cooperative': 'cooperative',
  'Cooperative Game': 'cooperative',

  // Team-based
  'Team-Based Game': 'team-based',
  'Teams': 'team-based',

  // Solo-friendly
  'Solo / Solitaire Game': 'solo',

  // Social/Party
  'Party Game': 'social',
  'Humor': 'social',

  // Narrative/Story
  'Adventure': 'narrative',
  'Exploration': 'narrative',
  'Storytelling': 'narrative',

  // Asymmetric
  'Asymmetric': 'asymmetric',

  // Hidden roles
  'Bluffing': 'hidden-roles',
  'Deduction': 'hidden-roles',
  'Spies/Secret Agents': 'hidden-roles',
  'Traitor Game': 'hidden-roles',
} as const

/**
 * Type for player experience slugs
 */
export type ExperienceSlug = (typeof BGG_EXPERIENCE_MAP)[keyof typeof BGG_EXPERIENCE_MAP]

/**
 * Get player experience slug for a BGG category/mechanic name
 */
export function getBGGExperienceSlug(bggName: string): string | undefined {
  return BGG_EXPERIENCE_MAP[bggName]
}

/**
 * Check if a BGG category/mechanic maps to a player experience
 */
export function hasBGGExperienceMapping(bggName: string): boolean {
  return bggName in BGG_EXPERIENCE_MAP
}

/**
 * Get all player experience slugs for arrays of BGG categories and mechanics
 * Returns unique experience slugs (de-duplicated)
 */
export function getBGGExperienceSlugs(bggCategories: string[], bggMechanics: string[] = []): string[] {
  const experiences = new Set<string>()

  // Check categories
  for (const cat of bggCategories) {
    const exp = getBGGExperienceSlug(cat)
    if (exp) {
      experiences.add(exp)
    }
  }

  // Check mechanics
  for (const mech of bggMechanics) {
    const exp = getBGGExperienceSlug(mech)
    if (exp) {
      experiences.add(exp)
    }
  }

  return Array.from(experiences)
}
