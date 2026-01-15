'use client'

import { useReducer, useCallback } from 'react'
import { WizardContainer } from '@/components/recommend/WizardContainer'
import { WelcomeStep } from '@/components/recommend/WelcomeStep'
import { ScenarioCards } from '@/components/recommend/ScenarioCards'
import { SliderQuestion } from '@/components/recommend/SliderQuestion'
import { ArchetypeReveal } from '@/components/recommend/ArchetypeReveal'
import { RecommendationResults } from '@/components/recommend/RecommendationResults'
import type {
  WizardState,
  WizardAction,
  WizardAnswers,
  Archetype,
  GameRecommendation,
  GameSuggestion,
  PlayerCountOption,
  PlayTimeOption,
  ExperienceLevel,
  ExperienceType,
  ThemeWorld,
} from '@/lib/recommend/types'

// Questions configuration
const PLAYER_COUNT_OPTIONS = [
  { id: 'solo', label: 'Solo', description: 'Just me', icon: 'User' },
  { id: 'partner', label: 'Partner', description: '2 players', icon: 'Users' },
  { id: 'small-group', label: 'Small Group', description: '3-4 players', icon: 'Users' },
  { id: 'party', label: 'Party', description: '5+ players', icon: 'Users' },
]

const EXPERIENCE_LEVEL_OPTIONS = [
  { id: 'new', label: 'New to Games', description: 'Looking for something approachable', icon: 'Sparkles' },
  { id: 'casual', label: 'Casual Gamer', description: 'I enjoy the occasional game night', icon: 'Coffee' },
  { id: 'experienced', label: 'Experienced', description: 'I know my way around a rulebook', icon: 'BookOpen' },
  { id: 'hardcore', label: 'Hardcore', description: 'Bring on the complexity', icon: 'Brain' },
]

const EXPERIENCE_TYPE_OPTIONS = [
  { id: 'competitive', label: 'Competitive', description: 'I play to win', icon: 'Swords' },
  { id: 'cooperative', label: 'Cooperative', description: 'Let us work together', icon: 'Handshake' },
  { id: 'strategic', label: 'Strategic', description: 'Deep thinking and planning', icon: 'Target' },
  { id: 'social', label: 'Social', description: 'Laughter and interaction', icon: 'PartyPopper' },
  { id: 'narrative', label: 'Narrative', description: 'Story and adventure', icon: 'BookOpen' },
]

const THEME_WORLD_OPTIONS = [
  { id: 'swords-sorcery', label: 'Swords & Sorcery', description: 'Fantasy, dungeons, dragons, epic quests', icon: 'Sword' },
  { id: 'stars-cosmos', label: 'Stars & Cosmos', description: 'Sci-fi, space exploration, aliens, tech', icon: 'Rocket' },
  { id: 'empires-ages', label: 'Empires & Ages', description: 'History, civilization, war, ancient cultures', icon: 'Castle' },
  { id: 'mystery-shadows', label: 'Mystery & Shadows', description: 'Horror, noir, detective, secrets', icon: 'Ghost' },
  { id: 'hearth-harvest', label: 'Hearth & Harvest', description: 'Nature, farming, animals, cozy vibes', icon: 'TreeDeciduous' },
  { id: 'surprise-me', label: 'Surprise Me', description: 'I\'m open to anything!', icon: 'Shuffle' },
]

// Wizard steps
type StepId = 'welcome' | 'player-count' | 'play-time' | 'experience-level' | 'experience-type' | 'theme-world' | 'loading' | 'archetype' | 'results'

const STEPS: StepId[] = [
  'welcome',
  'player-count',
  'play-time',
  'experience-level',
  'experience-type',
  'theme-world',
  'loading',
  'archetype',
  'results',
]

// Initial state
const initialState: WizardState = {
  currentStep: 0,
  totalSteps: STEPS.length,
  answers: {},
  isComplete: false,
  isLoading: false,
  archetype: null,
  recommendations: null,
  alsoConsider: null,
  error: null,
}

// Reducer for wizard state
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: action.value,
        },
      }
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
      }
    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      }
    case 'SKIP_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      }
    case 'SET_RESULTS':
      return {
        ...state,
        isLoading: false,
        isComplete: true,
        archetype: action.archetype,
        recommendations: action.recommendations,
        alsoConsider: action.alsoConsider,
      }
    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error,
      }
    case 'RESTART':
      return initialState
    default:
      return state
  }
}

export function RecommendWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState)
  const currentStepId = STEPS[state.currentStep]

  // Calculate question progress (excluding welcome, loading, archetype, results)
  const questionSteps = STEPS.filter(
    s => !['welcome', 'loading', 'archetype', 'results'].includes(s)
  )
  const currentQuestionIndex = questionSteps.indexOf(currentStepId)
  const questionProgress = currentQuestionIndex >= 0
    ? ((currentQuestionIndex + 1) / questionSteps.length) * 100
    : 0

  // Handle answer selection
  const handleAnswer = useCallback((questionId: string, value: unknown) => {
    dispatch({ type: 'SET_ANSWER', questionId, value })
    dispatch({ type: 'NEXT_STEP' })
  }, [])

  // Handle navigation
  const handleBack = useCallback(() => {
    dispatch({ type: 'PREV_STEP' })
  }, [])

  // Handle getting recommendations
  const handleGetRecommendations = useCallback(async () => {
    // Note: We're already on the loading step (handleAnswer advanced us here)
    dispatch({ type: 'SET_LOADING', isLoading: true })

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: state.answers }),
      })

      if (!response.ok) {
        throw new Error('Failed to get recommendations')
      }

      const data = await response.json()

      // Set results first (this populates archetype data)
      dispatch({
        type: 'SET_RESULTS',
        archetype: data.archetype,
        recommendations: data.recommendations,
        alsoConsider: data.alsoConsider || [],
      })

      // Now go to archetype reveal step (data is ready)
      dispatch({ type: 'NEXT_STEP' }) // Go to archetype step

      // After archetype reveal animation, go to results
      setTimeout(() => {
        dispatch({ type: 'NEXT_STEP' }) // Go to results step
      }, 2500)

    } catch (error) {
      console.error('Recommendation error:', error)
      dispatch({ type: 'SET_ERROR', error: 'Something went wrong. Please try again.' })
    }
  }, [state.answers])

  // Handle restart
  const handleRestart = useCallback(() => {
    dispatch({ type: 'RESTART' })
  }, [])

  // Show progress bar only during questions
  const showProgress = currentQuestionIndex >= 0

  return (
    <WizardContainer
      progress={showProgress ? questionProgress : undefined}
      showBack={state.currentStep > 0 && currentStepId !== 'loading' && currentStepId !== 'results'}
      onBack={handleBack}
    >
      {/* Welcome Step */}
      {currentStepId === 'welcome' && (
        <WelcomeStep onStart={() => dispatch({ type: 'NEXT_STEP' })} />
      )}

      {/* Player Count Question */}
      {currentStepId === 'player-count' && (
        <ScenarioCards
          title="Who are you playing with?"
          subtitle="This helps us find games that work for your group"
          options={PLAYER_COUNT_OPTIONS}
          selectedId={state.answers.playerCount}
          onSelect={(id) => handleAnswer('playerCount', id as PlayerCountOption)}
        />
      )}

      {/* Play Time Question */}
      {currentStepId === 'play-time' && (
        <SliderQuestion
          title="How much time do you have?"
          subtitle="We will find games that fit your schedule"
          value={state.answers.playTime || 'standard'}
          options={[
            { id: 'quick', label: 'Quick', description: 'Under 30 min' },
            { id: 'standard', label: 'Standard', description: '30-60 min' },
            { id: 'long', label: 'Long', description: '1-2 hours' },
            { id: 'epic', label: 'Epic', description: '2+ hours' },
          ]}
          onSelect={(id) => handleAnswer('playTime', id as PlayTimeOption)}
        />
      )}

      {/* Experience Level Question */}
      {currentStepId === 'experience-level' && (
        <ScenarioCards
          title="What's your experience level?"
          subtitle="We will match complexity to your comfort zone"
          options={EXPERIENCE_LEVEL_OPTIONS}
          selectedId={state.answers.experienceLevel}
          onSelect={(id) => handleAnswer('experienceLevel', id as ExperienceLevel)}
        />
      )}

      {/* Experience Type Question */}
      {currentStepId === 'experience-type' && (
        <ScenarioCards
          title="What experience are you looking for?"
          subtitle="Pick what sounds most appealing right now"
          options={EXPERIENCE_TYPE_OPTIONS}
          selectedId={state.answers.experienceType}
          onSelect={(id) => {
            dispatch({ type: 'SET_ANSWER', questionId: 'experienceType', value: id as ExperienceType })
            // Skip theme question for social/party games (they're usually theme-light)
            if (id === 'social') {
              dispatch({ type: 'SET_ANSWER', questionId: 'themeWorld', value: 'surprise-me' })
              dispatch({ type: 'NEXT_STEP' }) // Skip to theme-world
              dispatch({ type: 'NEXT_STEP' }) // Skip past theme-world to loading
              setTimeout(handleGetRecommendations, 300)
            } else {
              dispatch({ type: 'NEXT_STEP' })
            }
          }}
        />
      )}

      {/* Theme World Question */}
      {currentStepId === 'theme-world' && (
        <ScenarioCards
          title="What world draws you in?"
          subtitle="Pick the setting that excites you most"
          options={THEME_WORLD_OPTIONS}
          selectedId={state.answers.themeWorld}
          onSelect={(id) => {
            handleAnswer('themeWorld', id as ThemeWorld)
            // This is the last question, trigger recommendations
            setTimeout(handleGetRecommendations, 300)
          }}
        />
      )}

      {/* Loading Step - show based on isLoading state, not step */}
      {state.isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          {/* Animated dice/compass icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
              <svg
                className="h-10 w-10 text-primary-foreground animate-spin"
                style={{ animationDuration: '3s' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tight md:text-2xl animate-pulse">
            The Boardmello wizards are conjuring...
          </h2>
          <p className="mt-3 text-muted-foreground max-w-sm">
            Exploring the gaming universes to find your perfect matches
          </p>

          {/* Fun animated dots */}
          <div className="mt-6 flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* Archetype Reveal Step */}
      {currentStepId === 'archetype' && state.archetype && (
        <ArchetypeReveal archetype={state.archetype} />
      )}

      {/* Results Step */}
      {currentStepId === 'results' && state.archetype && state.recommendations && (
        <RecommendationResults
          archetype={state.archetype}
          recommendations={state.recommendations}
          alsoConsider={state.alsoConsider || []}
          onRestart={handleRestart}
        />
      )}

      {/* Error State */}
      {state.error && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-lg font-medium text-destructive">{state.error}</p>
          <button
            onClick={handleRestart}
            className="mt-4 text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </WizardContainer>
  )
}
