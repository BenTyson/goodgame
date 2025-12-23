/**
 * AI Content Generation Module
 *
 * Uses Claude to generate unique game content:
 * - Rules summaries
 * - Setup guides
 * - Quick reference cards
 */

// Claude client
export { generate, generateJSON, type GenerationResult } from './claude'

// Prompts
export {
  SYSTEM_PROMPT,
  PROMPT_VERSION,
  getRulesPrompt,
  getSetupPrompt,
  getReferencePrompt,
  getAllPrompts,
} from './prompts'

// Generator
export {
  generateRulesContent,
  generateSetupContent,
  generateReferenceContent,
  generateAllContent,
  generateContentForNextGame,
  getGenerationStats,
  type ContentType,
  type GenerationStats,
} from './generator'
