'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseAsyncActionOptions {
  /** Duration to show the saved indicator (ms). Default: 2000 */
  savedDuration?: number
  /** Callback on success */
  onSuccess?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
}

export interface UseAsyncActionReturn {
  /** Whether an async operation is in progress */
  saving: boolean
  /** Whether the last operation succeeded (auto-resets after savedDuration) */
  saved: boolean
  /** Error from the last operation, if any */
  error: string | null
  /** Execute an async function with loading/error state management */
  execute: <T>(fn: () => Promise<T>) => Promise<T | undefined>
  /** Reset the saved and error states */
  reset: () => void
  /** Mark as unsaved (call when form changes) */
  markUnsaved: () => void
}

/**
 * Hook for managing async action state (saving, saved, error).
 * Encapsulates the common pattern used across admin editors.
 *
 * @example
 * ```tsx
 * const { saving, saved, execute } = useAsyncAction({ savedDuration: 3000 })
 *
 * const handleSave = () => execute(async () => {
 *   await fetch('/api/save', { method: 'POST', body: JSON.stringify(data) })
 * })
 *
 * return (
 *   <Button disabled={saving} onClick={handleSave}>
 *     {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
 *   </Button>
 * )
 * ```
 */
export function useAsyncAction(options: UseAsyncActionOptions = {}): UseAsyncActionReturn {
  const { savedDuration = 2000, onSuccess, onError } = options

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current)
      }
    }
  }, [])

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      // Clear any existing saved timeout
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = null
      }

      setSaving(true)
      setSaved(false)
      setError(null)

      try {
        const result = await fn()
        setSaved(true)
        onSuccess?.()

        // Auto-reset saved state after duration
        if (savedDuration > 0) {
          savedTimeoutRef.current = setTimeout(() => {
            setSaved(false)
          }, savedDuration)
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        onError?.(err instanceof Error ? err : new Error(errorMessage))
        return undefined
      } finally {
        setSaving(false)
      }
    },
    [savedDuration, onSuccess, onError]
  )

  const reset = useCallback(() => {
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = null
    }
    setSaved(false)
    setError(null)
  }, [])

  const markUnsaved = useCallback(() => {
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = null
    }
    setSaved(false)
  }, [])

  return {
    saving,
    saved,
    error,
    execute,
    reset,
    markUnsaved,
  }
}
