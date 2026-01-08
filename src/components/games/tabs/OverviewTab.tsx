'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, BookOpen, ChevronDown, ChevronUp, ImageIcon, Brain } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { TaxonomySection } from '@/components/games/TaxonomySection'
import { CreditsSection } from '@/components/games/CreditsSection'
import { ComponentsList } from '@/components/games/ComponentsList'
import { WikipediaGameplay, WikipediaReception } from '@/components/games/WikipediaContent'
import { GameRelationsSection } from '@/components/games/GameRelationsSection'
import { AwardBadgeList } from '@/components/games/AwardBadge'
import { ImageGallery } from '@/components/games/ImageGallery'
import { ReviewSection } from '@/components/reviews'
import { cn } from '@/lib/utils'
import type {
  ComponentList as ComponentListType,
  GameImage,
  Json,
  Category,
  Mechanic,
  Theme,
  PlayerExperience,
  Designer,
  Artist,
  Publisher,
  CrunchBreakdown,
} from '@/types/database'
import type { GameAwardWithDetails } from '@/lib/supabase/award-queries'
import type { ReviewWithUser } from '@/lib/supabase/review-queries'
import type { GroupedGameRelations } from '@/lib/supabase/family-queries'

// Sidebar taxonomy component
function SidebarTaxonomy({
  categories,
  mechanics,
  themes,
  experiences,
}: {
  categories?: { slug: string; name: string }[]
  mechanics?: { slug: string; name: string }[]
  themes?: { slug: string; name: string }[]
  experiences?: { slug: string; name: string }[]
}) {
  const sections = [
    { label: 'Categories', items: categories, prefix: '/games?categories=' },
    { label: 'Mechanics', items: mechanics, prefix: '/games?mechanics=' },
    { label: 'Themes', items: themes, prefix: '/games?themes=' },
    { label: 'Experience', items: experiences, prefix: '/games?experiences=' },
  ].filter(s => s.items && s.items.length > 0)

  if (sections.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-6 space-y-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Classification</h3>
      {sections.map((section) => (
        <div key={section.label} className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{section.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {section.items!.slice(0, 5).map((item) => (
              <Link
                key={item.slug}
                href={`${section.prefix}${item.slug}`}
                className="text-xs px-2 py-1 rounded-md bg-muted/50 hover:bg-muted text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
            {section.items!.length > 5 && (
              <span className="text-xs px-2 py-1 text-muted-foreground">
                +{section.items!.length - 5}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Gameplay teaser component with CTA to How to Play tab
function GameplayTeaser({
  content,
  onNavigate
}: {
  content: string
  onNavigate: () => void
}) {
  // Clean and truncate content
  const cleaned = content.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim()
  const truncated = cleaned.length > 200
    ? cleaned.slice(0, cleaned.lastIndexOf(' ', 200)) + '...'
    : cleaned

  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 p-6 space-y-4">
      <p className="text-muted-foreground leading-relaxed">
        {truncated}
      </p>
      <button
        onClick={onNavigate}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline cursor-pointer"
      >
        Learn how to play →
      </button>
    </div>
  )
}

// YouTube embed component
function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xl">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  )
}

// Get complexity tier from crunch score
function getComplexityTier(score: number): { label: string; color: string } {
  if (score <= 2) return { label: 'Gateway', color: 'text-emerald-500' }
  if (score <= 4) return { label: 'Light', color: 'text-green-500' }
  if (score <= 5.5) return { label: 'Medium-Light', color: 'text-lime-500' }
  if (score <= 6.5) return { label: 'Medium', color: 'text-yellow-500' }
  if (score <= 7.5) return { label: 'Medium-Heavy', color: 'text-orange-500' }
  if (score <= 8.5) return { label: 'Heavy', color: 'text-red-500' }
  return { label: 'Expert', color: 'text-rose-500' }
}

// Crunch Score breakdown card component
function CrunchScoreCard({ score, breakdown }: { score: number; breakdown: CrunchBreakdown }) {
  const tier = getComplexityTier(score)

  const metrics = [
    { label: 'Rules Density', value: breakdown.rulesDensity, description: 'Rulebook complexity' },
    { label: 'Decision Space', value: breakdown.decisionSpace, description: 'Choices per turn' },
    { label: 'Learning Curve', value: breakdown.learningCurve, description: 'Time to learn' },
    { label: 'Strategic Depth', value: breakdown.strategicDepth, description: 'Mastery ceiling' },
    { label: 'Components', value: breakdown.componentComplexity, description: 'Physical complexity' },
  ]

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Crunch Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{score.toFixed(1)}</span>
            <span className="text-muted-foreground">/ 10</span>
            <span className={cn('text-sm font-semibold', tier.color)}>{tier.label}</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{metric.label}</span>
              <span className="font-medium">{metric.value}</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-500"
                style={{ width: `${(metric.value / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Reasoning */}
      {breakdown.reasoning && (
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {breakdown.reasoning}
          </p>
        </div>
      )}
    </div>
  )
}

interface BaseGame {
  id: string
  name: string
  slug: string
  box_image_url?: string | null
}

interface Expansion {
  id: string
  name: string
  slug: string
  box_image_url?: string | null
  year_published?: number | null
}

interface Family {
  id: string
  name: string
  slug: string
}

export interface OverviewTabProps {
  game: {
    id: string
    name: string
    slug: string
    description?: string | null
    wikipedia_gameplay?: string | null
    wikipedia_reception?: string | null
    wikipedia_url?: string | null
    component_list?: Json | null
    bgg_id?: number | null
    official_website?: string | null
    rulebook_url?: string | null
    categories?: Category[] | null
    mechanics?: Mechanic[] | null
    themes?: Theme[] | null
    player_experiences?: PlayerExperience[] | null
    designers_list?: Designer[] | null
    artists_list?: Artist[] | null
    publishers_list?: Publisher[] | null
    images?: GameImage[] | null
    year_published?: number | null
    crunch_score?: number | null
    crunch_breakdown?: Json | null
  }
  gameAwards: GameAwardWithDetails[]
  gameRelations: GroupedGameRelations
  initialReviews: ReviewWithUser[]
  initialHasMore: boolean
}

export function OverviewTab({
  game,
  gameAwards,
  gameRelations,
  initialReviews,
  initialHasMore,
}: OverviewTabProps) {
  const [showGallery, setShowGallery] = useState(false)

  const hasWikipediaContent = game.wikipedia_gameplay || game.wikipedia_reception
  const hasComponentList = game.component_list && Object.keys(game.component_list as object).length > 0
  const hasRelations = gameRelations.baseGame || gameRelations.expansions.length > 0 || gameRelations.otherRelations.length > 0
  const hasTaxonomy = (game.mechanics && game.mechanics.length > 0) ||
                      (game.themes && game.themes.length > 0) ||
                      (game.player_experiences && game.player_experiences.length > 0)
  const hasImages = game.images && game.images.length > 0
  const hasCrunchBreakdown = game.crunch_score && game.crunch_breakdown

  const hasCredits = game.designers_list?.length || game.artists_list?.length || game.publishers_list?.length
  const hasSidebar = hasCrunchBreakdown || hasTaxonomy || hasCredits

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
      {/* Main Content Column */}
      <div className={cn('space-y-12', hasSidebar ? 'lg:col-span-2' : 'lg:col-span-3')}>
        {/* About Section */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">About</h2>
          {game.description && (
            <p className="text-muted-foreground leading-relaxed">
              {game.description}
            </p>
          )}
        </section>

        {/* Video Section - Placeholder for now */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Watch</h2>
          <YouTubeEmbed
            videoId="oPW0jMG1DTM"
            title={`${game.name} - How to Play`}
          />
        </section>

        {/* How It Plays - Teaser with CTA to How to Play tab */}
        {game.wikipedia_gameplay && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">How It Plays</h2>
            <GameplayTeaser
              content={game.wikipedia_gameplay}
              onNavigate={() => {
                window.location.hash = 'rules'
              }}
            />
          </section>
        )}

        {/* Image Gallery */}
        {hasImages && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold tracking-tight">Gallery</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGallery(!showGallery)}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                {game.images!.length} images
                {showGallery ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            {showGallery && (
              <ImageGallery images={game.images!} gameName={game.name} />
            )}
          </section>
        )}

        {/* Components List */}
        {hasComponentList && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">What&apos;s in the Box</h2>
            <ComponentsList
              components={game.component_list as ComponentListType}
              variant="grid"
            />
          </section>
        )}

        {/* Taxonomy Section */}
        {hasTaxonomy && (
          <section>
            <Collapsible defaultOpen={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold tracking-tight">Game Classification</h2>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    Show details
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <TaxonomySection
                  categories={game.categories || undefined}
                  mechanics={game.mechanics || undefined}
                  themes={game.themes || undefined}
                  playerExperiences={game.player_experiences || undefined}
                  collapseAfter={6}
                />
              </CollapsibleContent>
            </Collapsible>
          </section>
        )}

        {/* Game Relations */}
        {hasRelations && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              {gameRelations.baseGame ? 'Related Games' : 'Expansions & Related'}
            </h2>
            <GameRelationsSection
              baseGame={gameRelations.baseGame}
              expansions={gameRelations.expansions}
              otherRelations={gameRelations.otherRelations}
              family={gameRelations.family}
            />
          </section>
        )}

        {/* Awards */}
        {gameAwards.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Awards & Recognition</h2>
            <AwardBadgeList
              awards={gameAwards}
              variant="default"
            />
          </section>
        )}

        {/* Reception */}
        {game.wikipedia_reception && (
          <section>
            <WikipediaReception
              reception={game.wikipedia_reception}
              wikipediaUrl={game.wikipedia_url}
            />
          </section>
        )}

        {/* Reviews */}
        <section>
          <ReviewSection
            gameId={game.id}
            gameName={game.name}
            initialReviews={initialReviews}
            initialHasMore={initialHasMore}
          />
        </section>

        {/* External Links */}
        {(game.bgg_id || game.official_website || game.rulebook_url) && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">External Links</h2>
            <div className="flex flex-wrap gap-3">
              {game.official_website && (
                <Button variant="outline" asChild>
                  <a
                    href={game.official_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    Official Website
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {game.rulebook_url && (
                <Button variant="outline" asChild>
                  <a
                    href={game.rulebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Official Rulebook
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {game.bgg_id && (
                <Button variant="outline" asChild>
                  <a
                    href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    BoardGameGeek
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Sidebar Column */}
      {hasSidebar && (
        <div className="lg:col-span-1 space-y-6">
          {/* Crunch Score */}
          {hasCrunchBreakdown && (
            <CrunchScoreCard
              score={game.crunch_score!}
              breakdown={game.crunch_breakdown as unknown as CrunchBreakdown}
            />
          )}

          {/* Taxonomy */}
          {hasTaxonomy && (
            <SidebarTaxonomy
              categories={game.categories || undefined}
              mechanics={game.mechanics || undefined}
              themes={game.themes || undefined}
              experiences={game.player_experiences || undefined}
            />
          )}

          {/* Credits */}
          {hasCredits && (
            <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Credits</h3>
              <CreditsSection
                designers={game.designers_list}
                artists={game.artists_list}
                publishers={game.publishers_list}
                variant="compact"
                limit={4}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
