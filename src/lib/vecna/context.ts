/**
 * Vecna Context Builder
 *
 * Builds rich context for AI content generation using all available data sources.
 */

import type { FamilyContext } from './types'
import type { Json } from '@/types/database'

// Wikipedia summary structure from AI extraction
interface WikipediaSummary {
  summary: string
  themes: string[]
  mechanics: string[]
  reception: string | null
  awards: string[]
}

// Wikipedia infobox structure
interface WikipediaInfobox {
  designers?: string[]
  publishers?: Array<{ name: string; region?: string }>
  players?: { min?: number; max?: number }
  playTime?: { min?: number; max?: number }
  setupTime?: string
  ages?: number
  releaseDate?: string
  genres?: string[]
}

// Wikipedia award structure
interface WikipediaAward {
  name: string
  year: number | null
  status: 'winner' | 'nominated' | 'finalist'
  category?: string
}

// Full game data for context building
export interface GameContextData {
  name: string
  year_published: number | null
  // Wikipedia data
  wikipedia_summary: WikipediaSummary | null
  wikipedia_gameplay: string | null
  wikipedia_origins: string | null
  wikipedia_reception: string | null
  wikipedia_awards: WikipediaAward[] | null
  wikipedia_infobox: WikipediaInfobox | null
  // Family context (for expansions)
  familyContext: FamilyContext | null
  isExpansion: boolean
  relationToBase?: string  // "expansion_of", "sequel_to", etc.
}

/**
 * Build enhanced Wikipedia context for AI prompts
 * Combines all Wikipedia data sources into a structured context string
 */
export function buildWikipediaContext(data: {
  summary?: WikipediaSummary | null
  gameplay?: string | null
  origins?: string | null
  reception?: string | null
  awards?: WikipediaAward[] | null
  infobox?: WikipediaInfobox | null
}): string | null {
  const sections: string[] = []

  // AI-generated summary (themes, mechanics, general overview)
  if (data.summary) {
    sections.push('=== WIKIPEDIA SUMMARY ===')
    sections.push(data.summary.summary)

    if (data.summary.themes.length > 0) {
      sections.push(`\nKey Themes: ${data.summary.themes.join(', ')}`)
    }
    if (data.summary.mechanics.length > 0) {
      sections.push(`Core Mechanics: ${data.summary.mechanics.join(', ')}`)
    }
  }

  // Gameplay section (direct rules context from Wikipedia)
  if (data.gameplay) {
    sections.push('\n=== GAMEPLAY SECTION (from Wikipedia) ===')
    sections.push(data.gameplay)
  }

  // Origins/History section (designer intent, development context)
  if (data.origins) {
    sections.push('\n=== ORIGINS & HISTORY ===')
    sections.push(data.origins)
  }

  // Reception section (critical acclaim, what players love)
  if (data.reception) {
    sections.push('\n=== CRITICAL RECEPTION ===')
    sections.push(data.reception)
  } else if (data.summary?.reception) {
    sections.push('\n=== CRITICAL RECEPTION ===')
    sections.push(data.summary.reception)
  }

  // Structured awards (for descriptions and credibility)
  if (data.awards && data.awards.length > 0) {
    sections.push('\n=== AWARDS ===')
    const winners = data.awards.filter(a => a.status === 'winner')
    const nominated = data.awards.filter(a => a.status === 'nominated' || a.status === 'finalist')

    if (winners.length > 0) {
      sections.push('Won:')
      winners.forEach(a => {
        const yearStr = a.year ? ` (${a.year})` : ''
        const catStr = a.category ? ` - ${a.category}` : ''
        sections.push(`  - ${a.name}${yearStr}${catStr}`)
      })
    }
    if (nominated.length > 0) {
      sections.push('Nominated:')
      nominated.forEach(a => {
        const yearStr = a.year ? ` (${a.year})` : ''
        sections.push(`  - ${a.name}${yearStr}`)
      })
    }
  } else if (data.summary?.awards && data.summary.awards.length > 0) {
    sections.push('\n=== AWARDS ===')
    sections.push(data.summary.awards.join(', '))
  }

  // Infobox data (structured metadata)
  if (data.infobox) {
    const infoItems: string[] = []
    if (data.infobox.designers?.length) {
      infoItems.push(`Designers: ${data.infobox.designers.join(', ')}`)
    }
    if (data.infobox.publishers?.length) {
      const pubs = data.infobox.publishers.map(p =>
        p.region ? `${p.name} (${p.region})` : p.name
      ).join(', ')
      infoItems.push(`Publishers: ${pubs}`)
    }
    if (data.infobox.genres?.length) {
      infoItems.push(`Genres: ${data.infobox.genres.join(', ')}`)
    }

    if (infoItems.length > 0) {
      sections.push('\n=== INFOBOX DATA ===')
      sections.push(infoItems.join('\n'))
    }
  }

  if (sections.length === 0) {
    return null
  }

  return sections.join('\n')
}

/**
 * Build family context section for expansion content generation
 * Enhanced with full Wikipedia context from base game
 */
export function buildFamilyContextSection(context: FamilyContext): string {
  const sections: string[] = [
    '=== BASE GAME CONTEXT ===',
    `This expansion is for "${context.baseGameName}".`,
    '',
  ]

  // Core game identity
  if (context.coreMechanics.length > 0) {
    sections.push(`Core Mechanics: ${context.coreMechanics.join(', ')}`)
  }

  if (context.coreTheme) {
    sections.push(`Theme: ${context.coreTheme}`)
  }

  // Designers and publishers (for consistency in tone/style)
  if (context.baseGameDesigners && context.baseGameDesigners.length > 0) {
    sections.push(`Designers: ${context.baseGameDesigners.join(', ')}`)
  }

  if (context.baseGamePublishers && context.baseGamePublishers.length > 0) {
    sections.push(`Publishers: ${context.baseGamePublishers.join(', ')}`)
  }

  // Critical acclaim context (helps AI understand what makes the base game special)
  if (context.baseGameAwards && context.baseGameAwards.length > 0) {
    sections.push(`\nAwards Won: ${context.baseGameAwards.slice(0, 5).join(', ')}`)
  }

  if (context.baseGameReception) {
    // Truncate long reception text but keep the key info
    const receptionPreview = context.baseGameReception.length > 500
      ? context.baseGameReception.slice(0, 500) + '...'
      : context.baseGameReception
    sections.push(`\nCritical Reception:\n${receptionPreview}`)
  }

  // Design philosophy (helps AI understand the designer's intent)
  if (context.baseGameOrigins) {
    // Truncate long origins text
    const originsPreview = context.baseGameOrigins.length > 400
      ? context.baseGameOrigins.slice(0, 400) + '...'
      : context.baseGameOrigins
    sections.push(`\nDesign Origins:\n${originsPreview}`)
  }

  // Base game rules context
  if (context.baseRulesOverview) {
    sections.push(`\nBase Game Rules Overview:\n${context.baseRulesOverview}`)
  }

  if (context.baseSetupSummary) {
    sections.push(`\nBase Game Setup:\n${context.baseSetupSummary}`)
  }

  if (context.componentTypes.length > 0) {
    sections.push(`\nBase Game Components: ${context.componentTypes.join(', ')}`)
  }

  return sections.join('\n')
}

/**
 * Build complete AI context from game data
 * Returns structured context sections for use in prompts
 */
export function buildAIContext(data: GameContextData): {
  wikipediaContext: string | null
  familyContext: string | null
  expansionNote: string | null
} {
  // Build Wikipedia context
  const wikipediaContext = buildWikipediaContext({
    summary: data.wikipedia_summary,
    gameplay: data.wikipedia_gameplay,
    origins: data.wikipedia_origins,
    reception: data.wikipedia_reception,
    awards: data.wikipedia_awards,
    infobox: data.wikipedia_infobox,
  })

  // Build family context for expansions
  const familyContext = data.familyContext
    ? buildFamilyContextSection(data.familyContext)
    : null

  // Build expansion note
  let expansionNote: string | null = null
  if (data.isExpansion && data.familyContext) {
    const relationType = data.relationToBase?.replace(/_/g, ' ') || 'expansion'
    expansionNote = `NOTE: This is a ${relationType} for "${data.familyContext.baseGameName}". ` +
      `Focus on what this expansion ADDS or CHANGES - don't repeat base game information. ` +
      `Players reading this will already know the base game.`
  }

  return {
    wikipediaContext,
    familyContext,
    expansionNote,
  }
}

/**
 * Parse JSON fields from database (handles Json type)
 */
export function parseGameContextFromDb(game: {
  name: string
  year_published: number | null
  wikipedia_summary: Json | null
  wikipedia_gameplay: string | null
  wikipedia_origins: string | null
  wikipedia_reception: string | null
  wikipedia_awards: Json | null
  wikipedia_infobox: Json | null
}): Omit<GameContextData, 'familyContext' | 'isExpansion' | 'relationToBase'> {
  return {
    name: game.name,
    year_published: game.year_published,
    wikipedia_summary: game.wikipedia_summary as WikipediaSummary | null,
    wikipedia_gameplay: game.wikipedia_gameplay,
    wikipedia_origins: game.wikipedia_origins,
    wikipedia_reception: game.wikipedia_reception,
    wikipedia_awards: game.wikipedia_awards as WikipediaAward[] | null,
    wikipedia_infobox: game.wikipedia_infobox as WikipediaInfobox | null,
  }
}
