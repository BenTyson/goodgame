/**
 * Gamer Archetype Definitions and Classification
 */

import type { Archetype, ArchetypeId, WizardAnswers } from './types'

// Archetype definitions
export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  strategist: {
    id: 'strategist',
    name: 'The Strategist',
    icon: 'Brain',
    description: 'You love games where every decision matters. The deeper the strategy, the better.',
    color: 'bg-purple-500',
  },
  'social-butterfly': {
    id: 'social-butterfly',
    name: 'The Social Butterfly',
    icon: 'Users',
    description: 'For you, games are about bringing people together. Laughter matters more than winning.',
    color: 'bg-pink-500',
  },
  'team-player': {
    id: 'team-player',
    name: 'The Team Player',
    icon: 'Handshake',
    description: 'You would rather work together than compete. Beating the game as a team is the ultimate thrill.',
    color: 'bg-blue-500',
  },
  storyteller: {
    id: 'storyteller',
    name: 'The Storyteller',
    icon: 'BookOpen',
    description: 'Games are adventures waiting to unfold. Theme and narrative draw you in.',
    color: 'bg-amber-500',
  },
  'quick-draw': {
    id: 'quick-draw',
    name: 'The Quick Draw',
    icon: 'Zap',
    description: 'You love fast, decisive games. Set up quick, play quick, and on to the next one.',
    color: 'bg-yellow-500',
  },
  curator: {
    id: 'curator',
    name: 'The Curator',
    icon: 'Gem',
    description: 'You appreciate elegance and design. A beautifully crafted game is a joy to play.',
    color: 'bg-teal-500',
  },
}

// Archetype scoring weights
interface ArchetypeScore {
  strategist: number
  'social-butterfly': number
  'team-player': number
  storyteller: number
  'quick-draw': number
  curator: number
}

/**
 * Classify user into an archetype based on their answers
 */
export function classifyArchetype(answers: WizardAnswers): Archetype {
  const scores: ArchetypeScore = {
    strategist: 0,
    'social-butterfly': 0,
    'team-player': 0,
    storyteller: 0,
    'quick-draw': 0,
    curator: 0,
  }

  // Player count scoring
  switch (answers.playerCount) {
    case 'solo':
      scores.strategist += 15
      scores.curator += 10
      break
    case 'partner':
      scores.strategist += 10
      scores.curator += 5
      break
    case 'small-group':
      scores['team-player'] += 10
      scores.curator += 5
      break
    case 'party':
      scores['social-butterfly'] += 25
      break
  }

  // Play time scoring
  switch (answers.playTime) {
    case 'quick':
      scores['quick-draw'] += 25
      scores['social-butterfly'] += 10
      break
    case 'standard':
      scores.curator += 10
      scores['team-player'] += 5
      break
    case 'long':
      scores.strategist += 15
      scores.storyteller += 10
      break
    case 'epic':
      scores.strategist += 20
      scores.storyteller += 15
      break
  }

  // Experience level scoring
  switch (answers.experienceLevel) {
    case 'new':
      scores['social-butterfly'] += 10
      scores['quick-draw'] += 10
      break
    case 'casual':
      scores['social-butterfly'] += 10
      scores['team-player'] += 5
      break
    case 'experienced':
      scores.strategist += 10
      scores.curator += 10
      break
    case 'hardcore':
      scores.strategist += 25
      scores.curator += 5
      break
  }

  // Experience type scoring (strongest signal)
  switch (answers.experienceType) {
    case 'competitive':
      scores.strategist += 30
      break
    case 'cooperative':
      scores['team-player'] += 35
      break
    case 'strategic':
      scores.strategist += 25
      scores.curator += 10
      break
    case 'social':
      scores['social-butterfly'] += 35
      break
    case 'narrative':
      scores.storyteller += 40
      break
  }

  // Find the highest scoring archetype
  const entries = Object.entries(scores) as [ArchetypeId, number][]
  const sorted = entries.sort((a, b) => b[1] - a[1])
  const winnerId = sorted[0][0]

  return ARCHETYPES[winnerId]
}

/**
 * Get category preferences based on archetype
 * Used to boost matching games in scoring
 */
export function getArchetypeCategories(archetypeId: ArchetypeId): string[] {
  const categoryMap: Record<ArchetypeId, string[]> = {
    strategist: ['strategy', 'economic', 'war-game', 'civilization'],
    'social-butterfly': ['party', 'social-deduction', 'word-game', 'trivia'],
    'team-player': ['cooperative', 'team-based', 'campaign'],
    storyteller: ['thematic', 'adventure', 'fantasy', 'horror', 'sci-fi'],
    'quick-draw': ['card-game', 'dice', 'real-time', 'dexterity'],
    curator: ['abstract', 'puzzle', 'tile-placement', 'pattern-building'],
  }
  return categoryMap[archetypeId] || []
}

/**
 * Get mechanic preferences based on archetype
 */
export function getArchetypeMechanics(archetypeId: ArchetypeId): string[] {
  const mechanicMap: Record<ArchetypeId, string[]> = {
    strategist: ['worker-placement', 'area-control', 'engine-building', 'auction'],
    'social-butterfly': ['voting', 'trading', 'negotiation', 'bluffing'],
    'team-player': ['cooperative-play', 'hand-management', 'action-points'],
    storyteller: ['narrative-choice', 'role-playing', 'storytelling', 'legacy'],
    'quick-draw': ['dice-rolling', 'push-your-luck', 'real-time', 'speed'],
    curator: ['tile-placement', 'pattern-building', 'set-collection', 'drafting'],
  }
  return mechanicMap[archetypeId] || []
}
