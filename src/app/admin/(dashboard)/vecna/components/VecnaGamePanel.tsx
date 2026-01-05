'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ExternalLink,
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
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Tags,
  SkipForward,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
import { VECNA_STATE_CONFIG } from '@/lib/vecna'
import { PipelineProgressBar } from './PipelineProgressBar'
import { BlockedStateAlert } from './BlockedStateAlert'
import { RulebookDiscovery } from './RulebookDiscovery'

interface VecnaGamePanelProps {
  game: VecnaGame
  family: VecnaFamily | null
  isStandalone: boolean
  onOpenSourcesDrawer: () => void
}

// Source badge component
function SourceBadge({ source }: { source: string | null | undefined }) {
  const config: Record<string, { label: string; color: string }> = {
    bgg: { label: 'BGG', color: 'bg-orange-100 text-orange-700' },
    wikidata: { label: 'WD', color: 'bg-blue-100 text-blue-700' },
    wikipedia: { label: 'WP', color: 'bg-violet-100 text-violet-700' },
    manual: { label: 'Manual', color: 'bg-slate-100 text-slate-700' },
    ai: { label: 'AI', color: 'bg-cyan-100 text-cyan-700' },
  }
  const c = config[source || ''] || { label: '?', color: 'bg-gray-100 text-gray-500' }
  return <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', c.color)}>{c.label}</span>
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

  const stateConfig = VECNA_STATE_CONFIG[currentState]
  const isBlocked = currentState === 'rulebook_missing' || currentState === 'review_pending'
  const needsRulebook = currentState === 'rulebook_missing' || (currentState === 'enriched' && !hasRulebook)

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

  // Generate content
  const startGenerating = async () => {
    setIsProcessing(true)
    setError(null)
    setProcessingMessage('Generating content with AI...')

    try {
      await fetch(`/api/admin/vecna/${game.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'generating' }),
      })
      handleStateChange('generating')

      setProcessingMessage('Creating rules summary, setup guide, and reference...')
      const generateResponse = await fetch('/api/admin/rulebook/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, contentTypes: ['rules', 'setup', 'reference'] }),
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
        return { label: 'Assign Taxonomy', icon: Tags, action: () => updateState('taxonomy_assigned') }
      case 'taxonomy_assigned':
        return { label: 'Generate Content', icon: Sparkles, action: startGenerating }
      case 'generating':
        return { label: 'Mark as Generated', icon: CheckCircle2, action: () => updateState('generated') }
      case 'generated':
        return { label: 'Ready for Review', icon: Eye, action: () => updateState('review_pending') }
      case 'review_pending':
        return { label: 'Approve & Publish', icon: Globe, action: () => updateState('published'), requireConfirm: true }
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
                    <span className="capitalize">{game.relation_type.replace(/_/g, ' ')}</span>
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
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </Link>
              <Link href={`/games/${game.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5">
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

      {/* Tabs */}
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="mt-4 space-y-4">
          {/* Next Action Card */}
          {nextAction && (
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Next Action</div>
                    <div className="font-medium">{stateConfig.description}</div>
                  </div>
                  {nextAction.requireConfirm ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button disabled={isProcessing}>
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <nextAction.icon className="h-4 w-4 mr-2" />
                          )}
                          {nextAction.label}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Publish Game?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will publish "{game.name}" and make it visible to users.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={nextAction.action}>Publish</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button onClick={nextAction.action} disabled={isProcessing}>
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <nextAction.icon className="h-4 w-4 mr-2" />
                      )}
                      {nextAction.label}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing message */}
          {processingMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Loader2 className="h-4 w-4 text-blue-500 flex-shrink-0 animate-spin mt-0.5" />
              <span className="text-sm text-blue-700">{processingMessage}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Data Status - compact */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={game.has_wikipedia ? 'default' : 'outline'} className={cn(!game.has_wikipedia && 'text-muted-foreground')}>
              Wikipedia {game.has_wikipedia ? 'Yes' : 'No'}
            </Badge>
            <Badge variant={game.has_wikidata ? 'default' : 'outline'} className={cn(!game.has_wikidata && 'text-muted-foreground')}>
              Wikidata {game.has_wikidata ? 'Yes' : 'No'}
            </Badge>
            <Badge variant={hasRulebook ? 'default' : 'outline'} className={cn(!hasRulebook && 'text-muted-foreground')}>
              Rulebook {hasRulebook ? 'Yes' : 'No'}
            </Badge>
            <Badge variant={game.has_content ? 'default' : 'outline'} className={cn(!game.has_content && 'text-muted-foreground')}>
              Content {game.has_content ? 'Yes' : 'No'}
            </Badge>
            {game.crunch_score && (
              <Badge variant="secondary">Crunch: {game.crunch_score.toFixed(1)}</Badge>
            )}
          </div>

          {/* Rulebook Discovery - collapsible, auto-expanded when needed */}
          {(showRulebookDiscovery || needsRulebook) && (
            <RulebookDiscovery
              gameId={game.id}
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

          {/* Reset options */}
          {!['imported', 'enriched'].includes(currentState) && (
            <div className="pt-3 border-t">
              <div className="text-xs text-muted-foreground mb-2">Reset State</div>
              <div className="flex flex-wrap gap-2">
                {currentState !== 'rulebook_ready' && currentState !== 'rulebook_missing' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => updateState('rulebook_ready')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Back to Rulebook Ready
                  </Button>
                )}
                {currentState === 'review_pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isProcessing}
                    onClick={startGenerating}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Regenerate Content
                  </Button>
                )}
                {currentState === 'published' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Unpublish
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unpublish Game?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will unpublish "{game.name}" and remove it from public view.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => updateState('review_pending')}>
                          Unpublish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-4">
          <Accordion type="multiple" defaultValue={game.has_content ? ['content'] : ['external']}>
            {/* Generated Content */}
            {game.has_content && (
              <AccordionItem value="content">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Generated Content
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Rules Summary */}
                    {game.rules_content && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Rules Summary</h4>
                        {game.rules_content.quickStart && (
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {game.rules_content.quickStart.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {game.rules_content.winCondition && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Win:</strong> {game.rules_content.winCondition}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Setup */}
                    {game.setup_content?.steps && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Setup Guide</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          {game.setup_content.steps.slice(0, 5).map((step, i) => (
                            <li key={i}>{step.step}</li>
                          ))}
                          {game.setup_content.steps.length > 5 && (
                            <li className="text-muted-foreground/60">
                              +{game.setup_content.steps.length - 5} more steps...
                            </li>
                          )}
                        </ol>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Taxonomy */}
            <AccordionItem value="taxonomy">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  Taxonomy
                  <span className="text-xs text-muted-foreground ml-2">
                    {game.categories.length + game.mechanics.length + game.themes.length} items
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {/* Categories */}
                  {game.categories.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Categories</h4>
                      <div className="flex flex-wrap gap-1">
                        {game.categories.map((cat) => (
                          <Badge key={cat.id} variant="outline" className="text-xs">
                            {cat.is_primary && <span className="text-yellow-500 mr-1">★</span>}
                            {cat.name}
                            {cat.source && <SourceBadge source={cat.source} />}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mechanics */}
                  {game.mechanics.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Mechanics</h4>
                      <div className="flex flex-wrap gap-1">
                        {game.mechanics.map((mech) => (
                          <Badge key={mech.id} variant="outline" className="text-xs">
                            {mech.name}
                            {mech.source && <SourceBadge source={mech.source} />}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Themes */}
                  {game.themes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Themes</h4>
                      <div className="flex flex-wrap gap-1">
                        {game.themes.map((theme) => (
                          <Badge key={theme.id} variant="outline" className="text-xs">
                            {theme.name}
                            {theme.source && <SourceBadge source={theme.source} />}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Images */}
            <AccordionItem value="images">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {game.thumbnail_url && (
                    <div className="space-y-1">
                      <Image
                        src={game.thumbnail_url}
                        alt="Thumbnail"
                        width={100}
                        height={100}
                        className="rounded object-cover w-full aspect-square"
                      />
                      <p className="text-xs text-muted-foreground text-center">Thumbnail</p>
                    </div>
                  )}
                  {game.box_image_url && (
                    <div className="space-y-1">
                      <Image
                        src={game.box_image_url}
                        alt="Box"
                        width={100}
                        height={100}
                        className="rounded object-cover w-full aspect-square"
                      />
                      <p className="text-xs text-muted-foreground text-center">Box Art</p>
                    </div>
                  )}
                  {game.wikidata_image_url && (
                    <div className="space-y-1">
                      <Image
                        src={game.wikidata_image_url}
                        alt="Wikidata"
                        width={100}
                        height={100}
                        className="rounded object-cover w-full aspect-square"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Wikidata <Badge className="text-[8px] py-0">CC</Badge>
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* External References */}
            <AccordionItem value="external">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  External References
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {game.bgg_id && (
                    <a
                      href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50"
                    >
                      <span className="w-5 h-5 rounded bg-orange-500 text-white text-xs flex items-center justify-center font-bold">B</span>
                      <span className="text-sm">BoardGameGeek</span>
                      <span className="text-xs text-muted-foreground">ID: {game.bgg_id}</span>
                    </a>
                  )}
                  {game.wikipedia_url && (
                    <a
                      href={game.wikipedia_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50"
                    >
                      <Globe className="h-5 w-5 text-violet-500" />
                      <span className="text-sm">Wikipedia</span>
                    </a>
                  )}
                  {game.wikidata_id && (
                    <a
                      href={`https://www.wikidata.org/wiki/${game.wikidata_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50"
                    >
                      <Database className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">Wikidata</span>
                      <span className="text-xs text-muted-foreground">{game.wikidata_id}</span>
                    </a>
                  )}
                  {game.rulebook_url && (
                    <a
                      href={game.rulebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50"
                    >
                      <FileText className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Rulebook</span>
                      {game.rulebook_source && <SourceBadge source={game.rulebook_source} />}
                    </a>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Debug Sources Link */}
          <div className="mt-4 pt-4 border-t">
            <Button variant="ghost" size="sm" onClick={onOpenSourcesDrawer} className="text-muted-foreground">
              <Database className="h-4 w-4 mr-2" />
              View Debug Sources
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
