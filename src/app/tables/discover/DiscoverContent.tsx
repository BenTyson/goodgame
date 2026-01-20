'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  MapPin,
  List,
  Map as MapIcon,
  Loader2,
  Navigation,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapView, type MapMarker } from '@/components/maps'
import { DiscoverTableCard } from '@/components/tables'
import { useDiscoverTables } from '@/hooks/tables'

interface DiscoverContentProps {
  userId?: string
}

type ViewMode = 'split' | 'list' | 'map'

export function DiscoverContent({ userId }: DiscoverContentProps) {
  const {
    tables,
    loading,
    userLocation,
    hasUserLocation,
    locationLoading,
    locationDenied,
    radiusMiles,
    setRadiusMiles,
    requestLocation,
  } = useDiscoverTables({ userId })

  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Convert tables to map markers
  const markers: MapMarker[] = useMemo(
    () =>
      tables.map((table) => ({
        id: table.tableId,
        lat: table.locationLat,
        lng: table.locationLng,
        data: table,
      })),
    [tables]
  )

  // Filter tables by search query
  const filteredTables = useMemo(() => {
    if (!searchQuery) return tables
    const query = searchQuery.toLowerCase()
    return tables.filter(
      (table) =>
        table.gameName.toLowerCase().includes(query) ||
        table.title?.toLowerCase().includes(query) ||
        table.locationName?.toLowerCase().includes(query) ||
        table.hostDisplayName?.toLowerCase().includes(query) ||
        table.hostUsername?.toLowerCase().includes(query)
    )
  }, [tables, searchQuery])

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
                      <DiscoverTableCard
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
                      <DiscoverTableCard
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
                    <DiscoverTableCard
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
