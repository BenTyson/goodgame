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
  'variants',
  'editions',
  'versions',
  'supplements',
  'extensions',
  'spin-offs',
  'spinoffs',
]

// =====================================================
// Section Extraction
// =====================================================

/**
 * Extract known sections from a Wikipedia article
 *
 * @param articleUrl - Wikipedia article URL
 * @returns Object containing extracted section content
 */
export async function extractKnownSections(
  articleUrl: string
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
  allSections: string[]
}> {
  const sections = await getArticleSections(articleUrl)

  return {
    total: sections.length,
    hasOrigins: findSection(sections, ORIGINS_SECTION_NAMES) !== null,
    hasReception: findSection(sections, RECEPTION_SECTION_NAMES) !== null,
    hasGameplay: findSection(sections, GAMEPLAY_SECTION_NAMES) !== null,
    hasExpansions: findSection(sections, EXPANSIONS_SECTION_NAMES) !== null,
    allSections: sections.map((s) => s.title),
  }
}
