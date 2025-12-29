/**
 * Game Recommendation Engine Types
 */

// Question types for the wizard
export type QuestionType = 'scenario' | 'slider' | 'this-or-that' | 'multi-select'

// Player count options
export type PlayerCountOption = 'solo' | 'partner' | 'small-group' | 'party'

// Play time options
export type PlayTimeOption = 'quick' | 'standard' | 'long' | 'epic'

// Experience level options
export type ExperienceLevel = 'new' | 'casual' | 'experienced' | 'hardcore'

// Experience type (what kind of game)
export type ExperienceType =
  | 'competitive'
  | 'cooperative'
  | 'strategic'
  | 'social'
  | 'narrative'

// Theme/world preference
export type ThemeWorld =
  | 'swords-sorcery'    // Fantasy, dungeons, dragons, quests
  | 'stars-cosmos'      // Sci-fi, space, aliens, tech
  | 'empires-ages'      // Historical, civilization, war
  | 'mystery-shadows'   // Horror, noir, detective, survival
  | 'hearth-harvest'    // Nature, farming, animals, cozy
  | 'surprise-me'       // Don't care / open to anything

// Gamer archetype IDs
export type ArchetypeId =
  | 'strategist'
  | 'social-butterfly'
  | 'team-player'
  | 'storyteller'
  | 'quick-draw'
  | 'curator'

// Wizard answers collected from user
export interface WizardAnswers {
  playerCount?: PlayerCountOption
  playTime?: PlayTimeOption
  experienceLevel?: ExperienceLevel
  experienceType?: ExperienceType
  themeWorld?: ThemeWorld
  themes?: string[]
  mechanicLikes?: string[]
}

// Derived preference signals for scoring
export interface RecommendationSignals {
  playerCountMin: number
  playerCountMax: number
  playTimeMin: number
  playTimeMax: number
  weightMin: number
  weightMax: number
  preferredCategories: string[]
  preferredMechanics: string[]
  preferredThemes: string[]  // Theme keywords derived from themeWorld
}

// A single question in the wizard
export interface WizardQuestion {
  id: string
  type: QuestionType
  title: string
  subtitle?: string
  options?: QuestionOption[]
  // For slider questions
  min?: number
  max?: number
  step?: number
  labels?: string[]
  // Whether this question can be skipped
  skippable?: boolean
  // Condition for showing this question
  showIf?: (answers: WizardAnswers) => boolean
}

// An option for scenario/this-or-that questions
export interface QuestionOption {
  id: string
  label: string
  description?: string
  icon?: string // Lucide icon name
}

// Full wizard state
export interface WizardState {
  currentStep: number
  totalSteps: number
  answers: WizardAnswers
  isComplete: boolean
  isLoading: boolean
  archetype: Archetype | null
  recommendations: GameRecommendation[] | null
  alsoConsider: GameSuggestion[] | null
  error: string | null
}

// Wizard action types for reducer
export type WizardAction =
  | { type: 'SET_ANSWER'; questionId: string; value: unknown }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SKIP_STEP' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_RESULTS'; archetype: Archetype; recommendations: GameRecommendation[]; alsoConsider: GameSuggestion[] }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESTART' }

// Gamer archetype definition
export interface Archetype {
  id: ArchetypeId
  name: string
  icon: string // Lucide icon name
  description: string
  color: string // Tailwind color class
}

// A single game recommendation
export interface GameRecommendation {
  gameId: string
  rank: 1 | 2 | 3
  confidence: 'high' | 'medium'
  personalizedReason: string
  playPitch: string
  perfectFor: string
  // Game details (joined from DB)
  game: {
    id: string
    name: string
    slug: string
    description: string | null
    thumbnail_url: string | null
    player_count_min: number
    player_count_max: number
    play_time_min: number | null
    play_time_max: number | null
    weight: number | null
    categories?: string[]
    mechanics?: string[]
  }
}

// API request for recommendations
export interface RecommendationRequest {
  answers: WizardAnswers
  userId?: string // If logged in
}

// A simpler game entry for "also consider" section
export interface GameSuggestion {
  id: string
  name: string
  slug: string
  thumbnail_url: string | null
  player_count_min: number
  player_count_max: number
  weight: number | null
}

// API response with recommendations
export interface RecommendationResponse {
  archetype: Archetype
  recommendations: GameRecommendation[]
  alsoConsider: GameSuggestion[] // Additional 3-4 games
  meta: {
    totalCandidates: number
    processingTimeMs: number
  }
}

// Refinement options
export interface RefinementOption {
  id: string
  label: string
  action: 'increase' | 'decrease' | 'toggle' | 'exclude'
  attribute: keyof RecommendationSignals | 'excludeGames'
  value?: string | number
}
