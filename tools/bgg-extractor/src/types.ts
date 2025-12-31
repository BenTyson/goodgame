/**
 * BGG Extractor Types
 *
 * These types define the structure of legally extractable factual data
 * from BoardGameGeek's public API.
 *
 * LEGAL NOTE: All data extracted is factual/public information:
 * - Game names, years, player counts, playtimes (printed on box)
 * - Designer/publisher/artist names (public credits)
 * - Relationships (expansions, families - publisher stated)
 * - Category/mechanic classifications (taxonomy)
 *
 * We do NOT extract:
 * - BGG descriptions (user-contributed, BGG claims rights)
 * - BGG ratings/rankings (proprietary aggregated data)
 * - BGG weight scores (user-voted, proprietary)
 */

// Entity with BGG ID for enrichment
export interface BGGEntity {
  bgg_id: number
  name: string
}

// Relationship direction
export type ExpansionDirection = 'expands' | 'expanded_by'
export type ImplementationDirection = 'reimplements' | 'reimplemented_by'
export type CompilationDirection = 'contains' | 'contained_in'

// Relationship types
export interface ExpansionLink extends BGGEntity {
  direction: ExpansionDirection
}

export interface ImplementationLink extends BGGEntity {
  direction: ImplementationDirection
}

export interface CompilationLink extends BGGEntity {
  direction: CompilationDirection
}

// Rulebook hint from BGG files page
export interface RulebookHint {
  filename: string
  language?: string  // 'en', 'de', 'fr', etc.
  type: 'rulebook' | 'faq' | 'reference' | 'other'
}

// Complete extracted game data
export interface ExtractedGame {
  // === Core Factual Data ===
  bgg_id: number
  name: string
  alternate_names: string[]
  year_published: number | null

  // Player count (printed on box)
  min_players: number | null
  max_players: number | null

  // Playtime (printed on box)
  min_playtime: number | null
  max_playtime: number | null

  // Age (printed on box)
  min_age: number | null

  // Image URLs (stored as reference, not displayed)
  image_url: string | null
  thumbnail_url: string | null

  // === Entities with BGG IDs ===
  designers: BGGEntity[]
  publishers: BGGEntity[]
  artists: BGGEntity[]
  categories: BGGEntity[]
  mechanics: BGGEntity[]

  // === Relationships ===
  expansions: ExpansionLink[]
  implementations: ImplementationLink[]
  families: BGGEntity[]
  integrations: BGGEntity[]
  compilations: CompilationLink[]

  // === Rulebook Hints ===
  rulebook_hints: RulebookHint[]

  // === Metadata ===
  extracted_at: string  // ISO date
}

// Publisher details (from secondary fetch)
export interface ExtractedPublisher {
  bgg_id: number
  name: string
  website: string | null
  extracted_at: string
}

// Designer details (from secondary fetch)
export interface ExtractedDesigner {
  bgg_id: number
  name: string
  website: string | null
  extracted_at: string
}

// Extraction output
export interface ExtractionResult {
  games: ExtractedGame[]
  stats: {
    total_games: number
    total_designers: number
    total_publishers: number
    total_artists: number
    total_families: number
    total_expansions: number
    extraction_date: string
    extraction_duration_ms: number
  }
}
