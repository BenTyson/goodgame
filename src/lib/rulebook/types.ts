/**
 * Rulebook Parser Types
 * Types for PDF parsing and content extraction
 */

// Parsed PDF metadata
export interface ParsedPDF {
  text: string
  pageCount: number
  wordCount: number
  metadata: {
    title?: string
    author?: string
    creator?: string
    producer?: string
  }
  extractedAt: Date
  processingTimeMs: number
}

// Extracted game data from rulebook
export interface ExtractedGameData {
  // Marketing content
  tagline?: string
  description?: string

  // Validation data (should match existing game data)
  playerCount?: {
    min: number
    max: number
    best?: number[]
  }
  playTime?: {
    min: number
    max: number
  }
  minAge?: number

  // Component list
  components?: ComponentList

  // Original content (AI-generated from rulebook)
  rulesOverview?: string
  setupSummary?: string
  turnStructure?: TurnPhase[]
  winCondition?: string
  endGameConditions?: string[]
  firstPlayerRule?: string

  // Raw sections for further processing
  rawSections?: RulebookSection[]
}

export interface ComponentList {
  cards?: number
  dice?: number
  tokens?: number
  boards?: number
  miniatures?: number
  tiles?: number
  meeples?: number
  cubes?: number
  other?: string[]
}

export interface TurnPhase {
  name: string
  description: string
  isOptional?: boolean
}

export interface RulebookSection {
  title: string
  content: string
  pageNumber?: number
}

// Crunch Score breakdown (1-10 scale)
export interface CrunchBreakdown {
  rulesDensity: number      // 1-10: Rulebook length/complexity ratio
  decisionSpace: number     // 1-10: Choices per turn
  learningCurve: number     // 1-10: Easy to learn = low
  strategicDepth: number    // 1-10: Hard to master = high
  componentComplexity: number // 1-10: Based on pieces/boards/cards
  reasoning: string         // AI explanation of the score
}

export interface CrunchResult {
  score: number             // 1.0-10.0 composite score
  breakdown: CrunchBreakdown
  confidence: 'high' | 'medium' | 'low'
  bggReference: number | null // BGG weight used for calibration (if any)
  generatedAt: Date
}

// Legacy aliases for backward compatibility
export type BNCSBreakdown = CrunchBreakdown
export type BNCSResult = Omit<CrunchResult, 'bggReference'>

// Publisher rulebook pattern
export interface PublisherPattern {
  publisherName: string
  urlPattern: string
  patternType: 'direct' | 'search' | 'resource_page'
  resourcePageUrl?: string
  isVerified: boolean
}

// Rulebook discovery result
export interface RulebookDiscoveryResult {
  found: boolean
  url?: string
  source?: 'publisher_website' | 'publisher_partnership' | 'bgg_files' | 'manual'
  confidence: 'high' | 'medium' | 'low'
  notes?: string
}

// Parse result with full data
export interface RulebookParseResult {
  success: boolean
  pdf?: ParsedPDF
  extractedData?: ExtractedGameData
  crunch?: CrunchResult
  bncs?: BNCSResult // Legacy alias
  error?: string
}

// AI-generated rules content structure (V3 - Quick Start Guide format)
export interface RulesContent {
  // NEW: What makes this game special (Phase 2)
  whatMakesThisSpecial?: {
    hook: string
    bestMoments: string[]
    perfectFor: string
    notFor?: string
  }
  // NEW: At-a-glance summary (Phase 2)
  atAGlance?: {
    goal: string
    onYourTurn: string
    gameEnds: string
    youWin: string
  }
  quickStart: string[]
  overview: string
  coreRules: {
    title: string
    summary?: string
    points: string[]
  }[]
  turnStructure: {
    phase: string
    description: string
    keyChoices?: string
  }[]
  scoring: {
    category: string
    points: string
    strategy?: string
  }[]
  endGameConditions: string[]
  winCondition: string
  keyTerms?: { term: string; definition: string }[]
  tips: string[]
  rulesNotes?: string[]
  // NEW: Teaching tips (Phase 2)
  teachingTips?: {
    openingExplanation: string
    startWithThis: string
    saveForLater: string
    commonQuestions?: string[]
  }
  // NEW: Complexity acknowledgment for heavy games (Phase 2)
  complexityNote?: string
}

// AI-generated setup content structure (V2 - richer content)
export interface SetupContent {
  overview: string
  estimatedTime?: string
  spaceRequired?: string
  beforeYouStart?: string[]
  components: {
    name: string
    quantity: string
    description: string
    sortingTip?: string
  }[]
  steps: {
    step: number
    title: string
    instruction: string
    details?: string
    tip?: string | null
  }[]
  playerSetup: {
    description: string
    items: string[]
    notes?: string
  }
  boardSetup?: {
    description: string
    steps: string[]
    playerCountVariations?: string | null
  }
  firstPlayerRule: string
  readyCheck?: string[]
  quickTips: string[]
  commonMistakes: string[]
  storageNotes?: string
}

// AI-generated reference card structure (V2 - richer content)
export interface ReferenceContent {
  turnSummary: {
    phase: string
    required?: boolean
    actions: string[]
    notes?: string | null
  }[]
  actionCosts?: {
    action: string
    cost: string
    effect: string
    limit?: string
  }[]
  resourceConversions?: {
    from: string
    to: string
    when: string
  }[]
  keyActions?: { action: string; cost?: string; effect: string }[]
  importantRules: { rule: string; context?: string }[] | string[]
  timingRules?: { situation: string; resolution: string }[]
  endGame: string | {
    triggers: string[]
    finalRound?: string
    winner: string
    tiebreakers?: string[]
  }
  scoringSummary: {
    category: string
    value?: string
    calculation?: string
    maxPossible?: string
  }[]
  iconography?: {
    symbol: string
    meaning: string
    examples?: string
  }[]
  commonQuestions?: { question: string; answer: string }[]
  quickReminders: string[]
}

// Content generation result
export interface ContentGenerationResult {
  success: boolean
  rulesContent?: RulesContent
  setupContent?: SetupContent
  referenceContent?: ReferenceContent
  errors?: {
    rules?: string
    setup?: string
    reference?: string
  }
  processingTimeMs: number
}

// =====================================================
// Structured Parsed Text Types
// For categorized/cleaned rulebook text (AI Q&A feature)
// =====================================================

/** Standard section types for rulebook categorization */
export type RulebookSectionType =
  | 'overview'
  | 'components'
  | 'setup'
  | 'gameplay'
  | 'turns'
  | 'actions'
  | 'scoring'
  | 'variants'
  | 'glossary'
  | 'faq'
  | 'other'

/** A categorized section from the rulebook */
export interface StructuredSection {
  /** Standard section type */
  type: RulebookSectionType
  /** Original section title from the PDF */
  title: string
  /** Cleaned section content */
  content: string
  /** Word count for this section */
  wordCount: number
}

/** Metadata about the parsing/cleaning process */
export interface StructuredParseMetadata {
  /** Total sections detected */
  totalSections: number
  /** Total words in cleaned text */
  totalWords: number
  /** Cleaning operations applied */
  cleaningApplied: string[]
}

/** Complete structured parsed text object stored in DB */
export interface ParsedTextStructured {
  /** Schema version for future compatibility */
  version: 1
  /** Full cleaned text (all sections combined) */
  cleanedText: string
  /** Categorized sections */
  sections: StructuredSection[]
  /** Parsing metadata */
  metadata: StructuredParseMetadata
}
