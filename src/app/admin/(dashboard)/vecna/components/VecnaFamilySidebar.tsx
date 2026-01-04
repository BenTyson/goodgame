'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Search,
  ChevronDown,
  ChevronRight,
  Wand2,
  Globe,
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  FileText,
  Users2,
  Gamepad2,
  PanelLeftClose,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { VecnaFamily, VecnaGame, VecnaState } from '@/lib/vecna'
import { VECNA_STATE_CONFIG } from '@/lib/vecna'

interface VecnaFamilySidebarProps {
  families: VecnaFamily[]
  standaloneGames: VecnaGame[]
  selectedFamilyId: string | null
  selectedGameId: string | null
  showStandalone: boolean
  stateFilter: string
  searchQuery: string
  stats: {
    total: number
    published: number
    needsReview: number
    missingRulebook: number
    processing: number
  }
  collapsed: boolean
  onSelectFamily: (familyId: string) => void
  onSelectGame: (gameId: string) => void
  onSelectStandalone: () => void
  onStateFilterChange: (state: string) => void
  onSearchChange: (query: string) => void
  onToggleCollapse: () => void
}

// State filter options
const STATE_FILTERS = [
  { value: 'all', label: 'All States' },
  { value: 'imported', label: 'Imported' },
  { value: 'enriched', label: 'Enriched' },
  { value: 'rulebook_missing', label: 'No Rulebook' },
  { value: 'rulebook_ready', label: 'Rulebook Ready' },
  { value: 'parsed', label: 'Parsed' },
  { value: 'generated', label: 'Generated' },
  { value: 'review_pending', label: 'Review' },
  { value: 'published', label: 'Published' },
]

// State icon mapping
function getStateIcon(state: VecnaState) {
  switch (state) {
    case 'published':
      return <Globe className="h-3 w-3 text-green-500" />
    case 'generated':
    case 'review_pending':
      return <Eye className="h-3 w-3 text-amber-500" />
    case 'parsing':
    case 'generating':
      return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
    case 'parsed':
    case 'taxonomy_assigned':
      return <FileText className="h-3 w-3 text-violet-500" />
    case 'rulebook_missing':
      return <AlertCircle className="h-3 w-3 text-amber-500" />
    case 'rulebook_ready':
      return <CheckCircle2 className="h-3 w-3 text-green-500" />
    default:
      return <div className="h-3 w-3 rounded-full bg-slate-300" />
  }
}

export function VecnaFamilySidebar({
  families,
  standaloneGames,
  selectedFamilyId,
  selectedGameId,
  showStandalone,
  stateFilter,
  searchQuery,
  stats,
  collapsed,
  onSelectFamily,
  onSelectGame,
  onSelectStandalone,
  onStateFilterChange,
  onSearchChange,
  onToggleCollapse,
}: VecnaFamilySidebarProps) {
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    new Set(selectedFamilyId ? [selectedFamilyId] : [])
  )

  const toggleFamily = (familyId: string) => {
    setExpandedFamilies(prev => {
      const next = new Set(prev)
      if (next.has(familyId)) {
        next.delete(familyId)
      } else {
        next.add(familyId)
      }
      return next
    })
  }

  const handleFamilyClick = (familyId: string) => {
    if (!expandedFamilies.has(familyId)) {
      toggleFamily(familyId)
    }
    onSelectFamily(familyId)
  }

  // Don't render anything if collapsed
  if (collapsed) {
    return null
  }

  return (
    <aside className="w-96 border-r bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-lg">Vecna Pipeline</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="h-8 w-8 p-0"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.published}</div>
            <div className="text-[10px] text-muted-foreground">Published</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-600">{stats.needsReview}</div>
            <div className="text-[10px] text-muted-foreground">Review</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{stats.missingRulebook}</div>
            <div className="text-[10px] text-muted-foreground">No Rules</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search families or games..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* State Filter */}
        <Select value={stateFilter} onValueChange={onStateFilterChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Filter by state" />
          </SelectTrigger>
          <SelectContent>
            {STATE_FILTERS.map(filter => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Family List */}
      <ScrollArea className="flex-1">
        <div className="p-2 pr-4 space-y-1">
          {/* Families */}
          {families.map(family => {
            const isExpanded = expandedFamilies.has(family.id)
            const isSelected = selectedFamilyId === family.id

            // Progress bar calculation
            const publishedPercent = family.total_games > 0
              ? (family.published_count / family.total_games) * 100
              : 0

            return (
              <div key={family.id} className="space-y-0.5">
                {/* Family Header */}
                <div
                  onClick={() => handleFamilyClick(family.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer',
                    isSelected && !selectedGameId
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFamily(family.id)
                    }}
                    className="p-0.5 hover:bg-black/10 rounded cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        toggleFamily(family.id)
                      }
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>

                  <Users2 className="h-4 w-4 opacity-60" />

                  <span className="flex-1 truncate text-sm font-medium">
                    {family.name}
                  </span>

                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] px-1.5 py-0',
                      isSelected && !selectedGameId && 'bg-primary-foreground/20'
                    )}
                  >
                    {family.published_count}/{family.total_games}
                  </Badge>
                </div>

                {/* Family Progress Bar */}
                {isExpanded && (
                  <div className="ml-8 mr-2 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${publishedPercent}%` }}
                    />
                  </div>
                )}

                {/* Games in Family */}
                {isExpanded && (
                  <div className="ml-6 space-y-0.5">
                    {family.games.map(game => (
                      <GameItem
                        key={game.id}
                        game={game}
                        isSelected={selectedGameId === game.id}
                        isBaseGame={game.id === family.base_game_id}
                        onClick={() => {
                          onSelectFamily(family.id)
                          onSelectGame(game.id)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Standalone Games Section */}
          {standaloneGames.length > 0 && (
            <div className="pt-2 border-t mt-2">
              <button
                onClick={onSelectStandalone}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors mb-1',
                  showStandalone && !selectedGameId
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <Gamepad2 className="h-4 w-4 opacity-60" />
                <span className="flex-1 text-sm font-medium">Standalone Games</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {standaloneGames.filter(g => g.is_published).length}/{standaloneGames.length}
                </Badge>
              </button>

              {showStandalone && (
                <div className="ml-4 space-y-0.5">
                  {standaloneGames.map(game => (
                    <GameItem
                      key={game.id}
                      game={game}
                      isSelected={selectedGameId === game.id}
                      onClick={() => onSelectGame(game.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {families.length === 0 && standaloneGames.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {searchQuery || stateFilter !== 'all'
                ? 'No games match your filters'
                : 'No games to process'}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}

// Individual game item in sidebar
function GameItem({
  game,
  isSelected,
  isBaseGame,
  onClick,
}: {
  game: VecnaGame
  isSelected: boolean
  isBaseGame?: boolean
  onClick: () => void
}) {
  const stateConfig = VECNA_STATE_CONFIG[game.vecna_state]

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors',
        isSelected
          ? 'bg-primary/10 border border-primary/30'
          : 'hover:bg-accent'
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-8 w-8 rounded overflow-hidden bg-muted flex-shrink-0">
        {game.thumbnail_url ? (
          <Image
            src={game.thumbnail_url}
            alt={game.name}
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Gamepad2 className="h-4 w-4 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Name and relation */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm truncate">{game.name}</span>
          {isBaseGame && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
              Base
            </Badge>
          )}
        </div>
        {game.relation_type && (
          <div className="text-[10px] text-muted-foreground truncate">
            {game.relation_type.replace(/_/g, ' ')}
          </div>
        )}
      </div>

      {/* State indicator with label */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5"
        title={stateConfig.description}
      >
        {getStateIcon(game.vecna_state)}
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {stateConfig.label}
        </span>
      </div>
    </button>
  )
}
