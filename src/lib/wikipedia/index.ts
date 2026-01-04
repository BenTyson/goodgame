/**
 * Wikipedia Integration Utilities
 * Shared functions for fetching and processing Wikipedia content
 */

import { generateJSON, type GenerationResult } from '@/lib/ai/claude'

// =====================================================
// Types
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

  const rawContent = page.extract || ''
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
