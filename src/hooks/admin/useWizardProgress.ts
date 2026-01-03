'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface WizardProgress {
  currentStep: number
  completedSteps: number[]
  skippedSteps: number[]
}

export interface UseWizardProgressOptions {
  /** Total number of steps in the wizard */
  totalSteps: number
  /** Called when progress changes */
  onProgressChange?: (progress: WizardProgress) => void
}

export interface UseWizardProgressReturn {
  /** Current step (1-indexed) */
  currentStep: number
  /** Array of completed step numbers */
  completedSteps: number[]
  /** Array of skipped step numbers */
  skippedSteps: number[]
  /** Whether a step is completed */
  isStepComplete: (step: number) => boolean
  /** Whether a step was skipped */
  isStepSkipped: (step: number) => boolean
  /** Whether user can navigate to a step */
  canNavigateToStep: (step: number) => boolean
  /** Go to a specific step */
  goToStep: (step: number) => void
  /** Go to next step */
  nextStep: () => void
  /** Go to previous step */
  prevStep: () => void
  /** Mark current step as complete */
  completeStep: (step?: number) => void
  /** Mark current step as skipped */
  skipStep: (step?: number) => void
  /** Reset all progress */
  resetProgress: () => void
  /** Save progress to localStorage */
  saveProgress: () => void
  /** Whether progress was loaded from storage */
  hasRestoredProgress: boolean
  /** Whether client-side hydration is complete (safe to trust state) */
  isHydrated: boolean
}

/**
 * Hook for managing wizard progress with localStorage persistence.
 *
 * @example
 * ```tsx
 * const { currentStep, nextStep, completeStep, isStepComplete } = useWizardProgress('game-123', { totalSteps: 5 })
 *
 * const handleComplete = () => {
 *   completeStep()
 *   nextStep()
 * }
 * ```
 */
// Helper to load progress from localStorage synchronously
function loadProgressFromStorage(storageKey: string): WizardProgress | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      return JSON.parse(stored) as WizardProgress
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

export function useWizardProgress(
  gameId: string,
  options: UseWizardProgressOptions
): UseWizardProgressReturn {
  const { totalSteps, onProgressChange } = options
  const storageKey = `wizard-progress-${gameId}`

  // Start with defaults - will load from localStorage after hydration
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [skippedSteps, setSkippedSteps] = useState<number[]>([])
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Ref to access current step in stable callbacks without causing re-renders
  const currentStepRef = useRef(currentStep)
  currentStepRef.current = currentStep

  // Load from localStorage AFTER hydration to avoid SSR mismatch
  useEffect(() => {
    const saved = loadProgressFromStorage(storageKey)
    if (saved) {
      setCurrentStep(saved.currentStep)
      setCompletedSteps(saved.completedSteps || [])
      setSkippedSteps(saved.skippedSteps || [])
      setHasRestoredProgress(true)
    }
    setIsHydrated(true)
  }, [storageKey])

  // Notify on progress change
  useEffect(() => {
    onProgressChange?.({ currentStep, completedSteps, skippedSteps })
  }, [currentStep, completedSteps, skippedSteps, onProgressChange])

  const saveProgress = useCallback(() => {
    try {
      const progress: WizardProgress = {
        currentStep,
        completedSteps,
        skippedSteps,
      }
      localStorage.setItem(storageKey, JSON.stringify(progress))
    } catch {
      // Ignore storage errors
    }
  }, [storageKey, currentStep, completedSteps, skippedSteps])

  // Auto-save on progress change
  useEffect(() => {
    saveProgress()
  }, [saveProgress])

  const isStepComplete = useCallback(
    (step: number) => completedSteps.includes(step),
    [completedSteps]
  )

  const isStepSkipped = useCallback(
    (step: number) => skippedSteps.includes(step),
    [skippedSteps]
  )

  const canNavigateToStep = useCallback(
    (step: number) => {
      if (step < 1 || step > totalSteps) return false
      if (step <= currentStep) return true
      // Can only go to next step if current is complete or skipped
      return step === currentStep + 1 && (isStepComplete(currentStep) || isStepSkipped(currentStep))
    },
    [currentStep, totalSteps, isStepComplete, isStepSkipped]
  )

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= totalSteps) {
        setCurrentStep(step)
      }
    },
    [totalSteps]
  )

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev < totalSteps ? prev + 1 : prev)
  }, [totalSteps])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => prev > 1 ? prev - 1 : prev)
  }, [])

  const completeStep = useCallback((step?: number) => {
    const stepToComplete = step ?? currentStepRef.current
    setCompletedSteps((prev) => {
      if (prev.includes(stepToComplete)) return prev
      return [...prev, stepToComplete]
    })
    // Remove from skipped if it was there
    setSkippedSteps((prev) => prev.filter((s) => s !== stepToComplete))
  }, [])

  const skipStep = useCallback((step?: number) => {
    const stepToSkip = step ?? currentStepRef.current
    setSkippedSteps((prev) => {
      if (prev.includes(stepToSkip)) return prev
      return [...prev, stepToSkip]
    })
  }, [])

  const resetProgress = useCallback(() => {
    setCurrentStep(1)
    setCompletedSteps([])
    setSkippedSteps([])
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // Ignore storage errors
    }
  }, [storageKey])

  return {
    currentStep,
    completedSteps,
    skippedSteps,
    isStepComplete,
    isStepSkipped,
    canNavigateToStep,
    goToStep,
    nextStep,
    prevStep,
    completeStep,
    skipStep,
    resetProgress,
    saveProgress,
    hasRestoredProgress,
    isHydrated,
  }
}
