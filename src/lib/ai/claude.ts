/**
 * Claude AI Client
 * Wrapper for Anthropic SDK with retry logic and cost tracking
 */

import Anthropic from '@anthropic-ai/sdk'

// Initialize client (uses ANTHROPIC_API_KEY env var automatically)
const anthropic = new Anthropic()

// Model configuration
// Claude 3.5 models use format: claude-3-5-{model}-{date}
// Claude 4.5 models use format: claude-{model}-4-5 (no -latest suffix)
const DEFAULT_MODEL = 'claude-3-5-haiku-20241022'
const MAX_TOKENS = 4096

// Cost per 1M tokens
const COSTS: Record<string, { input: number; output: number }> = {
  // Claude 3.5 models
  'claude-3-5-haiku-20241022': { input: 1.00, output: 5.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  // Claude 4.5 models (if available)
  'claude-haiku-4-5': { input: 1.00, output: 5.00 },
  'claude-sonnet-4-5': { input: 3.00, output: 15.00 },
}

export interface GenerationResult {
  content: string
  model: string
  tokensInput: number
  tokensOutput: number
  costUsd: number
  durationMs: number
}

export interface GenerationOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  retries?: number
}

/**
 * Calculate cost in USD for a generation
 */
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = COSTS[model as keyof typeof COSTS] || COSTS[DEFAULT_MODEL]
  return (inputTokens * costs.input + outputTokens * costs.output) / 1_000_000
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate content using Claude
 */
export async function generate(
  systemPrompt: string,
  userPrompt: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  const model = options.model || DEFAULT_MODEL
  const maxTokens = options.maxTokens || MAX_TOKENS
  const temperature = options.temperature ?? 0.7
  const maxRetries = options.retries ?? 3

  let lastError: Error | null = null
  const startTime = Date.now()

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      const tokensInput = response.usage.input_tokens
      const tokensOutput = response.usage.output_tokens
      const costUsd = calculateCost(model, tokensInput, tokensOutput)
      const durationMs = Date.now() - startTime

      return {
        content: content.text,
        model,
        tokensInput,
        tokensOutput,
        costUsd,
        durationMs,
      }

    } catch (error) {
      lastError = error as Error
      console.error(`Claude API error (attempt ${attempt + 1}/${maxRetries}):`, error)

      // Don't retry on auth errors
      if (error instanceof Anthropic.AuthenticationError) {
        throw error
      }

      // Exponential backoff for rate limits
      if (error instanceof Anthropic.RateLimitError) {
        const waitTime = Math.pow(2, attempt) * 1000
        await sleep(waitTime)
        continue
      }

      // Wait before retry for other errors
      if (attempt < maxRetries - 1) {
        await sleep(1000 * (attempt + 1))
      }
    }
  }

  throw lastError || new Error('Generation failed after retries')
}

/**
 * Attempt to repair common JSON syntax issues from AI responses
 */
function repairJSON(str: string): string {
  let result = str

  // IMPORTANT: Fix quotes used as apostrophes in contractions/possessives
  // Pattern: word + any quote + letter (like Martin"s) -> word + apostrophe + letter
  // Must do this BEFORE general quote replacement to avoid breaking JSON structure

  // Replace straight double quote used as apostrophe
  result = result.replace(/(\w)"([a-zA-Z])/g, "$1'$2")
  // Replace smart double quotes used as apostrophe
  result = result.replace(/(\w)[\u201C\u201D]([a-zA-Z])/g, "$1'$2")
  // Replace smart single quotes used as apostrophe (normalize to straight)
  result = result.replace(/(\w)[\u2018\u2019]([a-zA-Z])/g, "$1'$2")

  // Replace remaining smart/curly double quotes with straight quotes
  result = result.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
  // Replace smart/curly single quotes with straight single quotes
  result = result.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")

  // Replace other unicode quote-like characters
  result = result.replace(/[\u00AB\u00BB]/g, '"')  // Guillemets
  result = result.replace(/[\u2039\u203A]/g, "'")  // Single guillemets

  // Remove trailing commas before } or ]
  result = result.replace(/,(\s*[}\]])/g, '$1')

  // Fix unquoted property names (simple cases)
  result = result.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')

  // Remove comments (// style)
  result = result.replace(/\/\/[^\n]*/g, '')

  // Replace single-quoted JSON string values with double quotes
  // Only match values after a colon (to avoid breaking apostrophes in text)
  // Pattern: `: 'value'` or `:'value'` -> `: "value"`
  result = result.replace(/:(\s*)'([^']*?)'/g, ':$1"$2"')

  // Remove any control characters except whitespace
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

  // Try to find and extract just the JSON object if there's extra text
  const jsonMatch = result.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    result = jsonMatch[0]
  }

  return result
}

/**
 * Check if a string appears to be conversational text rather than JSON
 */
function isConversationalResponse(str: string): boolean {
  const conversationalStarts = [
    'i notice',
    'i see',
    'based on',
    'looking at',
    'the rulebook',
    'this appears',
    'unfortunately',
    'i apologize',
    'i cannot',
    'i\'m unable',
    'let me',
    'here\'s',
    'note that',
    'it seems',
  ]
  const normalized = str.toLowerCase().trim()
  return conversationalStarts.some(start => normalized.startsWith(start))
}

/**
 * Generate JSON content with automatic parsing
 */
export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options: GenerationOptions = {}
): Promise<{ data: T; meta: Omit<GenerationResult, 'content'> }> {
  const result = await generate(systemPrompt, userPrompt, options)

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = result.content.trim()

  // Check if the response is conversational text instead of JSON
  if (isConversationalResponse(jsonStr)) {
    const preview = jsonStr.substring(0, 100).replace(/\n/g, ' ')
    throw new Error(`AI returned conversational text instead of JSON. Response starts with: "${preview}..."`)
  }

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7)
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3)
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3)
  }
  jsonStr = jsonStr.trim()

  // Check again after stripping code blocks
  if (isConversationalResponse(jsonStr)) {
    const preview = jsonStr.substring(0, 100).replace(/\n/g, ' ')
    throw new Error(`AI returned conversational text instead of JSON. Response starts with: "${preview}..."`)
  }

  // Attempt to repair common JSON issues from AI responses
  jsonStr = repairJSON(jsonStr)

  try {
    const data = JSON.parse(jsonStr) as T
    return {
      data,
      meta: {
        model: result.model,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        costUsd: result.costUsd,
        durationMs: result.durationMs,
      }
    }
  } catch (parseError) {
    // Debug: Show character codes around the error position
    const match = String(parseError).match(/position (\d+)/)
    if (match) {
      const pos = parseInt(match[1])
      const context = jsonStr.substring(Math.max(0, pos - 20), pos + 20)
      const charCodes = [...context].map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ')
      console.error('JSON error context:', context)
      console.error('Character codes:', charCodes)
    }
    console.error('Failed to parse JSON response:', jsonStr.substring(0, 500))

    // Create error with raw response for downstream analysis
    const error = new Error(`Invalid JSON response: ${parseError}`) as Error & { rawResponse?: string }
    error.rawResponse = jsonStr.substring(0, 1000)
    throw error
  }
}
