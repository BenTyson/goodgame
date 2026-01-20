'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Zap,
  Package,
} from 'lucide-react'
import { EnrichmentBadges } from './EnrichmentBadges'
import type { PuffinBrowseResponse, PuffinBrowseGame } from '@/app/api/admin/puffin/games/route'
import type { RelationMode } from './ImportWizard'

interface PuffinBrowserProps {
  onImport: (bggIds: number[], relationMode: RelationMode) => void
  onQuickImport: (bggIds: number[]) => void
}

const RANK_PRESETS = [
  { label: 'Top 100', min: 1, max: 100 },
  { label: 'Top 500', min: 1, max: 500 },
  { label: 'Top 1000', min: 1, max: 1000 },
  { label: 'All Ranked', min: undefined, max: undefined },
]

export function PuffinBrowser({ onImport, onQuickImport }: PuffinBrowserProps) {
  // Filter state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [hideImported, setHideImported] = useState(false)
  const [rankPreset, setRankPreset] = useState<string>('Top 500')
  const [sort, setSort] = useState<string>('rank')

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit] = useState(25)

  // Data state
  const [data, setData] = useState<PuffinBrowseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [relationMode, setRelationMode] = useState<RelationMode>('all')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Get current rank filter values
  const rankFilter = useMemo(() => {
    const preset = RANK_PRESETS.find(p => p.label === rankPreset)
    return preset || { min: undefined, max: undefined }
  }, [rankPreset])

  // Fetch data from API
  const fetchGames = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      params.set('sort', sort)

      if (debouncedSearch) params.set('search', debouncedSearch)
      if (rankFilter.min) params.set('minRank', rankFilter.min.toString())
      if (rankFilter.max) params.set('maxRank', rankFilter.max.toString())

      const response = await fetch(`/api/admin/puffin/games?${params.toString()}`, {
        cache: 'no-store',  // Always fetch fresh data to reflect recent imports
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to fetch games')
      }

      const result: PuffinBrowseResponse = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games')
    } finally {
      setLoading(false)
    }
  }, [page, limit, sort, debouncedSearch, rankFilter])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  // Get visible games (filtered by hideImported)
  const visibleGames = useMemo(() => {
    if (!data?.games) return []
    if (hideImported) {
      return data.games.filter(g => !g.importedToBoardmello)
    }
    return data.games
  }, [data?.games, hideImported])

  // Get selectable games (not already imported)
  const selectableGames = useMemo(() => {
    return visibleGames.filter(g => !g.importedToBoardmello)
  }, [visibleGames])

  // Selection handlers
  const toggleSelection = useCallback((bggId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(bggId)) {
        next.delete(bggId)
      } else {
        next.add(bggId)
      }
      return next
    })
  }, [])

  const toggleAllOnPage = useCallback(() => {
    const selectableBggIds = selectableGames.map(g => g.bggId)
    const allSelected = selectableBggIds.every(id => selectedIds.has(id))

    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        // Deselect all on this page
        selectableBggIds.forEach(id => next.delete(id))
      } else {
        // Select all selectable on this page
        selectableBggIds.forEach(id => next.add(id))
      }
      return next
    })
  }, [selectableGames, selectedIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Pagination
  const totalPages = data ? Math.ceil(data.total / limit) : 0
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  // Import handlers
  const handleImport = useCallback(() => {
    if (selectedIds.size === 0) return
    onImport(Array.from(selectedIds), relationMode)
  }, [selectedIds, relationMode, onImport])

  const handleQuickImport = useCallback(() => {
    if (selectedIds.size === 0) return
    onQuickImport(Array.from(selectedIds))
  }, [selectedIds, onQuickImport])

  // Determine if all selectable games on page are selected
  const allPageSelected = selectableGames.length > 0 &&
    selectableGames.every(g => selectedIds.has(g.bggId))
  const somePageSelected = selectableGames.some(g => selectedIds.has(g.bggId))

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search games..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={hideImported ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHideImported(!hideImported)}
              >
                Hide Imported
              </Button>
              <Select value={rankPreset} onValueChange={(v) => { setRankPreset(v); setPage(1) }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Rank filter" />
                </SelectTrigger>
                <SelectContent>
                  {RANK_PRESETS.map(p => (
                    <SelectItem key={p.label} value={p.label}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">Rank</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && !data && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {/* Table */}
          {data && (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={toggleAllOnPage}
                          aria-label="Select all"
                          className={somePageSelected && !allPageSelected ? 'opacity-50' : ''}
                        />
                      </TableHead>
                      <TableHead className="w-16">Img</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-16 text-center">Year</TableHead>
                      <TableHead className="w-16 text-center">Rank</TableHead>
                      <TableHead className="w-16 text-center">Rating</TableHead>
                      <TableHead className="w-16 text-center">Exp</TableHead>
                      <TableHead className="w-24 text-center">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleGames.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          No games match your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleGames.map((game) => (
                        <GameRow
                          key={game.bggId}
                          game={game}
                          selected={selectedIds.has(game.bggId)}
                          onToggle={() => toggleSelection(game.bggId)}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, data.total)} of {data.total} games
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={!hasPrevPage || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasNextPage || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Loading indicator for subsequent fetches */}
          {loading && data && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Action Bar */}
      {selectedIds.size > 0 && (
        <Card className="sticky bottom-4 border-primary/50 shadow-lg">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {selectedIds.size} game{selectedIds.size !== 1 ? 's' : ''} selected
                </Badge>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Import with:</span>
                  <Select value={relationMode} onValueChange={(v) => setRelationMode(v as RelationMode)}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Game only</SelectItem>
                      <SelectItem value="upstream">+ Base games</SelectItem>
                      <SelectItem value="all">+ Full family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
                <Button variant="outline" size="sm" onClick={handleImport}>
                  Import Selected
                </Button>
                <Button size="sm" onClick={handleQuickImport} className="gap-1.5">
                  <Zap className="h-4 w-4" />
                  Quick Import
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Separate component for table rows to optimize re-renders
interface GameRowProps {
  game: PuffinBrowseGame
  selected: boolean
  onToggle: () => void
}

function GameRow({ game, selected, onToggle }: GameRowProps) {
  const isImported = game.importedToBoardmello

  return (
    <TableRow
      className={`cursor-pointer transition-colors ${
        isImported
          ? 'opacity-60'
          : selected
            ? 'bg-primary/5'
            : 'hover:bg-muted/50'
      }`}
      onClick={() => !isImported && onToggle()}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          disabled={isImported}
          aria-label={`Select ${game.name}`}
        />
      </TableCell>
      <TableCell>
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt={game.name}
            className="w-10 h-10 object-cover rounded"
          />
        ) : (
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{game.name}</span>
          {game.isExpansion && (
            <span className="text-xs text-muted-foreground">Expansion</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center text-muted-foreground">
        {game.yearPublished || '-'}
      </TableCell>
      <TableCell className="text-center">
        {game.rank ? `#${game.rank}` : '-'}
      </TableCell>
      <TableCell className="text-center">
        {game.rating > 0 ? game.rating.toFixed(1) : '-'}
      </TableCell>
      <TableCell className="text-center">
        {game.expansionCount > 20 ? '20+' : game.expansionCount || '-'}
      </TableCell>
      <TableCell className="text-center">
        <EnrichmentBadges
          sources={game.sources}
          importedToBoardmello={game.importedToBoardmello}
          boardmelloSlug={game.boardmelloSlug}
          compact
        />
      </TableCell>
    </TableRow>
  )
}
