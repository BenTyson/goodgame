/**
 * Shared types for admin wizard components
 */
import type { Game, GameImage } from '@/types/database'

/**
 * Publisher info for game editor components
 */
export interface Publisher {
  id: string
  name: string
  slug: string
  website: string | null
}

/**
 * Game with additional relations for wizard/editor
 */
export type GameWithRelations = Game & {
  images: GameImage[]
  publishers_list?: Publisher[]
}

/**
 * Selected taxonomy item with primary flag
 */
export interface SelectedTaxonomyItem {
  id: string
  isPrimary: boolean
}

/**
 * Base props shared by all wizard step components
 */
export interface WizardStepProps {
  game: Game
  onComplete: () => void
  onSkip: () => void
}

/**
 * Extended step props for steps that can update game fields
 */
export interface WizardStepWithUpdateProps extends WizardStepProps {
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
}

/**
 * Props for steps that work with images
 */
export interface WizardStepWithImagesProps extends WizardStepProps {
  images: GameImage[]
  onImagesChange: (images: GameImage[]) => void
}

/**
 * Wizard step definition for the step indicator
 */
export interface WizardStep {
  id: number
  title: string
  description?: string
}

/**
 * Wizard progress state
 */
export interface WizardProgress {
  currentStep: number
  completedSteps: number[]
  skippedSteps: number[]
}
