'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ExternalLink,
  Database,
  Globe,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Award,
  Users,
  Star,
  Layers,
  Link2,
  Image as ImageIcon,
  FileText,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type {
  BggRawData,
  WikipediaSummary,
  WikipediaInfobox,
  WikipediaImage,
  WikipediaExternalLink,
  WikipediaAward,
} from '@/lib/vecna/types'
import { formatDate } from '@/lib/admin/utils'
import { SourceStatusCard } from '@/components/admin'

interface SourcesTabProps {
  game: Game
}

// Helper to get award badge color
function getAwardBadgeClass(result: string): string {
  switch (result) {
    case 'winner':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    case 'nominated':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'finalist':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'recommended':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

// Collapsible section component for clean UI
function SourceSection({
  title,
  description,
  icon: Icon,
  iconColor,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string
  description: string
  icon: typeof Database
  iconColor: string
  badge?: { label: string; variant?: 'default' | 'secondary' | 'outline' }
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className={`h-8 w-8 rounded-lg ${iconColor} flex items-center justify-center`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  {badge && (
                    <Badge variant={badge.variant || 'secondary'} className="text-xs">
                      {badge.label}
                    </Badge>
                  )}
                </div>
                <CardDescription>{description}</CardDescription>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// Data field display component
function DataField({
  label,
  value,
  icon: Icon,
  href,
  className = '',
}: {
  label: string
  value: React.ReactNode
  icon?: typeof Info
  href?: string
  className?: string
}) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const content = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline inline-flex items-center gap-1"
    >
      {value}
      <ExternalLink className="h-3 w-3" />
    </a>
  ) : (
    <span className="text-foreground">{value}</span>
  )

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      <div className="font-medium text-sm">{content}</div>
    </div>
  )
}

// Text content block
function ContentBlock({
  title,
  content,
  maxHeight = '150px',
}: {
  title: string
  content: string | null
  maxHeight?: string
}) {
  if (!content) return null

  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div
        className="text-sm bg-muted/50 rounded-lg p-3 overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
        style={{ maxHeight }}
      >
        {content}
      </div>
    </div>
  )
}

export function SourcesTab({ game }: SourcesTabProps) {
  // Parse JSON fields with type safety
  const bggData = game.bgg_raw_data as BggRawData | null
  const wikipediaSummary = game.wikipedia_summary as WikipediaSummary | null
  const wikipediaInfobox = game.wikipedia_infobox as WikipediaInfobox | null
  const wikipediaImages = game.wikipedia_images as WikipediaImage[] | null
  const wikipediaLinks = game.wikipedia_external_links as WikipediaExternalLink[] | null
  const wikipediaAwards = game.wikipedia_awards as WikipediaAward[] | null

  // Check data availability
  const hasBgg = !!game.bgg_id || !!bggData
  const hasWikidata = !!game.wikidata_id
  const hasWikipedia = !!game.wikipedia_url
  const hasWikipediaData = !!wikipediaSummary || !!wikipediaInfobox || !!game.wikipedia_gameplay || !!game.wikipedia_origins

  return (
    <div className="space-y-4">
      {/* Quick Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <Layers className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Data Sources Overview</CardTitle>
              <CardDescription>External data imported for this game</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* BGG Status */}
            <SourceStatusCard
              title="BoardGameGeek"
              isLinked={hasBgg}
              linkUrl={hasBgg ? `https://boardgamegeek.com/boardgame/${game.bgg_id || bggData?.id}` : undefined}
              linkTitle="View on BGG"
            >
              <p className="text-xs text-muted-foreground">
                ID: {game.bgg_id || bggData?.id}
              </p>
              <p className="text-xs text-muted-foreground">
                Synced: {formatDate(game.bgg_last_synced)}
              </p>
            </SourceStatusCard>

            {/* Wikidata Status */}
            <SourceStatusCard
              title="Wikidata"
              isLinked={hasWikidata}
              linkUrl={hasWikidata ? `https://www.wikidata.org/wiki/${game.wikidata_id}` : undefined}
              linkTitle="View on Wikidata"
            >
              <p className="text-xs text-muted-foreground">
                ID: {game.wikidata_id}
              </p>
              <p className="text-xs text-muted-foreground">
                Synced: {formatDate(game.wikidata_last_synced)}
              </p>
            </SourceStatusCard>

            {/* Wikipedia Status */}
            <SourceStatusCard
              title="Wikipedia"
              isLinked={hasWikipedia}
              linkUrl={hasWikipedia && game.wikipedia_url ? game.wikipedia_url : undefined}
              linkTitle="View on Wikipedia"
            >
              <p className="text-xs text-muted-foreground truncate" title={game.wikipedia_url || ''}>
                {game.wikipedia_url?.replace('https://en.wikipedia.org/wiki/', '')}
              </p>
              <p className="text-xs text-muted-foreground">
                Fetched: {game.wikipedia_fetched_at ? formatDate(game.wikipedia_fetched_at) : hasWikipediaData ? 'Data present' : 'Never'}
              </p>
            </SourceStatusCard>
          </div>
        </CardContent>
      </Card>

      {/* BGG Data Section */}
      <SourceSection
        title="BoardGameGeek"
        description="Data from BGG API"
        icon={Database}
        iconColor="bg-orange-500/10 text-orange-500"
        badge={hasBgg ? { label: 'Connected' } : undefined}
        defaultOpen={hasBgg}
      >
        {hasBgg ? (
          <div className="space-y-6">
            {/* Core Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DataField
                label="BGG ID"
                value={game.bgg_id || bggData?.id}
                href={game.bgg_id ? `https://boardgamegeek.com/boardgame/${game.bgg_id}` : undefined}
              />
              <DataField label="Type" value={bggData?.type || 'boardgame'} />
              <DataField
                label="BGG Weight"
                value={bggData?.weight ? `${Number(bggData.weight).toFixed(2)} / 5` : null}
                icon={Star}
              />
              <DataField
                label="BGG Rating"
                value={bggData?.rating ? `${Number(bggData.rating).toFixed(1)} (${bggData.numRatings?.toLocaleString()} votes)` : null}
                icon={Star}
              />
            </div>

            {/* People */}
            {(bggData?.designers?.length || bggData?.artists?.length || bggData?.publishers?.length) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">People & Publishers</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {bggData?.designers?.length && (
                    <DataField
                      label="Designers"
                      value={bggData.designers.join(', ')}
                      icon={Users}
                    />
                  )}
                  {bggData?.artists?.length && (
                    <DataField
                      label="Artists"
                      value={bggData.artists.join(', ')}
                      icon={Users}
                    />
                  )}
                  {bggData?.publishers?.length && (
                    <DataField
                      label="Publishers"
                      value={bggData.publishers.slice(0, 5).join(', ') + (bggData.publishers.length > 5 ? ` +${bggData.publishers.length - 5} more` : '')}
                      icon={Users}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Taxonomy */}
            {(bggData?.categories?.length || bggData?.mechanics?.length) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">BGG Categories & Mechanics</h4>
                <div className="space-y-3">
                  {bggData?.categories?.length && (
                    <div>
                      <span className="text-xs text-muted-foreground uppercase">Categories</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {bggData.categories.map((cat, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {bggData?.mechanics?.length && (
                    <div>
                      <span className="text-xs text-muted-foreground uppercase">Mechanics</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {bggData.mechanics.map((mech, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {mech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Relations */}
            {(bggData?.expandsGame || bggData?.expansions?.length || bggData?.families?.length) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">Relations</h4>
                <div className="space-y-2">
                  {bggData?.expandsGame && (
                    <DataField
                      label="Expands"
                      value={bggData.expandsGame.name}
                      href={`https://boardgamegeek.com/boardgame/${bggData.expandsGame.id}`}
                      icon={Link2}
                    />
                  )}
                  {bggData?.expansions?.length && (
                    <div>
                      <span className="text-xs text-muted-foreground uppercase">Expansions ({bggData.expansions.length})</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {bggData.expansions.slice(0, 10).map((exp) => (
                          <Badge key={exp.id} variant="secondary" className="text-xs">
                            {exp.name}
                          </Badge>
                        ))}
                        {bggData.expansions.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{bggData.expansions.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {bggData?.description && (
              <ContentBlock title="BGG Description" content={bggData.description} maxHeight="200px" />
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No BGG data available</p>
            <p className="text-xs mt-1">Add a BGG ID in the Details tab to import data</p>
          </div>
        )}
      </SourceSection>

      {/* Wikidata Section */}
      <SourceSection
        title="Wikidata"
        description="Structured data from Wikimedia"
        icon={Database}
        iconColor="bg-blue-500/10 text-blue-500"
        badge={hasWikidata ? { label: 'Linked' } : undefined}
        defaultOpen={hasWikidata}
      >
        {hasWikidata ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DataField
                label="Wikidata ID"
                value={game.wikidata_id}
                href={`https://www.wikidata.org/wiki/${game.wikidata_id}`}
              />
              {game.wikidata_series_id && (
                <DataField
                  label="Series ID"
                  value={game.wikidata_series_id}
                  href={`https://www.wikidata.org/wiki/${game.wikidata_series_id}`}
                />
              )}
              {game.official_website && (
                <DataField
                  label="Official Website"
                  value={new URL(game.official_website).hostname}
                  href={game.official_website}
                  icon={Globe}
                />
              )}
            </div>

            {game.wikidata_image_url && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  CC-Licensed Image
                </span>
                <div className="relative w-full max-w-xs">
                  <img
                    src={game.wikidata_image_url}
                    alt={game.name}
                    className="rounded-lg border shadow-sm"
                  />
                  <Badge className="absolute bottom-2 right-2 bg-green-600 text-xs">
                    CC Licensed
                  </Badge>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Last synced: {formatDate(game.wikidata_last_synced)}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No Wikidata link available</p>
            <p className="text-xs mt-1">Wikidata provides CC0-licensed structured data</p>
          </div>
        )}
      </SourceSection>

      {/* Wikipedia Section */}
      <SourceSection
        title="Wikipedia"
        description="Encyclopedia article content"
        icon={Globe}
        iconColor="bg-slate-500/10 text-slate-500"
        badge={
          hasWikipedia
            ? {
                label: game.wikipedia_search_confidence || 'linked',
                variant: game.wikipedia_search_confidence === 'high' ? 'default' : 'secondary',
              }
            : undefined
        }
        defaultOpen={hasWikipedia}
      >
        {hasWikipedia ? (
          <div className="space-y-6">
            {/* Link and confidence */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <a href={game.wikipedia_url || '#'} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  View Wikipedia Article
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
              {game.wikipedia_search_confidence && (
                <Badge variant="outline">
                  Match Confidence: {game.wikipedia_search_confidence}
                </Badge>
              )}
            </div>

            {/* Infobox Data */}
            {wikipediaInfobox && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">Infobox Data</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {wikipediaInfobox.designer?.length && (
                    <DataField label="Designer(s)" value={wikipediaInfobox.designer.join(', ')} />
                  )}
                  {wikipediaInfobox.publisher?.length && (
                    <DataField label="Publisher(s)" value={wikipediaInfobox.publisher.join(', ')} />
                  )}
                  {wikipediaInfobox.players && (
                    <DataField label="Players" value={wikipediaInfobox.players} />
                  )}
                  {wikipediaInfobox.playingTime && (
                    <DataField label="Playing Time" value={wikipediaInfobox.playingTime} />
                  )}
                  {wikipediaInfobox.setupTime && (
                    <DataField label="Setup Time" value={wikipediaInfobox.setupTime} />
                  )}
                  {wikipediaInfobox.ages && (
                    <DataField label="Ages" value={wikipediaInfobox.ages} />
                  )}
                  {wikipediaInfobox.releaseDate && (
                    <DataField label="Release Date" value={wikipediaInfobox.releaseDate} />
                  )}
                  {wikipediaInfobox.genre && (
                    <DataField label="Genre" value={wikipediaInfobox.genre} />
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {(wikipediaSummary?.summary || game.description) && (
              <ContentBlock
                title="Summary"
                content={wikipediaSummary?.summary || null}
                maxHeight="150px"
              />
            )}

            {/* Gameplay */}
            {game.wikipedia_gameplay && (
              <ContentBlock
                title="Gameplay"
                content={game.wikipedia_gameplay as string}
                maxHeight="200px"
              />
            )}

            {/* Origins/History */}
            {game.wikipedia_origins && (
              <ContentBlock
                title="Origins & History"
                content={game.wikipedia_origins as string}
                maxHeight="200px"
              />
            )}

            {/* Reception */}
            {game.wikipedia_reception && (
              <ContentBlock
                title="Reception"
                content={game.wikipedia_reception as string}
                maxHeight="200px"
              />
            )}

            {/* Awards */}
            {wikipediaAwards && wikipediaAwards.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Awards ({wikipediaAwards.length})
                </h4>
                <div className="grid gap-2">
                  {wikipediaAwards.map((award, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <Award className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="flex-1 text-sm">{award.name}</span>
                      {award.year && (
                        <span className="text-xs text-muted-foreground">{award.year}</span>
                      )}
                      <Badge className={`text-xs ${getAwardBadgeClass(award.result)}`}>
                        {award.result}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            {wikipediaLinks && wikipediaLinks.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-2 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  External Links ({wikipediaLinks.length})
                </h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {wikipediaLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                    >
                      <Badge variant="outline" className="text-xs shrink-0">
                        {link.type}
                      </Badge>
                      <span className="truncate flex-1">{link.domain || new URL(link.url).hostname}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            {wikipediaImages && wikipediaImages.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Article Images ({wikipediaImages.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {wikipediaImages.slice(0, 8).map((img, i) => (
                    <div key={i} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={img.thumbUrl || img.url}
                          alt={img.caption || img.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {img.license && (
                        <Badge
                          variant="secondary"
                          className="absolute bottom-1 right-1 text-[10px] opacity-80 group-hover:opacity-100"
                        >
                          {img.license}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Fetched: {formatDate(game.wikipedia_fetched_at)}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No Wikipedia article linked</p>
            <p className="text-xs mt-1">Wikipedia provides gameplay, history, and award information</p>
          </div>
        )}
      </SourceSection>
    </div>
  )
}
