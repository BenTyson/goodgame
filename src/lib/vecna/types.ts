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

  // External data summary
  rulebook_url: string | null
  wikipedia_url: string | null
  wikidata_id: string | null

  // Generated content (for review)
  rules_content: RulesContent | null
  setup_content: SetupContent | null
  reference_content: ReferenceContent | null

  // Source data for comparison
  bgg_raw_data: BggRawData | null
  wikipedia_summary: WikipediaSummary | null
  wikipedia_gameplay: string | null
  wikipedia_origins: string | null
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

// BGG raw data structure
export interface BggRawData {
  name?: string
  yearpublished?: number
  minplayers?: number
  maxplayers?: number
  minplaytime?: number
  maxplaytime?: number
  description?: string
  thumbnail?: string
  image?: string
  weight?: number
  [key: string]: unknown
}

// Wikipedia summary structure
export interface WikipediaSummary {
  summary?: string
  themes?: string[]
  mechanics?: string[]
  reception?: string
  awards?: string[]
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
