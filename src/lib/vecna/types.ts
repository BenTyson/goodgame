/**
 * Vecna Pipeline Types
 *
 * Type definitions for the automated game content pipeline.
 */

// Processing state for individual games
export type VecnaState =
  | 'imported'           // BGG data imported
  | 'enriched'           // Wikidata + Wikipedia done
  | 'rulebook_missing'   // Waiting for manual rulebook URL
  | 'rulebook_ready'     // Rulebook URL confirmed
  | 'parsing'            // Rulebook being parsed
  | 'parsed'             // Rulebook text extracted
  | 'taxonomy_assigned'  // Categories/mechanics assigned
  | 'generating'         // AI content being generated
  | 'generated'          // AI content ready
  | 'review_pending'     // Ready for human review
  | 'published'          // Live on site

// State display configuration
export const VECNA_STATE_CONFIG: Record<VecnaState, {
  label: string
  description: string
  color: string
  icon: string
  canProgress: boolean
}> = {
  imported: {
    label: 'Imported',
    description: 'BGG data imported, awaiting enrichment',
    color: 'text-slate-500',
    icon: 'Download',
    canProgress: true,
  },
  enriched: {
    label: 'Enriched',
    description: 'Wikidata + Wikipedia data fetched',
    color: 'text-blue-500',
    icon: 'Database',
    canProgress: true,
  },
  rulebook_missing: {
    label: 'No Rulebook',
    description: 'Waiting for manual rulebook URL',
    color: 'text-amber-500',
    icon: 'AlertCircle',
    canProgress: false,
  },
  rulebook_ready: {
    label: 'Rulebook Ready',
    description: 'Rulebook URL confirmed',
    color: 'text-green-500',
    icon: 'FileCheck',
    canProgress: true,
  },
  parsing: {
    label: 'Parsing',
    description: 'Extracting text from rulebook',
    color: 'text-violet-500',
    icon: 'Loader2',
    canProgress: false,
  },
  parsed: {
    label: 'Parsed',
    description: 'Rulebook text extracted',
    color: 'text-violet-600',
    icon: 'FileText',
    canProgress: true,
  },
  taxonomy_assigned: {
    label: 'Categorized',
    description: 'Categories/mechanics assigned',
    color: 'text-indigo-500',
    icon: 'Tags',
    canProgress: true,
  },
  generating: {
    label: 'Generating',
    description: 'AI content being generated',
    color: 'text-cyan-500',
    icon: 'Sparkles',
    canProgress: false,
  },
  generated: {
    label: 'Generated',
    description: 'AI content ready for review',
    color: 'text-cyan-600',
    icon: 'CheckCircle2',
    canProgress: true,
  },
  review_pending: {
    label: 'Review',
    description: 'Ready for human review',
    color: 'text-amber-600',
    icon: 'Eye',
    canProgress: true,
  },
  published: {
    label: 'Published',
    description: 'Live on site',
    color: 'text-green-600',
    icon: 'Globe',
    canProgress: false,
  },
}

// Family context for expansion processing
export interface FamilyContext {
  baseGameId: string
  baseGameName: string
  coreMechanics: string[]         // From base game taxonomy or Wikipedia
  coreTheme: string | null        // From base game theme/Wikipedia
  baseSetupSummary: string | null // From base game setup_content
  baseRulesOverview: string | null // From base game rules_content.overview
  componentTypes: string[]        // From base game component_list
}

// Game with family and processing state
export interface VecnaGame {
  id: string
  name: string
  slug: string
  year_published: number | null
  thumbnail_url: string | null

  // Processing state
  vecna_state: VecnaState
  vecna_processed_at: string | null
  vecna_error: string | null

  // Relation info
  relation_type?: string        // expansion_of, sequel_to, etc.
  relation_to_base?: string     // Name of base game

  // Data status flags
  has_rulebook: boolean
  has_wikipedia: boolean
  has_wikidata: boolean
  has_content: boolean
  is_published: boolean

  // Crunch score
  crunch_score: number | null

  // =====================================================
  // BGG Data
  // =====================================================
  bgg_id: number | null
  bgg_raw_data: BggRawData | null
  bgg_last_synced: string | null

  // Direct BGG fields (for convenience)
  weight: number | null              // BGG complexity weight 1-5
  min_age: number | null
  player_count_min: number | null
  player_count_max: number | null
  play_time_min: number | null
  play_time_max: number | null

  // =====================================================
  // Wikidata
  // =====================================================
  wikidata_id: string | null
  wikidata_image_url: string | null  // CC-licensed image
  wikidata_series_id: string | null  // Series membership
  official_website: string | null    // From Wikidata P856
  wikidata_last_synced: string | null

  // =====================================================
  // Wikipedia
  // =====================================================
  wikipedia_url: string | null
  wikipedia_summary: WikipediaSummary | null       // AI-generated summary
  wikipedia_infobox: WikipediaInfobox | null       // Structured infobox data
  wikipedia_gameplay: string | null                // Gameplay section
  wikipedia_origins: string | null                 // Origins/History section
  wikipedia_reception: string | null               // Reception section
  wikipedia_images: WikipediaImage[] | null        // Article images with licenses
  wikipedia_external_links: WikipediaExternalLink[] | null  // Categorized links
  wikipedia_awards: WikipediaAward[] | null        // Structured awards
  wikipedia_search_confidence: 'high' | 'medium' | 'low' | null
  wikipedia_fetched_at: string | null

  // =====================================================
  // Rulebook & Content
  // =====================================================
  rulebook_url: string | null
  rulebook_source: string | null     // 'wikidata' | 'wikipedia' | 'publisher_pattern' | 'manual'

  // Generated content
  rules_content: RulesContent | null
  setup_content: SetupContent | null
  reference_content: ReferenceContent | null
  content_generated_at: string | null

  // =====================================================
  // Other
  // =====================================================
  description: string | null

  // Images
  box_image_url: string | null
  hero_image_url: string | null

  // Taxonomy (with source tracking)
  categories: Array<{ id: string; name: string; slug: string; is_primary: boolean; source: string | null }>
  mechanics: Array<{ id: string; name: string; slug: string; source: string | null }>
  themes: Array<{ id: string; name: string; slug: string; source: string | null }>
}

// Taxonomy source type (for documentation)
export type TaxonomySource = 'bgg' | 'wikidata' | 'wikipedia' | 'ai' | 'manual'

// BGG raw data structure (comprehensive)
export interface BggRawData {
  // Core identifiers
  id?: number
  type?: string  // 'boardgame' | 'boardgameexpansion'
  name?: string
  alternateNames?: string[]

  // Basic info
  yearpublished?: number
  minplayers?: number
  maxplayers?: number
  minplaytime?: number
  maxplaytime?: number
  playingTime?: number
  minAge?: number
  description?: string

  // Images
  thumbnail?: string
  image?: string

  // BGG metrics (internal use only - not for public display)
  weight?: number      // BGG complexity weight 1-5
  rating?: number      // BGG average rating
  numRatings?: number  // Number of ratings
  rank?: number | null // BGG overall rank

  // People
  designers?: string[]
  artists?: string[]
  publishers?: string[]

  // Taxonomy
  categories?: string[]
  mechanics?: string[]
  categoryLinks?: Array<{ id: number; name: string }>
  mechanicLinks?: Array<{ id: number; name: string }>

  // Relations
  families?: Array<{ id: number; name: string }>
  expansions?: Array<{ id: number; name: string }>
  expandsGame?: { id: number; name: string } | null
  implementations?: Array<{ id: number; name: string }>
  implementsGame?: { id: number; name: string } | null

  // Allow additional fields
  [key: string]: unknown
}

// Wikipedia summary structure (AI-generated)
export interface WikipediaSummary {
  summary?: string
  themes?: string[]
  mechanics?: string[]
  reception?: string
  awards?: string[]
}

// Wikipedia infobox structure (extracted from article)
export interface WikipediaInfobox {
  designer?: string[]
  publisher?: string[]
  players?: string
  playingTime?: string
  setupTime?: string
  ages?: string
  releaseDate?: string
  genre?: string
  skills?: string[]
  website?: string
  series?: string
  expansion?: string
  publishersWithRegion?: Array<{ name: string; region?: string; isPrimary?: boolean }>
  image?: string
  imageCaption?: string
  mechanics?: string[]
  themes?: string[]
  complexity?: string
  minPlayers?: string
  maxPlayers?: string
  recommendedPlayers?: string
  playerElimination?: boolean
  bggId?: string
}

// Wikipedia image with metadata
export interface WikipediaImage {
  filename: string
  url?: string
  thumbUrl?: string
  width?: number
  height?: number
  caption?: string
  license?: string
  isPrimary?: boolean
}

// Wikipedia external link (categorized)
export interface WikipediaExternalLink {
  url: string
  type: 'official' | 'rulebook' | 'publisher' | 'store' | 'video' | 'review' | 'other'
  domain?: string
}

// Wikipedia award (structured)
export interface WikipediaAward {
  name: string
  year?: number
  result: 'winner' | 'nominated' | 'finalist' | 'recommended' | 'unknown'
}

// Content types for display
export interface RulesContent {
  quickStart?: string[]
  coreRules?: Array<{ title: string; content: string }>
  turnStructure?: Array<{ phase: string; description: string }>
  endGameConditions?: string[]
  winCondition?: string
  tips?: string[]
}

export interface SetupContent {
  estimatedTime?: string
  steps?: Array<{ step: string; details?: string }>
  components?: Array<{ name: string; quantity?: number | string; description?: string }>
  playerSetup?: string
  firstPlayerRule?: string
  quickTips?: string[]
  commonMistakes?: string[]
}

export interface ReferenceContent {
  turnSummary?: Array<{ phase: string; actions: string[] }>
  keyActions?: Array<{ name: string; description: string; cost?: string }>
  importantRules?: Array<{ rule: string; clarification?: string }>
  endGame?: string | {
    winner?: string
    triggers?: string[]
    finalRound?: string
    tiebreakers?: string[]
  }
  scoringSummary?: Array<{ category: string; points: string }>
}

// Family with games for sidebar
export interface VecnaFamily {
  id: string
  name: string
  slug: string
  base_game_id: string | null
  family_context: FamilyContext | null

  // Games in processing order
  games: VecnaGame[]

  // Aggregate stats
  total_games: number
  published_count: number
  ready_for_review_count: number
  missing_rulebook_count: number
}

// Pipeline progress for a family
export interface PipelineProgress {
  familyId: string
  currentGameId: string | null
  currentStage: VecnaState | null

  // Overall progress
  totalGames: number
  completedGames: number
  progressPercent: number

  // Stage breakdown
  stageBreakdown: Record<VecnaState, number>

  // Blockers
  gamesNeedingRulebook: string[]
  gamesWithErrors: Array<{ gameId: string; error: string }>
}

// Data source for unified view
export type DataSource = 'bgg' | 'wikidata' | 'wikipedia' | 'manual' | 'ai'

// Unified data field with source tracking
export interface SourcedField<T> {
  value: T
  source: DataSource
  confidence?: 'high' | 'medium' | 'low'
  lastUpdated?: string
}

// Game data unified view - shows all sources for comparison
export interface UnifiedGameData {
  // Core info
  name: SourcedField<string>
  description: SourcedField<string> | null
  year_published: SourcedField<number> | null

  // Player info
  min_players: SourcedField<number> | null
  max_players: SourcedField<number> | null
  min_playtime: SourcedField<number> | null
  max_playtime: SourcedField<number> | null

  // Images
  images: Array<{
    url: string
    source: DataSource
    type: 'box' | 'gameplay' | 'components' | 'hero'
    license?: string  // For Wikipedia images
    attribution?: string
  }>

  // External links
  rulebook_urls: Array<{
    url: string
    source: DataSource
    label?: string
  }>
  official_urls: Array<{
    url: string
    source: DataSource
    label?: string
  }>

  // Taxonomy from multiple sources
  categories: Array<SourcedField<string>>
  mechanics: Array<SourcedField<string>>
  themes: Array<SourcedField<string>>

  // Wikipedia content sections
  wikipedia: {
    summary: string | null
    gameplay: string | null
    origins: string | null
    reception: string | null
    awards: Array<{
      name: string
      year: number | null
      status: 'winner' | 'nominated' | 'finalist'
    }>
  } | null

  // Publisher info
  publishers: Array<{
    name: string
    source: DataSource
    region?: string
    isPrimary: boolean
    website?: string
  }>

  // Designers
  designers: Array<{
    name: string
    source: DataSource
  }>
}

// Processing action for pipeline control
export type PipelineAction =
  | 'start'           // Start processing family
  | 'pause'           // Pause at current step
  | 'resume'          // Resume from pause
  | 'skip_game'       // Skip current game
  | 'retry_game'      // Retry failed game
  | 'set_rulebook'    // Set rulebook URL manually
  | 'approve_review'  // Approve game in review
  | 'reject_review'   // Reject and re-generate

// API response for pipeline operations
export interface PipelineResponse {
  success: boolean
  message: string
  progress?: PipelineProgress
  error?: string
}
