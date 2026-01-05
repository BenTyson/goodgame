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
  Clock,
  Users,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Tags,
  Palette,
  Cog,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { VecnaFamily, VecnaGame, VecnaState } from '@/lib/vecna'
import { VECNA_STATE_CONFIG } from '@/lib/vecna'
import { RulebookDiscovery } from './RulebookDiscovery'
import { StateActions } from './StateActions'
import { FamilyBatchActions } from './FamilyBatchActions'

interface VecnaGameViewProps {
  game: VecnaGame
  family: VecnaFamily | null
  isStandalone: boolean
}

// Data source badge component
function SourceBadge({ source }: { source: string | null | undefined }) {
  const config: Record<string, { label: string; color: string }> = {
    bgg: { label: 'BGG', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    wikidata: { label: 'WD', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    wikipedia: { label: 'WP', color: 'bg-violet-100 text-violet-700 border-violet-200' },
    manual: { label: 'Manual', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    ai: { label: 'AI', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  }

  const c = config[source || ''] || { label: '?', color: 'bg-gray-100 text-gray-500 border-gray-200' }
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', c.color)}>
      {c.label}
    </span>
  )
}

// State progress display
function StateProgress({ state }: { state: VecnaState }) {
  const states: VecnaState[] = [
    'imported',
    'enriched',
    'rulebook_ready',
    'parsed',
    'taxonomy_assigned',
    'generated',
    'review_pending',
    'published',
  ]

  const currentIndex = states.indexOf(state)
  const config = VECNA_STATE_CONFIG[state]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={cn('font-medium', config.color)}>{config.label}</span>
        <span className="text-sm text-muted-foreground">{config.description}</span>
      </div>
      <div className="flex gap-1">
        {states.map((s, i) => {
          const isComplete = i < currentIndex || state === 'published'
          const isCurrent = s === state
          const isPending = i > currentIndex && state !== 'published'

          return (
            <div
              key={s}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                isComplete && 'bg-green-500',
                isCurrent && 'bg-primary animate-pulse',
                isPending && 'bg-muted'
              )}
              title={VECNA_STATE_CONFIG[s].label}
            />
          )
        })}
      </div>
    </div>
  )
}

// Expandable text component for long content
function ExpandableText({ text, className }: { text: string; className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = text.length > 300

  return (
    <div className={className}>
      <p className={cn('text-sm text-muted-foreground whitespace-pre-wrap', !isExpanded && isLong && 'line-clamp-4')}>
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-primary hover:underline mt-1"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

// Collapsible section component
function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = true,
  badge,
  children,
}: {
  title: string
  icon: React.ElementType
  defaultOpen?: boolean
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium flex-1 text-left">{title}</span>
        {badge}
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="p-4 bg-background">{children}</div>}
    </div>
  )
}

export function VecnaGameView({ game, family, isStandalone }: VecnaGameViewProps) {
  const router = useRouter()
  const [currentState, setCurrentState] = useState<VecnaState>(game.vecna_state)
  const [hasRulebook, setHasRulebook] = useState(game.has_rulebook)
  const stateConfig = VECNA_STATE_CONFIG[currentState]

  const handleStateChange = (newState: VecnaState) => {
    setCurrentState(newState)
    router.refresh()
  }

  const handleRulebookSet = (url: string) => {
    setHasRulebook(true)
    setCurrentState('rulebook_ready')
    router.refresh()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-6">
        {/* Thumbnail */}
        <div className="relative h-32 w-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {game.thumbnail_url ? (
            <Image
              src={game.thumbnail_url}
              alt={game.name}
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold">{game.name}</h1>
              {game.year_published && (
                <p className="text-muted-foreground">{game.year_published}</p>
              )}
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

          {/* Relation info */}
          {game.relation_type && family && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <span className="capitalize">{game.relation_type.replace(/_/g, ' ')}</span>
              {game.relation_to_base && (
                <>
                  <span>of</span>
                  <span className="font-medium text-foreground">{game.relation_to_base}</span>
                </>
              )}
            </div>
          )}

          {/* State Progress */}
          <StateProgress state={currentState} />
        </div>
      </div>

      {/* Error display */}
      {game.vecna_error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-red-800">Processing Error</div>
              <div className="text-sm text-red-700">{game.vecna_error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="unified" className="w-full">
        <TabsList>
          <TabsTrigger value="unified">Status</TabsTrigger>
          <TabsTrigger value="rulebook">Rulebook</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="taxonomy">Taxonomy</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
        </TabsList>

        {/* Rulebook Tab - Always accessible for managing rulebooks */}
        <TabsContent value="rulebook" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rulebook Management
                </CardTitle>
                <CardDescription>
                  Set or update the rulebook URL for this game. Each game in a family can have its own rulebook.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Current Rulebook Status */}
                {game.rulebook_url ? (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Rulebook Set</span>
                      {game.rulebook_source && <SourceBadge source={game.rulebook_source} />}
                    </div>
                    <a
                      href={game.rulebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 hover:underline break-all"
                    >
                      {game.rulebook_url}
                    </a>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-800">No rulebook URL set for this game</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rulebook Discovery Component */}
            <RulebookDiscovery
              gameId={game.id}
              gameName={game.name}
              currentRulebookUrl={game.rulebook_url}
              onRulebookSet={handleRulebookSet}
            />
          </div>
        </TabsContent>

        {/* Unified View Tab */}
        <TabsContent value="unified" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Main content - left 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              {/* Data Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={game.has_wikipedia ? 'default' : 'outline'}
                  className={cn(!game.has_wikipedia && 'text-muted-foreground')}
                >
                  Wikipedia {game.has_wikipedia ? 'Yes' : 'No'}
                </Badge>
                <Badge
                  variant={game.has_wikidata ? 'default' : 'outline'}
                  className={cn(!game.has_wikidata && 'text-muted-foreground')}
                >
                  Wikidata {game.has_wikidata ? 'Yes' : 'No'}
                </Badge>
                <Badge
                  variant={hasRulebook ? 'default' : 'outline'}
                  className={cn(!hasRulebook && 'text-muted-foreground')}
                >
                  Rulebook {hasRulebook ? 'Yes' : 'No'}
                </Badge>
                <Badge
                  variant={game.has_content ? 'default' : 'outline'}
                  className={cn(!game.has_content && 'text-muted-foreground')}
                >
                  Content {game.has_content ? 'Yes' : 'No'}
                </Badge>
                {game.crunch_score && (
                  <Badge variant="secondary">
                    Crunch: {game.crunch_score.toFixed(1)}
                  </Badge>
                )}
              </div>

              {/* External Links */}
              <CollapsibleSection title="External References" icon={ExternalLink}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* BGG Link */}
                  {game.bgg_id && (
                    <a
                      href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <span className="w-5 h-5 rounded bg-orange-500 text-white text-xs flex items-center justify-center font-bold">B</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">BoardGameGeek</div>
                        <div className="text-xs text-muted-foreground">ID: {game.bgg_id}</div>
                      </div>
                      <SourceBadge source="bgg" />
                    </a>
                  )}
                  {game.wikipedia_url && (
                    <a
                      href={game.wikipedia_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Globe className="h-5 w-5 text-violet-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium flex items-center gap-1">
                          Wikipedia
                          {game.wikipedia_search_confidence && (
                            <span className={cn(
                              'text-[10px] px-1 rounded',
                              game.wikipedia_search_confidence === 'high' && 'bg-green-100 text-green-700',
                              game.wikipedia_search_confidence === 'medium' && 'bg-yellow-100 text-yellow-700',
                              game.wikipedia_search_confidence === 'low' && 'bg-red-100 text-red-700'
                            )}>
                              {game.wikipedia_search_confidence}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {game.wikipedia_url}
                        </div>
                      </div>
                      <SourceBadge source="wikipedia" />
                    </a>
                  )}
                  {game.wikidata_id && (
                    <a
                      href={`https://www.wikidata.org/wiki/${game.wikidata_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Database className="h-5 w-5 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">Wikidata</div>
                        <div className="text-xs text-muted-foreground">{game.wikidata_id}</div>
                      </div>
                      <SourceBadge source="wikidata" />
                    </a>
                  )}
                  {/* Official Website from Wikidata */}
                  {game.official_website && (
                    <a
                      href={game.official_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Globe className="h-5 w-5 text-emerald-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">Official Website</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {game.official_website}
                        </div>
                      </div>
                      <SourceBadge source="wikidata" />
                    </a>
                  )}
                  {game.rulebook_url && (
                    <a
                      href={game.rulebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-green-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium flex items-center gap-1">
                          Rulebook
                          {game.rulebook_source && (
                            <SourceBadge source={game.rulebook_source} />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {game.rulebook_url}
                        </div>
                      </div>
                    </a>
                  )}
                  {!game.bgg_id && !game.wikipedia_url && !game.wikidata_id && !game.rulebook_url && !game.official_website && (
                    <div className="text-sm text-muted-foreground col-span-2">
                      No external references available
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {/* Family Context (if in family) */}
              {family && (
                <CollapsibleSection
                  title="Family Context"
                  icon={Users}
                  badge={
                    <Badge variant="outline" className="text-xs">
                      {family.total_games} games
                    </Badge>
                  }
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Family:</span>
                      <Link
                        href={`/admin/families/${family.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {family.name}
                      </Link>
                    </div>
                    {family.family_context && (
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        <div className="font-medium mb-2">Base Game Context</div>
                        <div className="space-y-1 text-muted-foreground">
                          <div>Base: {family.family_context.baseGameName}</div>
                          {family.family_context.coreMechanics.length > 0 && (
                            <div>Mechanics: {family.family_context.coreMechanics.join(', ')}</div>
                          )}
                          {family.family_context.coreTheme && (
                            <div>Theme: {family.family_context.coreTheme}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Rulebook Discovery - show when missing or in rulebook_missing state */}
              {(currentState === 'rulebook_missing' || currentState === 'enriched' || !hasRulebook) && (
                <RulebookDiscovery
                  gameId={game.id}
                  gameName={game.name}
                  currentRulebookUrl={game.rulebook_url}
                  onRulebookSet={handleRulebookSet}
                />
              )}

              {/* Processing Info */}
              <CollapsibleSection
                title="Processing Status"
                icon={Clock}
                defaultOpen={false}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current State:</span>
                    <span className={cn('font-medium', stateConfig.color)}>{stateConfig.label}</span>
                  </div>
                  {game.vecna_processed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Processed:</span>
                      <span>{new Date(game.vecna_processed_at).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published:</span>
                    <span>{game.is_published ? 'Yes' : 'No'}</span>
                  </div>

                  {/* Data Freshness */}
                  <div className="pt-2 border-t mt-2">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Data Freshness</div>
                    {game.bgg_last_synced && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">BGG synced:</span>
                        <span>{new Date(game.bgg_last_synced).toLocaleDateString()}</span>
                      </div>
                    )}
                    {game.wikidata_last_synced && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Wikidata synced:</span>
                        <span>{new Date(game.wikidata_last_synced).toLocaleDateString()}</span>
                      </div>
                    )}
                    {game.wikipedia_fetched_at && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Wikipedia fetched:</span>
                        <span>{new Date(game.wikipedia_fetched_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {game.content_generated_at && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Content generated:</span>
                        <span>{new Date(game.content_generated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleSection>
            </div>

            {/* Sidebar - right column */}
            <div className="space-y-4">
              <StateActions
                gameId={game.id}
                gameName={game.name}
                currentState={currentState}
                hasRulebook={hasRulebook}
                rulebookUrl={game.rulebook_url}
                hasContent={game.has_content}
                isPublished={game.is_published}
                onStateChange={handleStateChange}
              />

              {/* Family Batch Processing (only for family games) */}
              {family && (
                <FamilyBatchActions
                  family={family}
                  onProcessingComplete={() => router.refresh()}
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Content Tab - Review generated content */}
        <TabsContent value="content" className="mt-4 space-y-4">
          {!game.has_content ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No content generated yet. Process the game to generate content.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Rules Content */}
              {game.rules_content && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rules Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {game.rules_content.quickStart && game.rules_content.quickStart.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Quick Start</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {game.rules_content.quickStart.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {game.rules_content.coreRules && game.rules_content.coreRules.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Core Rules</h4>
                        <div className="space-y-2">
                          {game.rules_content.coreRules.map((rule, i) => (
                            <div key={i} className="text-sm">
                              <span className="font-medium">{rule.title}:</span>{' '}
                              <span className="text-muted-foreground">{rule.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {game.rules_content.turnStructure && game.rules_content.turnStructure.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Turn Structure</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          {game.rules_content.turnStructure.map((phase, i) => (
                            <li key={i}>
                              <span className="font-medium text-foreground">{phase.phase}:</span> {phase.description}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {game.rules_content.winCondition && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Win Condition</h4>
                        <p className="text-sm text-muted-foreground">{game.rules_content.winCondition}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Setup Content */}
              {game.setup_content && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Setup Guide</CardTitle>
                    {game.setup_content.estimatedTime && (
                      <CardDescription>Estimated time: {game.setup_content.estimatedTime}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {game.setup_content.components && game.setup_content.components.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Components</h4>
                        <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                          {game.setup_content.components.map((comp, i) => (
                            <li key={i}>
                              {comp.quantity && <span className="font-medium">{comp.quantity}x </span>}
                              {comp.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {game.setup_content.steps && game.setup_content.steps.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Setup Steps</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          {game.setup_content.steps.map((step, i) => (
                            <li key={i} className="text-muted-foreground">
                              {step.step}
                              {step.details && (
                                <p className="ml-5 text-xs text-muted-foreground/70 mt-0.5">{step.details}</p>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {game.setup_content.firstPlayerRule && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">First Player</h4>
                        <p className="text-sm text-muted-foreground">{game.setup_content.firstPlayerRule}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Reference Content */}
              {game.reference_content && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Reference</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {game.reference_content.turnSummary && game.reference_content.turnSummary.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Turn Summary</h4>
                        <div className="space-y-2">
                          {game.reference_content.turnSummary.map((phase, i) => (
                            <div key={i} className="text-sm">
                              <span className="font-medium">{phase.phase}</span>
                              <ul className="list-disc list-inside ml-3 text-muted-foreground">
                                {phase.actions.map((action, j) => (
                                  <li key={j}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {game.reference_content.keyActions && game.reference_content.keyActions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Key Actions</h4>
                        <div className="space-y-1">
                          {game.reference_content.keyActions.map((action, i) => (
                            <div key={i} className="text-sm">
                              <span className="font-medium">{action.name}</span>
                              {action.cost && <span className="text-muted-foreground"> ({action.cost})</span>}
                              <span className="text-muted-foreground">: {action.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {game.reference_content.endGame && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">End Game</h4>
                        {typeof game.reference_content.endGame === 'string' ? (
                          <p className="text-sm text-muted-foreground">{game.reference_content.endGame}</p>
                        ) : (
                          <div className="text-sm text-muted-foreground space-y-1">
                            {game.reference_content.endGame.winner && (
                              <p><span className="font-medium text-foreground">Winner:</span> {game.reference_content.endGame.winner}</p>
                            )}
                            {game.reference_content.endGame.triggers && game.reference_content.endGame.triggers.length > 0 && (
                              <div>
                                <span className="font-medium text-foreground">Triggers:</span>
                                <ul className="list-disc list-inside ml-2">
                                  {game.reference_content.endGame.triggers.map((t, i) => <li key={i}>{t}</li>)}
                                </ul>
                              </div>
                            )}
                            {game.reference_content.endGame.finalRound && (
                              <p><span className="font-medium text-foreground">Final Round:</span> {game.reference_content.endGame.finalRound}</p>
                            )}
                            {game.reference_content.endGame.tiebreakers && game.reference_content.endGame.tiebreakers.length > 0 && (
                              <div>
                                <span className="font-medium text-foreground">Tiebreakers:</span>
                                <ol className="list-decimal list-inside ml-2">
                                  {game.reference_content.endGame.tiebreakers.map((t, i) => <li key={i}>{t}</li>)}
                                </ol>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {game.reference_content.scoringSummary && game.reference_content.scoringSummary.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Scoring</h4>
                        <div className="space-y-1">
                          {game.reference_content.scoringSummary.map((score, i) => (
                            <div key={i} className="text-sm flex justify-between">
                              <span className="text-muted-foreground">{score.category}</span>
                              <span className="font-medium">{score.points}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Taxonomy Tab - Review categories, mechanics, themes */}
        <TabsContent value="taxonomy" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tags className="h-5 w-5 text-blue-500" />
                  Categories
                </CardTitle>
                <CardDescription>
                  {game.categories.length} assigned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {game.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {game.categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-1">
                        <Badge
                          variant={cat.is_primary ? 'default' : 'secondary'}
                          className="text-sm"
                        >
                          {cat.name}
                          {cat.is_primary && (
                            <Star className="h-3 w-3 ml-1 fill-current" />
                          )}
                        </Badge>
                        <SourceBadge source={cat.source} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No categories assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Mechanics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cog className="h-5 w-5 text-green-500" />
                  Mechanics
                </CardTitle>
                <CardDescription>
                  {game.mechanics.length} assigned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {game.mechanics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {game.mechanics.map((mech) => (
                      <div key={mech.id} className="flex items-center gap-1">
                        <Badge variant="outline" className="text-sm">
                          {mech.name}
                        </Badge>
                        <SourceBadge source={mech.source} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No mechanics assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Themes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-500" />
                  Themes
                </CardTitle>
                <CardDescription>
                  {game.themes.length} assigned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {game.themes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {game.themes.map((theme) => (
                      <div key={theme.id} className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-sm bg-purple-100 text-purple-700">
                          {theme.name}
                        </Badge>
                        <SourceBadge source={theme.source} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No themes assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Wikipedia-derived taxonomy */}
          {game.wikipedia_summary && (game.wikipedia_summary.themes?.length || game.wikipedia_summary.mechanics?.length) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Wikipedia-Derived Taxonomy</CardTitle>
                <CardDescription>
                  Potential categories/mechanics extracted from Wikipedia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {game.wikipedia_summary.themes && game.wikipedia_summary.themes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Suggested Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {game.wikipedia_summary.themes.map((theme, i) => (
                        <Badge key={i} variant="outline" className="text-sm border-dashed">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {game.wikipedia_summary.mechanics && game.wikipedia_summary.mechanics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Suggested Mechanics</h4>
                    <div className="flex flex-wrap gap-2">
                      {game.wikipedia_summary.mechanics.map((mech, i) => (
                        <Badge key={i} variant="outline" className="text-sm border-dashed">
                          {mech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {game.categories.length === 0 && game.mechanics.length === 0 && game.themes.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Tags className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No taxonomy assigned yet.</p>
                <p className="text-sm">Categories, mechanics, and themes will appear here once assigned.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Images Tab - Review game images */}
        <TabsContent value="images" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Thumbnail */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Thumbnail</CardTitle>
                <CardDescription>Small preview image</CardDescription>
              </CardHeader>
              <CardContent>
                {game.thumbnail_url ? (
                  <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={game.thumbnail_url}
                      alt={`${game.name} thumbnail`}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                ) : (
                  <div className="aspect-square w-full max-w-[200px] mx-auto rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                {game.thumbnail_url && (
                  <p className="text-xs text-muted-foreground mt-2 truncate text-center">
                    {game.thumbnail_url.split('/').pop()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Box Image */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Box Art</CardTitle>
                <CardDescription>Full resolution box image</CardDescription>
              </CardHeader>
              <CardContent>
                {game.box_image_url ? (
                  <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={game.box_image_url}
                      alt={`${game.name} box art`}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                ) : (
                  <div className="aspect-square w-full max-w-[200px] mx-auto rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                {game.box_image_url && (
                  <p className="text-xs text-muted-foreground mt-2 truncate text-center">
                    {game.box_image_url.split('/').pop()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Hero Image */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Hero Image</CardTitle>
                <CardDescription>Featured banner image</CardDescription>
              </CardHeader>
              <CardContent>
                {game.hero_image_url ? (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={game.hero_image_url}
                      alt={`${game.name} hero`}
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                {game.hero_image_url && (
                  <p className="text-xs text-muted-foreground mt-2 truncate text-center">
                    {game.hero_image_url.split('/').pop()}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Wikidata CC-Licensed Image */}
          {game.wikidata_image_url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  Wikidata Image
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    CC Licensed
                  </Badge>
                </CardTitle>
                <CardDescription>Creative Commons licensed - safe for public display</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-square w-full max-w-[250px] mx-auto rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={game.wikidata_image_url}
                    alt={`${game.name} Wikidata image`}
                    fill
                    className="object-contain"
                    sizes="250px"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center truncate">
                  {game.wikidata_image_url.split('/').pop()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Wikipedia Images with Licenses */}
          {game.wikipedia_images && game.wikipedia_images.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-violet-500" />
                  Wikipedia Images
                  <Badge variant="secondary" className="text-xs">
                    {game.wikipedia_images.length} images
                  </Badge>
                </CardTitle>
                <CardDescription>Images from Wikipedia article with license info</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {game.wikipedia_images.map((img, i) => (
                    <div key={i} className="space-y-2">
                      {img.url || img.thumbUrl ? (
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={img.thumbUrl || img.url || ''}
                            alt={img.caption || `Wikipedia image ${i + 1}`}
                            fill
                            className="object-contain"
                            sizes="200px"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground truncate" title={img.filename}>
                          {img.filename?.replace('File:', '')}
                        </p>
                        {img.license && (
                          <Badge variant="outline" className="text-[10px]">
                            {img.license}
                          </Badge>
                        )}
                        {img.isPrimary && (
                          <Badge className="text-[10px] bg-violet-100 text-violet-700">
                            Primary
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* BGG Images (from raw data) */}
          {game.bgg_raw_data && (game.bgg_raw_data.thumbnail || game.bgg_raw_data.image) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-orange-500 text-white text-xs flex items-center justify-center font-bold">BGG</span>
                  BoardGameGeek Images
                </CardTitle>
                <CardDescription>Original images from BGG (not CC licensed)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {game.bgg_raw_data.thumbnail && (
                    <div>
                      <p className="text-sm font-medium mb-2">BGG Thumbnail</p>
                      <div className="relative aspect-square w-full max-w-[150px] rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={String(game.bgg_raw_data.thumbnail)}
                          alt="BGG thumbnail"
                          fill
                          className="object-cover"
                          sizes="150px"
                        />
                      </div>
                    </div>
                  )}
                  {game.bgg_raw_data.image && (
                    <div>
                      <p className="text-sm font-medium mb-2">BGG Full Image</p>
                      <div className="relative aspect-square w-full max-w-[150px] rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={String(game.bgg_raw_data.image)}
                          alt="BGG full image"
                          fill
                          className="object-cover"
                          sizes="150px"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!game.thumbnail_url && !game.box_image_url && !game.hero_image_url &&
           !game.wikidata_image_url && !(game.wikipedia_images?.length) &&
           !(game.bgg_raw_data?.thumbnail || game.bgg_raw_data?.image) && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No images available for this game.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sources Tab - Compare data from different sources */}
        <TabsContent value="sources" className="mt-4 space-y-4">
          {/* BGG Data */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-orange-500 text-white text-xs flex items-center justify-center font-bold">BGG</span>
                BoardGameGeek
                {game.bgg_id && (
                  <a
                    href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline ml-auto"
                  >
                    View on BGG →
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {game.bgg_raw_data ? (
                <div className="space-y-4">
                  {/* Core Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Year:</span> {game.bgg_raw_data.yearpublished || 'N/A'}</div>
                    <div><span className="text-muted-foreground">Players:</span> {game.bgg_raw_data.minplayers || '?'}-{game.bgg_raw_data.maxplayers || '?'}</div>
                    <div><span className="text-muted-foreground">Playtime:</span> {game.bgg_raw_data.minplaytime || '?'}-{game.bgg_raw_data.maxplaytime || '?'} min</div>
                    <div><span className="text-muted-foreground">Min Age:</span> {game.bgg_raw_data.minAge || game.min_age || 'N/A'}+</div>
                    <div><span className="text-muted-foreground">Weight:</span> {game.bgg_raw_data.weight ? Number(game.bgg_raw_data.weight).toFixed(2) : 'N/A'}</div>
                    <div><span className="text-muted-foreground">Type:</span> {game.bgg_raw_data.type || 'boardgame'}</div>
                  </div>

                  {/* Admin-only BGG Metrics (not for public display) */}
                  {(game.bgg_raw_data.rating || game.bgg_raw_data.rank) && (
                    <div className="pt-3 border-t">
                      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <span>Internal BGG Metrics</span>
                        <Badge variant="outline" className="text-[9px] px-1">Admin Only</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {game.bgg_raw_data.rating && (
                          <div><span className="text-muted-foreground">Rating:</span> {Number(game.bgg_raw_data.rating).toFixed(2)}</div>
                        )}
                        {game.bgg_raw_data.numRatings && (
                          <div><span className="text-muted-foreground">Votes:</span> {game.bgg_raw_data.numRatings.toLocaleString()}</div>
                        )}
                        {game.bgg_raw_data.rank && (
                          <div><span className="text-muted-foreground">Rank:</span> #{game.bgg_raw_data.rank}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* People */}
                  {(game.bgg_raw_data.designers?.length || game.bgg_raw_data.artists?.length || game.bgg_raw_data.publishers?.length) && (
                    <div className="pt-3 border-t space-y-2">
                      {game.bgg_raw_data.designers && game.bgg_raw_data.designers.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Designers:</span> {game.bgg_raw_data.designers.join(', ')}
                        </div>
                      )}
                      {game.bgg_raw_data.artists && game.bgg_raw_data.artists.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Artists:</span> {game.bgg_raw_data.artists.join(', ')}
                        </div>
                      )}
                      {game.bgg_raw_data.publishers && game.bgg_raw_data.publishers.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Publishers:</span> {game.bgg_raw_data.publishers.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alt Names */}
                  {game.bgg_raw_data.alternateNames && game.bgg_raw_data.alternateNames.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Also Known As:</span>{' '}
                        {game.bgg_raw_data.alternateNames.slice(0, 5).join(', ')}
                        {game.bgg_raw_data.alternateNames.length > 5 && ` (+${game.bgg_raw_data.alternateNames.length - 5} more)`}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {game.bgg_raw_data.description && (
                    <div className="pt-3 border-t">
                      <span className="text-muted-foreground text-sm">Description:</span>
                      <ExpandableText
                        text={String(game.bgg_raw_data.description).replace(/<[^>]*>/g, '')}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No BGG data available</p>
              )}
            </CardContent>
          </Card>

          {/* Wikipedia Data */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-violet-500" />
                Wikipedia
                {game.wikipedia_url && (
                  <a
                    href={game.wikipedia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline ml-auto"
                  >
                    View Article →
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Summary */}
              {game.wikipedia_summary ? (
                <div className="space-y-3">
                  {game.wikipedia_summary.summary && (
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                        Summary
                        <SourceBadge source="ai" />
                      </h4>
                      <ExpandableText text={game.wikipedia_summary.summary} />
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-3">
                    {game.wikipedia_summary.themes && game.wikipedia_summary.themes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">AI-Extracted Themes</h4>
                        <div className="flex flex-wrap gap-1">
                          {game.wikipedia_summary.themes.map((theme, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{theme}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {game.wikipedia_summary.mechanics && game.wikipedia_summary.mechanics.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">AI-Extracted Mechanics</h4>
                        <div className="flex flex-wrap gap-1">
                          {game.wikipedia_summary.mechanics.map((mech, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{mech}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Wikipedia Infobox */}
              {game.wikipedia_infobox && Object.keys(game.wikipedia_infobox).length > 0 && (
                <div className="pt-3 border-t">
                  <h4 className="font-medium text-sm mb-2">Infobox Data</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {game.wikipedia_infobox.designer && game.wikipedia_infobox.designer.length > 0 && (
                      <div><span className="text-muted-foreground">Designer:</span> {game.wikipedia_infobox.designer.join(', ')}</div>
                    )}
                    {game.wikipedia_infobox.publisher && game.wikipedia_infobox.publisher.length > 0 && (
                      <div><span className="text-muted-foreground">Publisher:</span> {game.wikipedia_infobox.publisher.join(', ')}</div>
                    )}
                    {game.wikipedia_infobox.players && (
                      <div><span className="text-muted-foreground">Players:</span> {game.wikipedia_infobox.players}</div>
                    )}
                    {game.wikipedia_infobox.playingTime && (
                      <div><span className="text-muted-foreground">Playing Time:</span> {game.wikipedia_infobox.playingTime}</div>
                    )}
                    {game.wikipedia_infobox.setupTime && (
                      <div><span className="text-muted-foreground">Setup Time:</span> {game.wikipedia_infobox.setupTime}</div>
                    )}
                    {game.wikipedia_infobox.ages && (
                      <div><span className="text-muted-foreground">Ages:</span> {game.wikipedia_infobox.ages}</div>
                    )}
                    {game.wikipedia_infobox.releaseDate && (
                      <div><span className="text-muted-foreground">Release:</span> {game.wikipedia_infobox.releaseDate}</div>
                    )}
                    {game.wikipedia_infobox.genre && (
                      <div><span className="text-muted-foreground">Genre:</span> {game.wikipedia_infobox.genre}</div>
                    )}
                    {game.wikipedia_infobox.series && (
                      <div><span className="text-muted-foreground">Series:</span> {game.wikipedia_infobox.series}</div>
                    )}
                    {game.wikipedia_infobox.website && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Website:</span>{' '}
                        <a href={game.wikipedia_infobox.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {game.wikipedia_infobox.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Structured Awards */}
              {game.wikipedia_awards && game.wikipedia_awards.length > 0 && (
                <div className="pt-3 border-t">
                  <h4 className="font-medium text-sm mb-2">Awards ({game.wikipedia_awards.length})</h4>
                  <div className="space-y-1">
                    {game.wikipedia_awards.map((award, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            award.result === 'winner' && 'bg-yellow-50 border-yellow-300 text-yellow-700',
                            award.result === 'nominated' && 'bg-blue-50 border-blue-300 text-blue-700',
                            award.result === 'finalist' && 'bg-purple-50 border-purple-300 text-purple-700'
                          )}
                        >
                          {award.result === 'winner' ? '🏆' : award.result === 'nominated' ? '📋' : '🎖️'} {award.result}
                        </Badge>
                        <span>{award.name}</span>
                        {award.year && <span className="text-muted-foreground">({award.year})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wikipedia Sections */}
              <div className="pt-3 border-t space-y-3">
                {game.wikipedia_gameplay && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Gameplay</h4>
                    <ExpandableText text={game.wikipedia_gameplay} />
                  </div>
                )}

                {game.wikipedia_origins && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Origins / History</h4>
                    <ExpandableText text={game.wikipedia_origins} />
                  </div>
                )}

                {game.wikipedia_reception && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Reception</h4>
                    <ExpandableText text={game.wikipedia_reception} />
                  </div>
                )}
              </div>

              {/* External Links from Wikipedia */}
              {game.wikipedia_external_links && game.wikipedia_external_links.length > 0 && (
                <div className="pt-3 border-t">
                  <h4 className="font-medium text-sm mb-2">External Links from Wikipedia</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {game.wikipedia_external_links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50 transition-colors text-sm"
                      >
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            link.type === 'official' && 'bg-green-50 text-green-700',
                            link.type === 'rulebook' && 'bg-blue-50 text-blue-700',
                            link.type === 'publisher' && 'bg-purple-50 text-purple-700',
                            link.type === 'store' && 'bg-orange-50 text-orange-700'
                          )}
                        >
                          {link.type}
                        </Badge>
                        <span className="truncate flex-1">{link.domain || new URL(link.url).hostname}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!game.wikipedia_summary && !game.wikipedia_gameplay && !game.wikipedia_origins && !game.wikipedia_infobox && (
                <p className="text-sm text-muted-foreground">No Wikipedia data available</p>
              )}
            </CardContent>
          </Card>

          {/* Wikidata */}
          {(game.wikidata_id || game.official_website || game.wikidata_series_id) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  Wikidata
                  {game.wikidata_id && (
                    <a
                      href={`https://www.wikidata.org/wiki/${game.wikidata_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline ml-auto"
                    >
                      {game.wikidata_id} →
                    </a>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {game.official_website && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Official Website:</span>{' '}
                      <a href={game.official_website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {game.official_website}
                      </a>
                    </div>
                  )}
                  {game.wikidata_series_id && (
                    <div>
                      <span className="text-muted-foreground">Series ID:</span>{' '}
                      <a
                        href={`https://www.wikidata.org/wiki/${game.wikidata_series_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {game.wikidata_series_id}
                      </a>
                    </div>
                  )}
                  {game.wikidata_image_url && (
                    <div>
                      <span className="text-muted-foreground">CC Image:</span>{' '}
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Available</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Values (merged) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Values (Merged)</CardTitle>
              <CardDescription>Final values used on the game page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-muted-foreground">Year:</span> {game.year_published || 'N/A'}</div>
                <div>
                  <span className="text-muted-foreground">Players:</span>{' '}
                  {game.player_count_min || game.bgg_raw_data?.minplayers || '?'}-{game.player_count_max || game.bgg_raw_data?.maxplayers || '?'}
                </div>
                <div>
                  <span className="text-muted-foreground">Playtime:</span>{' '}
                  {game.play_time_min || game.bgg_raw_data?.minplaytime || '?'}-{game.play_time_max || game.bgg_raw_data?.maxplaytime || '?'} min
                </div>
                <div><span className="text-muted-foreground">Min Age:</span> {game.min_age || game.bgg_raw_data?.minAge || 'N/A'}+</div>
                <div><span className="text-muted-foreground">Weight:</span> {game.weight?.toFixed(2) || game.bgg_raw_data?.weight?.toFixed(2) || 'N/A'}</div>
                <div><span className="text-muted-foreground">Crunch:</span> {game.crunch_score?.toFixed(1) || 'N/A'}</div>
                {game.description && (
                  <div className="col-span-full mt-2">
                    <span className="text-muted-foreground">Description:</span>
                    <ExpandableText text={game.description} className="mt-1" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
