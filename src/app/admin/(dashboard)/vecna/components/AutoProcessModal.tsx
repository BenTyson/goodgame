'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  SkipForward,
  Zap,
  FileText,
  Tags,
  Sparkles,
  AlertCircle,
  ImageIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { VecnaState } from '@/lib/vecna'

interface AutoProcessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'single' | 'family'
  gameId?: string
  familyId?: string
  gameName?: string
  familyName?: string
  model?: 'haiku' | 'sonnet' | 'opus'
  onComplete: () => void
}

type ProcessingPhase = 'idle' | 'processing' | 'complete' | 'error'

interface StepStatus {
  parsing: 'pending' | 'running' | 'complete' | 'error' | 'skipped'
  taxonomy: 'pending' | 'running' | 'complete' | 'error' | 'skipped'
  generating: 'pending' | 'running' | 'complete' | 'error' | 'skipped'
}

interface GameProgress {
  gameId: string
  gameName: string
  thumbnailUrl?: string
  steps: StepStatus
  success?: boolean
  error?: string
  previousState?: VecnaState
  newState?: VecnaState
  skipped?: boolean
  skipReason?: string
}

interface Summary {
  total: number
  processed: number
  skipped: number
  errors: number
  duration: number
}

const STEP_ICONS = {
  parsing: FileText,
  taxonomy: Tags,
  generating: Sparkles,
}

const STEP_LABELS = {
  parsing: 'Parse Rulebook',
  taxonomy: 'Assign Taxonomy',
  generating: 'Generate Content',
}

export function AutoProcessModal({
  open,
  onOpenChange,
  mode,
  gameId,
  familyId,
  gameName,
  familyName,
  model = 'sonnet',
  onComplete,
}: AutoProcessModalProps) {
  const [phase, setPhase] = useState<ProcessingPhase>('idle')
  const [gameProgress, setGameProgress] = useState<Map<string, GameProgress>>(new Map())
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)
  const [currentGameIndex, setCurrentGameIndex] = useState(0)
  const [totalGames, setTotalGames] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [aborted, setAborted] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPhase('idle')
      setGameProgress(new Map())
      setCurrentGameId(null)
      setCurrentGameIndex(0)
      setTotalGames(0)
      setSummary(null)
      setAborted(false)
      // Auto-start processing
      startProcessing()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const startProcessing = async () => {
    setPhase('processing')
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/admin/vecna/auto-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          gameId: mode === 'single' ? gameId : undefined,
          familyId: mode === 'family' ? familyId : undefined,
          model,
          skipBlocked: true,
          stopOnError: false,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to start processing')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))
              handleEvent(event)
            } catch (e) {
              console.error('Failed to parse SSE event:', e)
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setAborted(true)
        setPhase('complete')
      } else {
        console.error('Auto-process error:', error)
        setPhase('error')
      }
    }
  }

  const handleEvent = (event: {
    type: string
    [key: string]: unknown
  }) => {
    switch (event.type) {
      case 'start':
        setTotalGames(event.totalGames as number)
        break

      case 'game_start': {
        const gameId = event.gameId as string
        setCurrentGameId(gameId)
        setCurrentGameIndex(event.gameIndex as number)
        setGameProgress(prev => {
          const next = new Map(prev)
          next.set(gameId, {
            gameId,
            gameName: event.gameName as string,
            thumbnailUrl: event.thumbnailUrl as string | undefined,
            steps: {
              parsing: 'pending',
              taxonomy: 'pending',
              generating: 'pending',
            },
          })
          return next
        })
        break
      }

      case 'step': {
        const gameId = event.gameId as string
        const step = event.step as keyof StepStatus
        const status = event.status as 'running' | 'complete' | 'error'
        setGameProgress(prev => {
          const next = new Map(prev)
          const game = next.get(gameId)
          if (game) {
            next.set(gameId, {
              ...game,
              steps: {
                ...game.steps,
                [step]: status,
              },
              ...(status === 'error' ? { error: event.error as string } : {}),
            })
          }
          return next
        })
        break
      }

      case 'game_complete': {
        const gameId = event.gameId as string
        setGameProgress(prev => {
          const next = new Map(prev)
          const game = next.get(gameId)
          if (game) {
            next.set(gameId, {
              ...game,
              success: event.success as boolean,
              error: event.error as string | undefined,
              previousState: event.previousState as VecnaState,
              newState: event.newState as VecnaState,
            })
          }
          return next
        })
        break
      }

      case 'game_skip': {
        const gameId = event.gameId as string
        setGameProgress(prev => {
          const next = new Map(prev)
          next.set(gameId, {
            gameId,
            gameName: event.gameName as string,
            steps: {
              parsing: 'skipped',
              taxonomy: 'skipped',
              generating: 'skipped',
            },
            skipped: true,
            skipReason: event.reason as string,
          })
          return next
        })
        break
      }

      case 'complete':
        setSummary(event.summary as Summary)
        setPhase('complete')
        break
    }
  }

  const handleCancel = () => {
    abortControllerRef.current?.abort()
  }

  const handleClose = () => {
    onOpenChange(false)
    if (phase === 'complete') {
      onComplete()
    }
  }

  const currentGame = currentGameId ? gameProgress.get(currentGameId) : null
  const progressPercent = totalGames > 0 ? (currentGameIndex / totalGames) * 100 : 0

  // Convert map to array for display
  const gamesList = Array.from(gameProgress.values())

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {phase === 'processing' ? 'Processing...' : 'Auto Process'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'single'
              ? `Processing ${gameName || 'game'}`
              : `Processing ${familyName || 'family'} games`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overall Progress */}
          {phase === 'processing' && totalGames > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{currentGameIndex} / {totalGames} games</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Current Game */}
          {phase === 'processing' && currentGame && (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center gap-3">
                {currentGame.thumbnailUrl ? (
                  <Image
                    src={currentGame.thumbnailUrl}
                    alt={currentGame.gameName}
                    width={48}
                    height={48}
                    className="rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{currentGame.gameName}</div>
                  <div className="text-xs text-muted-foreground">
                    Game {currentGameIndex} of {totalGames}
                  </div>
                </div>
              </div>

              {/* Step Progress */}
              <div className="space-y-2">
                {(['parsing', 'taxonomy', 'generating'] as const).map((step) => {
                  const status = currentGame.steps[step]
                  const Icon = STEP_ICONS[step]
                  return (
                    <div
                      key={step}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded transition-colors',
                        status === 'running' && 'bg-blue-50 dark:bg-blue-950/30',
                        status === 'complete' && 'bg-green-50 dark:bg-green-950/30',
                        status === 'error' && 'bg-red-50 dark:bg-red-950/30'
                      )}
                    >
                      {status === 'pending' && (
                        <div className="h-4 w-4 rounded-full border-2 border-muted" />
                      )}
                      {status === 'running' && (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      )}
                      {status === 'complete' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {status === 'error' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {status === 'skipped' && (
                        <SkipForward className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className={cn(
                        'text-sm',
                        status === 'running' && 'font-medium text-blue-700 dark:text-blue-300',
                        status === 'complete' && 'text-green-700 dark:text-green-300',
                        status === 'error' && 'text-red-700 dark:text-red-300'
                      )}>
                        {STEP_LABELS[step]}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Error Display */}
              {currentGame.error && (
                <div className="p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{currentGame.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Results Summary */}
          {phase === 'complete' && summary && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{summary.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.processed}</div>
                  <div className="text-xs text-muted-foreground">Processed</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{summary.skipped}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className={cn(
                  'p-3 rounded-lg text-center',
                  summary.errors > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted'
                )}>
                  <div className={cn(
                    'text-2xl font-bold',
                    summary.errors > 0 ? 'text-red-600' : 'text-muted-foreground'
                  )}>
                    {summary.errors}
                  </div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                Completed in {summary.duration}s
              </div>

              {/* Error Details (always show if there are errors) */}
              {summary.errors > 0 && gamesList.length === 1 && gamesList[0].error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-medium">Error processing {gamesList[0].gameName}:</div>
                      <div className="text-red-600 dark:text-red-400">{gamesList[0].error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Results List (for multiple games) */}
              {gamesList.length > 1 && (
                <ScrollArea className="h-48 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {gamesList.map((game) => (
                      <div
                        key={game.gameId}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded text-sm',
                          game.success && 'bg-green-50 dark:bg-green-950/20',
                          game.error && !game.skipped && 'bg-red-50 dark:bg-red-950/20',
                          game.skipped && 'bg-muted/50'
                        )}
                      >
                        {game.success && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {game.error && !game.skipped && <XCircle className="h-4 w-4 text-red-500" />}
                        {game.skipped && <SkipForward className="h-4 w-4 text-muted-foreground" />}
                        <span className="flex-1 truncate">{game.gameName}</span>
                        {game.skipped && (
                          <Badge variant="secondary" className="text-xs">{game.skipReason}</Badge>
                        )}
                        {game.newState && !game.skipped && (
                          <Badge variant="outline" className="text-xs">{game.newState}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {aborted && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Processing was cancelled
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {phase === 'processing' && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            {phase === 'complete' && (
              <Button onClick={handleClose}>
                Close & Refresh
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
