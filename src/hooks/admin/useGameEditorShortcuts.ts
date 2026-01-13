'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

export interface UseGameEditorShortcutsOptions {
  /** Callback for save action (Cmd+S) */
  onSave: () => void
  /** URL for previous game (Cmd+[) */
  previousGameUrl: string | null
  /** URL for next game (Cmd+]) */
  nextGameUrl: string | null
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean
  /** Whether save is currently in progress */
  isSaving: boolean
}

export interface UseGameEditorShortcutsReturn {
  /** Navigate to previous game (with unsaved check) */
  goToPrevious: () => void
  /** Navigate to next game (with unsaved check) */
  goToNext: () => void
}

/**
 * Hook for managing game editor keyboard shortcuts and unsaved changes warnings.
 *
 * Shortcuts:
 * - Cmd/Ctrl+S: Save
 * - Cmd/Ctrl+[: Previous game
 * - Cmd/Ctrl+]: Next game
 *
 * Also handles:
 * - beforeunload warning for unsaved changes
 * - Confirmation dialog before navigation with unsaved changes
 */
export function useGameEditorShortcuts(
  options: UseGameEditorShortcutsOptions
): UseGameEditorShortcutsReturn {
  const { onSave, previousGameUrl, nextGameUrl, hasUnsavedChanges, isSaving } = options
  const router = useRouter()

  // Track pending navigation for after user confirms
  const pendingNavRef = useRef<string | null>(null)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMod = e.metaKey || e.ctrlKey

      if (!isMod) return

      // Cmd+S: Save
      if (e.key === 's') {
        e.preventDefault()
        if (!isSaving) {
          onSave()
        }
        return
      }

      // Cmd+[: Previous game
      if (e.key === '[') {
        e.preventDefault()
        if (previousGameUrl) {
          navigateWithCheck(previousGameUrl)
        }
        return
      }

      // Cmd+]: Next game
      if (e.key === ']') {
        e.preventDefault()
        if (nextGameUrl) {
          navigateWithCheck(nextGameUrl)
        }
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSave, previousGameUrl, nextGameUrl, hasUnsavedChanges, isSaving])

  // Handle beforeunload for browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        // Modern browsers ignore custom messages but still show a generic warning
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Navigation with unsaved changes check
  const navigateWithCheck = useCallback((url: string) => {
    if (hasUnsavedChanges) {
      // Use native confirm for simplicity (works everywhere)
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      )
      if (!confirmed) {
        return
      }
    }
    router.push(url)
  }, [hasUnsavedChanges, router])

  const goToPrevious = useCallback(() => {
    if (previousGameUrl) {
      navigateWithCheck(previousGameUrl)
    }
  }, [previousGameUrl, navigateWithCheck])

  const goToNext = useCallback(() => {
    if (nextGameUrl) {
      navigateWithCheck(nextGameUrl)
    }
  }, [nextGameUrl, navigateWithCheck])

  return {
    goToPrevious,
    goToNext,
  }
}
