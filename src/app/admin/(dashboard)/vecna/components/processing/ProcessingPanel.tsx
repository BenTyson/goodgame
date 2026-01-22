'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Globe,
  FileText,
  Play,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Eye,
  Loader2,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  SkipForward,
  Zap,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'
import type { VecnaFamily, VecnaGame, VecnaState } from '@/lib/vecna'
import { useVecnaStateUpdate } from '@/hooks/admin'
import { PipelineProgressBar } from '../PipelineProgressBar'
import { BlockedStateAlert } from '../BlockedStateAlert'
import { RulebookDiscovery } from '../RulebookDiscovery'
import { AutoProcessModal } from '../AutoProcessModal'
import { ModelSelector, type ModelType } from '../ModelSelector'

interface ProcessingPanelProps {
  game: VecnaGame
  family?: VecnaFamily | null
  onGameCompleted?: (game: VecnaGame) => void
  onNextGame?: () => void
}

export function ProcessingPanel({
  game,
  family,
  onGameCompleted,
  onNextGame,
}: ProcessingPanelProps) {
  const router = useRouter()
  const [currentState, setCurrentState] = useState<VecnaState>(game.vecna_state)
  const [hasRulebook, setHasRulebook] = useState(game.has_rulebook)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showRulebookDiscovery, setShowRulebookDiscovery] = useState(false)
  const [showAutoProcess, setShowAutoProcess] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelType>('sonnet')

  // Hook for state updates
  const { updateState, isUpdating, error: stateError } = useVecnaStateUpdate({
    gameId: game.id,
    onSuccess: (newState) => {
      setCurrentState(newState)
      // If game reached completed state, notify parent
      if ((newState === 'generated' || newState === 'published') && onGameCompleted) {
        onGameCompleted({ ...game, vecna_state: newState })
      }
    },
  })

  const error = localError || stateError

  // Sync local state when game prop changes
  useEffect(() => {
    setCurrentState(game.vecna_state)
    setHasRulebook(game.has_rulebook)
  }, [game.id, game.vecna_state, game.has_rulebook])

  const isBlocked = currentState === 'rulebook_missing' || currentState === 'review_pending'
  const needsRulebook = !hasRulebook && ['imported', 'enriched', 'rulebook_missing'].includes(currentState)

  const handleRulebookSet = (url: string) => {
    setHasRulebook(true)
    setCurrentState('rulebook_ready')
    setShowRulebookDiscovery(false)
    router.refresh()
  }

  // Parse rulebook
  const startParsing = async () => {
    if (!game.rulebook_url) {
      setLocalError('No rulebook URL set')
      return
    }

    setIsProcessing(true)
    setLocalError(null)
    setProcessingMessage('Parsing rulebook PDF...')

    try {
      await fetch(`/api/admin/vecna/${game.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'parsing' }),
      })
      setCurrentState('parsing')

      setProcessingMessage('Extracting text and analyzing complexity...')
      const parseResponse = await fetch('/api/admin/rulebook/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, url: game.rulebook_url }),
      })

      const parseResult = await parseResponse.json()

      if (!parseResponse.ok || !parseResult.success) {
        throw new Error(parseResult.error || 'Parsing failed')
      }

      await updateState('parsed')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Parsing failed')
      await updateState('rulebook_ready', false)
    } finally {
      setIsProcessing(false)
      setProcessingMessage(null)
    }
  }

  const modelLabels = {
    haiku: 'Haiku (Fast)',
    sonnet: 'Sonnet (Balanced)',
    opus: 'Opus (Best)',
  }

  // Generate content
  const startGenerating = async () => {
    setIsProcessing(true)
    setLocalError(null)
    setProcessingMessage(`Generating with ${modelLabels[selectedModel]}...`)

    try {
      await fetch(`/api/admin/vecna/${game.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'generating' }),
      })
      setCurrentState('generating')

      setProcessingMessage(`Creating rules, setup, reference with ${modelLabels[selectedModel]}...`)
      const generateResponse = await fetch('/api/admin/rulebook/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, contentTypes: ['rules', 'setup', 'reference'], model: selectedModel }),
      })

      const generateResult = await generateResponse.json()

      if (!generateResponse.ok || !generateResult.success) {
        throw new Error(generateResult.error || 'Content generation failed')
      }

      await updateState('generated')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Generation failed')
      await updateState('taxonomy_assigned', false)
    } finally {
      setIsProcessing(false)
      setProcessingMessage(null)
    }
  }

  // Re-sync with BGG
  const resyncBGG = async () => {
    setIsProcessing(true)
    setLocalError(null)
    setProcessingMessage('Re-syncing with BoardGameGeek...')

    try {
      const response = await fetch(`/api/admin/games/${game.id}/sync-bgg`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Re-sync failed')
      }

      router.refresh()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Re-sync failed')
    } finally {
      setIsProcessing(false)
      setProcessingMessage(null)
    }
  }

  // Re-sync Wikipedia
  const resyncWikipedia = async () => {
    setIsProcessing(true)
    setLocalError(null)
    setProcessingMessage('Re-syncing Wikipedia data...')

    try {
      const response = await fetch(`/api/admin/games/${game.id}/resync-wikipedia`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Re-sync failed')
      }

      router.refresh()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Re-sync failed')
    } finally {
      setIsProcessing(false)
      setProcessingMessage(null)
    }
  }

  // Get next action based on state
  const getNextAction = () => {
    switch (currentState) {
      case 'imported':
        if (hasRulebook) {
          return { label: 'Parse Rulebook', icon: Play, action: startParsing }
        }
        return { label: 'Mark as Enriched', icon: CheckCircle2, action: () => updateState('enriched') }
      case 'enriched':
        if (hasRulebook) {
          return { label: 'Mark Rulebook Ready', icon: FileText, action: () => updateState('rulebook_ready') }
        }
        return { label: 'Find Rulebook', icon: FileText, action: () => setShowRulebookDiscovery(true) }
      case 'rulebook_missing':
        if (hasRulebook) {
          return { label: 'Mark Rulebook Ready', icon: FileText, action: () => updateState('rulebook_ready') }
        }
        return { label: 'Find Rulebook', icon: FileText, action: () => setShowRulebookDiscovery(true) }
      case 'rulebook_ready':
        return { label: 'Parse Rulebook', icon: Play, action: startParsing }
      case 'parsing':
        return { label: 'Mark as Parsed', icon: CheckCircle2, action: () => updateState('parsed') }
      case 'parsed':
        return { label: 'Assign Taxonomy', icon: CheckCircle2, action: () => updateState('taxonomy_assigned') }
      case 'taxonomy_assigned':
        return { label: 'Generate Content', icon: Sparkles, action: startGenerating }
      case 'generating':
        return { label: 'Mark as Generated', icon: CheckCircle2, action: () => updateState('generated') }
      case 'generated':
      case 'review_pending':
      case 'published':
        return null
    }
  }

  const nextAction = getNextAction()
  const isComplete = ['generated', 'review_pending', 'published'].includes(currentState)

  return (
    <div className="p-6 space-y-6">
      {/* Game Header */}
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {game.thumbnail_url ? (
            <Image
              src={game.thumbnail_url}
              alt={game.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold truncate">{game.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {game.year_published && <span>{game.year_published}</span>}
                {game.relation_type && family && (
                  <>
                    <span>&middot;</span>
                    <span className="capitalize">
                      {game.relation_type.replace(/_/g, ' ').replace(/ of$/i, '')}
                    </span>
                    {game.relation_to_base && (
                      <>
                        <span>of</span>
                        <span className="font-medium text-foreground">{game.relation_to_base}</span>
                      </>
                    )}
                  </>
                )}
                {game.has_rulebook && (
                  <>
                    <span>&middot;</span>
                    <span className="text-green-600 dark:text-green-400">Has rulebook</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/admin/games/${game.id}`}>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </Link>
              <Link href={`/games/${game.slug}`} target="_blank">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <PipelineProgressBar state={currentState} size="md" />

      {/* Blocked State Alert */}
      {(isBlocked || game.vecna_error) && (
        <BlockedStateAlert
          state={currentState}
          error={game.vecna_error}
          onAction={needsRulebook ? () => setShowRulebookDiscovery(true) : undefined}
        />
      )}

      {/* Pipeline Content */}
      <div className="space-y-4">
        {/* Model Selector - show when ready to generate */}
        {currentState === 'taxonomy_assigned' && (
          <ModelSelector value={selectedModel} onChange={setSelectedModel} />
        )}

        {/* Auto Process Button */}
        {hasRulebook && ['imported', 'enriched', 'rulebook_ready', 'rulebook_missing', 'parsed', 'taxonomy_assigned'].includes(currentState) && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAutoProcess(true)}
              disabled={isProcessing || isUpdating}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              Auto Process
            </Button>
          </div>
        )}

        {/* Primary Action Button */}
        {nextAction && (
          <div className="flex justify-center">
            <Button
              variant="default"
              size="lg"
              onClick={nextAction.action}
              disabled={isProcessing || isUpdating}
              className="gap-2"
            >
              {(isProcessing || isUpdating) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <nextAction.icon className="h-4 w-4" />
              )}
              {nextAction.label}
            </Button>
          </div>
        )}

        {/* Next game button when complete */}
        {isComplete && onNextGame && (
          <div className="flex justify-center">
            <Button
              variant="default"
              size="lg"
              onClick={onNextGame}
              className="gap-2"
            >
              Next Game
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Processing message */}
        {processingMessage && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 dark:bg-blue-950/30 dark:border-blue-800">
            <Loader2 className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0 animate-spin mt-0.5" />
            <span className="text-sm text-blue-700 dark:text-blue-300">{processingMessage}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 dark:bg-red-950/30 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Rulebook Discovery */}
        {(showRulebookDiscovery || needsRulebook) && (
          <RulebookDiscovery
            gameId={game.id}
            gameSlug={game.slug}
            gameName={game.name}
            currentRulebookUrl={game.rulebook_url}
            onRulebookSet={handleRulebookSet}
          />
        )}

        {/* Skip option for missing rulebook */}
        {currentState === 'rulebook_missing' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <span>or</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateState('taxonomy_assigned')}
              disabled={isProcessing || isUpdating}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip (Use Wikipedia Only)
            </Button>
          </div>
        )}

        {/* Reset Actions */}
        <div className="pt-4 border-t space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-2">Data Refresh</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isProcessing || isUpdating}
                onClick={resyncBGG}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh BGG
              </Button>
              {game.has_wikipedia && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isProcessing || isUpdating}
                  onClick={resyncWikipedia}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Wikipedia
                </Button>
              )}
            </div>
          </div>

          {!['imported', 'enriched'].includes(currentState) && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Pipeline Resets</div>
              <div className="flex flex-wrap gap-2">
                {hasRulebook && ['parsed', 'taxonomy_assigned', 'generated', 'review_pending', 'published'].includes(currentState) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isProcessing || isUpdating}
                    onClick={() => updateState('rulebook_ready')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Re-parse Rulebook
                  </Button>
                )}
                {['generated', 'review_pending', 'published'].includes(currentState) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isProcessing || isUpdating}
                    onClick={() => updateState('taxonomy_assigned')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Regenerate Content
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isProcessing || isUpdating}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset to Start
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Pipeline?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset "{game.name}" back to the imported state. You will need to re-process the entire pipeline.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => updateState('imported')}>
                        Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto Process Modal */}
      <AutoProcessModal
        open={showAutoProcess}
        onOpenChange={setShowAutoProcess}
        mode="single"
        gameId={game.id}
        gameName={game.name}
        model={selectedModel}
        onComplete={() => {
          router.refresh()
          if (onGameCompleted) {
            onGameCompleted({ ...game, vecna_state: 'generated' })
          }
        }}
      />
    </div>
  )
}
