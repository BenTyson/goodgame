/**
 * Wikipedia Infobox Parser
 *
 * Extracts structured data from Wikipedia infobox templates.
 * Targets: {{Infobox game}}, {{Infobox tabletop game}}, {{Infobox card game}}
 */

import { getPageWikitext, extractTitleFromUrl } from './client'
import type { WikipediaInfobox, WikipediaPublisher } from './types'

// =====================================================
// Infobox Extraction
// =====================================================

/**
 * Extract infobox data from a Wikipedia article
 *
 * @param articleUrl - Wikipedia article URL
 * @returns Parsed infobox data or null if no infobox found
 */
export async function extractInfobox(
  articleUrl: string
): Promise<WikipediaInfobox | null> {
  try {
    const title = extractTitleFromUrl(articleUrl)
    if (!title) {
      console.warn(`[Wikipedia] Invalid URL for infobox extraction: ${articleUrl}`)
      return null
    }

    const response = await getPageWikitext(title)
    const wikitext = response.parse?.wikitext?.['*']

    if (!wikitext) {
      console.warn(`[Wikipedia] No wikitext found for: ${title}`)
      return null
    }

    return parseInfoboxWikitext(wikitext)
  } catch (error) {
    console.warn(`[Wikipedia] Infobox extraction failed:`, error)
    return null
  }
}

// =====================================================
// Wikitext Parsing
// =====================================================

/**
 * Parse infobox from raw wikitext
 * Handles nested templates and multi-line values
 */
export function parseInfoboxWikitext(wikitext: string): WikipediaInfobox | null {
  // Match infobox templates (case insensitive)
  const infoboxPatterns = [
    /\{\{Infobox game\s*\|/i,
    /\{\{Infobox tabletop game\s*\|/i,
    /\{\{Infobox card game\s*\|/i,
    /\{\{Infobox board game\s*\|/i,
  ]

  let startIndex = -1
  for (const pattern of infoboxPatterns) {
    const match = wikitext.match(pattern)
    if (match && match.index !== undefined) {
      startIndex = match.index
      break
    }
  }

  if (startIndex === -1) {
    return null
  }

  // Find the matching closing braces
  const infoboxContent = extractTemplateContent(wikitext, startIndex)
  if (!infoboxContent) {
    return null
  }

  // Parse the key-value pairs
  const params = parseTemplateParams(infoboxContent)

  return mapParamsToInfobox(params)
}

/**
 * Extract template content handling nested braces
 */
function extractTemplateContent(wikitext: string, startIndex: number): string | null {
  let depth = 0
  let start = -1

  for (let i = startIndex; i < wikitext.length - 1; i++) {
    if (wikitext[i] === '{' && wikitext[i + 1] === '{') {
      if (depth === 0) {
        start = i + 2
      }
      depth++
      i++ // Skip next brace
    } else if (wikitext[i] === '}' && wikitext[i + 1] === '}') {
      depth--
      if (depth === 0) {
        return wikitext.slice(start, i)
      }
      i++ // Skip next brace
    }
  }

  return null
}

/**
 * Parse template parameters from infobox content
 * Handles multi-line values and nested templates
 */
function parseTemplateParams(content: string): Record<string, string> {
  const params: Record<string, string> = {}

  // Split by | but not when inside {{ }} or [[ ]]
  const parts: string[] = []
  let current = ''
  let braceDepth = 0
  let bracketDepth = 0

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (char === '{' && nextChar === '{') {
      braceDepth++
      current += '{{'
      i++
    } else if (char === '}' && nextChar === '}') {
      braceDepth--
      current += '}}'
      i++
    } else if (char === '[' && nextChar === '[') {
      bracketDepth++
      current += '[['
      i++
    } else if (char === ']' && nextChar === ']') {
      bracketDepth--
      current += ']]'
      i++
    } else if (char === '|' && braceDepth === 0 && bracketDepth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) {
    parts.push(current.trim())
  }

  // Parse each key=value pair
  for (const part of parts) {
    const equalsIndex = part.indexOf('=')
    if (equalsIndex > 0) {
      const key = part.slice(0, equalsIndex).trim().toLowerCase()
      const value = part.slice(equalsIndex + 1).trim()
      params[key] = value
    }
  }

  return params
}

/**
 * Map parsed parameters to WikipediaInfobox interface
 */
function mapParamsToInfobox(params: Record<string, string>): WikipediaInfobox {
  const infobox: WikipediaInfobox = {}

  // Designer(s)
  const designerValue =
    params['designer'] ||
    params['designers'] ||
    params['design'] ||
    params['created by']
  if (designerValue) {
    infobox.designer = parseWikiLinks(designerValue)
  }

  // Publisher(s)
  const publisherValue =
    params['publisher'] ||
    params['publishers'] ||
    params['published by']
  if (publisherValue) {
    infobox.publisher = parseWikiLinks(publisherValue)
    // Also parse with regional info for enhanced data
    infobox.publishersWithRegion = parsePublishersWithRegion(publisherValue)
  }

  // Players
  const playersValue =
    params['players'] ||
    params['player'] ||
    params['num_players'] ||
    params['number of players']
  if (playersValue) {
    infobox.players = cleanValue(playersValue)
  }

  // Playing time
  const playTimeValue =
    params['playing_time'] ||
    params['playing time'] ||
    params['playtime'] ||
    params['time'] ||
    params['duration']
  if (playTimeValue) {
    infobox.playingTime = cleanValue(playTimeValue)
  }

  // Setup time
  const setupTimeValue =
    params['setup_time'] ||
    params['setup time'] ||
    params['setup']
  if (setupTimeValue) {
    infobox.setupTime = cleanValue(setupTimeValue)
  }

  // Ages
  const agesValue =
    params['ages'] ||
    params['age'] ||
    params['age_range'] ||
    params['min_age']
  if (agesValue) {
    infobox.ages = cleanValue(agesValue)
  }

  // Release date / Year
  const releaseDateValue =
    params['release_date'] ||
    params['release'] ||
    params['pub_date'] ||
    params['date'] ||
    params['year'] ||
    params['years']
  if (releaseDateValue) {
    infobox.releaseDate = cleanValue(releaseDateValue)
  }

  // Genre
  const genreValue =
    params['genre'] ||
    params['genres'] ||
    params['type']
  if (genreValue) {
    infobox.genre = cleanValue(genreValue)
  }

  // Skills
  const skillsValue =
    params['skills'] ||
    params['skill'] ||
    params['skills_required']
  if (skillsValue) {
    infobox.skills = parseList(skillsValue)
  }

  // Website
  const websiteValue =
    params['website'] ||
    params['url'] ||
    params['official_website']
  if (websiteValue) {
    infobox.website = extractUrl(websiteValue)
  }

  // Series
  const seriesValue =
    params['series'] ||
    params['part_of_series']
  if (seriesValue) {
    infobox.series = cleanValue(seriesValue)
  }

  // Expansion
  const expansionValue =
    params['expansion'] ||
    params['expansions'] ||
    params['expansion_of'] ||
    params['expands']
  if (expansionValue) {
    infobox.expansion = cleanValue(expansionValue)
  }

  // Random chance
  const randomValue =
    params['random_chance'] ||
    params['random'] ||
    params['luck']
  if (randomValue) {
    infobox.randomChance = cleanValue(randomValue)
  }

  // =====================================================
  // New Tier 1 Fields
  // =====================================================

  // Image filename from infobox
  const imageValue = params['image']
  if (imageValue) {
    infobox.image = cleanValue(imageValue)
  }

  // Image caption
  const captionValue =
    params['image_caption'] ||
    params['caption'] ||
    params['image_alt']
  if (captionValue) {
    infobox.imageCaption = cleanValue(captionValue)
  }

  // Mechanics
  const mechanicsValue =
    params['mechanics'] ||
    params['mechanic'] ||
    params['mechanisms'] ||
    params['mechanism']
  if (mechanicsValue) {
    infobox.mechanics = parseWikiLinks(mechanicsValue)
  }

  // Themes
  const themesValue =
    params['themes'] ||
    params['theme'] ||
    params['setting']
  if (themesValue) {
    infobox.themes = parseWikiLinks(themesValue)
  }

  // Complexity
  const complexityValue =
    params['complexity'] ||
    params['difficulty'] ||
    params['weight']
  if (complexityValue) {
    infobox.complexity = cleanValue(complexityValue)
  }

  // Structured player counts (min/max)
  const minPlayersValue =
    params['min_players'] ||
    params['minimum_players']
  if (minPlayersValue) {
    infobox.minPlayers = cleanValue(minPlayersValue)
  }

  const maxPlayersValue =
    params['max_players'] ||
    params['maximum_players']
  if (maxPlayersValue) {
    infobox.maxPlayers = cleanValue(maxPlayersValue)
  }

  // Recommended/optimal players
  const recommendedValue =
    params['recommended_players'] ||
    params['optimal_players'] ||
    params['best_players']
  if (recommendedValue) {
    infobox.recommendedPlayers = cleanValue(recommendedValue)
  }

  // Player elimination
  const eliminationValue =
    params['player_elimination'] ||
    params['elimination']
  if (eliminationValue) {
    const lower = eliminationValue.toLowerCase()
    infobox.playerElimination = lower === 'yes' || lower === 'true' || lower.includes('yes')
  }

  // BGG ID cross-reference
  const bggIdValue =
    params['bgg_id'] ||
    params['bggid'] ||
    params['boardgamegeek_id']
  if (bggIdValue) {
    infobox.bggId = cleanValue(bggIdValue)
  }

  return infobox
}

// =====================================================
// Value Parsing Helpers
// =====================================================

/**
 * Parse wiki links into array of names
 * Handles: [[Name]], [[Name|Display]], plain text, and lists
 */
export function parseWikiLinks(value: string): string[] {
  const results: string[] = []

  // First, try to extract wiki links
  const linkPattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
  let match

  while ((match = linkPattern.exec(value)) !== null) {
    // Use display text if available, otherwise link target
    const name = match[2] || match[1]
    results.push(name.trim())
  }

  // If no wiki links found, try comma/and-separated plain text
  if (results.length === 0) {
    const cleanedValue = value
      .replace(/\{\{[^}]+\}\}/g, '') // Remove templates
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/<ref[^>]*>.*?<\/ref>/gi, '') // Remove ref tags
      .replace(/<ref[^>]*\/>/gi, '') // Remove self-closing ref tags

    const parts = cleanedValue.split(/[,;&]|\band\b/i)
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed && trimmed.length > 1) {
        results.push(trimmed)
      }
    }
  }

  return results
}

/**
 * Parse a comma or newline-separated list
 */
function parseList(value: string): string[] {
  const cleanedValue = cleanValue(value)
  return cleanedValue
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Clean a value by removing wiki markup
 */
function cleanValue(value: string): string {
  return value
    // Remove wiki links, keep display text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    // Remove templates (but try to keep text)
    .replace(/\{\{(?:nowrap|nbsp|spaces?)\|([^}]+)\}\}/gi, '$1')
    .replace(/\{\{[^}]+\}\}/g, '')
    // Remove HTML tags
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    // Remove ref tags
    .replace(/<ref[^>]*>.*?<\/ref>/gi, '')
    .replace(/<ref[^>]*\/>/gi, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract URL from value (may be in template or plain)
 */
function extractUrl(value: string): string | undefined {
  // Try to extract from {{URL|...}} template
  const urlTemplateMatch = value.match(/\{\{URL\|([^|}]+)/i)
  if (urlTemplateMatch) {
    return urlTemplateMatch[1].trim()
  }

  // Try to extract bare URL
  const urlMatch = value.match(/https?:\/\/[^\s\]}<]+/)
  if (urlMatch) {
    return urlMatch[0]
  }

  // Try to extract from external link [url text]
  const extLinkMatch = value.match(/\[(https?:\/\/[^\s\]]+)/)
  if (extLinkMatch) {
    return extLinkMatch[1]
  }

  return undefined
}

// =====================================================
// Publisher Parsing with Regional Data
// =====================================================

/**
 * Parse publishers from wikitext with regional/localization info
 * Handles formats like:
 *   * [[Z-Man Games]] (U.S.)
 *   * [[Hobby Japan]] (Japan)
 *   [[Publisher]] (Region)
 *   Publisher name (Region)
 */
export function parsePublishersWithRegion(value: string): WikipediaPublisher[] {
  const publishers: WikipediaPublisher[] = []

  // Split by newlines and list markers
  const lines = value
    .split(/[\n*•]/)
    .map(line => line.trim())
    .filter(line => line.length > 0)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip template markers like {{Plainlist|
    if (line.startsWith('{{') && !line.includes('[[')) {
      continue
    }

    // Try to match [[Publisher]] (Region) pattern
    const linkWithRegionMatch = line.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]\s*\(([^)]+)\)/)
    if (linkWithRegionMatch) {
      const name = linkWithRegionMatch[2] || linkWithRegionMatch[1]
      const region = linkWithRegionMatch[3].trim()
      publishers.push({
        name: name.trim(),
        region,
        isPrimary: i === 0 || isUSRegion(region)
      })
      continue
    }

    // Try to match just [[Publisher]] without region
    const linkOnlyMatch = line.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/)
    if (linkOnlyMatch) {
      const name = linkOnlyMatch[2] || linkOnlyMatch[1]
      publishers.push({
        name: name.trim(),
        isPrimary: i === 0 // First publisher is usually primary
      })
      continue
    }

    // Plain text Publisher (Region)
    const plainWithRegionMatch = line.match(/^([^(]+)\s*\(([^)]+)\)/)
    if (plainWithRegionMatch) {
      publishers.push({
        name: plainWithRegionMatch[1].trim(),
        region: plainWithRegionMatch[2].trim(),
        isPrimary: i === 0
      })
      continue
    }

    // Plain text publisher name (no region)
    const cleanName = line
      .replace(/\{\{[^}]+\}\}/g, '') // Remove templates
      .replace(/<[^>]+>/g, '') // Remove HTML
      .trim()

    if (cleanName && cleanName.length > 1 && !cleanName.startsWith('}}')) {
      publishers.push({
        name: cleanName,
        isPrimary: i === 0
      })
    }
  }

  // Mark first US publisher as primary if we found one
  const usPublisher = publishers.find(p => p.region && isUSRegion(p.region))
  if (usPublisher) {
    // Reset all isPrimary flags
    publishers.forEach(p => p.isPrimary = false)
    usPublisher.isPrimary = true
  } else if (publishers.length > 0) {
    // Otherwise first publisher is primary
    publishers.forEach(p => p.isPrimary = false)
    publishers[0].isPrimary = true
  }

  return publishers
}

/**
 * Check if a region string indicates US/United States
 */
function isUSRegion(region: string): boolean {
  const normalized = region.toLowerCase().trim()
  return (
    normalized === 'u.s.' ||
    normalized === 'us' ||
    normalized === 'usa' ||
    normalized === 'united states' ||
    normalized === 'north america' ||
    normalized === 'english' || // Often indicates primary English publisher
    normalized === 'worldwide'
  )
}

/**
 * Get the primary publisher from a list
 * Priority: US region > first publisher
 */
export function getPrimaryPublisher(publishers: WikipediaPublisher[]): WikipediaPublisher | null {
  if (publishers.length === 0) return null

  // Return the one marked as primary
  const primary = publishers.find(p => p.isPrimary)
  if (primary) return primary

  // Fallback: look for US region
  const usPublisher = publishers.find(p => p.region && isUSRegion(p.region))
  if (usPublisher) return usPublisher

  // Final fallback: first in list
  return publishers[0]
}
