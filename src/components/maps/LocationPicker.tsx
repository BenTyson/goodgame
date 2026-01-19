'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapPin, Navigation, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import 'mapbox-gl/dist/mapbox-gl.css'

// Set access token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export interface LocationData {
  name: string
  address: string
  lat: number
  lng: number
}

interface SearchResult {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

interface LocationPickerProps {
  value?: LocationData | null
  onChange: (location: LocationData | null) => void
  placeholder?: string
  className?: string
  showMap?: boolean
  disabled?: boolean
}

export function LocationPicker({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className,
  showMap = true,
  disabled = false,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Search for locations using Mapbox Geocoding API
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim() || !MAPBOX_TOKEN) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,place&limit=5&language=en`
      )
      const data = await response.json()

      if (data.features) {
        const results: SearchResult[] = data.features.map((feature: any) => ({
          id: feature.id,
          name: feature.text || feature.place_name?.split(',')[0] || '',
          address: feature.place_name || '',
          lat: feature.center[1],
          lng: feature.center[0],
        }))
        setSearchResults(results)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(searchQuery)
      }, 300)
    } else {
      setSearchResults([])
      setShowResults(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, searchLocations])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!showMap || !mapContainerRef.current || mapRef.current) return
    if (!MAPBOX_TOKEN) return

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: value ? [value.lng, value.lat] : [-105.0772, 39.7661], // Default to Wheat Ridge
      zoom: value ? 14 : 10,
      interactive: true,
      accessToken: MAPBOX_TOKEN,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      setIsMapLoaded(true)

      if (value) {
        updateMarker(value.lat, value.lng, map)
      }
    })

    map.on('click', (e) => {
      const { lat, lng } = e.lngLat
      reverseGeocode(lat, lng)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap])

  // Update map when value changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return

    if (value) {
      mapRef.current.flyTo({
        center: [value.lng, value.lat],
        zoom: 14,
        duration: 1000,
      })
      updateMarker(value.lat, value.lng)
    }
  }, [value, isMapLoaded])

  const updateMarker = useCallback((lat: number, lng: number, map?: mapboxgl.Map) => {
    const mapInstance = map || mapRef.current
    if (!mapInstance) return

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
    } else {
      const el = document.createElement('div')
      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary, #14b8a6); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      `
      el.style.cursor = 'grab'

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true,
        anchor: 'bottom',
      })
        .setLngLat([lng, lat])
        .addTo(mapInstance)

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        reverseGeocode(lngLat.lat, lngLat.lng)
      })

      markerRef.current = marker
    }

    mapInstance.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 1000,
    })
  }, [])

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!MAPBOX_TOKEN) return

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,place`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const locationData: LocationData = {
          name: feature.text || feature.place_name?.split(',')[0] || 'Selected Location',
          address: feature.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat,
          lng,
        }

        onChange(locationData)
        setSearchQuery(locationData.address)
        setShowResults(false)
      } else {
        onChange({
          name: 'Selected Location',
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat,
          lng,
        })
      }

      updateMarker(lat, lng)
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  const handleSelectResult = (result: SearchResult) => {
    const locationData: LocationData = {
      name: result.name,
      address: result.address,
      lat: result.lat,
      lng: result.lng,
    }

    onChange(locationData)
    setSearchQuery(result.address)
    setShowResults(false)
    setLocationError(null)
    updateMarker(result.lat, result.lng)
  }

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        await reverseGeocode(latitude, longitude)
        setIsLocating(false)
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location blocked. Click the lock icon in your browser address bar to allow location access, then try again.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.')
            break
          case error.TIMEOUT:
            setLocationError('Location request timed out.')
            break
          default:
            setLocationError('An unknown error occurred.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleClear = () => {
    onChange(null)
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
    setLocationError(null)
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="text-sm text-muted-foreground">
          Location picker unavailable. Mapbox not configured.
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search input with dropdown */}
      <div className="relative" ref={resultsRef}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-9 pr-9"
          />
          {(value || searchQuery) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isSearching && (
            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0"
              >
                <p className="font-medium text-sm">{result.name}</p>
                <p className="text-xs text-muted-foreground truncate">{result.address}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Use current location button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleUseCurrentLocation}
        disabled={isLocating || disabled}
        className="w-full"
      >
        {isLocating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Getting location...
          </>
        ) : (
          <>
            <Navigation className="h-4 w-4 mr-2" />
            Use my current location
          </>
        )}
      </Button>

      {/* Error message */}
      {locationError && (
        <p className="text-sm text-destructive">{locationError}</p>
      )}

      {/* Map preview */}
      {showMap && (
        <div className="relative">
          <div
            ref={mapContainerRef}
            className={cn(
              'w-full h-[200px] rounded-lg border border-border overflow-hidden',
              !value && 'opacity-60'
            )}
          />
          {!value && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded-full">
                Select a location to preview
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected location display */}
      {value && (
        <div className="p-3 rounded-lg bg-accent/50 text-sm">
          <p className="font-medium">{value.name}</p>
          <p className="text-muted-foreground text-xs mt-0.5">{value.address}</p>
        </div>
      )}
    </div>
  )
}
