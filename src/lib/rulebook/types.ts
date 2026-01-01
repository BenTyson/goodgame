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

// AI-generated rules content structure (V2 - richer content)
export interface RulesContent {
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
