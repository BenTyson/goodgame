/**
 * Rulebook AI Extraction Prompts
 * Prompts for extracting structured data from rulebook text
 */

import type { ParsedPDF } from './types'

/**
 * System prompt for rulebook analysis
 */
export const RULEBOOK_SYSTEM_PROMPT = `You are an expert board game analyst who specializes in reading rulebooks and extracting structured information.

Your role:
- Extract FACTUAL information from rulebook text (player count, play time, components)
- Generate ORIGINAL summaries of rules and gameplay (never copy verbatim)
- Analyze complexity factors objectively
- Be precise with numbers and lists

Important rules:
- Return ONLY valid JSON - no markdown, no explanations outside the JSON
- If information is not found in the rulebook, use null instead of guessing
- Distinguish between minimum/maximum values for ranges
- List all components you can identify
- Be conservative with complexity estimates - err toward lower scores`

/**
 * Prompt for extracting basic game data from rulebook
 */
export function getDataExtractionPrompt(rulebookText: string, gameName: string): string {
  // Truncate rulebook to fit context window (keep first ~30k chars)
  const truncatedText = rulebookText.length > 30000
    ? rulebookText.substring(0, 30000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  return `Analyze this rulebook for "${gameName}" and extract key information.

RULEBOOK TEXT:
---
${truncatedText}
---

Extract the following information and return as JSON:
{
  "playerCount": {
    "min": <number or null>,
    "max": <number or null>,
    "best": [<recommended player counts or null>]
  },
  "playTime": {
    "min": <minutes or null>,
    "max": <minutes or null>
  },
  "minAge": <number or null>,
  "components": {
    "cards": <count or null>,
    "dice": <count or null>,
    "tokens": <count or null>,
    "boards": <count or null>,
    "tiles": <count or null>,
    "meeples": <count or null>,
    "cubes": <count or null>,
    "miniatures": <count or null>,
    "other": ["list of other components"]
  },
  "turnStructure": [
    {
      "name": "Phase/Step name",
      "description": "What happens in this phase",
      "isOptional": <boolean>
    }
  ],
  "winCondition": "How the game ends and who wins",
  "rulesOverview": "2-3 sentence summary of the core gameplay loop (write in your own words)",
  "setupSummary": "Brief description of setup process (write in your own words)"
}

Notes:
- Only include components you can find evidence of in the rulebook
- For turnStructure, include the main phases/steps of a turn (usually 3-6 items)
- For rulesOverview and setupSummary, write original text based on the rulebook (do not copy)
- Return null for any field where information cannot be determined`
}

/**
 * Prompt for BNCS (Board Nomads Complexity Score) analysis
 */
export function getBNCSPrompt(
  rulebookText: string,
  gameName: string,
  metrics: { pageCount: number; wordCount: number }
): string {
  // Truncate rulebook to fit context window
  const truncatedText = rulebookText.length > 25000
    ? rulebookText.substring(0, 25000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  return `Analyze the complexity of "${gameName}" based on this rulebook and generate a Board Nomads Complexity Score (BNCS).

RULEBOOK METRICS:
- Pages: ${metrics.pageCount}
- Words: ${metrics.wordCount}

RULEBOOK TEXT:
---
${truncatedText}
---

Score each dimension from 1.0 to 5.0:
- 1.0-2.0 = Very simple/easy
- 2.0-3.0 = Moderate
- 3.0-4.0 = Complex/challenging
- 4.0-5.0 = Very complex/hardcore

Return as JSON:
{
  "rulesDensity": <1.0-5.0>,
  "decisionSpace": <1.0-5.0>,
  "learningCurve": <1.0-5.0>,
  "strategicDepth": <1.0-5.0>,
  "componentComplexity": <1.0-5.0>,
  "overallScore": <1.0-5.0>,
  "reasoning": "2-3 sentences explaining the overall complexity assessment",
  "confidence": "high" | "medium" | "low"
}

SCORING GUIDE:

**Rules Density** - How much there is to learn
- Consider: rulebook length, number of exceptions, edge cases, special rules
- Short rulebook (< 10 pages) with simple rules = 1-2
- Standard rulebook with moderate rules = 2-3
- Long rulebook with many exceptions = 3-4
- Dense rulebook with complex interactions = 4-5

**Decision Space** - Choices available on a turn
- Very limited options (1-2 choices) = 1-2
- Several clear options (3-5 choices) = 2-3
- Many viable options, some planning needed = 3-4
- Vast decision tree, heavy optimization = 4-5

**Learning Curve** - Time to competency
- Learn in 5 minutes = 1-2
- Learn in 15-30 minutes = 2-3
- Takes a full game to understand = 3-4
- Multiple plays needed to grasp = 4-5

**Strategic Depth** - Mastery difficulty
- Obvious optimal plays = 1-2
- Some strategy, light planning = 2-3
- Significant strategy, long-term planning = 3-4
- Deep strategy, experts still improve = 4-5

**Component Complexity** - Game state tracking
- Few pieces, simple board = 1-2
- Moderate pieces, clear state = 2-3
- Many pieces, tracking required = 3-4
- Complex state, multiple systems = 4-5

**Overall Score** - Weighted average (Learning Curve and Rules Density weighted higher for new players)
- Calculate: (rulesDensity * 1.5 + learningCurve * 1.5 + decisionSpace + strategicDepth + componentComplexity) / 6

**Confidence**:
- "high" if rulebook is complete and clear
- "medium" if some information is missing or unclear
- "low" if rulebook is incomplete or very short`
}

/**
 * Prompt for generating original rules summary from rulebook
 */
export function getRulesSummaryPrompt(rulebookText: string, gameName: string): string {
  const truncatedText = rulebookText.length > 30000
    ? rulebookText.substring(0, 30000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  return `Based on this rulebook for "${gameName}", write an ORIGINAL rules summary for new players.

RULEBOOK TEXT:
---
${truncatedText}
---

Write a friendly, conversational rules summary. Do NOT copy from the rulebook - use your own words.

Return as JSON:
{
  "quickStart": [
    "4-6 bullet points to start playing immediately",
    "Focus on what you do on your turn",
    "Skip edge cases"
  ],
  "overview": "2-3 sentences about what makes this game fun",
  "coreRules": [
    {
      "title": "Category name",
      "points": ["Rule 1", "Rule 2", "Rule 3"]
    }
  ],
  "turnStructure": [
    {
      "phase": "Phase name",
      "description": "What happens"
    }
  ],
  "scoring": [
    {
      "category": "How to score",
      "points": "How many"
    }
  ],
  "endGame": "When and how the game ends",
  "tips": [
    "3-4 beginner strategy tips"
  ]
}

Guidelines:
- Write like you're teaching a friend
- Focus on the essentials, skip advanced rules
- Make it scannable with clear sections
- Include 3-5 core rules categories
- Keep turnStructure to main phases only (3-5)
- Include all major scoring categories`
}

/**
 * Prompt for generating setup guide from rulebook
 */
export function getSetupGuidePrompt(rulebookText: string, gameName: string): string {
  const truncatedText = rulebookText.length > 25000
    ? rulebookText.substring(0, 25000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  return `Based on this rulebook for "${gameName}", write an ORIGINAL setup guide.

RULEBOOK TEXT:
---
${truncatedText}
---

Return as JSON:
{
  "overview": "One sentence describing setup",
  "components": [
    {
      "name": "Component name",
      "quantity": "How many",
      "description": "What it is/does"
    }
  ],
  "steps": [
    {
      "step": 1,
      "title": "Step title",
      "instruction": "What to do",
      "tip": "Optional helpful tip"
    }
  ],
  "playerSetup": {
    "description": "What each player receives",
    "items": ["Item 1", "Item 2"]
  },
  "firstPlayer": "How to determine first player",
  "commonMistakes": ["Setup mistakes to avoid"]
}

Guidelines:
- Write in your own words (don't copy from rulebook)
- Include 5-10 main components
- Include 5-8 setup steps in order
- Keep instructions clear and concise
- Include practical tips where helpful`
}
