/**
 * Claude AI Prompts for Game Recommendations
 */

import type { Archetype, WizardAnswers, ThemeWorld } from './types'
import type { Game } from '@/types/database'

// System prompt for recommendation ranking
export const RECOMMENDATION_SYSTEM_PROMPT = `You are a friendly board game matchmaker for Board Nomads. Your job is to pick the 3 best games from a list of candidates for a specific player based on their preferences.

You'll receive:
1. A player profile (their archetype, preferences, what they're looking for)
2. A list of candidate games with pre-computed compatibility scores

Your tasks:
1. Select the TOP 3 games that best match this person's preferences
2. Write personalized explanations for WHY each game suits THEM specifically
3. Rank them 1-2-3 based on confidence

Writing style:
- Warm and enthusiastic, like recommending to a friend
- Reference their specific preferences naturally
- Keep explanations to 2-3 sentences max
- Make each game sound exciting and worth trying
- Be specific about what makes each game great for THEM

Return valid JSON only. No markdown formatting.`

// Types for the AI response
export interface AIRecommendation {
  gameId: string
  rank: 1 | 2 | 3
  confidence: 'high' | 'medium'
  personalizedReason: string
  playPitch: string
  perfectFor: string
}

export interface AIResponse {
  recommendations: AIRecommendation[]
}

// Build the user prompt for Claude
export function buildRecommendationPrompt(
  archetype: Archetype,
  answers: WizardAnswers,
  candidates: { game: Game; score: number; categories: string[]; mechanics: string[] }[]
): string {
  // Build player profile description
  const playerProfile = buildPlayerProfile(archetype, answers)

  // Build candidate list
  const candidateList = candidates
    .slice(0, 15) // Top 15 candidates
    .map((c, i) => buildCandidateEntry(c, i + 1))
    .join('\n')

  return `Find the perfect games for this player:

**Player Profile:**
${playerProfile}

**Candidate Games (ordered by compatibility score):**
${candidateList}

Return a JSON object with this exact structure:
{
  "recommendations": [
    {
      "gameId": "uuid-of-game",
      "rank": 1,
      "confidence": "high",
      "personalizedReason": "Two sentences about why this specifically matches them.",
      "playPitch": "One exciting sentence about what makes this game great.",
      "perfectFor": "Perfect for [specific descriptor matching their profile]."
    },
    { ... rank 2 ... },
    { ... rank 3 ... }
  ]
}`
}

function buildPlayerProfile(archetype: Archetype, answers: WizardAnswers): string {
  const lines: string[] = []

  lines.push(`- Archetype: ${archetype.name}`)
  lines.push(`- ${archetype.description}`)

  if (answers.playerCount) {
    const playerDescriptions: Record<string, string> = {
      solo: 'Playing solo',
      partner: 'Playing with a partner (2 players)',
      'small-group': 'Playing with a small group (3-4 players)',
      party: 'Playing with a larger group (5+ players)',
    }
    lines.push(`- Group size: ${playerDescriptions[answers.playerCount]}`)
  }

  if (answers.playTime) {
    const timeDescriptions: Record<string, string> = {
      quick: 'Quick games under 30 minutes',
      standard: 'Standard sessions of 30-60 minutes',
      long: 'Longer sessions of 1-2 hours',
      epic: 'Epic sessions of 2+ hours',
    }
    lines.push(`- Time preference: ${timeDescriptions[answers.playTime]}`)
  }

  if (answers.experienceLevel) {
    const levelDescriptions: Record<string, string> = {
      new: 'New to board games, wants approachable games',
      casual: 'Casual gamer, enjoys occasional game nights',
      experienced: 'Experienced, comfortable with rules',
      hardcore: 'Hardcore, loves complex strategy',
    }
    lines.push(`- Experience: ${levelDescriptions[answers.experienceLevel]}`)
  }

  if (answers.experienceType) {
    const typeDescriptions: Record<string, string> = {
      competitive: 'Looking for competitive, head-to-head gameplay',
      cooperative: 'Looking for cooperative, team-based experiences',
      strategic: 'Looking for deep strategic thinking',
      social: 'Looking for social fun and laughter',
      narrative: 'Looking for story-driven adventures',
    }
    lines.push(`- Seeking: ${typeDescriptions[answers.experienceType]}`)
  }

  if (answers.themeWorld && answers.themeWorld !== 'surprise-me') {
    const themeDescriptions: Record<string, string> = {
      'swords-sorcery': 'Fantasy worlds with magic, dragons, and epic quests',
      'stars-cosmos': 'Sci-fi settings with space, aliens, and futuristic tech',
      'empires-ages': 'Historical themes with civilizations, war, and empires',
      'mystery-shadows': 'Dark and mysterious settings with horror, noir, or detective themes',
      'hearth-harvest': 'Cozy themes with nature, farming, and animals',
    }
    lines.push(`- Theme preference: ${themeDescriptions[answers.themeWorld]}`)
  }

  return lines.join('\n')
}

function buildCandidateEntry(
  candidate: { game: Game; score: number; categories: string[]; mechanics: string[] },
  index: number
): string {
  const { game, score, categories, mechanics } = candidate

  const details: string[] = []
  details.push(`${game.player_count_min}-${game.player_count_max} players`)

  if (game.play_time_max) {
    details.push(`${game.play_time_min || game.play_time_max}-${game.play_time_max} min`)
  }

  if (game.weight) {
    details.push(`Weight: ${game.weight.toFixed(1)}/5`)
  }

  const flags: string[] = []
  if (game.is_staff_pick) flags.push('Staff Pick')
  if (game.is_top_rated) flags.push('Top Rated')
  if (game.is_trending) flags.push('Trending')
  if (game.is_hidden_gem) flags.push('Hidden Gem')

  return `${index}. **${game.name}** (ID: ${game.id}, Score: ${score})
   ${details.join(' | ')}
   Categories: ${categories.join(', ') || 'N/A'}
   Mechanics: ${mechanics.join(', ') || 'N/A'}
   ${flags.length > 0 ? `Tags: ${flags.join(', ')}` : ''}
   ${game.description ? game.description.slice(0, 150) + '...' : ''}`
}

/**
 * Generate personalized recommendation text using templates
 * This is used as fallback when AI is unavailable and for enhancing recommendations
 */
export function generatePersonalizedText(
  game: Game,
  answers: WizardAnswers,
  archetype: Archetype,
  categories: string[],
  mechanics: string[],
  rank: number
): { personalizedReason: string; playPitch: string; perfectFor: string } {
  const reasons: string[] = []
  const pitches: string[] = []

  // Theme-based personalization
  const themeReasons = getThemeBasedReason(game, answers.themeWorld, categories)
  if (themeReasons) reasons.push(themeReasons)

  // Experience type personalization
  const expReason = getExperienceTypeReason(game, answers.experienceType, categories, mechanics)
  if (expReason) reasons.push(expReason)

  // Player count personalization
  const playerReason = getPlayerCountReason(game, answers.playerCount)
  if (playerReason) reasons.push(playerReason)

  // Complexity personalization
  const complexityReason = getComplexityReason(game, answers.experienceLevel)
  if (complexityReason) reasons.push(complexityReason)

  // Play time personalization
  const timeReason = getPlayTimeReason(game, answers.playTime)
  if (timeReason) pitches.push(timeReason)

  // Curated flags boost
  if (game.is_staff_pick) pitches.push("It's a staff favorite here at Board Nomads.")
  else if (game.is_hidden_gem) pitches.push("It's a hidden gem that deserves more attention.")
  else if (game.is_trending) pitches.push("It's been getting a lot of buzz lately.")
  else if (game.is_top_rated) pitches.push("It's consistently highly rated by players.")

  // Build final text
  const personalizedReason = reasons.length > 0
    ? reasons.slice(0, 2).join(' ')
    : `${game.name} matches what you're looking for with its engaging gameplay and solid design.`

  const playPitch = pitches.length > 0
    ? pitches[0]
    : getGenericPitch(game, categories)

  const perfectFor = getPerfectForText(answers, archetype, rank)

  return { personalizedReason, playPitch, perfectFor }
}

function getThemeBasedReason(game: Game, themeWorld: ThemeWorld | undefined, categories: string[]): string | null {
  if (!themeWorld || themeWorld === 'surprise-me') return null

  const categoriesLower = categories.map(c => c.toLowerCase())

  const themeMatches: Record<ThemeWorld, { keywords: string[]; phrases: string[] }> = {
    'swords-sorcery': {
      keywords: ['fantasy', 'medieval', 'adventure', 'mythology', 'fighting', 'dragon'],
      phrases: [
        `${game.name} takes you into an epic fantasy world you'll love exploring.`,
        `This one brings the fantasy adventure vibes you're after.`,
        `Perfect for your love of magical, epic settings.`,
      ]
    },
    'stars-cosmos': {
      keywords: ['science fiction', 'space', 'sci-fi', 'alien', 'cyberpunk', 'futuristic'],
      phrases: [
        `${game.name} delivers the sci-fi experience you're craving.`,
        `This hits that space exploration itch perfectly.`,
        `Great for fans of futuristic themes like yourself.`,
      ]
    },
    'empires-ages': {
      keywords: ['ancient', 'civilization', 'war', 'historical', 'political', 'renaissance'],
      phrases: [
        `${game.name} captures that empire-building feel you enjoy.`,
        `This one's all about building your legacy through the ages.`,
        `Perfect for history buffs who want to reshape the world.`,
      ]
    },
    'mystery-shadows': {
      keywords: ['horror', 'mystery', 'murder', 'detective', 'deduction', 'zombie', 'lovecraft'],
      phrases: [
        `${game.name} brings the dark, mysterious atmosphere you're drawn to.`,
        `This delivers delicious tension and intrigue.`,
        `Great for those who love unraveling secrets and mysteries.`,
      ]
    },
    'hearth-harvest': {
      keywords: ['animals', 'farming', 'nature', 'environmental', 'cozy'],
      phrases: [
        `${game.name} has that cozy, peaceful vibe you're looking for.`,
        `Perfect for a relaxing game night with warm, inviting gameplay.`,
        `This one's charmingly wholesome without sacrificing depth.`,
      ]
    },
    'surprise-me': { keywords: [], phrases: [] }
  }

  const match = themeMatches[themeWorld]
  const hasThemeMatch = match.keywords.some(kw =>
    categoriesLower.some(cat => cat.includes(kw))
  )

  if (hasThemeMatch && match.phrases.length > 0) {
    return match.phrases[Math.floor(Math.random() * match.phrases.length)]
  }

  return null
}

function getExperienceTypeReason(
  game: Game,
  experienceType: string | undefined,
  categories: string[],
  mechanics: string[]
): string | null {
  if (!experienceType) return null

  const categoriesLower = categories.map(c => c.toLowerCase())
  const mechanicsLower = mechanics.map(m => m.toLowerCase())

  switch (experienceType) {
    case 'competitive':
      if (categoriesLower.some(c => c.includes('strategy') || c.includes('economic'))) {
        return `It offers the competitive depth and strategic challenge you want.`
      }
      return `Great for head-to-head competition where skill matters.`

    case 'cooperative':
      if (categoriesLower.some(c => c.includes('cooperative'))) {
        return `You'll work together as a team to overcome challenges.`
      }
      if (mechanicsLower.some(m => m.includes('cooperative'))) {
        return `The cooperative gameplay creates memorable shared victories.`
      }
      return null

    case 'strategic':
      if (game.weight && game.weight >= 2.5) {
        return `The strategic depth here will keep you thinking multiple moves ahead.`
      }
      return `Offers plenty of meaningful decisions to sink your teeth into.`

    case 'social':
      if (categoriesLower.some(c => c.includes('party') || c.includes('social'))) {
        return `It's built for laughs and memorable moments with friends.`
      }
      return `Easy to get into and sparks great table conversation.`

    case 'narrative':
      if (categoriesLower.some(c => c.includes('adventure') || c.includes('thematic'))) {
        return `The storytelling here will draw you and your group right in.`
      }
      return `Each session tells its own unique story.`

    default:
      return null
  }
}

function getPlayerCountReason(game: Game, playerCount: string | undefined): string | null {
  if (!playerCount) return null

  const bestPlayers = game.player_count_best || []

  switch (playerCount) {
    case 'solo':
      if (game.player_count_min === 1) {
        return `${game.name} has a great solo mode that's engaging from start to finish.`
      }
      return null

    case 'partner':
      if (bestPlayers.includes(2) || (game.player_count_min <= 2 && game.player_count_max >= 2)) {
        return `It plays excellently at 2 players.`
      }
      return null

    case 'small-group':
      if (bestPlayers.some(p => p >= 3 && p <= 4)) {
        return `It really shines with 3-4 players.`
      }
      return null

    case 'party':
      if (game.player_count_max >= 5) {
        return `${game.name} handles larger groups beautifully.`
      }
      return null

    default:
      return null
  }
}

function getComplexityReason(game: Game, experienceLevel: string | undefined): string | null {
  if (!experienceLevel || !game.weight) return null

  const weight = game.weight

  switch (experienceLevel) {
    case 'new':
      if (weight <= 2) {
        return `It's approachable enough to learn quickly without feeling overwhelming.`
      }
      return null

    case 'casual':
      if (weight >= 1.5 && weight <= 2.5) {
        return `The rules are easy to pick up, but there's enough depth to stay interesting.`
      }
      return null

    case 'experienced':
      if (weight >= 2 && weight <= 3.5) {
        return `It hits that sweet spot of depth without being overly complicated.`
      }
      return null

    case 'hardcore':
      if (weight >= 3) {
        return `The complexity here will satisfy your appetite for meaty decisions.`
      }
      return null

    default:
      return null
  }
}

function getPlayTimeReason(game: Game, playTime: string | undefined): string | null {
  if (!playTime) return null

  const gameTime = game.play_time_max || game.play_time_min || 60

  switch (playTime) {
    case 'quick':
      if (gameTime <= 30) {
        return `Quick to play, so you can fit it into any game night.`
      }
      return null

    case 'standard':
      if (gameTime >= 30 && gameTime <= 60) {
        return `Perfect length for a satisfying session without overstaying its welcome.`
      }
      return null

    case 'long':
      if (gameTime >= 60 && gameTime <= 120) {
        return `Gives you time to really sink into the experience.`
      }
      return null

    case 'epic':
      if (gameTime >= 120) {
        return `An epic experience that rewards the time investment.`
      }
      return null

    default:
      return null
  }
}

function getGenericPitch(game: Game, categories: string[]): string {
  const pitches = [
    `A well-designed game that consistently delivers a great experience.`,
    `Offers a rewarding experience that keeps players coming back.`,
    `Smart design choices make every session enjoyable.`,
    `A solid choice that hits all the right notes.`,
  ]

  // Add category-specific pitches
  const categoriesLower = categories.map(c => c.toLowerCase())
  if (categoriesLower.some(c => c.includes('family'))) {
    pitches.push(`Great for bringing people together around the table.`)
  }
  if (categoriesLower.some(c => c.includes('strategy'))) {
    pitches.push(`Rewards careful planning and tactical thinking.`)
  }

  return pitches[Math.floor(Math.random() * pitches.length)]
}

function getPerfectForText(answers: WizardAnswers, archetype: Archetype, rank: number): string {
  const descriptors: string[] = []

  // Based on player count
  if (answers.playerCount === 'solo') descriptors.push('solo sessions')
  else if (answers.playerCount === 'partner') descriptors.push('couples')
  else if (answers.playerCount === 'small-group') descriptors.push('game nights with friends')
  else if (answers.playerCount === 'party') descriptors.push('larger gatherings')

  // Based on experience
  if (answers.experienceType === 'competitive') descriptors.push('competitive spirits')
  else if (answers.experienceType === 'cooperative') descriptors.push('team players')
  else if (answers.experienceType === 'strategic') descriptors.push('strategic thinkers')
  else if (answers.experienceType === 'social') descriptors.push('social gamers')
  else if (answers.experienceType === 'narrative') descriptors.push('story lovers')

  // Based on theme
  if (answers.themeWorld === 'swords-sorcery') descriptors.push('fantasy fans')
  else if (answers.themeWorld === 'stars-cosmos') descriptors.push('sci-fi enthusiasts')
  else if (answers.themeWorld === 'mystery-shadows') descriptors.push('mystery lovers')
  else if (answers.themeWorld === 'hearth-harvest') descriptors.push('cozy game fans')

  if (descriptors.length === 0) {
    return `Perfect for ${archetype.name.toLowerCase().replace('the ', '')} types like you.`
  }

  const selected = descriptors.slice(0, 2)
  if (rank === 1) {
    return `Perfect for ${selected.join(' and ')} who want the best.`
  }
  return `Perfect for ${selected.join(' and ')}.`
}
