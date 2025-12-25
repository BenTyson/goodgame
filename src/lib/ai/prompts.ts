/**
 * AI Content Generation Prompts
 *
 * These prompts generate UNIQUE content - not copies of BGG.
 * The goal is friendly, helpful game teaching content.
 */

import type { GameRow } from '@/types/database'

// Current prompt version for tracking
export const PROMPT_VERSION = '1.0.0'

/**
 * System prompt for all game content generation
 */
export const SYSTEM_PROMPT = `You are a friendly, experienced board game teacher who loves helping people learn new games.

Your writing style:
- Conversational and welcoming, like explaining to a friend
- Clear and concise - get to the point
- Focus on the fun and what makes games enjoyable
- Use "you" to address the reader directly
- Avoid jargon unless necessary (then explain it)

Important rules:
- Write everything in YOUR OWN WORDS - never copy from other sources
- Focus on practical advice that helps people play
- Be accurate about rules but prioritize clarity over completeness
- Include helpful tips that come from experience
- Return ONLY valid JSON - no markdown, no explanations outside the JSON`

/**
 * Build game context string for prompts
 */
function buildGameContext(game: GameRow): string {
  const details = []

  details.push(`Game: ${game.name}`)

  if (game.year_published) {
    details.push(`Published: ${game.year_published}`)
  }

  details.push(`Players: ${game.player_count_min}-${game.player_count_max}`)
  details.push(`Play time: ${game.play_time_min}-${game.play_time_max} minutes`)

  if (game.weight) {
    const complexity = game.weight < 2 ? 'Light' : game.weight < 3 ? 'Medium' : 'Heavy'
    details.push(`Complexity: ${complexity} (${game.weight.toFixed(1)}/5)`)
  }

  if (game.designers && game.designers.length > 0) {
    details.push(`Designer(s): ${game.designers.join(', ')}`)
  }

  if (game.description) {
    // Clean and truncate description
    const cleanDesc = game.description
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .trim()
      .substring(0, 800)
    details.push(`\nDescription: ${cleanDesc}`)
  }

  return details.join('\n')
}

/**
 * Generate rules content prompt
 */
export function getRulesPrompt(game: GameRow): string {
  return `Create a rules summary for this board game. Write in your own words - be helpful and conversational.

${buildGameContext(game)}

Return a JSON object with this exact structure:
{
  "quickStart": [
    "4-6 bullet points that let someone start playing immediately",
    "Focus on the core loop - what do you do on your turn?",
    "Skip edge cases, focus on the basics"
  ],
  "overview": "2-3 sentences about what makes this game fun and what you're trying to do. Hook the reader!",
  "coreRules": [
    {
      "title": "Rule Category Name",
      "points": ["Key rule 1", "Key rule 2", "Key rule 3"]
    }
  ],
  "turnStructure": [
    {
      "phase": "Phase Name",
      "description": "What happens in this phase"
    }
  ],
  "scoring": [
    {
      "category": "What scores points",
      "points": "How many points"
    }
  ],
  "endGame": "How the game ends and who wins",
  "tips": [
    "3-4 beginner-friendly strategy tips",
    "Things you wish you knew your first game"
  ]
}

Make coreRules have 3-5 categories covering the main rules. Keep turnStructure to the essential phases (3-5 max). Make scoring have 5-8 categories covering the main ways to earn points.`
}

/**
 * Generate setup content prompt
 */
export function getSetupPrompt(game: GameRow): string {
  return `Create a setup guide for this board game. Write clear, step-by-step instructions.

${buildGameContext(game)}

Return a JSON object with this exact structure:
{
  "overview": "One sentence describing what setup involves",
  "beforeYouStart": [
    "Things to check or prepare before opening the box",
    "Like: make sure you have enough table space"
  ],
  "components": [
    {
      "name": "Component Name",
      "quantity": "How many",
      "description": "Brief description of what it is/does"
    }
  ],
  "steps": [
    {
      "step": 1,
      "title": "Step Title",
      "instruction": "Detailed instruction for this step",
      "tip": "Optional helpful tip for this step"
    }
  ],
  "playerSetup": {
    "description": "What each player receives/does to start",
    "items": ["Item or action 1", "Item or action 2"]
  },
  "firstPlayer": "How to determine who goes first",
  "commonMistakes": [
    "Setup mistakes new players often make"
  ]
}

Include 5-8 setup steps. Make components list the main components (5-10 items).`
}

/**
 * Generate reference content prompt
 */
export function getReferencePrompt(game: GameRow): string {
  return `Create a quick reference guide for this board game. This is for during gameplay - make it scannable!

${buildGameContext(game)}

Return a JSON object with this exact structure:
{
  "turnSummary": [
    "Bullet point summary of a turn",
    "What are your options?",
    "Keep it short - this is a reference"
  ],
  "actions": [
    {
      "name": "Action Name",
      "cost": "What it costs (if anything)",
      "effect": "What it does",
      "limit": "Any restrictions"
    }
  ],
  "symbols": [
    {
      "symbol": "Symbol name or description",
      "meaning": "What it means"
    }
  ],
  "scoring": [
    {
      "category": "Scoring Category",
      "points": "How many points",
      "notes": "Any special rules"
    }
  ],
  "importantNumbers": [
    {
      "what": "What this number is",
      "value": "The value",
      "context": "When it matters"
    }
  ],
  "reminders": [
    "Things players often forget during the game"
  ]
}

Focus on the most-referenced information. Actions should cover 4-8 main actions. Symbols should include any iconography. ImportantNumbers should have key values players look up.`
}

/**
 * Generate score sheet content prompt
 */
export function getScoreSheetPrompt(game: GameRow): string {
  return `Create a score sheet configuration for this board game. This will be used to generate an interactive/printable score tracker.

${buildGameContext(game)}

Return a JSON object with this exact structure:
{
  "config": {
    "layout_type": "standard",
    "orientation": "portrait",
    "show_total_row": true,
    "color_scheme": "default"
  },
  "fields": [
    {
      "name": "field_identifier",
      "label": "Display Label (include point value if fixed, e.g., 'Cities (2 pts each)')",
      "field_type": "number",
      "section": "Section Name (optional grouping)",
      "description": "Brief hint about how to score this category",
      "is_negative": false,
      "min_value": 0,
      "max_value": null
    }
  ],
  "instructions": [
    "Brief instruction about how to use this score sheet",
    "Any special scoring rules to remember"
  ],
  "tiebreaker": "How to resolve ties (if applicable)"
}

Field types:
- "number" for point values (most common)
- "checkbox" for yes/no bonuses (like "Longest Road" - worth fixed points)

Section names help group related scoring categories. Common sections:
- "Base Points", "Bonuses", "Penalties", "End Game", etc.

Important rules:
- Set "is_negative": true for penalty fields (incomplete tickets, floor penalties, etc.)
- Include ALL scoring categories from the game - be comprehensive
- Order fields in the typical end-game scoring sequence
- Make labels clear and include point values where applicable (e.g., "Settlements (1 pt each)")
- Use snake_case for field names (e.g., "victory_cards", "completed_routes")
- Set reasonable max_value if there's a game limit (e.g., max 5 settlements)

Include 5-15 scoring fields covering all ways to earn/lose points. Group related fields with the same section name.`
}

/**
 * Get all prompts for a game
 */
export function getAllPrompts(game: GameRow) {
  return {
    rules: getRulesPrompt(game),
    setup: getSetupPrompt(game),
    reference: getReferencePrompt(game),
    scoreSheet: getScoreSheetPrompt(game),
  }
}
