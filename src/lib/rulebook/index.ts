/**
 * Rulebook Processing Module
 * PDF parsing, AI extraction, and BNCS scoring
 */

// Types
export type {
  ParsedPDF,
  ExtractedGameData,
  ComponentList,
  TurnPhase,
  RulebookSection,
  BNCSBreakdown,
  BNCSResult,
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
  getBNCSPrompt,
  getRulesSummaryPrompt,
  getSetupGuidePrompt,
  getReferenceCardPrompt,
} from './prompts'

// Complexity scoring
export {
  generateBNCS,
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
