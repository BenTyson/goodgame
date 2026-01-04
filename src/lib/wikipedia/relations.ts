/**
 * Wikipedia Relations Extraction
 *
 * Detects expansions, sequels, and related games from Wikipedia article links.
 * Uses infobox "expansion" field and "See also" section for detection.
 */

import {
  getPageLinks,
  getPageWikitext,
  extractTitleFromUrl,
  buildWikipediaUrl,
} from './client'
import { getArticleSections } from './sections'
import type { WikipediaRelation, SectionInfo } from './types'

// =====================================================
// Relation Extraction from Infobox
// =====================================================

/**
 * Extract expansion/sequel relations from infobox wikitext
 */
export async function extractInfoboxRelations(
  articleUrl: string,
  gameName: string
): Promise<WikipediaRelation[]> {
  const relations: WikipediaRelation[] = []

  try {
    const title = extractTitleFromUrl(articleUrl)
    if (!title) return relations

    const response = await getPageWikitext(title)
    const wikitext = response.parse?.wikitext?.['*']
    if (!wikitext) return relations

    // Look for expansion-related fields in infobox
    // Use [\s\S] instead of . to match across lines (ES2018 's' flag alternative)
    const expansionPatterns = [
      /\|\s*expansion\s*=\s*([\s\S]+?)(?:\n\||\n\}\})/i,
      /\|\s*expansions\s*=\s*([\s\S]+?)(?:\n\||\n\}\})/i,
      /\|\s*expansion_of\s*=\s*([\s\S]+?)(?:\n\||\n\}\})/i,
      /\|\s*expands\s*=\s*([\s\S]+?)(?:\n\||\n\}\})/i,
    ]

    for (const pattern of expansionPatterns) {
      const match = wikitext.match(pattern)
      if (match) {
        const expansionValue = match[1]
        const links = extractWikiLinks(expansionValue)

        for (const link of links) {
          relations.push({
            title: link.text || link.target,
            url: buildWikipediaUrl(link.target),
            relationType: 'expansion',
            confidence: 'high',
            source: 'infobox',
          })
        }
      }
    }

    // Look for sequel-related fields
    const sequelPatterns = [
      /\|\s*preceded_by\s*=\s*([\s\S]+?)(?:\n\||\n\}\})/i,
      /\|\s*followed_by\s*=\s*([\s\S]+?)(?:\n\||\n\}\})/i,
      /\|\s*sequel\s*=\s*([\s\S]+?)(?:\n\||\n\}\})/i,
    ]

    for (const pattern of sequelPatterns) {
      const match = wikitext.match(pattern)
      if (match) {
        const sequelValue = match[1]
        const links = extractWikiLinks(sequelValue)

        for (const link of links) {
          relations.push({
            title: link.text || link.target,
            url: buildWikipediaUrl(link.target),
            relationType: 'sequel',
            confidence: 'high',
            source: 'infobox',
          })
        }
      }
    }

    return relations
  } catch (error) {
    console.warn(`[Wikipedia] Failed to extract infobox relations:`, error)
    return relations
  }
}

// =====================================================
// Relation Extraction from See Also
// =====================================================

/**
 * Extract related games from "See also" section
 */
export async function extractSeeAlsoRelations(
  articleUrl: string,
  gameName: string
): Promise<WikipediaRelation[]> {
  const relations: WikipediaRelation[] = []

  try {
    const title = extractTitleFromUrl(articleUrl)
    if (!title) return relations

    // Find "See also" section
    const sections = await getArticleSections(articleUrl)
    const seeAlsoSection = sections.find(
      (s) => s.title.toLowerCase() === 'see also'
    )

    if (!seeAlsoSection) {
      return relations
    }

    // Get links from the article
    const linksResponse = await getPageLinks(title, 200)
    const pages = linksResponse.query?.pages
    if (!pages) return relations

    const pageId = Object.keys(pages)[0]
    const page = pages[pageId]
    if (!page.links) return relations

    // Filter to likely game-related links
    for (const link of page.links) {
      const linkTitle = link.title

      // Skip common non-game pages
      if (isNonGameLink(linkTitle)) continue

      // Check if link title suggests a relation
      const relationType = inferRelationType(linkTitle, gameName)

      if (relationType) {
        relations.push({
          title: linkTitle,
          url: buildWikipediaUrl(linkTitle),
          relationType,
          confidence: 'medium',
          source: 'see_also',
        })
      }
    }

    return relations
  } catch (error) {
    console.warn(`[Wikipedia] Failed to extract See also relations:`, error)
    return relations
  }
}

// =====================================================
// Relation Extraction from Article Links
// =====================================================

/**
 * Extract potential related games from article body links
 * Looks for links that contain game-related keywords
 */
export async function extractArticleLinks(
  articleUrl: string,
  gameName: string
): Promise<WikipediaRelation[]> {
  const relations: WikipediaRelation[] = []

  try {
    const title = extractTitleFromUrl(articleUrl)
    if (!title) return relations

    // Get wikitext to find contextual links
    const response = await getPageWikitext(title)
    const wikitext = response.parse?.wikitext?.['*']
    if (!wikitext) return relations

    // Look for links near expansion/sequel keywords
    const expansionContextPatterns = [
      /expansion[s]?\s*(?:include|are|such as|:)?\s*(.{0,200})/gi,
      /sequel[s]?\s*(?:include|are|such as|:)?\s*(.{0,200})/gi,
      /spin-?off[s]?\s*(?:include|are|such as|:)?\s*(.{0,200})/gi,
      /standalone\s+(?:expansion|game)[s]?\s*(?:include|are|such as|:)?\s*(.{0,200})/gi,
    ]

    for (const pattern of expansionContextPatterns) {
      let match
      while ((match = pattern.exec(wikitext)) !== null) {
        const context = match[1]
        const links = extractWikiLinks(context)

        for (const link of links) {
          // Skip if it's the same game
          if (link.target.toLowerCase() === gameName.toLowerCase()) continue

          const relationType = pattern.source.includes('expansion')
            ? 'expansion'
            : pattern.source.includes('sequel')
              ? 'sequel'
              : 'related'

          relations.push({
            title: link.text || link.target,
            url: buildWikipediaUrl(link.target),
            relationType,
            confidence: 'low',
            source: 'article_link',
          })
        }
      }
    }

    return relations
  } catch (error) {
    console.warn(`[Wikipedia] Failed to extract article links:`, error)
    return relations
  }
}

// =====================================================
// Combined Extraction
// =====================================================

/**
 * Extract all game relations from a Wikipedia article
 * Combines infobox, See also, and article link extraction
 */
export async function extractGameRelations(
  articleUrl: string,
  gameName: string
): Promise<WikipediaRelation[]> {
  const allRelations: WikipediaRelation[] = []
  const seenUrls = new Set<string>()

  // Extract from infobox (highest confidence)
  const infoboxRelations = await extractInfoboxRelations(articleUrl, gameName)
  for (const rel of infoboxRelations) {
    if (!seenUrls.has(rel.url)) {
      allRelations.push(rel)
      seenUrls.add(rel.url)
    }
  }

  // Extract from See also section (medium confidence)
  const seeAlsoRelations = await extractSeeAlsoRelations(articleUrl, gameName)
  for (const rel of seeAlsoRelations) {
    if (!seenUrls.has(rel.url)) {
      allRelations.push(rel)
      seenUrls.add(rel.url)
    }
  }

  // Extract from article body (low confidence, limit to avoid noise)
  const articleRelations = await extractArticleLinks(articleUrl, gameName)
  for (const rel of articleRelations.slice(0, 10)) {
    if (!seenUrls.has(rel.url)) {
      allRelations.push(rel)
      seenUrls.add(rel.url)
    }
  }

  console.log(`  [Wikipedia] Found ${allRelations.length} potential game relations`)

  return allRelations
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Extract wiki links from wikitext
 */
function extractWikiLinks(
  text: string
): Array<{ target: string; text: string | null }> {
  const links: Array<{ target: string; text: string | null }> = []
  const pattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

  let match
  while ((match = pattern.exec(text)) !== null) {
    const target = match[1].trim()
    const displayText = match[2]?.trim() || null

    // Skip file/image links
    if (
      target.toLowerCase().startsWith('file:') ||
      target.toLowerCase().startsWith('image:')
    ) {
      continue
    }

    links.push({ target, text: displayText })
  }

  return links
}

/**
 * Check if a link is likely not a game page
 */
function isNonGameLink(title: string): boolean {
  const lower = title.toLowerCase()
  return (
    lower.startsWith('list of') ||
    lower.startsWith('category:') ||
    lower.startsWith('template:') ||
    lower.startsWith('wikipedia:') ||
    lower.startsWith('help:') ||
    lower.startsWith('portal:') ||
    lower.startsWith('file:') ||
    lower.includes('(award)') ||
    lower.includes('(company)') ||
    lower.includes('(publisher)') ||
    lower.includes('(designer)') ||
    lower.includes('(video game)') ||
    lower.includes('(film)') ||
    lower.includes('(tv series)')
  )
}

/**
 * Infer relation type from link title and game name
 */
function inferRelationType(
  linkTitle: string,
  gameName: string
): 'expansion' | 'sequel' | 'related' | null {
  const lowerLink = linkTitle.toLowerCase()
  const lowerGame = gameName.toLowerCase()

  // Check if link contains the game name (likely expansion)
  if (lowerLink.includes(lowerGame)) {
    if (
      lowerLink.includes('expansion') ||
      lowerLink.includes('supplement') ||
      lowerLink.includes('add-on')
    ) {
      return 'expansion'
    }
    // Could be expansion if it's "Game Name: Something"
    if (lowerLink.startsWith(lowerGame + ':')) {
      return 'expansion'
    }
    return 'related'
  }

  // Check for sequel indicators
  if (lowerLink.includes('2') || lowerLink.includes('ii')) {
    // Check if it's a sequel to this game
    const baseNameMatch = lowerLink.match(/^(.+?)(?:\s+2|\s+ii|\s+second)$/i)
    if (baseNameMatch && lowerGame.includes(baseNameMatch[1])) {
      return 'sequel'
    }
  }

  return null
}

// =====================================================
// Relation Type Utilities
// =====================================================

/**
 * Group relations by type
 */
export function groupRelationsByType(
  relations: WikipediaRelation[]
): Record<'expansion' | 'sequel' | 'related' | 'unknown', WikipediaRelation[]> {
  return {
    expansion: relations.filter((r) => r.relationType === 'expansion'),
    sequel: relations.filter((r) => r.relationType === 'sequel'),
    related: relations.filter((r) => r.relationType === 'related'),
    unknown: relations.filter((r) => r.relationType === 'unknown'),
  }
}

/**
 * Get high confidence relations only
 */
export function getHighConfidenceRelations(
  relations: WikipediaRelation[]
): WikipediaRelation[] {
  return relations.filter((r) => r.confidence === 'high')
}
