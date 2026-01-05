'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Play,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  SkipForward,
  Zap,
  FileText,
  Sparkles,
  ChevronDown,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { VecnaFamily, VecnaState } from '@/lib/vecna'
import { PipelineProgressBar } from './PipelineProgressBar'

type ProcessingMode = 'full' | 'parse-only' | 'generate-only' | 'from-current'

interface ProcessingResult {
  gameId: string
  gameName: string
  previousState: VecnaState
  newState: VecnaState
  success: boolean
  error?: string
  skipped?: boolean
  skipReason?: string
}

interface ProcessingResponse {
  success: boolean
  familyId: string
  familyName: string
  mode: ProcessingMode
  summary: {
    totalGames: number
    processed: number
    skipped: number
    errors: number
  }
  results: ProcessingResult[]
}

interface VecnaFamilyHeaderProps {
  family: VecnaFamily
  onProcessingComplete: () => void
  className?: string
}

const MODE_INFO: Record<ProcessingMode, { label: string; description: string; icon: typeof Play }> = {
  'from-current': {
    label: 'Continue from Current',
    description: 'Process each game from its current state',
    icon: Play,
  },
  'full': {
    label: 'Full Pipeline',
    description: 'Run complete pipeline (parse + generate)',
    icon: Zap,
  },
  'parse-only': {
    label: 'Parse Only',
    description: 'Only parse rulebooks',
    icon: FileText,
  },
  'generate-only': {
    label: 'Generate Only',
    description: 'Only generate content',
    icon: Sparkles,
  },
}

export function VecnaFamilyHeader({
  family,
  onProcessingComplete,
  className,
}: VecnaFamilyHeaderProps) {
  const router = useRouter()

  // Processing state
  const [mode, setMode] = useState<ProcessingMode>('from-current')
  const [skipBlocked, setSkipBlocked] = useState(true)
  const [stopOnError, setStopOnError] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [results, setResults] = useState<ProcessingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Calculate family stats
  const stats = useMemo(() => {
    const total = family.games.length
    const published = family.games.filter(g => g.vecna_state === 'published').length
    const generated = family.games.filter(g =>
      g.vecna_state === 'generated' || g.vecna_state === 'review_pending'
    ).length

    // Games blocked by missing rulebook
    const blocked = family.games.filter(g => {
      if (['published', 'review_pending', 'generated'].includes(g.vecna_state)) return false
      if (!g.has_rulebook && ['enriched', 'rulebook_missing', 'rulebook_ready', 'parsing', 'parsed', 'taxonomy_assigned', 'generating'].includes(g.vecna_state)) {
        return true
      }
      return false
    }).length

    // Games ready to process
    const ready = family.games.filter(g => {
      if (['published', 'review_pending', 'generated'].includes(g.vecna_state)) return false
      if (g.has_rulebook) return true
      if (g.vecna_state === 'imported' && (g.has_wikidata || g.has_wikipedia)) return true
      return false
    }).length

    const needsReview = family.games.filter(g => g.vecna_state === 'review_pending').length

    return { total, published, generated, blocked, ready, needsReview }
  }, [family.games])

  // Get the "dominant" state for the progress bar (most common non-published state)
  const dominantState = useMemo(() => {
    const nonPublished = family.games.filter(g => g.vecna_state !== 'published')
    if (nonPublished.length === 0) return 'published' as VecnaState

    // Find earliest state that any game is in
    const stateOrder: VecnaState[] = [
      'imported', 'enriched', 'rulebook_missing', 'rulebook_ready',
      'parsing', 'parsed', 'taxonomy_assigned', 'generating',
      'generated', 'review_pending', 'published'
    ]
    for (const state of stateOrder) {
      if (nonPublished.some(g => g.vecna_state === state)) {
        return state
      }
    }
    return nonPublished[0].vecna_state
  }, [family.games])

  // Get base game thumbnail
  const baseGame = family.games.find(g => g.id === family.base_game_id) || family.games[0]
  const thumbnailUrl = baseGame?.thumbnail_url

  const startProcessing = async () => {
    setShowConfirm(false)
    setIsProcessing(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch(`/api/admin/vecna/family/${family.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          stopOnError,
          skipBlocked,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed')
      }

      setResults(data)
      onProcessingComplete()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const ModeIcon = MODE_INFO[mode].icon

  return (
    <>
      <div className={cn('bg-card border rounded-lg p-4', className)}>
        {/* Top row: Family info + batch actions */}
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={family.name}
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Family info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold truncate">{family.name}</h2>
              <Badge variant="secondary" className="text-xs">
                {stats.total} games
              </Badge>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-green-600 font-medium">
                {stats.published} published
              </span>
              {stats.generated > 0 && (
                <span className="text-sm text-blue-600">
                  {stats.generated} generated
                </span>
              )}
              {stats.needsReview > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  {stats.needsReview} needs review
                </Badge>
              )}
              {stats.blocked > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                  {stats.blocked} blocked
                </Badge>
              )}
            </div>
          </div>

          {/* Batch actions dropdown */}
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isProcessing || stats.ready === 0}
                  className="min-w-[140px]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ModeIcon className="w-4 h-4 mr-2" />
                      Batch
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Processing Mode</DropdownMenuLabel>
                {Object.entries(MODE_INFO).map(([key, info]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setMode(key as ProcessingMode)}
                    className={cn(mode === key && 'bg-accent')}
                  >
                    <info.icon className="w-4 h-4 mr-2" />
                    <div className="flex-1">
                      <div className="font-medium">{info.label}</div>
                      <div className="text-xs text-muted-foreground">{info.description}</div>
                    </div>
                    {mode === key && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Options</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={skipBlocked}
                  onCheckedChange={setSkipBlocked}
                >
                  Skip blocked games
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={stopOnError}
                  onCheckedChange={setStopOnError}
                >
                  Stop on first error
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowConfirm(true)}
                  className="text-primary font-medium"
                  disabled={stats.ready === 0}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Process {stats.ready} Games
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <PipelineProgressBar state={dominantState} size="sm" />
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Results summary */}
        {results && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {(() => {
              const advanced = results.results.filter(r =>
                r.success && !r.skipped && r.previousState !== r.newState
              ).length
              const blocked = results.results.filter(r =>
                r.success && !r.skipped && r.previousState === r.newState
              ).length
              const skipped = results.results.filter(r => r.skipped).length
              const errors = results.results.filter(r => !r.success && !r.skipped).length

              return (
                <>
                  <span className="text-sm text-muted-foreground">Results:</span>
                  {advanced > 0 && (
                    <Badge className="bg-green-100 text-green-700">{advanced} advanced</Badge>
                  )}
                  {blocked > 0 && (
                    <Badge className="bg-amber-100 text-amber-700">{blocked} blocked</Badge>
                  )}
                  {skipped > 0 && (
                    <Badge variant="secondary">{skipped} skipped</Badge>
                  )}
                  {errors > 0 && (
                    <Badge className="bg-red-100 text-red-700">{errors} errors</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResults(null)}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </>
              )
            })()}
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Batch Processing?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  This will process <strong>{stats.ready} games</strong> in the{' '}
                  <strong>{family.name}</strong> family using{' '}
                  <strong>{MODE_INFO[mode].label}</strong> mode.
                </p>
                {skipBlocked && stats.blocked > 0 && (
                  <p className="text-amber-600">
                    {stats.blocked} blocked games will be skipped.
                  </p>
                )}
                <p>This may take several minutes.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={startProcessing}>
              Start Processing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
