/**
 * Claude AI Client
 * Wrapper for Anthropic SDK with retry logic and cost tracking
 */

import Anthropic from '@anthropic-ai/sdk'

// Initialize client (uses ANTHROPIC_API_KEY env var automatically)
const anthropic = new Anthropic()

// Model configuration
const DEFAULT_MODEL = 'claude-3-haiku-20240307'
const MAX_TOKENS = 4096

// Cost per 1M tokens (as of late 2024)
const COSTS = {
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
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

  // Remove trailing commas before } or ]
  result = result.replace(/,(\s*[}\]])/g, '$1')

  // Fix unquoted property names (simple cases)
  result = result.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')

  // Remove comments (// style)
  result = result.replace(/\/\/[^\n]*/g, '')

  // Replace single quotes with double quotes (for property values)
  // This is tricky - only do it for simple cases
  result = result.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')

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
    console.error('Failed to parse JSON response:', jsonStr.substring(0, 500))
    throw new Error(`Invalid JSON response: ${parseError}`)
  }
}
