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

Extract the following information and return as JSON. IMPORTANT: Generate ORIGINAL content based on the rulebook - do NOT copy the examples below.

{
  "tagline": "<GENERATE: A catchy 5-15 word marketing phrase unique to THIS game>",
  "description": "<GENERATE: 2-3 paragraphs about this specific game's theme, mechanics, and appeal>",
  "playerCount": {"min": null, "max": null, "best": []},
  "playTime": {"min": null, "max": null},
  "minAge": null,
  "components": {
    "cards": null,
    "dice": null,
    "tokens": null,
    "boards": null,
    "tiles": null,
    "meeples": null,
    "cubes": null,
    "miniatures": null,
    "other": []
  },
  "turnStructure": [],
  "winCondition": "<GENERATE: How does the game end and who wins?>",
  "endGameConditions": [],
  "firstPlayerRule": "<GENERATE: How is the first player determined?>",
  "rulesOverview": "<GENERATE: 2-3 sentences summarizing the core gameplay>",
  "setupSummary": "<GENERATE: Brief setup overview>"
}

CRITICAL INSTRUCTIONS:
- Replace ALL <GENERATE: ...> placeholders with actual content from the rulebook
- tagline should be catchy and specific to THIS game (not generic)
- description should be 2-3 paragraphs explaining the game's theme and appeal
- Use null for numbers you cannot find
- Use empty arrays [] for lists you cannot populate

Notes:
- Only include components you can find evidence of in the rulebook
- For turnStructure, include the main phases/steps of a turn (usually 3-6 items)
- For tagline, description, rulesOverview and setupSummary, write original text based on the rulebook (do not copy)
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

Return as JSON with these EXACT keys (all are required):
{
  "quickStart": ["First bullet point", "Second bullet point", "Third bullet point", "Fourth bullet point"],
  "overview": "2-3 sentences describing what makes this game engaging and fun to play.",
  "coreRules": [
    {"title": "Movement", "points": ["How players move", "Movement restrictions"]},
    {"title": "Actions", "points": ["Available actions", "Action limitations"]}
  ],
  "turnStructure": [
    {"phase": "Phase 1 Name", "description": "What happens in this phase"},
    {"phase": "Phase 2 Name", "description": "What happens in this phase"}
  ],
  "scoring": [
    {"category": "Victory Points", "points": "1 per card"},
    {"category": "Bonus", "points": "5 at end"}
  ],
  "endGameConditions": ["When a player reaches X points", "When the deck runs out", "After X rounds"],
  "winCondition": "The player with the most victory points wins. In case of a tie, the player with more cards wins.",
  "tips": ["Tip 1 for beginners", "Tip 2 for beginners", "Tip 3 for beginners"]
}

Guidelines:
- Write like you're teaching a friend
- Focus on the essentials, skip advanced rules
- Make it scannable with clear sections
- Include 3-5 core rules categories
- Keep turnStructure to main phases only (3-5)
- Include all major scoring categories
- Be specific about endGameConditions (e.g., "When a player reaches 10 victory points")`
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

Return as JSON with these EXACT keys (all are required):
{
  "overview": "One sentence describing what setup involves.",
  "estimatedTime": "5-10 minutes",
  "components": [
    {"name": "Game Board", "quantity": "1", "description": "The main playing surface"},
    {"name": "Player Tokens", "quantity": "4", "description": "One for each player"}
  ],
  "steps": [
    {"step": 1, "title": "Unfold the Board", "instruction": "Place the game board in the center of the table.", "tip": "Make sure all players can reach it."},
    {"step": 2, "title": "Shuffle Cards", "instruction": "Shuffle all cards and place them face-down.", "tip": null}
  ],
  "playerSetup": {
    "description": "Each player receives the following starting materials:",
    "items": ["1 player board", "5 starting resources", "1 reference card"]
  },
  "firstPlayerRule": "The player who most recently did X goes first. Otherwise, choose randomly.",
  "quickTips": ["Organize components by type before starting", "Have each player set up their own area", "Read the quick-start guide first"],
  "commonMistakes": ["Forgetting to shuffle the deck", "Placing tokens in the wrong starting position", "Missing the first player marker"]
}

Guidelines:
- Write in your own words (don't copy from rulebook)
- Include 5-10 main components
- Include 5-8 setup steps in order
- Keep instructions clear and concise
- firstPlayerRule should be specific (e.g., "The player who most recently visited a farm goes first")
- Include 2-4 practical quickTips
- Include 2-4 commonMistakes to avoid`
}

/**
 * Prompt for generating quick reference card from rulebook
 */
export function getReferenceCardPrompt(rulebookText: string, gameName: string): string {
  const truncatedText = rulebookText.length > 25000
    ? rulebookText.substring(0, 25000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  return `Based on this rulebook for "${gameName}", create a quick reference card for during play.

RULEBOOK TEXT:
---
${truncatedText}
---

Return as JSON:
{
  "turnSummary": [
    {
      "phase": "Phase name",
      "actions": ["Action 1", "Action 2"]
    }
  ],
  "keyActions": [
    {
      "action": "Action name",
      "cost": "Resource cost if any",
      "effect": "What it does"
    }
  ],
  "importantRules": [
    "Critical rule to remember during play"
  ],
  "endGame": "The game ends when a player reaches 10 victory points, or when the deck runs out. The player with the most points wins.",
  "scoringSummary": [
    {
      "category": "Scoring category",
      "value": "Points or formula"
    }
  ],
  "iconography": [
    {
      "symbol": "Symbol/icon name",
      "meaning": "What it represents"
    }
  ],
  "quickReminders": [
    "Common things players forget"
  ]
}

Guidelines:
- This is for MID-GAME reference, not learning the game
- Focus on turn structure, costs, and scoring
- Keep entries brief - this is a reference card, not a rulebook
- Include 3-5 items per section maximum
- Include any iconography/symbols used in the game
- Omit sections if not relevant to the game`
}
