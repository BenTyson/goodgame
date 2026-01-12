'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Globe,
  Database,
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
  XCircle,
  Cpu,
  Zap,
  Brain,
  RefreshCw,
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
import { PipelineProgressBar } from './PipelineProgressBar'
import { BlockedStateAlert } from './BlockedStateAlert'
import { RulebookDiscovery } from './RulebookDiscovery'
import { AutoProcessModal } from './AutoProcessModal'

interface VecnaGamePanelProps {
  game: VecnaGame
  family: VecnaFamily | null
  isStandalone: boolean
  onOpenSourcesDrawer: () => void
}

export function VecnaGamePanel({
  game,
  family,
  isStandalone,
  onOpenSourcesDrawer,
}: VecnaGamePanelProps) {
  const router = useRouter()
  const [currentState, setCurrentState] = useState<VecnaState>(game.vecna_state)
  const [hasRulebook, setHasRulebook] = useState(game.has_rulebook)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRulebookDiscovery, setShowRulebookDiscovery] = useState(false)
  const [showAutoProcess, setShowAutoProcess] = useState(false)
  const [selectedModel, setSelectedModel] = useState<'sonnet' | 'haiku' | 'opus'>('sonnet')

  // Sync local state when game prop changes (e.g., after router.refresh())
  useEffect(() => {
    setCurrentState(game.vecna_state)
    setHasRulebook(game.has_rulebook)
  }, [game.id, game.vecna_state, game.has_rulebook])

  const isBlocked = currentState === 'rulebook_missing' || currentState === 'review_pending'
  // Show rulebook discovery for early states that don't have a rulebook yet
  const needsRulebook = !hasRulebook && ['imported', 'enriched', 'rulebook_missing'].includes(currentState)

  const handleStateChange = (newState: VecnaState) => {
    setCurrentState(newState)
    router.refresh()
  }

  const handleRulebookSet = (url: string) => {
    setHasRulebook(true)
    setCurrentState('rulebook_ready')
    setShowRulebookDiscovery(false)
    router.refresh()
  }

  // State update function
  const updateState = async (newState: VecnaState, clearError = true) => {
    setIsProcessing(true)
    if (clearError) setError(null)

    try {
      const response = await fetch(`/api/admin/vecna/${game.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState, error: clearError ? null : undefined }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update state')
      }

      handleStateChange(newState)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update state')
    } finally {
      setIsProcessing(false)
      setProcessingMessage(null)
    }
  }

  // Parse rulebook
  const startParsing = async () => {
    if (!game.rulebook_url) {
      setError('No rulebook URL set')
      return
    }

    setIsProcessing(true)
    setError(null)
    setProcessingMessage('Parsing rulebook PDF...')

    try {
      await fetch(`/api/admin/vecna/${game.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'parsing' }),
      })
      handleStateChange('parsing')

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
      setError(err instanceof Error ? err.message : 'Parsing failed')
      await updateState('rulebook_ready', false)
    } finally {
      setIsProcessing(false)
      setProcessingMessage(null)
    }
  }

  // Model display names
  const modelLabels = {
    haiku: 'Haiku (Fast)',
    sonnet: 'Sonnet (Balanced)',
    opus: 'Opus (Best)',
  }

  // Generate content
  const startGenerating = async () => {
    setIsProcessing(true)
    setError(null)
    setProcessingMessage(`Generating with ${modelLabels[selectedModel]}...`)

    try {
      await fetch(`/api/admin/vecna/${game.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'generating' }),
      })
      handleStateChange('generating')

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
      setError(err instanceof Error ? err.message : 'Generation failed')
      await updateState('taxonomy_assigned', false)
    } finally {
      setIsProcessing(false)
      setProcessingMessage(null)
    }
  }

  // Re-sync with BGG
  const resyncBGG = async () => {
    setIsProcessing(true)
    setError(null)
    setProcessingMessage('Re-syncing with BoardGameGeek...')

    try {
      const response = await fetch(`/api/admin/games/${game.id}/sync-bgg`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Re-sync failed')
      }

      // Refresh to show updated data
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-sync failed')
    } finally {
      setIsProcessing(false)
      setProcessingMessage(null)
    }
  }

  // Re-sync Wikipedia data
  const resyncWikipedia = async () => {
    setIsProcessing(true)
    setError(null)
    setProcessingMessage('Re-syncing Wikipedia data...')

    try {
      const response = await fetch(`/api/admin/games/${game.id}/resync-wikipedia`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Re-sync failed')
      }

      // Refresh to show updated data
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-sync failed')
    } finally {
      setIsProcessing(false)
      setProcessingMessage(null)
    }
  }

  // Get next action based on state
  const getNextAction = () => {
    switch (currentState) {
      case 'imported':
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
      // Pipeline complete - publishing happens in Game Editor
      case 'generated':
      case 'review_pending':
      case 'published':
        return null
    }
  }

  const nextAction = getNextAction()

  return (
    <div className="p-6 space-y-4">
      {/* Game Header */}
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {game.thumbnail_url ? (
            <Image
              src={game.thumbnail_url}
              alt={game.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold truncate">{game.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {game.year_published && <span>{game.year_published}</span>}
                {game.relation_type && family && (
                  <>
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
        {/* Model Selector - show when ready to generate (before generation only) */}
        {currentState === 'taxonomy_assigned' && (
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Model:</span>
            <div className="flex gap-1 bg-muted/50 rounded-md p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedModel('haiku')}
                className={cn(
                  'h-7 text-xs gap-1',
                  selectedModel === 'haiku' && 'bg-background shadow-sm'
                )}
              >
                <Zap className="h-3 w-3" />
                Haiku
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedModel('sonnet')}
                className={cn(
                  'h-7 text-xs gap-1',
                  selectedModel === 'sonnet' && 'bg-background shadow-sm'
                )}
              >
                <Sparkles className="h-3 w-3" />
                Sonnet
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedModel('opus')}
                className={cn(
                  'h-7 text-xs gap-1',
                  selectedModel === 'opus' && 'bg-background shadow-sm'
                )}
              >
                <Brain className="h-3 w-3" />
                Opus
              </Button>
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              {selectedModel === 'haiku' && 'Fast & cheap for testing'}
              {selectedModel === 'sonnet' && 'Balanced quality & speed'}
              {selectedModel === 'opus' && 'Best quality, slower'}
            </span>
          </div>
        )}

        {/* Auto Process Button - show when game has rulebook and can be processed */}
        {hasRulebook && ['enriched', 'rulebook_ready', 'rulebook_missing', 'parsed', 'taxonomy_assigned'].includes(currentState) && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAutoProcess(true)}
              disabled={isProcessing}
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
              variant="ghost"
              size="lg"
              onClick={nextAction.action}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <nextAction.icon className="h-4 w-4" />
              )}
              {nextAction.label}
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

        {/* Critical Errors Only - shown when there's an actual problem */}
        {game.vecna_error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/30 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Processing Error</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{game.vecna_error}</p>
          </div>
        )}

        {/* Rulebook Discovery - collapsible, auto-expanded when needed */}
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>or</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateState('taxonomy_assigned')}
              disabled={isProcessing}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip (Use Wikipedia Only)
            </Button>
          </div>
        )}

        {/* Reset Actions - organized into two sections */}
        <div className="pt-3 border-t space-y-3">
          {/* Data Refresh */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Data Refresh</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isProcessing}
                onClick={resyncBGG}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh BGG Data
              </Button>
              {game.has_wikipedia && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isProcessing}
                  onClick={resyncWikipedia}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Wikipedia
                </Button>
              )}
            </div>
          </div>

          {/* Pipeline Resets */}
          {!['imported', 'enriched'].includes(currentState) && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Pipeline Resets</div>
              <div className="flex flex-wrap gap-2">
                {/* Re-parse Rulebook - available after parsing */}
                {hasRulebook && ['parsed', 'taxonomy_assigned', 'generated', 'review_pending', 'published'].includes(currentState) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => updateState('rulebook_ready')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Re-parse Rulebook
                  </Button>
                )}
                {/* Regenerate Content - available after generation */}
                {['generated', 'review_pending', 'published'].includes(currentState) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => updateState('taxonomy_assigned')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Regenerate Content
                  </Button>
                )}
                {/* Reset to Start - nuclear option */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isProcessing}
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
        onComplete={() => router.refresh()}
      />
    </div>
  )
}
