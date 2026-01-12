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
  Cpu,
  Brain,
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
import type { VecnaFamily, ProcessingMode, ProcessingResult, ProcessingResponse } from '@/lib/vecna'
import { AutoProcessModal } from './AutoProcessModal'

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
  const [showAutoProcess, setShowAutoProcess] = useState(false)
  const [selectedModel, setSelectedModel] = useState<'haiku' | 'sonnet' | 'opus'>('sonnet')
  const [results, setResults] = useState<ProcessingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Calculate family stats
  const stats = useMemo(() => {
    const total = family.games.length
    // Use is_published flag (not vecna_state) since games can be published from Game Editor
    const published = family.games.filter(g => g.is_published).length
    const generated = family.games.filter(g =>
      g.vecna_state === 'generated' || g.vecna_state === 'review_pending'
    ).length

    // Games blocked by missing rulebook
    const blocked = family.games.filter(g => {
      if (g.is_published || ['review_pending', 'generated'].includes(g.vecna_state)) return false
      if (!g.has_rulebook && ['enriched', 'rulebook_missing', 'rulebook_ready', 'parsing', 'parsed', 'taxonomy_assigned', 'generating'].includes(g.vecna_state)) {
        return true
      }
      return false
    }).length

    // Games ready to process
    const ready = family.games.filter(g => {
      if (g.is_published || ['review_pending', 'generated'].includes(g.vecna_state)) return false
      if (g.has_rulebook) return true
      if (g.vecna_state === 'imported' && (g.has_wikidata || g.has_wikipedia)) return true
      return false
    }).length

    const needsReview = family.games.filter(g => g.vecna_state === 'review_pending').length

    return { total, published, generated, blocked, ready, needsReview }
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
      <div className={cn('bg-muted/30 border rounded-lg px-4 py-3', className)}>
        {/* Compact single row: thumbnail + info + stats + batch actions */}
        <div className="flex items-center gap-3">
          {/* Small thumbnail */}
          <div className="flex-shrink-0">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={family.name}
                width={36}
                height={36}
                className="rounded object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded bg-muted flex items-center justify-center">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Family name + game count */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">{family.name}</span>
            <Badge variant="secondary" className="text-xs shrink-0">
              {stats.total} games
            </Badge>
          </div>

          {/* Status badges - compact */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <span className="text-xs text-green-600 dark:text-green-400">
              {stats.published}/{stats.total} published
            </span>
            {stats.needsReview > 0 && (
              <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs py-0 dark:text-blue-400 dark:border-blue-700">
                {stats.needsReview} review
              </Badge>
            )}
            {stats.blocked > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs py-0 dark:text-amber-400 dark:border-amber-700">
                {stats.blocked} blocked
              </Badge>
            )}

            {/* Batch actions dropdown */}
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

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Auto Process</DropdownMenuLabel>
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Cpu className="w-3 h-3" />
                    Model:
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={selectedModel === 'haiku' ? 'default' : 'outline'}
                      size="sm"
                      onClick={(e) => { e.preventDefault(); setSelectedModel('haiku') }}
                      className="h-6 text-xs px-2"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Haiku
                    </Button>
                    <Button
                      variant={selectedModel === 'sonnet' ? 'default' : 'outline'}
                      size="sm"
                      onClick={(e) => { e.preventDefault(); setSelectedModel('sonnet') }}
                      className="h-6 text-xs px-2"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Sonnet
                    </Button>
                    <Button
                      variant={selectedModel === 'opus' ? 'default' : 'outline'}
                      size="sm"
                      onClick={(e) => { e.preventDefault(); setSelectedModel('opus') }}
                      className="h-6 text-xs px-2"
                    >
                      <Brain className="h-3 w-3 mr-1" />
                      Opus
                    </Button>
                  </div>
                </div>
                <DropdownMenuItem
                  onClick={() => setShowAutoProcess(true)}
                  className="text-primary font-medium"
                  disabled={stats.ready === 0}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Auto Process with Progress
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">{advanced} advanced</Badge>
                  )}
                  {blocked > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">{blocked} blocked</Badge>
                  )}
                  {skipped > 0 && (
                    <Badge variant="secondary">{skipped} skipped</Badge>
                  )}
                  {errors > 0 && (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">{errors} errors</Badge>
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

      {/* Auto Process Modal */}
      <AutoProcessModal
        open={showAutoProcess}
        onOpenChange={setShowAutoProcess}
        mode="family"
        familyId={family.id}
        familyName={family.name}
        model={selectedModel}
        onComplete={() => {
          onProcessingComplete()
          router.refresh()
        }}
      />
    </>
  )
}
