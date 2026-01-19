'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { Locate, ZoomIn, ZoomOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { NearbyTable } from '@/types/tables'

import 'mapbox-gl/dist/mapbox-gl.css'

// Set access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export interface MapMarker {
  id: string
  lat: number
  lng: number
  data: NearbyTable
}

interface MapViewProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (marker: MapMarker) => void
  onMarkerHover?: (marker: MapMarker | null) => void
  selectedMarkerId?: string | null
  className?: string
  showControls?: boolean
  showLocateButton?: boolean
  onBoundsChange?: (bounds: { ne: [number, number]; sw: [number, number] }) => void
}

export function MapView({
  markers,
  center = [-98.5795, 39.8283], // US center
  zoom = 4,
  onMarkerClick,
  onMarkerHover,
  selectedMarkerId,
  className,
  showControls = true,
  showLocateButton = true,
  onBoundsChange,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    if (!mapboxgl.accessToken) return

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
      attributionControl: false,
    })

    // Add minimal attribution
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('load', () => {
      setIsMapLoaded(true)
    })

    map.on('moveend', () => {
      if (onBoundsChange) {
        const bounds = map.getBounds()
        if (bounds) {
          onBoundsChange({
            ne: [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
            sw: [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
          })
        }
      }
    })

    mapRef.current = map

    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current.clear()

      map.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers when they change
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return

    const map = mapRef.current
    const existingMarkers = markersRef.current
    const newMarkerIds = new Set(markers.map((m) => m.id))

    // Remove markers that are no longer in the list
    existingMarkers.forEach((marker, id) => {
      if (!newMarkerIds.has(id)) {
        marker.remove()
        existingMarkers.delete(id)
      }
    })

    // Add or update markers
    markers.forEach((markerData) => {
      if (existingMarkers.has(markerData.id)) {
        // Update existing marker position if needed
        const marker = existingMarkers.get(markerData.id)!
        const currentPos = marker.getLngLat()
        if (currentPos.lng !== markerData.lng || currentPos.lat !== markerData.lat) {
          marker.setLngLat([markerData.lng, markerData.lat])
        }
      } else {
        // Create new marker
        const marker = createMarker(markerData, map)
        existingMarkers.set(markerData.id, marker)
      }

      // Update selected state
      const markerEl = existingMarkers.get(markerData.id)?.getElement()
      if (markerEl) {
        if (selectedMarkerId === markerData.id) {
          markerEl.classList.add('marker-selected')
        } else {
          markerEl.classList.remove('marker-selected')
        }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, isMapLoaded, selectedMarkerId])

  // Handle selected marker change - fly to it
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !selectedMarkerId) return

    const marker = markers.find((m) => m.id === selectedMarkerId)
    if (marker) {
      mapRef.current.flyTo({
        center: [marker.lng, marker.lat],
        zoom: Math.max(mapRef.current.getZoom(), 12),
        duration: 500,
      })
    }
  }, [selectedMarkerId, markers, isMapLoaded])

  const createMarker = useCallback((markerData: MapMarker, map: mapboxgl.Map) => {
    const el = document.createElement('div')
    el.className = 'map-marker'
    el.innerHTML = `
      <div class="marker-inner">
        ${markerData.data.gameThumbnailUrl
          ? `<img src="${markerData.data.gameThumbnailUrl}" alt="" />`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="12" height="12" x="2" y="10" rx="2" ry="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/></svg>`
        }
      </div>
    `

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat([markerData.lng, markerData.lat])
      .addTo(map)

    // Click handler
    el.addEventListener('click', () => {
      onMarkerClick?.(markerData)
    })

    // Hover handlers
    el.addEventListener('mouseenter', () => {
      onMarkerHover?.(markerData)
      showPopup(markerData, map)
    })

    el.addEventListener('mouseleave', () => {
      onMarkerHover?.(null)
      hidePopup()
    })

    return marker
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMarkerClick, onMarkerHover])

  const showPopup = (markerData: MapMarker, map: mapboxgl.Map) => {
    hidePopup()

    const { data } = markerData
    const date = new Date(data.scheduledAt)
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -40],
      className: 'map-popup',
    })
      .setLngLat([markerData.lng, markerData.lat])
      .setHTML(`
        <div class="popup-content">
          <div class="popup-title">${data.title || data.gameName}</div>
          <div class="popup-meta">${formattedDate}</div>
          <div class="popup-meta">${data.attendingCount} attending${data.maxPlayers ? ` / ${data.maxPlayers} max` : ''}</div>
          ${data.distanceMiles ? `<div class="popup-distance">${data.distanceMiles.toFixed(1)} mi away</div>` : ''}
        </div>
      `)
      .addTo(map)

    popupRef.current = popup
  }

  const hidePopup = () => {
    if (popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }
  }

  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 200 })
  }

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 200 })
  }

  const handleLocate = () => {
    if (!navigator.geolocation) return

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([longitude, latitude])

        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 12,
          duration: 1000,
        })

        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Add user location marker
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !userLocation) return

    const el = document.createElement('div')
    el.className = 'user-location-marker'
    el.innerHTML = `
      <div class="user-location-pulse"></div>
      <div class="user-location-dot"></div>
    `

    new mapboxgl.Marker({ element: el })
      .setLngLat(userLocation)
      .addTo(mapRef.current)
  }, [userLocation, isMapLoaded])

  if (!mapboxgl.accessToken) {
    return (
      <div className={cn('flex items-center justify-center bg-muted rounded-lg', className)}>
        <p className="text-muted-foreground">Map unavailable</p>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div ref={mapContainerRef} className="w-full h-full rounded-lg overflow-hidden" />

      {/* Map controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 shadow-md"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 shadow-md"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Locate button */}
      {showLocateButton && (
        <Button
          variant="secondary"
          size="icon"
          onClick={handleLocate}
          disabled={isLocating}
          className="absolute bottom-4 right-4 h-10 w-10 shadow-md"
        >
          {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Locate className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* Custom styles */}
      <style jsx global>{`
        .map-marker {
          cursor: pointer;
          transition: transform 0.15s ease-out;
        }

        .map-marker:hover {
          transform: scale(1.1);
          z-index: 10;
        }

        .map-marker.marker-selected {
          transform: scale(1.2);
          z-index: 20;
        }

        .map-marker .marker-inner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: hsl(var(--primary));
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: white;
        }

        .map-marker .marker-inner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .map-marker.marker-selected .marker-inner {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.3), 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .user-location-marker {
          position: relative;
          width: 20px;
          height: 20px;
        }

        .user-location-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .user-location-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          animation: pulse 2s ease-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }

        .map-popup .mapboxgl-popup-content {
          padding: 12px 16px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          background: #1a1a1a;
          border: 1px solid #333;
        }

        .map-popup .mapboxgl-popup-tip {
          border-top-color: #1a1a1a;
        }

        .popup-content {
          min-width: 160px;
          max-width: 220px;
        }

        .popup-title {
          font-weight: 600;
          font-size: 0.875rem;
          color: #ffffff;
          margin-bottom: 6px;
          line-height: 1.3;
        }

        .popup-meta {
          font-size: 0.75rem;
          color: #a1a1aa;
          line-height: 1.4;
        }

        .popup-distance {
          font-size: 0.75rem;
          color: #14b8a6;
          font-weight: 600;
          margin-top: 6px;
        }
      `}</style>
    </div>
  )
}
