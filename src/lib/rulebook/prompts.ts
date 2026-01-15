/**
 * Rulebook AI Extraction Prompts
 * Prompts for extracting structured data from rulebook text
 *
 * Voice: Boardmello "Enthusiastic Expert"
 * - Friendly, passionate game lover who makes complex rules feel approachable
 * - Uses "you" directly, occasional light humor
 * - Expert knowledge delivered with warmth
 * - Clear and scannable, never condescending
 */

import type { ParsedPDF } from './types'

/**
 * System prompt for rulebook analysis - establishes the Boardmello voice
 */
export const RULEBOOK_SYSTEM_PROMPT = `You are a Boardmello content writer - an enthusiastic board game expert who genuinely loves helping people discover and learn games.

YOUR VOICE:
- Warm and approachable, like explaining a game to a friend at game night
- Genuinely excited about clever mechanics and fun gameplay moments
- Use "you" and "your" to speak directly to the reader
- Confident expertise without being condescending
- Occasionally playful (but not cheesy or overboard)
- Clear and scannable - respect the reader's time

WRITING PRINCIPLES:
- Lead with what's exciting about the game, not dry definitions
- Anticipate confusion and address it naturally
- Use active voice: "Draw two cards" not "Two cards are drawn"
- Be specific: "Collect 3 wood to build" not "Gather resources"
- When explaining complex rules, build up from simple foundations
- End sections with helpful context or tips when natural

CONTENT QUALITY:
- Generate ORIGINAL content - never copy rulebook text verbatim
- Every piece of content should feel crafted, not generated
- Include the "why" when it helps understanding (why a rule exists)
- Acknowledge when a game has unusual or tricky rules
- Be thorough but not exhaustive - cover essentials first

TECHNICAL REQUIREMENTS:
- Return ONLY valid JSON - no markdown, no text outside the JSON
- Use null for information genuinely not in the rulebook
- Be precise with numbers, components, and game terms
- Maintain game terminology (use the game's actual terms)`

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
 * Prompt for Crunch Score analysis (1-10 scale)
 */
export function getCrunchScorePrompt(
  rulebookText: string,
  gameName: string,
  metrics: { pageCount: number; wordCount: number }
): string {
  // Truncate rulebook to fit context window
  const truncatedText = rulebookText.length > 25000
    ? rulebookText.substring(0, 25000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  return `Analyze the complexity of "${gameName}" and generate a Crunch Score (Boardmello' complexity rating).

RULEBOOK METRICS:
- Pages: ${metrics.pageCount}
- Words: ${metrics.wordCount}

RULEBOOK TEXT:
---
${truncatedText}
---

Score each dimension from 1.0 to 10.0 using our Crunch tiers:
- 1.0-2.0 = Breezy (quick to learn, minimal rules)
- 2.1-4.0 = Light (family-friendly depth)
- 4.1-6.0 = Crunchy (solid complexity)
- 6.1-8.0 = Heavy (meaty decisions)
- 8.1-10.0 = Brain Burner (maximum crunch)

Return as JSON:
{
  "rulesDensity": <1.0-10.0>,
  "decisionSpace": <1.0-10.0>,
  "learningCurve": <1.0-10.0>,
  "strategicDepth": <1.0-10.0>,
  "componentComplexity": <1.0-10.0>,
  "overallScore": <1.0-10.0>,
  "reasoning": "2-3 sentences explaining the overall complexity assessment",
  "confidence": "high" | "medium" | "low"
}

SCORING GUIDE (1-10 Scale):

**Rules Density** - How much there is to learn
- Consider: rulebook length, number of exceptions, edge cases, special rules
- Very short rulebook (< 6 pages) with simple rules = 1-2
- Short rulebook (6-10 pages) with straightforward rules = 2-4
- Standard rulebook (10-20 pages) with moderate rules = 4-6
- Long rulebook (20-40 pages) with many exceptions = 6-8
- Dense rulebook (40+ pages) with complex interactions = 8-10

**Decision Space** - Choices available on a turn
- Very limited options (1-2 obvious choices) = 1-2
- Few clear options (2-3 choices) = 2-4
- Several clear options (3-5 choices) = 4-6
- Many viable options, planning needed = 6-8
- Vast decision tree, heavy optimization = 8-10

**Learning Curve** - Time to competency
- Learn in 5 minutes, play immediately = 1-2
- Learn in 10-15 minutes = 2-4
- Learn in 20-30 minutes = 4-6
- Takes a full game to understand = 6-8
- Multiple plays needed to grasp = 8-10

**Strategic Depth** - Mastery difficulty
- Obvious optimal plays, luck-driven = 1-2
- Some strategy, light planning = 2-4
- Moderate strategy, short-term planning = 4-6
- Significant strategy, long-term planning = 6-8
- Deep strategy, experts still improve = 8-10

**Component Complexity** - Game state tracking
- Few pieces, simple or no board = 1-2
- Modest pieces, clear state = 2-4
- Moderate pieces, some tracking = 4-6
- Many pieces, tracking required = 6-8
- Complex state, multiple interlocking systems = 8-10

**Overall Score** - Weighted average (Learning Curve and Rules Density weighted higher for new players)
- Calculate: (rulesDensity * 1.5 + learningCurve * 1.5 + decisionSpace + strategicDepth + componentComplexity) / 6

**Confidence**:
- "high" if rulebook is complete and clear
- "medium" if some information is missing or unclear
- "low" if rulebook is incomplete or very short`
}

/**
 * @deprecated Use getCrunchScorePrompt instead
 */
export function getBNCSPrompt(
  rulebookText: string,
  gameName: string,
  metrics: { pageCount: number; wordCount: number }
): string {
  return getCrunchScorePrompt(rulebookText, gameName, metrics)
}

/**
 * Prompt for generating original rules summary from rulebook
 * @param rulebookText - The parsed rulebook text
 * @param gameName - Name of the game
 * @param wikipediaContext - Optional Wikipedia summary for additional context
 */
export function getRulesSummaryPrompt(
  rulebookText: string,
  gameName: string,
  wikipediaContext?: string
): string {
  const truncatedText = rulebookText.length > 40000
    ? rulebookText.substring(0, 40000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  // Include Wikipedia context if available
  const wikiSection = wikipediaContext
    ? `
WIKIPEDIA CONTEXT (use for background info, theme context, and designer intent - NOT as rules source):
---
${wikipediaContext}
---

`
    : ''

  return `You're writing the rules guide for "${gameName}" on Boardmello. This will be the first thing new players read - make it count!
${wikiSection}
RULEBOOK TEXT (primary source for all rules):
---
${truncatedText}
---

Create a comprehensive but approachable rules guide. Write in YOUR voice - warm, expert, and genuinely helpful. Never copy rulebook text verbatim.

Return as JSON:
{
  "quickStart": [
    "First thing every player needs to know - what's the goal?",
    "The core action loop - what do you actually DO on your turn?",
    "The key decision point - where's the interesting choice?",
    "The satisfying moment - what makes this game click?",
    "Pro tip - something that clicks after a few plays"
  ],
  "overview": "3-4 sentences capturing what makes this game special. Lead with the hook - what's exciting? Then explain the core experience. End with who this game is perfect for.",
  "coreRules": [
    {
      "title": "Category Name (e.g., 'Resources', 'Combat', 'Building')",
      "summary": "One sentence explaining what this system does and why it matters",
      "points": [
        "Specific rule or mechanic explained clearly",
        "Another key point players need to know",
        "Important interaction or exception",
        "Helpful context or 'gotcha' to watch for"
      ]
    }
  ],
  "turnStructure": [
    {
      "phase": "Phase Name",
      "description": "What you do in this phase - be specific!",
      "keyChoices": "The main decision(s) you make here"
    }
  ],
  "scoring": [
    {
      "category": "Scoring Category",
      "points": "How many points and how to earn them",
      "strategy": "Brief tip on when/why to pursue this"
    }
  ],
  "endGameConditions": [
    "Specific trigger that ends the game (with exact numbers/conditions)",
    "Alternative end condition if applicable"
  ],
  "winCondition": "Exactly how the winner is determined. Include tiebreakers if they exist.",
  "keyTerms": [
    {
      "term": "Game-specific term",
      "definition": "What it means in plain language"
    }
  ],
  "tips": [
    "Strategic insight that new players often miss",
    "Common mistake to avoid",
    "Something experienced players wish they knew earlier",
    "Timing tip or tempo advice"
  ],
  "rulesNotes": [
    "Tricky rule that's easy to get wrong",
    "Important clarification or edge case"
  ]
}

QUALITY CHECKLIST:
- quickStart should let someone understand the game in 60 seconds
- overview should make someone WANT to play (not just describe the theme)
- coreRules should have 3-6 categories covering all major systems
- turnStructure should walk through a complete turn
- scoring should include ALL ways to earn points
- tips should be genuinely useful, not generic
- keyTerms for any game-specific vocabulary
- rulesNotes for things players commonly get wrong`
}

/**
 * Prompt for generating setup guide from rulebook
 * @param rulebookText - The parsed rulebook text
 * @param gameName - Name of the game
 * @param wikipediaContext - Optional Wikipedia summary for additional context
 */
export function getSetupGuidePrompt(
  rulebookText: string,
  gameName: string,
  wikipediaContext?: string
): string {
  const truncatedText = rulebookText.length > 35000
    ? rulebookText.substring(0, 35000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  // Include Wikipedia context if available
  const wikiSection = wikipediaContext
    ? `
WIKIPEDIA CONTEXT (use for component context and background - NOT as setup instructions):
---
${wikipediaContext}
---

`
    : ''

  return `You're writing the setup guide for "${gameName}" on Boardmello. Someone's about to crack open this box - help them get playing smoothly!
${wikiSection}
RULEBOOK TEXT (primary source for setup instructions):
---
${truncatedText}
---

Create a setup guide that gets people from "box on table" to "ready to play" efficiently. Write conversationally but stay practical.

Return as JSON:
{
  "overview": "2-3 sentences setting expectations. How complex is setup? What's the vibe? Any prep required beforehand?",
  "estimatedTime": "X-Y minutes (be realistic, include sorting time for first play)",
  "spaceRequired": "Brief note on table space needed",
  "components": [
    {
      "name": "Component Name",
      "quantity": "Count or description",
      "description": "What it is and how it's used",
      "sortingTip": "How to organize it (if helpful)"
    }
  ],
  "beforeYouStart": [
    "Any sorting, punching, or organizing to do before first play",
    "Reference cards to hand out",
    "Things to read/review before starting"
  ],
  "steps": [
    {
      "step": 1,
      "title": "Clear Action Title",
      "instruction": "Specific, actionable instruction",
      "details": "Additional details or variations (by player count, etc.)",
      "tip": "Helpful context or efficiency tip (null if none)"
    }
  ],
  "playerSetup": {
    "description": "What each player needs in their play area",
    "items": [
      "Specific item with quantity",
      "Another item - be specific about colors, positions, etc."
    ],
    "notes": "Any variations by player count or role"
  },
  "boardSetup": {
    "description": "How to configure the central play area",
    "steps": ["Specific placement instruction", "Another placement step"],
    "playerCountVariations": "How setup changes with different player counts (null if same)"
  },
  "firstPlayerRule": "The exact first player rule from the game. If it's thematic, include the fun flavor!",
  "readyCheck": [
    "Quick verification that setup is complete",
    "Common thing to double-check before starting"
  ],
  "quickTips": [
    "Practical tip that speeds up setup",
    "Organization hack experienced players use",
    "Advice for teaching while setting up"
  ],
  "commonMistakes": [
    "Specific setup error and why it matters",
    "Thing people often forget or do wrong"
  ],
  "storageNotes": "Tips for packing up efficiently (bagging suggestions, etc.)"
}

QUALITY CHECKLIST:
- components should list EVERYTHING in the box
- steps should be in logical order (board first, then cards, then player pieces, etc.)
- Include player count variations where relevant
- firstPlayerRule should use the game's actual thematic rule if it has one
- Tips should be genuinely useful, from experience
- Think about the person setting this up for the first time`
}

/**
 * Prompt for generating quick reference card from rulebook
 * @param rulebookText - The parsed rulebook text
 * @param gameName - Name of the game
 * @param wikipediaContext - Optional Wikipedia summary for additional context
 */
export function getReferenceCardPrompt(
  rulebookText: string,
  gameName: string,
  wikipediaContext?: string
): string {
  const truncatedText = rulebookText.length > 35000
    ? rulebookText.substring(0, 35000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  // Include Wikipedia context if available (lighter usage for reference cards)
  const wikiSection = wikipediaContext
    ? `
WIKIPEDIA CONTEXT (for iconography and terminology context only):
---
${wikipediaContext}
---

`
    : ''

  return `You're creating the quick reference for "${gameName}" on Boardmello. This is what players glance at MID-GAME when they need a quick answer - make it scannable!
${wikiSection}
RULEBOOK TEXT (primary source for all reference content):
---
${truncatedText}
---

Create a reference that answers the most common "wait, how does this work again?" questions during play. Prioritize clarity over comprehensiveness.

Return as JSON:
{
  "turnSummary": [
    {
      "phase": "Phase Name",
      "required": true,
      "actions": ["Specific action you can/must take"],
      "notes": "Important timing or limitation (null if none)"
    }
  ],
  "actionCosts": [
    {
      "action": "Action Name",
      "cost": "What you spend (resources, cards, etc.)",
      "effect": "What you get/do",
      "limit": "Any restrictions (once per turn, etc.)"
    }
  ],
  "resourceConversions": [
    {
      "from": "What you trade in",
      "to": "What you receive",
      "when": "When/where you can do this"
    }
  ],
  "importantRules": [
    {
      "rule": "The rule itself, clearly stated",
      "context": "When this matters or why it's easy to forget"
    }
  ],
  "timingRules": [
    {
      "situation": "When X happens",
      "resolution": "Do Y (in this order)"
    }
  ],
  "endGame": {
    "triggers": ["What causes the game to end - be specific"],
    "finalRound": "What happens after trigger (if applicable)",
    "winner": "How to determine the winner",
    "tiebreakers": ["First tiebreaker", "Second tiebreaker"]
  },
  "scoringSummary": [
    {
      "category": "Scoring Category",
      "calculation": "Exactly how to calculate (X points per Y)",
      "maxPossible": "Maximum points possible from this (if relevant)"
    }
  ],
  "iconography": [
    {
      "symbol": "Symbol name or description",
      "meaning": "What it represents in game terms",
      "examples": "Where you'll see this icon"
    }
  ],
  "commonQuestions": [
    {
      "question": "Question players often ask mid-game",
      "answer": "Clear, direct answer"
    }
  ],
  "quickReminders": [
    "Thing players commonly forget that affects gameplay",
    "Important rule that's easy to miss"
  ]
}

QUALITY CHECKLIST:
- This is for DURING play, not learning - assume they know the basics
- turnSummary should be glanceable in 5 seconds
- Include ALL costs and conversions players need to reference
- endGame should be complete - triggers, final round, winner, tiebreakers
- scoringSummary should cover every way to score points
- commonQuestions should address real confusion points
- Keep text SHORT - this is a reference card, not a guide`
}

// =====================================================
// Enhanced Prompts with Full Context (Vecna Pipeline)
// =====================================================

/**
 * Enhanced rules summary prompt that uses all available Wikipedia data
 * and optionally includes family context for expansions
 */
export function getEnhancedRulesSummaryPrompt(
  rulebookText: string,
  gameName: string,
  context: {
    wikipediaContext?: string | null
    familyContext?: string | null
    expansionNote?: string | null
  }
): string {
  const truncatedText = rulebookText.length > 35000
    ? rulebookText.substring(0, 35000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  // Build context sections
  const contextSections: string[] = []

  if (context.expansionNote) {
    contextSections.push(`IMPORTANT: ${context.expansionNote}\n`)
  }

  if (context.familyContext) {
    contextSections.push(`${context.familyContext}\n`)
  }

  if (context.wikipediaContext) {
    contextSections.push(`WIKIPEDIA CONTEXT (use for background, theme, and reception - rulebook is primary for rules):\n---\n${context.wikipediaContext}\n---\n`)
  }

  const contextBlock = contextSections.length > 0
    ? contextSections.join('\n')
    : ''

  return `You're writing the rules guide for "${gameName}" on Boardmello. This will be the first thing new players read - make it count!
${contextBlock}
RULEBOOK TEXT (primary source for all rules):
---
${truncatedText}
---

Create a comprehensive but approachable rules guide. Write in YOUR voice - warm, expert, and genuinely helpful. Never copy rulebook text verbatim.

${context.expansionNote ? `Since this is an expansion, focus on:\n- What NEW mechanics or rules this adds\n- How it CHANGES the base game experience\n- Setup additions/modifications\n- New victory conditions or scoring (if any)\nDon't repeat base game rules unless modified.\n\n` : ''}Return as JSON:
{
  "quickStart": [
    "First thing every player needs to know - what's the goal?",
    "The core action loop - what do you actually DO on your turn?",
    "The key decision point - where's the interesting choice?",
    "The satisfying moment - what makes this game click?",
    "Pro tip - something that clicks after a few plays"
  ],
  "overview": "3-4 sentences capturing what makes this game special. Lead with the hook - what's exciting? Then explain the core experience. End with who this game is perfect for.${context.expansionNote ? ' Mention how this expansion enhances the base game.' : ''}",
  "coreRules": [
    {
      "title": "Category Name (e.g., 'Resources', 'Combat', 'Building')",
      "summary": "One sentence explaining what this system does and why it matters",
      "points": [
        "Specific rule or mechanic explained clearly",
        "Another key point players need to know",
        "Important interaction or exception",
        "Helpful context or 'gotcha' to watch for"
      ]
    }
  ],
  "turnStructure": [
    {
      "phase": "Phase Name",
      "description": "What you do in this phase - be specific!",
      "keyChoices": "The main decision(s) you make here"
    }
  ],
  "scoring": [
    {
      "category": "Scoring Category",
      "points": "How many points and how to earn them",
      "strategy": "Brief tip on when/why to pursue this"
    }
  ],
  "endGameConditions": [
    "Specific trigger that ends the game (with exact numbers/conditions)",
    "Alternative end condition if applicable"
  ],
  "winCondition": "Exactly how the winner is determined. Include tiebreakers if they exist.",
  "keyTerms": [
    {
      "term": "Game-specific term",
      "definition": "What it means in plain language"
    }
  ],
  "tips": [
    "Strategic insight that new players often miss",
    "Common mistake to avoid",
    "Something experienced players wish they knew earlier",
    "Timing tip or tempo advice"
  ],
  "rulesNotes": [
    "Tricky rule that's easy to get wrong",
    "Important clarification or edge case"
  ]
}

QUALITY CHECKLIST:
- quickStart should let someone understand the game in 60 seconds
- overview should make someone WANT to play (not just describe the theme)${context.wikipediaContext ? '\n- Use Wikipedia reception/awards to add credibility if notable' : ''}
- coreRules should have 3-6 categories covering all major systems
- turnStructure should walk through a complete turn
- scoring should include ALL ways to earn points
- tips should be genuinely useful, not generic
- keyTerms for any game-specific vocabulary
- rulesNotes for things players commonly get wrong`
}

/**
 * Enhanced setup guide prompt with full context
 */
export function getEnhancedSetupGuidePrompt(
  rulebookText: string,
  gameName: string,
  context: {
    wikipediaContext?: string | null
    familyContext?: string | null
    expansionNote?: string | null
  }
): string {
  const truncatedText = rulebookText.length > 30000
    ? rulebookText.substring(0, 30000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  // Build context sections
  const contextSections: string[] = []

  if (context.expansionNote) {
    contextSections.push(`IMPORTANT: ${context.expansionNote}\n`)
  }

  if (context.familyContext) {
    contextSections.push(`${context.familyContext}\n`)
  }

  if (context.wikipediaContext) {
    contextSections.push(`WIKIPEDIA CONTEXT (for component context only):\n---\n${context.wikipediaContext}\n---\n`)
  }

  const contextBlock = contextSections.length > 0
    ? contextSections.join('\n')
    : ''

  return `You're writing the setup guide for "${gameName}" on Boardmello. Someone's about to crack open this box - help them get playing smoothly!
${contextBlock}
RULEBOOK TEXT (primary source for setup instructions):
---
${truncatedText}
---

${context.expansionNote ? `Since this is an expansion:\n- Focus on what's ADDED to base game setup\n- Note which base game components are still used\n- Highlight any base game setup MODIFICATIONS\n- Don't repeat base game setup steps unless changed\n\n` : ''}Create a setup guide that gets people from "box on table" to "ready to play" efficiently. Write conversationally but stay practical.

Return as JSON:
{
  "overview": "2-3 sentences setting expectations. How complex is setup? What's the vibe? Any prep required beforehand?${context.expansionNote ? ' Mention this is expansion setup.' : ''}",
  "estimatedTime": "X-Y minutes (be realistic, include sorting time for first play)",
  "spaceRequired": "Brief note on table space needed",
  "components": [
    {
      "name": "Component Name",
      "quantity": "Count or description",
      "description": "What it is and how it's used",
      "sortingTip": "How to organize it (if helpful)"
    }
  ],
  "beforeYouStart": [
    "Any sorting, punching, or organizing to do before first play",
    "Reference cards to hand out",
    "Things to read/review before starting"
  ],
  "steps": [
    {
      "step": 1,
      "title": "Clear Action Title",
      "instruction": "Specific, actionable instruction",
      "details": "Additional details or variations (by player count, etc.)",
      "tip": "Helpful context or efficiency tip (null if none)"
    }
  ],
  "playerSetup": {
    "description": "What each player needs in their play area",
    "items": [
      "Specific item with quantity",
      "Another item - be specific about colors, positions, etc."
    ],
    "notes": "Any variations by player count or role"
  },
  "boardSetup": {
    "description": "How to configure the central play area",
    "steps": ["Specific placement instruction", "Another placement step"],
    "playerCountVariations": "How setup changes with different player counts (null if same)"
  },
  "firstPlayerRule": "The exact first player rule from the game. If it's thematic, include the fun flavor!",
  "readyCheck": [
    "Quick verification that setup is complete",
    "Common thing to double-check before starting"
  ],
  "quickTips": [
    "Practical tip that speeds up setup",
    "Organization hack experienced players use",
    "Advice for teaching while setting up"
  ],
  "commonMistakes": [
    "Specific setup error and why it matters",
    "Thing people often forget or do wrong"
  ],
  "storageNotes": "Tips for packing up efficiently (bagging suggestions, etc.)"
}

QUALITY CHECKLIST:
- components should list ${context.expansionNote ? 'all NEW expansion components' : 'EVERYTHING in the box'}
- steps should be in logical order (board first, then cards, then player pieces, etc.)
- Include player count variations where relevant
- firstPlayerRule should use the game's actual thematic rule if it has one
- Tips should be genuinely useful, from experience`
}

/**
 * Enhanced reference card prompt with full context
 */
export function getEnhancedReferenceCardPrompt(
  rulebookText: string,
  gameName: string,
  context: {
    wikipediaContext?: string | null
    familyContext?: string | null
    expansionNote?: string | null
  }
): string {
  const truncatedText = rulebookText.length > 30000
    ? rulebookText.substring(0, 30000) + '\n\n[...rulebook truncated...]'
    : rulebookText

  // For reference cards, only use minimal context
  const contextBlock = context.expansionNote
    ? `IMPORTANT: ${context.expansionNote}\n\n`
    : ''

  return `You're creating the quick reference for "${gameName}" on Boardmello. This is what players glance at MID-GAME when they need a quick answer - make it scannable!
${contextBlock}
RULEBOOK TEXT (primary source for all reference content):
---
${truncatedText}
---

${context.expansionNote ? `Since this is an expansion, focus on:\n- NEW actions and their costs\n- Modified rules from base game\n- New scoring opportunities\n- New icons/symbols introduced\n\n` : ''}Create a reference that answers the most common "wait, how does this work again?" questions during play.

Return as JSON:
{
  "turnSummary": [
    {
      "phase": "Phase Name",
      "required": true,
      "actions": ["Specific action you can/must take"],
      "notes": "Important timing or limitation (null if none)"
    }
  ],
  "actionCosts": [
    {
      "action": "Action Name",
      "cost": "What you spend (resources, cards, etc.)",
      "effect": "What you get/do",
      "limit": "Any restrictions (once per turn, etc.)"
    }
  ],
  "resourceConversions": [
    {
      "from": "What you trade in",
      "to": "What you receive",
      "when": "When/where you can do this"
    }
  ],
  "importantRules": [
    {
      "rule": "The rule itself, clearly stated",
      "context": "When this matters or why it's easy to forget"
    }
  ],
  "timingRules": [
    {
      "situation": "When X happens",
      "resolution": "Do Y (in this order)"
    }
  ],
  "endGame": {
    "triggers": ["What causes the game to end - be specific"],
    "finalRound": "What happens after trigger (if applicable)",
    "winner": "How to determine the winner",
    "tiebreakers": ["First tiebreaker", "Second tiebreaker"]
  },
  "scoringSummary": [
    {
      "category": "Scoring Category",
      "calculation": "Exactly how to calculate (X points per Y)",
      "maxPossible": "Maximum points possible from this (if relevant)"
    }
  ],
  "iconography": [
    {
      "symbol": "Symbol name or description",
      "meaning": "What it represents in game terms",
      "examples": "Where you'll see this icon"
    }
  ],
  "commonQuestions": [
    {
      "question": "Question players often ask mid-game",
      "answer": "Clear, direct answer"
    }
  ],
  "quickReminders": [
    "Thing players commonly forget that affects gameplay",
    "Important rule that's easy to miss"
  ]
}

QUALITY CHECKLIST:
- This is for DURING play, not learning - assume they know the basics
- turnSummary should be glanceable in 5 seconds
- Include ALL costs and conversions players need to reference
- endGame should be complete - triggers, final round, winner, tiebreakers
- scoringSummary should cover every way to score points
- Keep text SHORT - this is a reference card, not a guide`
}

/**
 * Prompt for extracting themes and player experiences from rulebook
 * Used to suggest taxonomy assignments for admin review
 */
export function getTaxonomyExtractionPrompt(
  rulebookText: string,
  gameName: string,
  themes: { id: string; name: string; description: string | null }[],
  playerExperiences: { id: string; name: string; description: string | null }[]
): string {
  // Keep rulebook shorter for this extraction
  const truncatedText = rulebookText.length > 15000
    ? rulebookText.substring(0, 15000) + '\n[...truncated...]'
    : rulebookText

  // Simple format for theme list
  const themesSection = themes.map(t => `${t.id}: ${t.name}`).join('\n')
  const experiencesSection = playerExperiences.map(e => `${e.id}: ${e.name}`).join('\n')

  return `Analyze "${gameName}" and select the best matching themes and player experiences.

THEMES (id: name):
${themesSection}

PLAYER EXPERIENCES (id: name):
${experiencesSection}

RULEBOOK EXCERPT:
${truncatedText}

Return valid JSON matching this structure exactly:

{"themes":[{"id":"<uuid>","confidence":0.9,"reasoning":"short reason","isPrimary":true}],"playerExperiences":[{"id":"<uuid>","confidence":0.9,"reasoning":"short reason"}],"newSuggestions":[]}

Rules:
1. Select 1-3 themes, mark ONE as isPrimary:true, others isPrimary:false
2. Select 1-3 player experiences
3. Use exact UUIDs from lists above
4. confidence: number 0.0-1.0
5. reasoning: one short sentence, use only straight quotes
6. newSuggestions: leave as empty array []
7. Return ONLY the JSON object, no other text`
}
