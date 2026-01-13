'use client'

import type { GameEditorData } from '@/lib/supabase/game-queries'

// In-memory LRU cache for game editor data
const cache = new Map<string, { data: GameEditorData; timestamp: number }>()
const MAX_CACHE_SIZE = 5
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Hook for managing game editor data cache.
 *
 * Provides an LRU cache that stores up to 5 games in memory with a 5-minute TTL.
 * This helps with fast navigation between recently-viewed games.
 */
export function useGameEditorCache() {
  /**
   * Get cached data for a game if it exists and isn't stale
   */
  const getFromCache = (gameId: string): GameEditorData | null => {
    const entry = cache.get(gameId)
    if (!entry) return null

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cache.delete(gameId)
      return null
    }

    return entry.data
  }

  /**
   * Store game editor data in cache
   */
  const setCache = (gameId: string, data: GameEditorData): void => {
    // LRU eviction: remove oldest entry if at capacity
    if (cache.size >= MAX_CACHE_SIZE && !cache.has(gameId)) {
      const entries = [...cache.entries()]
      const oldest = entries.reduce((min, curr) =>
        curr[1].timestamp < min[1].timestamp ? curr : min
      )
      cache.delete(oldest[0])
    }

    cache.set(gameId, { data, timestamp: Date.now() })
  }

  /**
   * Invalidate (remove) a specific game from cache
   * Call this after saving changes to ensure fresh data on next load
   */
  const invalidate = (gameId: string): void => {
    cache.delete(gameId)
  }

  /**
   * Clear all cached data
   */
  const clearAll = (): void => {
    cache.clear()
  }

  return {
    getFromCache,
    setCache,
    invalidate,
    clearAll,
  }
}

export type UseGameEditorCacheReturn = ReturnType<typeof useGameEditorCache>
