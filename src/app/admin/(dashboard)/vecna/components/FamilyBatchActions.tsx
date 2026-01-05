'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { VecnaFamily, VecnaState } from '@/lib/vecna'

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

interface FamilyBatchActionsProps {
  family: VecnaFamily
  onProcessingComplete: () => void
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
    description: 'Only parse rulebooks, skip content generation',
    icon: FileText,
  },
  'generate-only': {
    label: 'Generate Only',
    description: 'Only generate content (assumes parsing done)',
    icon: Sparkles,
  },
}

export function FamilyBatchActions({ family, onProcessingComplete }: FamilyBatchActionsProps) {
  const router = useRouter()
  const [mode, setMode] = useState<ProcessingMode>('from-current')
  const [stopOnError, setStopOnError] = useState(false)
  const [skipBlocked, setSkipBlocked] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)
  const [results, setResults] = useState<ProcessingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Calculate family stats
  const totalGames = family.games.length
  const publishedCount = family.games.filter(g => g.vecna_state === 'published').length
  const generatedCount = family.games.filter(g => g.vecna_state === 'generated' || g.vecna_state === 'review_pending').length

  // Games without rulebook URLs that aren't in early states are blocked
  const blockedCount = family.games.filter(g => {
    if (g.vecna_state === 'published' || g.vecna_state === 'review_pending' || g.vecna_state === 'generated') return false
    // Games without rulebooks in enriched+ states are blocked
    if (!g.has_rulebook && ['enriched', 'rulebook_missing', 'rulebook_ready', 'parsing', 'parsed', 'taxonomy_assigned', 'generating'].includes(g.vecna_state)) {
      return true
    }
    return false
  }).length

  // Ready games: have rulebook OR are in imported state with enrichment data to progress
  const readyCount = family.games.filter(g => {
    // Skip already complete games
    if (['published', 'review_pending', 'generated'].includes(g.vecna_state)) return false
    // Games with rulebooks can be processed
    if (g.has_rulebook) return true
    // Games in imported state with enrichment data can at least progress to enriched
    if (g.vecna_state === 'imported' && (g.has_wikidata || g.has_wikipedia)) return true
    return false
  }).length

  const progressPercent = Math.round(((publishedCount + generatedCount) / totalGames) * 100)

  const startProcessing = async () => {
    setIsProcessing(true)
    setError(null)
    setResults(null)
    setProcessingStatus('Starting batch processing...')

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
      setProcessingStatus(null)
      onProcessingComplete()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed')
      setProcessingStatus(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const ModeIcon = MODE_INFO[mode].icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Batch Processing
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          Process all {totalGames} games in this family
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Family Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Family Progress</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex gap-2 flex-wrap text-xs">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {publishedCount} published
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {generatedCount} generated
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              {readyCount} ready
            </Badge>
            {blockedCount > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {blockedCount} blocked
              </Badge>
            )}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-2">
          <Label htmlFor="mode">Processing Mode</Label>
          <Select
            value={mode}
            onValueChange={(value) => setMode(value as ProcessingMode)}
            disabled={isProcessing}
          >
            <SelectTrigger id="mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODE_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <info.icon className="h-4 w-4" />
                    <span>{info.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{MODE_INFO[mode].description}</p>
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="skip-blocked" className="text-sm">
              Skip blocked games
            </Label>
            <Switch
              id="skip-blocked"
              checked={skipBlocked}
              onCheckedChange={setSkipBlocked}
              disabled={isProcessing}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="stop-on-error" className="text-sm">
              Stop on first error
            </Label>
            <Switch
              id="stop-on-error"
              checked={stopOnError}
              onCheckedChange={setStopOnError}
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Processing Status */}
        {processingStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Loader2 className="h-4 w-4 text-blue-500 flex-shrink-0 animate-spin mt-0.5" />
            <span className="text-sm text-blue-700">{processingStatus}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Start Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full"
              disabled={isProcessing || readyCount === 0}
            >
              <ModeIcon className="h-4 w-4 mr-2" />
              Process {readyCount} Games
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start Batch Processing?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    This will process <strong>{readyCount} games</strong> in the{' '}
                    <strong>{family.name}</strong> family using{' '}
                    <strong>{MODE_INFO[mode].label}</strong> mode.
                  </p>
                  {skipBlocked && blockedCount > 0 && (
                    <p className="text-yellow-600">
                      {blockedCount} blocked games will be skipped.
                    </p>
                  )}
                  <p>
                    This may take several minutes depending on the number of games.
                  </p>
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

        {/* Results */}
        {results && (() => {
          // Calculate better stats - differentiate actual progress from no-change
          const advanced = results.results.filter(r =>
            r.success && !r.skipped && r.previousState !== r.newState
          )
          const noChange = results.results.filter(r =>
            r.success && !r.skipped && r.previousState === r.newState
          )
          const skipped = results.results.filter(r => r.skipped)
          const errors = results.results.filter(r => !r.success && !r.skipped)

          return (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Processing Results</h4>
                <div className="flex gap-2 flex-wrap">
                  {advanced.length > 0 && (
                    <Badge className="bg-green-100 text-green-700">
                      {advanced.length} advanced
                    </Badge>
                  )}
                  {noChange.length > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      {noChange.length} blocked
                    </Badge>
                  )}
                  {skipped.length > 0 && (
                    <Badge variant="secondary">
                      {skipped.length} skipped
                    </Badge>
                  )}
                  {errors.length > 0 && (
                    <Badge className="bg-red-100 text-red-700">
                      {errors.length} errors
                    </Badge>
                  )}
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {results.results.map((result) => {
                  const didAdvance = result.success && !result.skipped && result.previousState !== result.newState
                  const isBlocked = result.success && !result.skipped && result.previousState === result.newState

                  return (
                    <div
                      key={result.gameId}
                      className={cn(
                        'flex items-center justify-between p-2 rounded text-sm',
                        didAdvance && 'bg-green-50',
                        isBlocked && 'bg-yellow-50',
                        result.skipped && 'bg-gray-50',
                        !result.success && !result.skipped && 'bg-red-50'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {didAdvance && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        {isBlocked && (
                          <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                        {result.skipped && (
                          <SkipForward className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        {!result.success && !result.skipped && (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="truncate">{result.gameName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {result.skipped ? (
                          <span>{result.skipReason}</span>
                        ) : didAdvance ? (
                          <span className="text-green-700">{result.previousState} → {result.newState}</span>
                        ) : isBlocked ? (
                          <span className="text-yellow-700">Needs rulebook</span>
                        ) : (
                          <span className="text-red-600">{result.error}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </CardContent>
    </Card>
  )
}
