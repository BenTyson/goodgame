/**
 * Rulebook Processing Module
 * PDF parsing, AI extraction, and Crunch Score generation
 */

// Types
export type {
  ParsedPDF,
  ExtractedGameData,
  ComponentList,
  TurnPhase,
  RulebookSection,
  CrunchBreakdown,
  CrunchResult,
  BNCSBreakdown,  // Legacy alias
  BNCSResult,     // Legacy alias
  PublisherPattern,
  RulebookDiscoveryResult,
  RulebookParseResult,
  RulesContent,
  SetupContent,
  ReferenceContent,
  ContentGenerationResult,
} from './types'

// Parser
export {
  parsePdfFromUrl,
  parsePdfFromBuffer,
  extractSections,
  findComponentsSection,
  estimateComplexityFromMetrics,
} from './parser'

// Prompts
export {
  RULEBOOK_SYSTEM_PROMPT,
  getDataExtractionPrompt,
  getCrunchScorePrompt,
  getBNCSPrompt,  // Legacy alias
  getRulesSummaryPrompt,
  getSetupGuidePrompt,
  getReferenceCardPrompt,
  // Enhanced prompts with full context support (Vecna pipeline)
  getEnhancedRulesSummaryPrompt,
  getEnhancedSetupGuidePrompt,
  getEnhancedReferenceCardPrompt,
} from './prompts'

// Complexity scoring (Crunch Score)
export {
  generateCrunchScore,
  generateBNCS,  // Legacy alias
  normalizeBGGWeight,
  calculateCalibratedScore,
  getCrunchLabel,
  getCrunchColor,
  formatCrunchBreakdown,
  getCrunchProfile,
  getCrunchBadgeClasses,
  // Legacy aliases
  getComplexityLabel,
  getComplexityColor,
  formatBNCSBreakdown,
  compareToBGGWeight,
  getComplexityProfile,
} from './complexity'

// Discovery
export {
  PUBLISHER_PATTERNS,
  discoverRulebookUrl,
  discoverFromPublisherWebsite,
  discoverRulebookWithFallback,
  searchForRulebook,
  getPublisherResourcePage,
  getPublisherPatterns,
  validateRulebookUrl,
} from './discovery'
