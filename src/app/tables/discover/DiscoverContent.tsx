'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import {
  MapPin,
  List,
  Map as MapIcon,
  Loader2,
  Navigation,
  Users,
  Calendar,
  Clock,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MapView, type MapMarker } from '@/components/maps'
import type { NearbyTable } from '@/types/tables'

interface DiscoverContentProps {
  userId?: string
}

type ViewMode = 'split' | 'list' | 'map'

// Default to Wheat Ridge, Colorado
const DEFAULT_LOCATION = { lat: 39.7661, lng: -105.0772 }

export function DiscoverContent({ userId }: DiscoverContentProps) {
  const [tables, setTables] = useState<NearbyTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Start with default location, update if user grants permission
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(DEFAULT_LOCATION)
  const [hasUserLocation, setHasUserLocation] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)

  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null)

  // Filters
  const [radiusMiles, setRadiusMiles] = useState(25)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch tables when location is available
  const fetchTables = useCallback(async (lat: number, lng: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radiusMiles.toString(),
        ...(userId && { userId }),
      })

      const response = await fetch(`/api/tables/discover?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch tables')
      }

      const data = await response.json()
      setTables(data.tables || [])
    } catch (err) {
      console.error('Error fetching tables:', err)
      setError('Failed to load tables. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [radiusMiles, userId])

  // Request user location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true)
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
        fetchTables(latitude, longitude)
      },
      (err) => {
        setLocationLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationDenied(true)
        }
        // Still fetch with default location
        if (!hasUserLocation) {
          fetchTables(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng)
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [fetchTables, hasUserLocation])

  // Request location on mount, but also fetch with default
  useEffect(() => {
    // Start fetching with default location immediately
    fetchTables(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng)
    // Then try to get user's actual location
    requestLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when radius changes
  useEffect(() => {
    if (userLocation) {
      fetchTables(userLocation.lat, userLocation.lng)
    }
  }, [radiusMiles, userLocation, fetchTables])

  // Convert tables to map markers
  const markers: MapMarker[] = tables.map((table) => ({
    id: table.tableId,
    lat: table.locationLat,
    lng: table.locationLng,
    data: table,
  }))

  // Filter tables by search query
  const filteredTables = tables.filter((table) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      table.gameName.toLowerCase().includes(query) ||
      table.title?.toLowerCase().includes(query) ||
      table.locationName?.toLowerCase().includes(query) ||
      table.hostDisplayName?.toLowerCase().includes(query) ||
      table.hostUsername?.toLowerCase().includes(query)
    )
  })

  // Track hydration to avoid Radix UI ID mismatches
  const [hasMounted, setHasMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const effectiveViewMode = isMobile ? (viewMode === 'split' ? 'list' : viewMode) : viewMode

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Discover Tables</h1>
              <p className="text-sm text-muted-foreground">
                Find game meetups near you
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild>
                <Link href="/tables/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Host a Table
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search games, hosts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Distance filter - only render after mount to avoid Radix hydration mismatch */}
            {hasMounted ? (
              <Select
                value={radiusMiles.toString()}
                onValueChange={(v) => setRadiusMiles(parseInt(v, 10))}
              >
                <SelectTrigger className="w-[140px]">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Within 5 mi</SelectItem>
                  <SelectItem value="10">Within 10 mi</SelectItem>
                  <SelectItem value="25">Within 25 mi</SelectItem>
                  <SelectItem value="50">Within 50 mi</SelectItem>
                  <SelectItem value="100">Within 100 mi</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="w-[140px] h-9 rounded-md border border-input bg-background" />
            )}

            {/* View toggle */}
            <div className="flex items-center border border-border rounded-lg p-1">
              {hasMounted && !isMobile && (
                <Button
                  variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('split')}
                  className="h-8 px-3"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  Split
                </Button>
              )}
              <Button
                variant={effectiveViewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                variant={effectiveViewMode === 'map' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="h-8 px-3"
              >
                <MapIcon className="h-4 w-4 mr-1" />
                Map
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Location banner - show when location denied */}
        {locationDenied && !hasUserLocation && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
            <div className="container flex items-center justify-between gap-4">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <Navigation className="h-4 w-4 inline mr-2" />
                Click the lock icon in your address bar to allow location access
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={requestLocation}
                disabled={locationLoading}
                className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Retry'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Finding tables...</p>
            </div>
          </div>
        )}

        {/* Main content */}
        {!loading && (
          <div className="flex-1 overflow-hidden">
            {/* Empty state - show map with overlay */}
            {filteredTables.length === 0 && (
              <div className="h-full relative">
                <MapView
                  markers={[]}
                  center={[userLocation.lng, userLocation.lat]}
                  zoom={hasUserLocation ? 10 : 4}
                  className="h-full"
                />
                {/* Empty state overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-background/95 backdrop-blur border border-border/50 rounded-xl p-8 text-center max-w-md shadow-lg pointer-events-auto">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                      <MapPin className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">
                      {searchQuery ? 'No matching tables' : 'No tables nearby'}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchQuery
                        ? 'Try adjusting your search or expanding the distance.'
                        : 'Be the first to host a game night in your area!'}
                    </p>
                    <Button asChild>
                      <Link href="/tables/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Host a Table
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Split view */}
            {filteredTables.length > 0 && effectiveViewMode === 'split' && (
              <div className="h-full flex">
                {/* List panel */}
                <div className="w-2/5 border-r border-border overflow-y-auto">
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {filteredTables.length} table{filteredTables.length !== 1 ? 's' : ''} found
                    </p>
                    {filteredTables.map((table) => (
                      <TableCard
                        key={table.tableId}
                        table={table}
                        isSelected={selectedTableId === table.tableId}
                        isHovered={hoveredTableId === table.tableId}
                        onClick={() => setSelectedTableId(table.tableId)}
                        onHover={(hovered) => setHoveredTableId(hovered ? table.tableId : null)}
                      />
                    ))}
                  </div>
                </div>

                {/* Map panel */}
                <div className="flex-1">
                  <MapView
                    markers={markers}
                    center={[userLocation.lng, userLocation.lat]}
                    zoom={10}
                    selectedMarkerId={selectedTableId}
                    onMarkerClick={(marker) => setSelectedTableId(marker.id)}
                    onMarkerHover={(marker) => setHoveredTableId(marker?.id || null)}
                    className="h-full"
                  />
                </div>
              </div>
            )}

            {/* List only view */}
            {filteredTables.length > 0 && effectiveViewMode === 'list' && (
              <div className="h-full overflow-y-auto">
                <div className="container py-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    {filteredTables.length} table{filteredTables.length !== 1 ? 's' : ''} found
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTables.map((table) => (
                      <TableCard
                        key={table.tableId}
                        table={table}
                        isSelected={selectedTableId === table.tableId}
                        onClick={() => setSelectedTableId(table.tableId)}
                        variant="grid"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Map only view */}
            {filteredTables.length > 0 && effectiveViewMode === 'map' && (
              <div className="h-full relative">
                <MapView
                  markers={markers}
                  center={[userLocation.lng, userLocation.lat]}
                  zoom={10}
                  selectedMarkerId={selectedTableId}
                  onMarkerClick={(marker) => setSelectedTableId(marker.id)}
                  className="h-full"
                />

                {/* Selected table overlay */}
                {selectedTableId && (
                  <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96">
                    <TableCard
                      table={filteredTables.find((t) => t.tableId === selectedTableId)!}
                      isSelected
                      onClose={() => setSelectedTableId(null)}
                      variant="overlay"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Table card component
interface TableCardProps {
  table: NearbyTable
  isSelected?: boolean
  isHovered?: boolean
  onClick?: () => void
  onHover?: (hovered: boolean) => void
  onClose?: () => void
  variant?: 'list' | 'grid' | 'overlay'
}

function TableCard({
  table,
  isSelected,
  isHovered,
  onClick,
  onHover,
  onClose,
  variant = 'list',
}: TableCardProps) {
  const scheduledDate = new Date(table.scheduledAt)
  const spotsLeft = table.maxPlayers ? table.maxPlayers - table.attendingCount : null

  const content = (
    <>
      {/* Game image */}
      <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        {table.gameThumbnailUrl ? (
          <Image
            src={table.gameThumbnailUrl}
            alt={table.gameName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <Users className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">
              {table.title || table.gameName}
            </h3>
            {table.title && (
              <p className="text-xs text-muted-foreground truncate">{table.gameName}</p>
            )}
          </div>
          {spotsLeft !== null && spotsLeft <= 2 && spotsLeft > 0 && (
            <Badge variant="secondary" className="flex-shrink-0 bg-amber-500/10 text-amber-600">
              {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
            </Badge>
          )}
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(scheduledDate, 'EEE, MMM d')}</span>
            <Clock className="h-3.5 w-3.5 ml-1" />
            <span>{format(scheduledDate, 'h:mm a')}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{table.locationName || 'Location TBD'}</span>
            {table.distanceMiles && (
              <span className="text-primary font-medium flex-shrink-0">
                {table.distanceMiles.toFixed(1)} mi
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {table.attendingCount} attending
              {table.maxPlayers && ` / ${table.maxPlayers} max`}
            </span>
          </div>
        </div>
      </div>

      {variant !== 'overlay' && (
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
    </>
  )

  if (variant === 'overlay') {
    return (
      <div className="bg-background border border-border rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-4">
          {content}
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
          <Button asChild className="flex-1">
            <Link href={`/tables/${table.tableId}`}>View Details</Link>
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Link
      href={`/tables/${table.tableId}`}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all',
        'hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5',
        isSelected && 'border-primary bg-primary/5 shadow-md',
        isHovered && !isSelected && 'border-primary/20 bg-accent/50',
        !isSelected && !isHovered && 'border-border/50 bg-card/50'
      )}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault()
          onClick()
        }
      }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {content}
    </Link>
  )
}
