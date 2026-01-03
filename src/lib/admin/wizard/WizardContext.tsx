'use client'

/**
 * WizardContext - Centralized state management for the game setup wizard
 *
 * Eliminates prop drilling by providing:
 * - Game state and field updates
 * - Image management
 * - Wizard progress tracking
 * - Save/async action state
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import type { Game, GameImage } from '@/types/database'
import type { GameWithRelations } from './types'

// Wizard progress state (mirrors useWizardProgress return type)
interface WizardProgressState {
  currentStep: number
  completedSteps: number[]
  skippedSteps: number[]
  isStepComplete: (step: number) => boolean
  isStepSkipped: (step: number) => boolean
  canNavigateToStep: (step: number) => boolean
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  completeStep: (step?: number) => void
  skipStep: (step?: number) => void
  resetProgress: () => void
}

// Main context value
interface WizardContextValue {
  // Game state
  game: Game
  images: GameImage[]
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
  updateImages: (images: GameImage[]) => void

  // Async action state
  saving: boolean
  saved: boolean
  saveGame: () => Promise<void>
  markUnsaved: () => void

  // Wizard progress
  progress: WizardProgressState

  // Step callbacks - stable references for step components
  handleStepComplete: () => void
  handleStepSkip: () => void

  // Router for refresh
  refreshData: () => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

interface WizardProviderProps {
  children: ReactNode
  initialGame: GameWithRelations
  progressHook: WizardProgressState
  asyncActionHook: {
    saving: boolean
    saved: boolean
    execute: (fn: () => Promise<void>) => Promise<void>
    markUnsaved: () => void
  }
}

export function WizardProvider({
  children,
  initialGame,
  progressHook,
  asyncActionHook,
}: WizardProviderProps) {
  const router = useRouter()

  // Game state - synced from server when initialGame changes
  const [game, setGame] = useState<Game>(initialGame)
  const [images, setImages] = useState<GameImage[]>(initialGame.images)

  // Sync state when server data changes (e.g., after router.refresh())
  useEffect(() => {
    setGame(initialGame)
    setImages(initialGame.images)
  }, [initialGame])

  // Field update function
  const updateField = useCallback(<K extends keyof Game>(field: K, value: Game[K]) => {
    setGame(prev => ({ ...prev, [field]: value }))
    asyncActionHook.markUnsaved()
  }, [asyncActionHook])

  // Images update function
  const updateImages = useCallback((newImages: GameImage[]) => {
    setImages(newImages)
    asyncActionHook.markUnsaved()
  }, [asyncActionHook])

  // Save game to server
  const saveGame = useCallback(async () => {
    const primaryImage = images.find(img => img.is_primary)
    const contentStatus = game.is_published ? 'published' : (game.content_status || 'none')

    await asyncActionHook.execute(async () => {
      const response = await fetch('/api/admin/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          data: {
            name: game.name,
            slug: game.slug,
            description: game.description,
            tagline: game.tagline,
            player_count_min: game.player_count_min,
            player_count_max: game.player_count_max,
            play_time_min: game.play_time_min,
            play_time_max: game.play_time_max,
            weight: game.weight,
            min_age: game.min_age,
            year_published: game.year_published,
            publisher: game.publisher,
            designers: game.designers,
            is_published: game.is_published,
            is_featured: game.is_featured,
            is_trending: game.is_trending,
            is_top_rated: game.is_top_rated,
            is_staff_pick: game.is_staff_pick,
            is_hidden_gem: game.is_hidden_gem,
            is_new_release: game.is_new_release,
            content_status: contentStatus,
            rules_content: game.rules_content,
            setup_content: game.setup_content,
            reference_content: game.reference_content,
            hero_image_url: primaryImage?.url || game.hero_image_url,
            box_image_url: primaryImage?.url || game.box_image_url,
            thumbnail_url: primaryImage?.url || game.thumbnail_url,
          }
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Save failed')
      }

      router.refresh()
    })
  }, [game, images, asyncActionHook, router])

  // Step complete handler - stable reference
  const handleStepComplete = useCallback(() => {
    progressHook.completeStep()
    progressHook.nextStep()
  }, [progressHook])

  // Step skip handler - stable reference
  const handleStepSkip = useCallback(() => {
    progressHook.skipStep()
    progressHook.nextStep()
  }, [progressHook])

  // Refresh data from server
  const refreshData = useCallback(() => {
    router.refresh()
  }, [router])

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<WizardContextValue>(() => ({
    game,
    images,
    updateField,
    updateImages,
    saving: asyncActionHook.saving,
    saved: asyncActionHook.saved,
    saveGame,
    markUnsaved: asyncActionHook.markUnsaved,
    progress: progressHook,
    handleStepComplete,
    handleStepSkip,
    refreshData,
  }), [
    game,
    images,
    updateField,
    updateImages,
    asyncActionHook.saving,
    asyncActionHook.saved,
    saveGame,
    asyncActionHook.markUnsaved,
    progressHook,
    handleStepComplete,
    handleStepSkip,
    refreshData,
  ])

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  )
}

/**
 * Hook to access wizard context
 * Must be used within WizardProvider
 */
export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider')
  }
  return context
}

/**
 * Hook for step components - provides only what steps need
 * Returns stable callbacks that won't cause re-renders
 */
export function useWizardStep() {
  const { game, handleStepComplete, handleStepSkip, refreshData } = useWizard()

  return {
    game,
    onComplete: handleStepComplete,
    onSkip: handleStepSkip,
    refreshData,
  }
}

/**
 * Hook for steps that need to update game fields
 */
export function useWizardStepWithUpdate() {
  const { game, updateField, handleStepComplete, handleStepSkip, refreshData } = useWizard()

  return {
    game,
    updateField,
    onComplete: handleStepComplete,
    onSkip: handleStepSkip,
    refreshData,
  }
}

/**
 * Hook for steps that work with images
 */
export function useWizardStepWithImages() {
  const { game, images, updateImages, handleStepComplete, handleStepSkip, refreshData } = useWizard()

  return {
    game,
    images,
    onImagesChange: updateImages,
    onComplete: handleStepComplete,
    onSkip: handleStepSkip,
    refreshData,
  }
}
