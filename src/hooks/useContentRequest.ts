'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

interface ContentRequestState {
  requestCount: number
  hasRequested: boolean
  isLoading: boolean
  handleRequest: () => Promise<void>
}

/**
 * Hook for managing content request state for preview games
 */
export function useContentRequest(gameId: string): ContentRequestState {
  const { user } = useAuth()
  const [requestCount, setRequestCount] = useState(0)
  const [hasRequested, setHasRequested] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch initial state
  useEffect(() => {
    let isMounted = true

    async function fetchState() {
      try {
        const response = await fetch(`/api/games/${gameId}/content-request`)
        if (response.ok) {
          const data = await response.json()
          if (isMounted) {
            setRequestCount(data.requestCount || 0)
            setHasRequested(data.hasRequested || false)
          }
        }
      } catch (error) {
        console.error('Failed to fetch content request state:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchState()

    return () => {
      isMounted = false
    }
  }, [gameId, user?.id])

  const handleRequest = useCallback(async () => {
    if (hasRequested) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/games/${gameId}/content-request`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setRequestCount(data.requestCount || requestCount + 1)
        setHasRequested(true)
      }
    } catch (error) {
      console.error('Failed to submit content request:', error)
    } finally {
      setIsLoading(false)
    }
  }, [gameId, hasRequested, requestCount])

  return {
    requestCount,
    hasRequested,
    isLoading,
    handleRequest,
  }
}
