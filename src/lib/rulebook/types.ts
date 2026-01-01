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

// BNCS (Board Nomads Complexity Score) breakdown
export interface BNCSBreakdown {
  rulesDensity: number      // 1-5: Rulebook length/complexity ratio
  decisionSpace: number     // 1-5: Choices per turn
  learningCurve: number     // 1-5: Easy to learn = low
  strategicDepth: number    // 1-5: Hard to master = high
  componentComplexity: number // 1-5: Based on pieces/boards/cards
  reasoning: string         // AI explanation of the score
}

export interface BNCSResult {
  score: number             // 1.0-5.0 composite score
  breakdown: BNCSBreakdown
  confidence: 'high' | 'medium' | 'low'
  generatedAt: Date
}

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
  bncs?: BNCSResult
  error?: string
}

// AI-generated rules content structure
export interface RulesContent {
  quickStart: string[]
  overview: string
  coreRules: { title: string; points: string[] }[]
  turnStructure: { phase: string; description: string }[]
  scoring: { category: string; points: string }[]
  endGameConditions: string[]
  winCondition: string
  tips: string[]
}

// AI-generated setup content structure
export interface SetupContent {
  overview: string
  estimatedTime?: string
  beforeYouStart?: string[]
  components: { name: string; quantity: string; description: string }[]
  steps: { step: number; title: string; instruction: string; tip?: string }[]
  playerSetup: { description: string; items: string[] }
  firstPlayerRule: string
  quickTips: string[]  // Matches admin form field name
  commonMistakes: string[]
}

// AI-generated reference card structure
export interface ReferenceContent {
  turnSummary: { phase: string; actions: string[] }[]
  keyActions: { action: string; cost?: string; effect: string }[]
  importantRules: string[]
  endGame: string  // Matches admin form field name
  scoringSummary: { category: string; value: string }[]
  iconography?: { symbol: string; meaning: string }[]
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
