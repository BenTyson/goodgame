/**
 * Wikipedia Category to Taxonomy Mapping
 *
 * Maps Wikipedia categories to our internal taxonomy system
 * (categories, mechanics, themes, player_experiences).
 */

import { getPageCategories, extractTitleFromUrl, getFirstPage } from './client'
import type { CategoryMapping } from './types'

// =====================================================
// Wikipedia Category Mappings
// =====================================================

/**
 * Static mappings from Wikipedia category patterns to our taxonomy
 * Format: { pattern: { type, slug } }
 * Patterns are matched against normalized category names (lowercase, no "Category:" prefix)
 */
const CATEGORY_MAPPINGS: Record<
  string,
  { type: 'category' | 'mechanic' | 'theme' | 'experience'; slug: string }
> = {
  // === MECHANICS ===
  'deck-building games': { type: 'mechanic', slug: 'deck-building' },
  'deck building games': { type: 'mechanic', slug: 'deck-building' },
  'worker placement games': { type: 'mechanic', slug: 'worker-placement' },
  'worker placement board games': { type: 'mechanic', slug: 'worker-placement' },
  'tile-laying games': { type: 'mechanic', slug: 'tile-placement' },
  'tile laying games': { type: 'mechanic', slug: 'tile-placement' },
  'tile-based games': { type: 'mechanic', slug: 'tile-placement' },
  'area control games': { type: 'mechanic', slug: 'area-control' },
  'area control board games': { type: 'mechanic', slug: 'area-control' },
  'set collection games': { type: 'mechanic', slug: 'set-collection' },
  'auction games': { type: 'mechanic', slug: 'auction' },
  'auction board games': { type: 'mechanic', slug: 'auction' },
  'roll-and-move games': { type: 'mechanic', slug: 'roll-and-move' },
  'roll and move board games': { type: 'mechanic', slug: 'roll-and-move' },
  'push-your-luck games': { type: 'mechanic', slug: 'push-your-luck' },
  'drafting games': { type: 'mechanic', slug: 'drafting' },
  'card drafting games': { type: 'mechanic', slug: 'drafting' },
  'engine building games': { type: 'mechanic', slug: 'engine-building' },
  'hand management games': { type: 'mechanic', slug: 'hand-management' },
  'resource management games': { type: 'mechanic', slug: 'resource-management' },
  'trading games': { type: 'mechanic', slug: 'trading' },
  'negotiation games': { type: 'mechanic', slug: 'negotiation' },
  'bluffing games': { type: 'mechanic', slug: 'bluffing' },
  'deduction games': { type: 'mechanic', slug: 'deduction' },
  'hidden movement games': { type: 'mechanic', slug: 'hidden-movement' },
  'hidden role games': { type: 'mechanic', slug: 'hidden-roles' },
  'programming games': { type: 'mechanic', slug: 'action-programming' },
  'action programming games': { type: 'mechanic', slug: 'action-programming' },
  'dice games': { type: 'mechanic', slug: 'dice-rolling' },
  'dice rolling games': { type: 'mechanic', slug: 'dice-rolling' },
  'pattern building games': { type: 'mechanic', slug: 'pattern-building' },
  'route building games': { type: 'mechanic', slug: 'route-building' },

  // === EXPERIENCES ===
  'cooperative board games': { type: 'experience', slug: 'cooperative' },
  'cooperative games': { type: 'experience', slug: 'cooperative' },
  'co-operative board games': { type: 'experience', slug: 'cooperative' },
  'party games': { type: 'experience', slug: 'party' },
  'party board games': { type: 'experience', slug: 'party' },
  'two-player games': { type: 'experience', slug: 'two-player' },
  'two player games': { type: 'experience', slug: 'two-player' },
  'solo games': { type: 'experience', slug: 'solo' },
  'solo board games': { type: 'experience', slug: 'solo' },
  'solitaire games': { type: 'experience', slug: 'solo' },
  'family games': { type: 'experience', slug: 'family' },
  'family board games': { type: 'experience', slug: 'family' },
  "children's games": { type: 'experience', slug: 'kids' },
  "children's board games": { type: 'experience', slug: 'kids' },
  'filler games': { type: 'experience', slug: 'filler' },
  'quick games': { type: 'experience', slug: 'filler' },
  'gateway games': { type: 'experience', slug: 'gateway' },

  // === THEMES ===
  'fantasy board games': { type: 'theme', slug: 'fantasy' },
  'fantasy games': { type: 'theme', slug: 'fantasy' },
  'science fiction board games': { type: 'theme', slug: 'science-fiction' },
  'sci-fi board games': { type: 'theme', slug: 'science-fiction' },
  'historical board games': { type: 'theme', slug: 'historical' },
  'history board games': { type: 'theme', slug: 'historical' },
  'medieval board games': { type: 'theme', slug: 'medieval' },
  'ancient history games': { type: 'theme', slug: 'ancient' },
  'horror board games': { type: 'theme', slug: 'horror' },
  'mystery games': { type: 'theme', slug: 'mystery' },
  'murder mystery games': { type: 'theme', slug: 'mystery' },
  'war games': { type: 'theme', slug: 'war' },
  'wargames': { type: 'theme', slug: 'war' },
  'war board games': { type: 'theme', slug: 'war' },
  'civilization games': { type: 'theme', slug: 'civilization' },
  'city-building games': { type: 'theme', slug: 'city-building' },
  'city building games': { type: 'theme', slug: 'city-building' },
  'economic simulation games': { type: 'theme', slug: 'economic' },
  'economic board games': { type: 'theme', slug: 'economic' },
  'train games': { type: 'theme', slug: 'trains' },
  'railroad games': { type: 'theme', slug: 'trains' },
  'railway games': { type: 'theme', slug: 'trains' },
  'space games': { type: 'theme', slug: 'space' },
  'space exploration games': { type: 'theme', slug: 'space' },
  'nautical games': { type: 'theme', slug: 'nautical' },
  'pirate games': { type: 'theme', slug: 'pirates' },
  'pirate board games': { type: 'theme', slug: 'pirates' },
  'zombie games': { type: 'theme', slug: 'zombies' },
  'zombie board games': { type: 'theme', slug: 'zombies' },
  'nature games': { type: 'theme', slug: 'nature' },
  'animal games': { type: 'theme', slug: 'animals' },
  'farming games': { type: 'theme', slug: 'farming' },
  'agriculture games': { type: 'theme', slug: 'farming' },

  // === CATEGORIES ===
  'strategy games': { type: 'category', slug: 'strategy' },
  'strategy board games': { type: 'category', slug: 'strategy' },
  'abstract strategy games': { type: 'category', slug: 'abstract' },
  'abstract board games': { type: 'category', slug: 'abstract' },
  'card games': { type: 'category', slug: 'card-game' },
  'traditional card games': { type: 'category', slug: 'card-game' },
  'trivia games': { type: 'category', slug: 'trivia' },
  'trivia board games': { type: 'category', slug: 'trivia' },
  'word games': { type: 'category', slug: 'word' },
  'word board games': { type: 'category', slug: 'word' },
  'puzzle games': { type: 'category', slug: 'puzzle' },
  'puzzle board games': { type: 'category', slug: 'puzzle' },
  'dexterity games': { type: 'category', slug: 'dexterity' },
  'dexterity board games': { type: 'category', slug: 'dexterity' },
  'race games': { type: 'category', slug: 'racing' },
  'racing games': { type: 'category', slug: 'racing' },
  'sports games': { type: 'category', slug: 'sports' },
  'sports board games': { type: 'category', slug: 'sports' },
  'educational board games': { type: 'category', slug: 'educational' },
  'educational games': { type: 'category', slug: 'educational' },
  'eurogames': { type: 'category', slug: 'euro' },
  'euro-style games': { type: 'category', slug: 'euro' },
  'ameritrash games': { type: 'category', slug: 'ameritrash' },
  'dungeon crawler games': { type: 'category', slug: 'dungeon-crawler' },
  'dungeon crawl games': { type: 'category', slug: 'dungeon-crawler' },
  'legacy games': { type: 'category', slug: 'legacy' },
  'legacy board games': { type: 'category', slug: 'legacy' },
  'campaign games': { type: 'category', slug: 'campaign' },
  'role-playing games': { type: 'category', slug: 'rpg' },
  'roleplaying games': { type: 'category', slug: 'rpg' },
  'miniature wargames': { type: 'category', slug: 'miniatures' },
  'miniatures games': { type: 'category', slug: 'miniatures' },
}

// =====================================================
// Category Extraction
// =====================================================

/**
 * Get Wikipedia categories for an article
 *
 * @param articleUrl - Wikipedia article URL
 * @returns Array of category names (without "Category:" prefix)
 */
export async function getArticleCategories(
  articleUrl: string
): Promise<string[]> {
  try {
    const title = extractTitleFromUrl(articleUrl)
    if (!title) {
      return []
    }

    const response = await getPageCategories(title, 100)
    const page = getFirstPage(response)

    if (!page || !page.categories) {
      return []
    }

    // Extract category names, removing "Category:" prefix
    return page.categories
      .map((c) => c.title.replace(/^Category:/, ''))
      .filter((c) => !isMetaCategory(c))
  } catch (error) {
    console.warn(`[Wikipedia] Failed to get categories:`, error)
    return []
  }
}

/**
 * Check if a category is a meta/maintenance category
 */
function isMetaCategory(category: string): boolean {
  const lower = category.toLowerCase()
  return (
    lower.includes('articles') ||
    lower.includes('wikipedia') ||
    lower.includes('pages') ||
    lower.includes('stubs') ||
    lower.includes('wikidata') ||
    lower.includes('cs1') ||
    lower.includes('webarchive') ||
    lower.includes('use dmy') ||
    lower.includes('use mdy') ||
    lower.includes('short description') ||
    lower.includes('infobox') ||
    lower.includes('all stub') ||
    lower.includes('cleanup') ||
    lower.includes('lacking') ||
    lower.includes('needing') ||
    lower.includes('disputed') ||
    lower.includes('accuracy') ||
    lower.includes('orphaned')
  )
}

// =====================================================
// Taxonomy Mapping
// =====================================================

/**
 * Map Wikipedia categories to our taxonomy
 *
 * @param categories - Array of Wikipedia category names
 * @returns Array of taxonomy mappings
 */
export function mapCategoriesToTaxonomy(
  categories: string[]
): CategoryMapping[] {
  const mappings: CategoryMapping[] = []
  const seenSlugs = new Set<string>()

  for (const category of categories) {
    const normalized = category.toLowerCase().trim()

    // Check for exact match
    if (CATEGORY_MAPPINGS[normalized]) {
      const mapping = CATEGORY_MAPPINGS[normalized]
      const key = `${mapping.type}:${mapping.slug}`
      if (!seenSlugs.has(key)) {
        mappings.push({
          wikipediaCategory: category,
          taxonomyType: mapping.type,
          taxonomySlug: mapping.slug,
          confidence: 'high',
        })
        seenSlugs.add(key)
      }
      continue
    }

    // Check for partial matches
    for (const [pattern, mapping] of Object.entries(CATEGORY_MAPPINGS)) {
      if (normalized.includes(pattern) || pattern.includes(normalized)) {
        const key = `${mapping.type}:${mapping.slug}`
        if (!seenSlugs.has(key)) {
          mappings.push({
            wikipediaCategory: category,
            taxonomyType: mapping.type,
            taxonomySlug: mapping.slug,
            confidence: 'medium',
          })
          seenSlugs.add(key)
        }
        break
      }
    }
  }

  return mappings
}

/**
 * Extract and map categories from a Wikipedia article
 *
 * @param articleUrl - Wikipedia article URL
 * @returns Object with raw categories and mappings
 */
export async function extractAndMapCategories(
  articleUrl: string
): Promise<{
  rawCategories: string[]
  mappings: CategoryMapping[]
}> {
  const rawCategories = await getArticleCategories(articleUrl)
  const mappings = mapCategoriesToTaxonomy(rawCategories)

  console.log(
    `  [Wikipedia] Found ${rawCategories.length} categories, mapped ${mappings.length} to taxonomy`
  )

  return {
    rawCategories,
    mappings,
  }
}

// =====================================================
// Batch Processing
// =====================================================

/**
 * Get taxonomy mappings for multiple articles
 *
 * @param articleUrls - Array of Wikipedia article URLs
 * @returns Map of URL to mappings
 */
export async function batchExtractCategories(
  articleUrls: string[]
): Promise<Map<string, CategoryMapping[]>> {
  const results = new Map<string, CategoryMapping[]>()

  for (const url of articleUrls) {
    const { mappings } = await extractAndMapCategories(url)
    results.set(url, mappings)
  }

  return results
}

/**
 * Get unique taxonomy items from all mappings
 *
 * @param mappings - Array of category mappings
 * @returns Grouped by taxonomy type
 */
export function groupMappingsByType(
  mappings: CategoryMapping[]
): Record<'category' | 'mechanic' | 'theme' | 'experience', string[]> {
  const result = {
    category: [] as string[],
    mechanic: [] as string[],
    theme: [] as string[],
    experience: [] as string[],
  }

  const seen = {
    category: new Set<string>(),
    mechanic: new Set<string>(),
    theme: new Set<string>(),
    experience: new Set<string>(),
  }

  for (const mapping of mappings) {
    if (!seen[mapping.taxonomyType].has(mapping.taxonomySlug)) {
      result[mapping.taxonomyType].push(mapping.taxonomySlug)
      seen[mapping.taxonomyType].add(mapping.taxonomySlug)
    }
  }

  return result
}
