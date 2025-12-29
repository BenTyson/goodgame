/**
 * Game Recommendation Scoring Algorithm
 */

import type { Game } from '@/types/database'
import type { WizardAnswers, RecommendationSignals } from './types'
import { getArchetypeCategories, getArchetypeMechanics, classifyArchetype } from './archetypes'

/**
 * Convert wizard answers into recommendation signals
 */
export function buildSignals(answers: WizardAnswers): RecommendationSignals {
  const signals: RecommendationSignals = {
    playerCountMin: 1,
    playerCountMax: 10,
    playTimeMin: 0,
    playTimeMax: 300,
    weightMin: 1,
    weightMax: 5,
    preferredCategories: [],
    preferredMechanics: [],
    preferredThemes: [],
  }

  // Player count mapping
  switch (answers.playerCount) {
    case 'solo':
      signals.playerCountMin = 1
      signals.playerCountMax = 1
      break
    case 'partner':
      signals.playerCountMin = 2
      signals.playerCountMax = 2
      break
    case 'small-group':
      signals.playerCountMin = 3
      signals.playerCountMax = 4
      break
    case 'party':
      signals.playerCountMin = 5
      signals.playerCountMax = 12
      break
  }

  // Play time mapping
  switch (answers.playTime) {
    case 'quick':
      signals.playTimeMin = 0
      signals.playTimeMax = 30
      break
    case 'standard':
      signals.playTimeMin = 30
      signals.playTimeMax = 60
      break
    case 'long':
      signals.playTimeMin = 60
      signals.playTimeMax = 120
      break
    case 'epic':
      signals.playTimeMin = 120
      signals.playTimeMax = 300
      break
  }

  // Weight/complexity mapping
  switch (answers.experienceLevel) {
    case 'new':
      signals.weightMin = 1
      signals.weightMax = 2
      break
    case 'casual':
      signals.weightMin = 1.5
      signals.weightMax = 2.5
      break
    case 'experienced':
      signals.weightMin = 2
      signals.weightMax = 4
      break
    case 'hardcore':
      signals.weightMin = 3
      signals.weightMax = 5
      break
  }

  // Category preferences based on experience type
  switch (answers.experienceType) {
    case 'competitive':
      signals.preferredCategories = ['strategy', 'economic', 'war-game']
      break
    case 'cooperative':
      signals.preferredCategories = ['cooperative', 'team-based']
      break
    case 'strategic':
      signals.preferredCategories = ['strategy', 'economic', 'civilization']
      break
    case 'social':
      signals.preferredCategories = ['party', 'social-deduction', 'word-game']
      break
    case 'narrative':
      signals.preferredCategories = ['thematic', 'adventure', 'fantasy']
      break
  }

  // Theme/world preferences
  switch (answers.themeWorld) {
    case 'swords-sorcery':
      signals.preferredThemes = ['fantasy', 'medieval', 'adventure', 'mythology', 'fighting', 'dragons']
      signals.preferredCategories.push('fantasy', 'adventure', 'fighting')
      break
    case 'stars-cosmos':
      signals.preferredThemes = ['science-fiction', 'space', 'space-exploration', 'cyberpunk', 'post-apocalyptic']
      signals.preferredCategories.push('science-fiction')
      break
    case 'empires-ages':
      signals.preferredThemes = ['ancient', 'medieval', 'renaissance', 'civilization', 'war', 'political']
      signals.preferredCategories.push('civilization', 'war-game', 'political')
      break
    case 'mystery-shadows':
      signals.preferredThemes = ['horror', 'mystery', 'murder', 'spies', 'deduction', 'zombies', 'lovecraft']
      signals.preferredCategories.push('horror', 'mystery', 'deduction')
      break
    case 'hearth-harvest':
      signals.preferredThemes = ['animals', 'farming', 'nature', 'environmental', 'prehistoric']
      signals.preferredCategories.push('animals', 'environmental')
      break
    case 'surprise-me':
      // No theme preference - leave empty
      break
  }

  return signals
}

/**
 * Score a game against user preferences (0-100)
 */
export function scoreGame(
  game: Game,
  signals: RecommendationSignals,
  gameCategories: string[],
  gameMechanics: string[]
): number {
  let score = 0

  // Player count optimality (25 points)
  const playerTarget = (signals.playerCountMin + signals.playerCountMax) / 2
  const gameBestPlayers = game.player_count_best || []

  if (gameBestPlayers.includes(Math.round(playerTarget))) {
    // Perfect match with "best player count"
    score += 25
  } else if (
    playerTarget >= game.player_count_min &&
    playerTarget <= game.player_count_max
  ) {
    // Within supported range
    score += 15
  } else if (
    game.player_count_min <= signals.playerCountMax &&
    game.player_count_max >= signals.playerCountMin
  ) {
    // Overlapping range
    score += 8
  }

  // Play time match (10 points)
  const playTimeTarget = (signals.playTimeMin + signals.playTimeMax) / 2
  const gameTime = game.play_time_max || game.play_time_min || 60

  if (gameTime >= signals.playTimeMin && gameTime <= signals.playTimeMax) {
    // Within desired range
    const deviation = Math.abs(gameTime - playTimeTarget) / playTimeTarget
    score += Math.max(3, 10 - deviation * 7)
  }

  // Weight/complexity match (15 points)
  const weightTarget = (signals.weightMin + signals.weightMax) / 2
  const gameWeight = game.weight || 2.5

  if (gameWeight >= signals.weightMin && gameWeight <= signals.weightMax) {
    const deviation = Math.abs(gameWeight - weightTarget) / weightTarget
    score += Math.max(5, 15 - deviation * 10)
  }

  // Category match (15 points)
  const categoryMatches = gameCategories.filter((cat) =>
    signals.preferredCategories.includes(cat)
  ).length
  score += Math.min(categoryMatches * 7, 15)

  // Theme match (10 points) - themes often overlap with categories
  if (signals.preferredThemes.length > 0) {
    const themeMatches = gameCategories.filter((cat) =>
      signals.preferredThemes.includes(cat)
    ).length
    score += Math.min(themeMatches * 5, 10)
  }

  // Mechanic match (10 points)
  const mechanicMatches = gameMechanics.filter((mech) =>
    signals.preferredMechanics.includes(mech)
  ).length
  score += Math.min(mechanicMatches * 5, 10)

  // Curated flags boost (15 points total)
  if (game.is_staff_pick) score += 6
  if (game.is_top_rated) score += 4
  if (game.is_trending) score += 3
  if (game.is_hidden_gem) score += 2

  return Math.round(score)
}

/**
 * Get hard filters for database query
 */
export function getHardFilters(signals: RecommendationSignals) {
  return {
    playersMin: signals.playerCountMin,
    playersMax: signals.playerCountMax,
    timeMin: signals.playTimeMin,
    timeMax: signals.playTimeMax,
    weightMin: signals.weightMin,
    weightMax: signals.weightMax,
  }
}

/**
 * Score and rank all candidate games
 */
export function rankGames(
  games: Game[],
  signals: RecommendationSignals,
  gameCategoriesMap: Map<string, string[]>,
  gameMechanicsMap: Map<string, string[]>
): { game: Game; score: number }[] {
  const scored = games.map((game) => ({
    game,
    score: scoreGame(
      game,
      signals,
      gameCategoriesMap.get(game.id) || [],
      gameMechanicsMap.get(game.id) || []
    ),
  }))

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score)
}
