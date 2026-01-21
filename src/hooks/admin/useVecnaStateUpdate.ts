'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { VecnaState } from '@/lib/vecna'

export interface UseVecnaStateUpdateOptions {
  gameId: string
  onSuccess?: (newState: VecnaState) => void
  /** If true, skip router.refresh() after successful update (caller handles refresh) */
  skipRefresh?: boolean
}

export interface UseVecnaStateUpdateReturn {
  updateState: (newState: VecnaState, clearError?: boolean) => Promise<boolean>
  isUpdating: boolean
  error: string | null
  clearError: () => void
}

/**
 * Hook for updating Vecna pipeline state via the API.
 *
 * Consolidates the duplicated updateState logic from:
 * - VecnaGamePanel.tsx
 * - StateActions.tsx
 * - ContentReviewPanel.tsx (handleUnpublish)
 */
export function useVecnaStateUpdate({
  gameId,
  onSuccess,
  skipRefresh = false,
}: UseVecnaStateUpdateOptions): UseVecnaStateUpdateReturn {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateState = useCallback(async (newState: VecnaState, clearError = true): Promise<boolean> => {
    setIsUpdating(true)
    if (clearError) setError(null)

    try {
      const response = await fetch(`/api/admin/vecna/${gameId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState, error: clearError ? null : undefined }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update state')
      }

      onSuccess?.(newState)
      if (!skipRefresh) {
        router.refresh()
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update state')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [gameId, onSuccess, router, skipRefresh])

  const clearErrorFn = useCallback(() => {
    setError(null)
  }, [])

  return {
    updateState,
    isUpdating,
    error,
    clearError: clearErrorFn,
  }
}
