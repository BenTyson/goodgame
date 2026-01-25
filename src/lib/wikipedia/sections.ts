/**
 * Wikipedia Section Extraction
 *
 * Extracts specific sections from Wikipedia articles for targeted content.
 * Focuses on Origins/History and Reception sections that are gaps in our data.
 */

import {
  getPageSections,
  getSectionWikitext,
  extractTitleFromUrl,
} from './client'
import type { SectionInfo, WikipediaSections } from './types'

// =====================================================
// Section Name Patterns
// =====================================================

// Names that indicate Origins/History section
const ORIGINS_SECTION_NAMES = [
  'history',
  'origins',
  'development',
  'background',
  'design',
  'design and development',
  'creation',
  'conception',
  'genesis',
]

// Names that indicate Reception section
const RECEPTION_SECTION_NAMES = [
  'reception',
  'critical reception',
  'reviews',
  'awards',
  'awards and accolades',
  'accolades',
  'critical response',
  'popularity',
  'legacy',
  'impact',
]

// Names that indicate Gameplay section
const GAMEPLAY_SECTION_NAMES = [
  'gameplay',
  'rules',
  'game play',
  'how to play',
  'mechanics',
  'game mechanics',
  'playing the game',
]

// Names that indicate Expansions section
const EXPANSIONS_SECTION_NAMES = [
  'expansions',
  'expansion',
  'editions',
  'versions',
  'supplements',
  'extensions',
  'spin-offs',
  'spinoffs',
]

// Names that indicate Variants section (separate from expansions)
const VARIANTS_SECTION_NAMES = [
  'variants',
  'variant',
  'house rules',
  'alternative rules',
  'optional rules',
  'advanced rules',
  'solo variant',
  'solo mode',
  'two-player variant',
]

// Names that indicate Strategy section (rare but valuable)
const STRATEGY_SECTION_NAMES = [
  'strategy',
  'tactics',
  'strategic',
  'tips',
  'strategy and tactics',
  'playing tips',
]

// Names that indicate Components section
const COMPONENTS_SECTION_NAMES = [
  'components',
  'contents',
  'equipment',
  'game components',
  'materials',
  'pieces',
]

// Names that indicate Legacy/Impact section
const LEGACY_SECTION_NAMES = [
  'legacy',
  'cultural impact',
  'influence',
  'impact',
  'in popular culture',
  'cultural significance',
]

// =====================================================
// Section Extraction
// =====================================================

/**
 * Extract known sections from a Wikipedia article
 *
 * @param articleUrl - Wikipedia article URL
 * @param includeAllSections - If true, extract ALL sections into allSections map
 * @returns Object containing extracted section content
 */
export async function extractKnownSections(
  articleUrl: string,
  includeAllSections: boolean = false
): Promise<WikipediaSections> {
  const result: WikipediaSections = {}

  try {
    const title = extractTitleFromUrl(articleUrl)
    if (!title) {
      console.warn(`[Wikipedia] Invalid URL for section extraction: ${articleUrl}`)
      return result
    }

    // Get section list
    const sectionsResponse = await getPageSections(title)
    const sections = sectionsResponse.parse?.sections

    if (!sections || sections.length === 0) {
      console.log(`  [Wikipedia] No sections found in article: ${title}`)
      return result
    }

    // Map sections to our format
    const sectionInfos: SectionInfo[] = sections.map((s) => ({
      index: parseInt(s.index, 10),
      title: s.line,
      level: parseInt(s.level, 10),
    }))

    // Extract lead section (index 0, before first heading)
    try {
      result.lead = await extractSectionContent(title, 0)
      if (result.lead) {
        console.log(`  [Wikipedia] Extracted Lead section`)
      }
    } catch {
      // Lead section extraction failed, continue
    }

    // Find and extract each type of section
    const originsSection = findSection(sectionInfos, ORIGINS_SECTION_NAMES)
    if (originsSection) {
      result.origins = await extractSectionContent(title, originsSection.index)
      console.log(`  [Wikipedia] Extracted Origins section: "${originsSection.title}"`)
    }

    const receptionSection = findSection(sectionInfos, RECEPTION_SECTION_NAMES)
    if (receptionSection) {
      result.reception = await extractSectionContent(title, receptionSection.index)
      console.log(`  [Wikipedia] Extracted Reception section: "${receptionSection.title}"`)
    }

    const gameplaySection = findSection(sectionInfos, GAMEPLAY_SECTION_NAMES)
    if (gameplaySection) {
      result.gameplay = await extractSectionContent(title, gameplaySection.index)
      console.log(`  [Wikipedia] Extracted Gameplay section: "${gameplaySection.title}"`)
    }

    const expansionsSection = findSection(sectionInfos, EXPANSIONS_SECTION_NAMES)
    if (expansionsSection) {
      result.expansions = await extractSectionContent(title, expansionsSection.index)
      console.log(`  [Wikipedia] Extracted Expansions section: "${expansionsSection.title}"`)
    }

    // NEW: Extract additional valuable sections
    const variantsSection = findSection(sectionInfos, VARIANTS_SECTION_NAMES)
    if (variantsSection) {
      result.variants = await extractSectionContent(title, variantsSection.index)
      console.log(`  [Wikipedia] Extracted Variants section: "${variantsSection.title}"`)
    }

    const strategySection = findSection(sectionInfos, STRATEGY_SECTION_NAMES)
    if (strategySection) {
      result.strategy = await extractSectionContent(title, strategySection.index)
      console.log(`  [Wikipedia] Extracted Strategy section: "${strategySection.title}"`)
    }

    const componentsSection = findSection(sectionInfos, COMPONENTS_SECTION_NAMES)
    if (componentsSection) {
      result.components = await extractSectionContent(title, componentsSection.index)
      console.log(`  [Wikipedia] Extracted Components section: "${componentsSection.title}"`)
    }

    const legacySection = findSection(sectionInfos, LEGACY_SECTION_NAMES)
    if (legacySection) {
      result.legacy = await extractSectionContent(title, legacySection.index)
      console.log(`  [Wikipedia] Extracted Legacy section: "${legacySection.title}"`)
    }

    // NEW: Extract ALL sections if requested (for comprehensive storage)
    if (includeAllSections) {
      result.allSections = {}
      for (const section of sectionInfos) {
        // Skip meta sections like "See also", "References", "External links"
        const lowerTitle = section.title.toLowerCase()
        if (['see also', 'references', 'external links', 'notes', 'further reading', 'bibliography'].includes(lowerTitle)) {
          continue
        }
        try {
          const content = await extractSectionContent(title, section.index)
          if (content && content.length > 50) { // Only store non-trivial sections
            result.allSections[section.title] = content
          }
        } catch {
          // Skip failed sections
        }
      }
      console.log(`  [Wikipedia] Extracted ${Object.keys(result.allSections).length} total sections`)
    }

    return result
  } catch (error) {
    console.warn(`[Wikipedia] Section extraction failed:`, error)
    return result
  }
}

/**
 * Get list of sections in an article
 *
 * @param articleUrl - Wikipedia article URL
 * @returns Array of section info
 */
export async function getArticleSections(
  articleUrl: string
): Promise<SectionInfo[]> {
  try {
    const title = extractTitleFromUrl(articleUrl)
    if (!title) {
      return []
    }

    const response = await getPageSections(title)
    const sections = response.parse?.sections

    if (!sections) {
      return []
    }

    return sections.map((s) => ({
      index: parseInt(s.index, 10),
      title: s.line,
      level: parseInt(s.level, 10),
    }))
  } catch (error) {
    console.warn(`[Wikipedia] Failed to get sections:`, error)
    return []
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Find a section by matching against known names
 */
function findSection(
  sections: SectionInfo[],
  targetNames: string[]
): SectionInfo | null {
  for (const section of sections) {
    const normalizedTitle = section.title.toLowerCase().trim()
    for (const name of targetNames) {
      if (normalizedTitle === name || normalizedTitle.includes(name)) {
        return section
      }
    }
  }
  return null
}

/**
 * Extract and clean section content
 */
async function extractSectionContent(
  title: string,
  sectionIndex: number
): Promise<string> {
  try {
    const response = await getSectionWikitext(title, sectionIndex)
    const wikitext = response.parse?.wikitext?.['*']

    if (!wikitext) {
      return ''
    }

    return cleanSectionWikitext(wikitext)
  } catch (error) {
    console.warn(`[Wikipedia] Failed to extract section ${sectionIndex}:`, error)
    return ''
  }
}

/**
 * Clean wikitext to readable plain text
 */
function cleanSectionWikitext(wikitext: string): string {
  return (
    wikitext
      // Remove section headers
      .replace(/^=+\s*[^=]+\s*=+$/gm, '')
      // Remove wiki links, keep text
      .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')
      // Remove external links, keep text
      .replace(/\[https?:\/\/[^\s\]]+\s*([^\]]*)\]/g, '$1')
      .replace(/\[https?:\/\/[^\s\]]+\]/g, '')
      // Remove file/image links
      .replace(/\[\[(?:File|Image):[^\]]+\]\]/gi, '')
      // Remove templates (simple ones)
      .replace(/\{\{[^{}]+\}\}/g, '')
      // Handle nested templates (second pass)
      .replace(/\{\{[^{}]+\}\}/g, '')
      // Remove ref tags (use [\s\S] instead of . with s flag for cross-line matching)
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
      .replace(/<ref[^>]*\/>/gi, '')
      // Remove other HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Convert bold/italic markup
      .replace(/'''([^']+)'''/g, '$1')
      .replace(/''([^']+)''/g, '$1')
      // Decode HTML entities for brackets
      .replace(/&#91;/g, '[')
      .replace(/&#93;/g, ']')
      // Remove [edit] links, citation markers, and [citation needed]
      .replace(/\[\s*edit\s*\]/gi, '')
      .replace(/\[\s*\d+\s*\]/g, '')
      .replace(/\[\s*citation needed\s*\]/gi, '')
      // Normalize multiple blank lines to single paragraph break
      .replace(/\n{3,}/g, '\n\n')
      // Trim horizontal whitespace from each line (preserve newlines)
      .replace(/^[^\S\n]+|[^\S\n]+$/gm, '')
      .trim()
  )
}

// =====================================================
// Section Analysis
// =====================================================

/**
 * Analyze what sections are available in an article
 * Useful for debugging and understanding article structure
 */
export async function analyzeSections(
  articleUrl: string
): Promise<{
  total: number
  hasOrigins: boolean
  hasReception: boolean
  hasGameplay: boolean
  hasExpansions: boolean
  hasVariants: boolean
  hasStrategy: boolean
  hasComponents: boolean
  hasLegacy: boolean
  allSections: string[]
}> {
  const sections = await getArticleSections(articleUrl)

  return {
    total: sections.length,
    hasOrigins: findSection(sections, ORIGINS_SECTION_NAMES) !== null,
    hasReception: findSection(sections, RECEPTION_SECTION_NAMES) !== null,
    hasGameplay: findSection(sections, GAMEPLAY_SECTION_NAMES) !== null,
    hasExpansions: findSection(sections, EXPANSIONS_SECTION_NAMES) !== null,
    hasVariants: findSection(sections, VARIANTS_SECTION_NAMES) !== null,
    hasStrategy: findSection(sections, STRATEGY_SECTION_NAMES) !== null,
    hasComponents: findSection(sections, COMPONENTS_SECTION_NAMES) !== null,
    hasLegacy: findSection(sections, LEGACY_SECTION_NAMES) !== null,
    allSections: sections.map((s) => s.title),
  }
}
