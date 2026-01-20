'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { NearbyTable } from '@/types/tables'

// Default to Wheat Ridge, Colorado
const DEFAULT_LOCATION = { lat: 39.7661, lng: -105.0772 }

interface UseDiscoverTablesOptions {
  userId?: string
  initialRadiusMiles?: number
}

interface UseDiscoverTablesReturn {
  tables: NearbyTable[]
  loading: boolean
  error: string | null
  userLocation: { lat: number; lng: number }
  hasUserLocation: boolean
  locationLoading: boolean
  locationDenied: boolean
  radiusMiles: number
  setRadiusMiles: (miles: number) => void
  requestLocation: () => void
  refetch: () => void
}

/**
 * Custom hook for managing discover tables state and fetching
 * Optimized to avoid double fetching on initial load
 */
export function useDiscoverTables({
  userId,
  initialRadiusMiles = 25,
}: UseDiscoverTablesOptions = {}): UseDiscoverTablesReturn {
  const [tables, setTables] = useState<NearbyTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(DEFAULT_LOCATION)
  const [hasUserLocation, setHasUserLocation] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)

  // Filters
  const [radiusMiles, setRadiusMiles] = useState(initialRadiusMiles)

  // Track if initial fetch has been done to prevent double fetch
  const initialFetchDone = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch tables from API
  const fetchTables = useCallback(
    async (lat: number, lng: number, signal?: AbortSignal) => {
      // Cancel any in-progress fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller if none provided
      const controller = new AbortController()
      abortControllerRef.current = controller
      const fetchSignal = signal || controller.signal

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          lat: lat.toString(),
          lng: lng.toString(),
          radius: radiusMiles.toString(),
          ...(userId && { userId }),
        })

        const response = await fetch(`/api/tables/discover?${params}`, {
          signal: fetchSignal,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch tables')
        }

        const data = await response.json()
        setTables(data.tables || [])
      } catch (err) {
        // Don't set error if aborted
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        console.error('Error fetching tables:', err)
        setError('Failed to load tables. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [radiusMiles, userId]
  )

  // Request user location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true)
      // Fetch with default if no geolocation support and haven't fetched yet
      if (!initialFetchDone.current) {
        initialFetchDone.current = true
        fetchTables(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng)
      }
      return
    }

    setLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setHasUserLocation(true)
        setLocationLoading(false)
        setLocationDenied(false)
        initialFetchDone.current = true
        fetchTables(latitude, longitude)
      },
      (err) => {
        setLocationLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationDenied(true)
        }
        // Fetch with default location if we haven't fetched yet
        if (!initialFetchDone.current) {
          initialFetchDone.current = true
          fetchTables(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng)
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [fetchTables])

  // Initial fetch - only request location once
  useEffect(() => {
    requestLocation()

    // Cleanup abort controller on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when radius changes (after initial fetch)
  useEffect(() => {
    if (initialFetchDone.current) {
      fetchTables(userLocation.lat, userLocation.lng)
    }
  }, [radiusMiles, userLocation.lat, userLocation.lng, fetchTables])

  // Manual refetch
  const refetch = useCallback(() => {
    fetchTables(userLocation.lat, userLocation.lng)
  }, [fetchTables, userLocation])

  return {
    tables,
    loading,
    error,
    userLocation,
    hasUserLocation,
    locationLoading,
    locationDenied,
    radiusMiles,
    setRadiusMiles,
    requestLocation,
    refetch,
  }
}
