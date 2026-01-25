/**
 * Wikipedia Integration Utilities
 *
 * Comprehensive Wikipedia integration for board game enrichment.
 * Includes search, validation, infobox parsing, section extraction,
 * category mapping, and relation detection.
 */

import { generateJSON, type GenerationResult } from '@/lib/ai/claude'
import type { Json } from '@/types/supabase'

// =====================================================
// Re-exports from sub-modules
// =====================================================

// Types
export * from './types'

// Client utilities
export {
  buildApiUrl,
  openSearch,
  fullTextSearch,
  getPageProperties,
  getPageExtract,
  getPageCategories,
  getPageLinks,
  getExternalLinks,
  getPageImages,
  getImageInfo,
  getPageWikitext,
  getPageSections,
  getSectionWikitext,
  getSectionHtml,
  extractTitleFromUrl,
  buildWikipediaUrl,
  getFirstPage,
} from './client'

// Search
export { searchWikipediaArticle, batchSearchWikipediaArticles } from './search'

// Validation
export {
  isDisambiguationPage,
  validateArticleMatch,
  isLikelyBoardGameTitle,
} from './validation'

// Infobox parsing
export { extractInfobox, parseInfoboxWikitext, parseWikiLinks, parsePublishersWithRegion, getPrimaryPublisher } from './infobox'

// Section extraction
export {
  extractKnownSections,
  getArticleSections,
  analyzeSections,
} from './sections'

// Category mapping
export {
  getArticleCategories,
  mapCategoriesToTaxonomy,
  extractAndMapCategories,
  batchExtractCategories,
  groupMappingsByType,
} from './categories'

// Relation detection
export {
  extractInfoboxRelations,
  extractSeeAlsoRelations,
  extractArticleLinks,
  extractGameRelations,
  groupRelationsByType,
  getHighConfidenceRelations,
} from './relations'

// Image extraction
export {
  extractArticleImages,
  getPrimaryImage,
} from './images'

// External links extraction
export {
  extractExternalLinks,
  getLinksByType,
  getOfficialSiteLink,
  getRulebookLinks,
} from './external-links'

// Awards extraction
export {
  extractAwardsFromText,
  getWinningAwards,
  getMostNotableAward,
} from './awards'

// Family enrichment (Wikipedia → game_relations)
export {
  enrichFamilyFromWikipedia,
  linkGamesWithRelations,
  mapWikipediaTypeToRelation,
  fetchWikipediaArticleContent,
  matchGamesToDatabase,
  type WikipediaExtraction,
  type ExtractedGame,
  type MatchedGame,
  type FamilyEnrichmentResult,
} from './family-enrichment'

// =====================================================
// Legacy Types (kept for backwards compatibility)
// =====================================================

export interface WikipediaFetchResult {
  rawContent: string
  articleTitle: string
  wordCount: number
}

export interface WikipediaSummary {
  summary: string
  themes: string[]
  mechanics: string[]
  reception: string | null
  awards: string[]
}

export interface WikipediaSummaryResult {
  data: WikipediaSummary
  meta: Omit<GenerationResult, 'content'>
}

// =====================================================
// Constants
// =====================================================

const WIKIPEDIA_SUMMARY_PROMPT = `You are summarizing a Wikipedia article about a board game for use as context in content generation.

Extract and summarize the following information concisely:

1. SUMMARY (300-500 words): The game's theme, setting, core gameplay loop, and what makes it notable. Include information about the designer's intent if mentioned.

2. THEMES: List 3-5 thematic elements (e.g., "medieval trading", "space exploration", "cooperative survival")

3. MECHANICS: List any game mechanics mentioned (e.g., "deck building", "worker placement", "tile laying")

4. RECEPTION: One paragraph about critical reception if mentioned (awards, reviews, sales figures). Return null if not mentioned.

5. AWARDS: List any awards or nominations mentioned (e.g., "Spiel des Jahres 2020", "Kennerspiel nominee")

Return as JSON:
{
  "summary": "...",
  "themes": ["theme1", "theme2"],
  "mechanics": ["mechanic1", "mechanic2"],
  "reception": "..." or null,
  "awards": ["award1", "award2"]
}

Guidelines:
- Focus on information that would help write accurate rules summaries, setup guides, and quick references
- Do NOT include plot spoilers for narrative games
- If the game has expansions, briefly mention what they add
- Include designer philosophy or design goals if mentioned
- Be factual and accurate - don't embellish

Return ONLY valid JSON, no markdown or explanation.`

// =====================================================
// Functions
// =====================================================

/**
 * Validate Wikipedia URL format
 */
export function isValidWikipediaUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname.endsWith('wikipedia.org') &&
      parsed.pathname.startsWith('/wiki/')
    )
  } catch {
    return false
  }
}

/**
 * Extract article title from Wikipedia URL
 */
export function extractArticleTitle(wikipediaUrl: string): string {
  const urlMatch = wikipediaUrl.match(/\/wiki\/(.+)$/)
  if (!urlMatch) {
    throw new Error('Invalid Wikipedia URL format')
  }
  return decodeURIComponent(urlMatch[1])
}

/**
 * Fetch Wikipedia article content using the MediaWiki API
 */
export async function fetchWikipediaContent(
  wikipediaUrl: string
): Promise<WikipediaFetchResult> {
  const articleTitle = extractArticleTitle(wikipediaUrl)

  // Use MediaWiki API to get article content as plain text
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=extracts&explaintext=true&format=json&origin=*`

  const response = await fetch(apiUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch Wikipedia article: ${response.status}`)
  }

  const data = await response.json()
  const pages = data.query?.pages
  if (!pages) {
    throw new Error('No pages found in Wikipedia response')
  }

  // Get the first (and should be only) page
  const pageId = Object.keys(pages)[0]
  const page = pages[pageId]

  if (page.missing !== undefined) {
    throw new Error(`Wikipedia article not found: ${articleTitle}`)
  }

  // Clean the extract content
  let rawContent = page.extract || ''
  // Decode HTML entities for brackets
  rawContent = rawContent.replace(/&#91;/g, '[').replace(/&#93;/g, ']')
  // Remove [edit] links and citation markers
  rawContent = rawContent.replace(/\[\s*edit\s*\]/gi, '')
  rawContent = rawContent.replace(/\[\s*\d+\s*\]/g, '')
  rawContent = rawContent.replace(/\[\s*citation needed\s*\]/gi, '')
  // Normalize whitespace
  rawContent = rawContent.replace(/\n{3,}/g, '\n\n').trim()

  const wordCount = rawContent.split(/\s+/).filter(Boolean).length

  return {
    rawContent,
    articleTitle,
    wordCount,
  }
}

/**
 * Summarize Wikipedia content for board game context using AI
 * Uses Claude Haiku for cost-effective processing
 */
export async function summarizeWikipediaContent(
  rawContent: string,
  gameName: string
): Promise<WikipediaSummaryResult> {
  // Truncate content if too long (keep first ~12000 chars for context)
  const truncatedContent =
    rawContent.length > 12000
      ? rawContent.slice(0, 12000) + '\n\n[Content truncated...]'
      : rawContent

  const userPrompt = `Wikipedia article for the board game "${gameName}":\n\n${truncatedContent}`

  const result = await generateJSON<WikipediaSummary>(
    WIKIPEDIA_SUMMARY_PROMPT,
    userPrompt,
    {
      temperature: 0.3, // Low temperature for factual extraction
      // Uses default Haiku model
    }
  )

  return result
}

/**
 * Format Wikipedia summary for display or inclusion in prompts
 */
export function formatSummaryForPrompt(summary: WikipediaSummary): string {
  const parts: string[] = []

  parts.push(summary.summary)

  if (summary.themes.length > 0) {
    parts.push(`Themes: ${summary.themes.join(', ')}`)
  }

  if (summary.mechanics.length > 0) {
    parts.push(`Mechanics: ${summary.mechanics.join(', ')}`)
  }

  if (summary.reception) {
    parts.push(`Reception: ${summary.reception}`)
  }

  if (summary.awards.length > 0) {
    parts.push(`Awards: ${summary.awards.join(', ')}`)
  }

  return parts.join('\n\n')
}

// =====================================================
// Main Enrichment Function
// =====================================================

import { searchWikipediaArticle } from './search'
import { extractInfobox } from './infobox'
import { extractKnownSections } from './sections'
import { extractAndMapCategories } from './categories'
import { extractGameRelations } from './relations'
import { extractArticleImages } from './images'
import { extractExternalLinks } from './external-links'
import { extractAwardsFromText } from './awards'
import type { WikipediaEnrichmentResult, WikipediaInfobox, WikipediaSections, CategoryMapping, WikipediaRelation, WikipediaImage, WikipediaExternalLink, WikipediaAward } from './types'

/**
 * Full Wikipedia enrichment for a board game
 *
 * Orchestrates the complete enrichment pipeline:
 * 1. Search for Wikipedia article (or use existing URL from Wikidata)
 * 2. Extract structured infobox data
 * 3. Extract Origins/History and Reception sections
 * 4. Generate AI summary (themes, mechanics, reception, awards)
 * 5. Map Wikipedia categories to taxonomy
 * 6. Detect expansion/sequel relations
 *
 * This function is designed to be called during BGG import, after Wikidata enrichment.
 * It never throws errors - failures are logged and partial results returned.
 *
 * @param gameName - Name of the board game
 * @param yearPublished - Year the game was published (optional, for validation)
 * @param designers - List of designer names (optional, for validation)
 * @param existingWikipediaUrl - Wikipedia URL from Wikidata (optional, skips search if provided)
 * @returns Enrichment result with all extracted data
 */
export async function enrichGameFromWikipedia(
  gameName: string,
  yearPublished?: number,
  designers?: string[],
  existingWikipediaUrl?: string
): Promise<WikipediaEnrichmentResult> {
  const result: WikipediaEnrichmentResult = {
    found: false,
    url: null,
    articleTitle: null,
    infobox: null,
    sections: null,
    categories: [],
    relations: [],
    categoryMappings: [],
    searchConfidence: undefined,
    error: null,
    // New Tier 1 fields
    images: [],
    externalLinks: [],
    awards: [],
    gameplay: undefined,
  }

  try {
    console.log(`  [Wikipedia] Enriching: ${gameName}`)

    // Step 1: Search for article (or use existing URL)
    const searchResult = await searchWikipediaArticle(
      gameName,
      yearPublished,
      designers,
      existingWikipediaUrl
    )

    if (!searchResult) {
      console.log(`  [Wikipedia] No article found for: ${gameName}`)
      return result
    }

    result.found = true
    result.url = searchResult.url
    result.articleTitle = searchResult.title
    result.searchConfidence = searchResult.confidence

    // Step 2: Extract infobox (structured data)
    try {
      result.infobox = await extractInfobox(searchResult.url)
      if (result.infobox) {
        console.log(`  [Wikipedia] Extracted infobox data`)
      }
    } catch (error) {
      console.warn(`  [Wikipedia] Infobox extraction failed:`, error)
    }

    // Step 3: Extract known sections (Origins, Reception, Gameplay, and new sections)
    try {
      // Pass true to extract all sections for comprehensive storage
      result.sections = await extractKnownSections(searchResult.url, true)
      const sectionCount = Object.values(result.sections).filter(v => v && typeof v === 'string').length
      if (sectionCount > 0) {
        console.log(`  [Wikipedia] Extracted ${sectionCount} sections`)
      }

      // Copy new sections to top-level result for easier access
      if (result.sections.lead) result.lead = result.sections.lead
      if (result.sections.variants) result.variants = result.sections.variants
      if (result.sections.strategy) result.strategy = result.sections.strategy
      if (result.sections.components) result.components = result.sections.components
      if (result.sections.expansions) result.expansionsSection = result.sections.expansions
      if (result.sections.allSections) result.allSections = result.sections.allSections
    } catch (error) {
      console.warn(`  [Wikipedia] Section extraction failed:`, error)
    }

    // Step 3b: Fetch full article text for comprehensive context
    try {
      const fullTextResult = await fetchWikipediaContent(searchResult.url)
      result.fullText = fullTextResult.rawContent
      console.log(`  [Wikipedia] Fetched full text (${fullTextResult.wordCount} words)`)
    } catch (error) {
      console.warn(`  [Wikipedia] Full text fetch failed:`, error)
    }

    // Step 4: Generate AI summary (only if we have content to summarize)
    // Note: This reuses the existing summarizeWikipediaContent function
    // The summary gets stored separately via the existing API endpoint
    // Here we focus on structured extraction

    // Step 5: Extract and map categories
    try {
      const categoryResult = await extractAndMapCategories(searchResult.url)
      result.categories = categoryResult.rawCategories
      result.categoryMappings = categoryResult.mappings
    } catch (error) {
      console.warn(`  [Wikipedia] Category extraction failed:`, error)
    }

    // Step 6: Detect game relations
    try {
      result.relations = await extractGameRelations(searchResult.url, gameName)
    } catch (error) {
      console.warn(`  [Wikipedia] Relation extraction failed:`, error)
    }

    // =====================================================
    // New Tier 1 Extractions
    // =====================================================

    // Step 7: Extract article images
    try {
      result.images = await extractArticleImages(searchResult.url, 5)
    } catch (error) {
      console.warn(`  [Wikipedia] Image extraction failed:`, error)
    }

    // Step 8: Extract external links (rulebook, official site, etc.)
    try {
      result.externalLinks = await extractExternalLinks(searchResult.url)
    } catch (error) {
      console.warn(`  [Wikipedia] External links extraction failed:`, error)
    }

    // Step 9: Extract structured awards from Reception section
    try {
      result.awards = extractAwardsFromText(result.sections?.reception)
    } catch (error) {
      console.warn(`  [Wikipedia] Awards extraction failed:`, error)
    }

    // Step 10: Store Gameplay section for content generation
    if (result.sections?.gameplay) {
      result.gameplay = result.sections.gameplay
    }

    console.log(`  [Wikipedia] Enrichment complete for: ${gameName}`)
    return result
  } catch (error) {
    console.warn(`  [Wikipedia] Enrichment failed for ${gameName}:`, error)
    result.error = error instanceof Error ? error.message : 'Unknown error'
    return result
  }
}

/**
 * Store Wikipedia enrichment results in the database
 * Helper function for use in the BGG importer
 * Uses Json type for JSONB fields to match Supabase types
 */
export interface WikipediaStorageData {
  wikipedia_url?: string
  wikipedia_infobox?: Json
  wikipedia_summary?: Json
  wikipedia_origins?: string
  wikipedia_reception?: string
  wikipedia_fetched_at?: string
  wikipedia_search_confidence?: 'high' | 'medium' | 'low'
  // Tier 1 fields
  wikipedia_images?: Json
  wikipedia_external_links?: Json
  wikipedia_awards?: Json
  wikipedia_gameplay?: string
  // Enhanced storage fields (Phase 1)
  wikipedia_full_text?: string
  wikipedia_lead?: string
  wikipedia_variants?: string
  wikipedia_strategy?: string
  wikipedia_components?: string
  wikipedia_expansions_section?: string
  wikipedia_all_sections?: Json
}

export function prepareWikipediaStorageData(
  enrichmentResult: WikipediaEnrichmentResult,
  existingSummary?: WikipediaSummary
): WikipediaStorageData {
  const data: WikipediaStorageData = {}

  if (enrichmentResult.url) {
    data.wikipedia_url = enrichmentResult.url
  }

  if (enrichmentResult.infobox) {
    data.wikipedia_infobox = enrichmentResult.infobox as unknown as Json
  }

  if (existingSummary) {
    data.wikipedia_summary = existingSummary as unknown as Json
    data.wikipedia_fetched_at = new Date().toISOString()
  }

  if (enrichmentResult.sections?.origins) {
    data.wikipedia_origins = enrichmentResult.sections.origins
  }

  if (enrichmentResult.sections?.reception) {
    data.wikipedia_reception = enrichmentResult.sections.reception
  }

  if (enrichmentResult.searchConfidence) {
    data.wikipedia_search_confidence = enrichmentResult.searchConfidence
  }

  // Tier 1 fields
  if (enrichmentResult.images && enrichmentResult.images.length > 0) {
    data.wikipedia_images = enrichmentResult.images as unknown as Json
  }

  if (enrichmentResult.externalLinks && enrichmentResult.externalLinks.length > 0) {
    data.wikipedia_external_links = enrichmentResult.externalLinks as unknown as Json
  }

  if (enrichmentResult.awards && enrichmentResult.awards.length > 0) {
    data.wikipedia_awards = enrichmentResult.awards as unknown as Json
  }

  if (enrichmentResult.gameplay) {
    data.wikipedia_gameplay = enrichmentResult.gameplay
  }

  // Enhanced storage fields (Phase 1)
  if (enrichmentResult.fullText) {
    data.wikipedia_full_text = enrichmentResult.fullText
  }

  if (enrichmentResult.lead) {
    data.wikipedia_lead = enrichmentResult.lead
  }

  if (enrichmentResult.variants) {
    data.wikipedia_variants = enrichmentResult.variants
  }

  if (enrichmentResult.strategy) {
    data.wikipedia_strategy = enrichmentResult.strategy
  }

  if (enrichmentResult.components) {
    data.wikipedia_components = enrichmentResult.components
  }

  if (enrichmentResult.expansionsSection) {
    data.wikipedia_expansions_section = enrichmentResult.expansionsSection
  }

  if (enrichmentResult.allSections && Object.keys(enrichmentResult.allSections).length > 0) {
    data.wikipedia_all_sections = enrichmentResult.allSections as unknown as Json
  }

  return data
}
