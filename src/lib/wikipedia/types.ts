/**
 * Wikipedia Integration Types
 * Shared TypeScript interfaces for Wikipedia API integration
 */

// =====================================================
// Search Types
// =====================================================

export interface WikipediaSearchResult {
  title: string
  url: string
  snippet: string
  confidence: 'high' | 'medium' | 'low'
}

export interface ValidationResult {
  isMatch: boolean
  confidence: 'high' | 'medium' | 'low'
  isDisambiguation: boolean
  score: number
  reasons: string[]
}

// =====================================================
// Infobox Types
// =====================================================

export interface WikipediaInfobox {
  designer?: string[]
  publisher?: string[]
  players?: string // e.g., "2-4"
  playingTime?: string // e.g., "30-60 minutes"
  setupTime?: string
  ages?: string // e.g., "10+"
  releaseDate?: string
  genre?: string
  skills?: string[]
  website?: string
  series?: string
  expansion?: string // Links to expansions
  randomChance?: string
  publishersWithRegion?: WikipediaPublisher[] // Enhanced publisher data with regions
  // New fields - Tier 1 extraction
  image?: string // Infobox image filename
  imageCaption?: string // Image caption
  mechanics?: string[] // Game mechanics from infobox
  themes?: string[] // Game themes from infobox
  complexity?: string // Complexity rating
  minPlayers?: string // Minimum players (structured)
  maxPlayers?: string // Maximum players (structured)
  recommendedPlayers?: string // Optimal player count
  playerElimination?: boolean // Whether players can be eliminated
  bggId?: string // BGG cross-reference ID
}

/**
 * Publisher with regional/localization info
 * Extracted from Wikipedia infobox publisher field
 */
export interface WikipediaPublisher {
  name: string
  region?: string // e.g., "U.S.", "Greece", "Japan", "Germany"
  isPrimary?: boolean // First publisher or marked as original
}

/**
 * Wikipedia article image with metadata
 */
export interface WikipediaImage {
  filename: string // File:Example.jpg
  url?: string // Full Commons URL
  thumbUrl?: string // Thumbnail URL
  width?: number
  height?: number
  caption?: string
  license?: string
  isPrimary?: boolean // Main/cover image
}

/**
 * Categorized external link from Wikipedia article
 */
export interface WikipediaExternalLink {
  url: string
  type: 'official' | 'rulebook' | 'publisher' | 'store' | 'video' | 'review' | 'other'
  domain?: string // Extracted domain for display
}

/**
 * Structured award information
 */
export interface WikipediaAward {
  name: string // e.g., "Spiel des Jahres"
  year?: number
  result: 'winner' | 'nominated' | 'finalist' | 'recommended' | 'unknown'
}

// =====================================================
// Section Types
// =====================================================

export interface SectionInfo {
  index: number
  title: string
  level: number // Heading level (1-6)
}

export interface WikipediaSections {
  origins?: string // "History", "Origins", "Development", "Background", "Design"
  reception?: string // "Reception", "Critical reception", "Reviews"
  gameplay?: string // "Gameplay", "Rules"
  expansions?: string // "Expansions", "Variants"
}

// =====================================================
// Category Types
// =====================================================

export interface CategoryMapping {
  wikipediaCategory: string
  taxonomyType: 'category' | 'mechanic' | 'theme' | 'experience'
  taxonomySlug: string
  confidence: 'high' | 'medium' | 'low'
}

// =====================================================
// Relations Types
// =====================================================

export interface WikipediaRelation {
  title: string
  url: string
  relationType: 'expansion' | 'sequel' | 'related' | 'unknown'
  confidence: 'high' | 'medium' | 'low'
  source: 'infobox' | 'see_also' | 'article_link'
}

export interface MatchedRelation extends WikipediaRelation {
  gameId: string
  gameName: string
  bggId?: number
}

// =====================================================
// Enrichment Result Types
// =====================================================

export interface WikipediaEnrichmentResult {
  found: boolean
  url: string | null
  articleTitle: string | null
  infobox: WikipediaInfobox | null
  sections: WikipediaSections | null
  categories: string[]
  relations: WikipediaRelation[]
  categoryMappings: CategoryMapping[]
  searchConfidence?: 'high' | 'medium' | 'low'
  error: string | null
  // New fields - Tier 1 extraction
  images: WikipediaImage[]
  externalLinks: WikipediaExternalLink[]
  awards: WikipediaAward[]
  gameplay?: string // Gameplay section content
}

// =====================================================
// API Response Types
// =====================================================

// OpenSearch returns an array: [query, titles[], descriptions[], urls[]]
export type MediaWikiOpenSearchResponse = [string, string[], string[], string[]]

export interface MediaWikiQueryResponse {
  query: {
    pages: Record<
      string,
      {
        pageid?: number
        ns?: number
        title: string
        missing?: boolean
        extract?: string
        categories?: Array<{ ns: number; title: string }>
        links?: Array<{ ns: number; title: string }>
        extlinks?: Array<{ url: string }>
        images?: Array<{ ns: number; title: string }> // Image file names
        imageinfo?: Array<{
          url: string
          descriptionurl: string
          width: number
          height: number
          mime: string
          thumburl?: string
          extmetadata?: {
            LicenseShortName?: { value: string }
            ImageDescription?: { value: string }
          }
        }>
        pageprops?: {
          disambiguation?: string
          wikibase_item?: string
        }
      }
    >
    search?: Array<{
      ns: number
      title: string
      pageid: number
      size: number
      wordcount: number
      snippet: string
      timestamp: string
    }>
  }
}

export interface MediaWikiParseResponse {
  parse: {
    title: string
    pageid: number
    wikitext?: { '*': string }
    sections?: Array<{
      toclevel: number
      level: string
      line: string
      number: string
      index: string
      fromtitle: string
      byteoffset: number
      anchor: string
    }>
    text?: { '*': string }
  }
}
