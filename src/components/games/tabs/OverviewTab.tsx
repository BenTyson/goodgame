'use client'

import Link from 'next/link'
import { ExternalLink, BookOpen, Brain, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CreditsSection } from '@/components/games/CreditsSection'
import { WikipediaReception } from '@/components/games/WikipediaContent'
import { GameRelationsSection } from '@/components/games/GameRelationsSection'
import { AwardBadgeList } from '@/components/games/AwardBadge'
import { ImageGallery } from '@/components/games/ImageGallery'
import { VideoCarousel } from '@/components/games/VideoCarousel'
import { GameDocumentsCard } from '@/components/games/GameDocumentsCard'
import { ReviewSection } from '@/components/reviews'
import { cn } from '@/lib/utils'
import { getCrunchTier } from '@/lib/utils/complexity'
import { cleanAndTruncateWikipedia } from '@/lib/utils/wikipedia'
import { useExpandableList } from '@/hooks/use-expandable-list'
import type {
  GameImage,
  GameDocument,
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

// Individual taxonomy section with expand/collapse
function TaxonomySidebarSection({
  label,
  items,
  prefix,
  badgeClass,
  initialLimit = 6,
}: {
  label: string
  items: { slug: string; name: string }[]
  prefix: string
  badgeClass: string
  initialLimit?: number
}) {
  const { displayItems, hasMore, remaining, expanded, toggle } = useExpandableList(items, initialLimit)

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {displayItems.map((item) => (
          <Link
            key={item.slug}
            href={`${prefix}${item.slug}`}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border bg-transparent transition-all duration-200',
              badgeClass
            )}
          >
            {item.name}
          </Link>
        ))}
        {hasMore && (
          <button
            onClick={toggle}
            className="text-xs px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            {expanded ? (
              <>
                Show less
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                +{remaining}
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// Sidebar taxonomy component with colorful badges
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
    {
      label: 'Categories',
      items: categories,
      prefix: '/games?categories=',
      badgeClass: 'border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60',
    },
    {
      label: 'Mechanics',
      items: mechanics,
      prefix: '/games?mechanics=',
      badgeClass: 'border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/60',
    },
    {
      label: 'Themes',
      items: themes,
      prefix: '/games?themes=',
      badgeClass: 'border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/60',
    },
    {
      label: 'Experience',
      items: experiences,
      prefix: '/games?experiences=',
      badgeClass: 'border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/60',
    },
  ].filter(s => s.items && s.items.length > 0)

  if (sections.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-6 space-y-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Classification</h3>
      {sections.map((section) => (
        <TaxonomySidebarSection
          key={section.label}
          label={section.label}
          items={section.items!}
          prefix={section.prefix}
          badgeClass={section.badgeClass}
        />
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
  const truncated = cleanAndTruncateWikipedia(content, 450)

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground leading-relaxed">
        {truncated}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onNavigate}
        className="border-primary text-primary hover:bg-primary/10"
      >
        Continue Learning
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
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

// Crunch Score breakdown card component
function CrunchScoreCard({ score, breakdown }: { score: number; breakdown: CrunchBreakdown }) {
  const tier = getCrunchTier(score)

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

export interface FeaturedVideo {
  id: string
  youtube_video_id: string
  youtube_url: string
  title: string | null
  video_type: string
}

interface GameVideo {
  id: string
  youtube_video_id: string
  title: string | null
  video_type: string
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
    featured_video?: FeaturedVideo | null
  }
  gameAwards: GameAwardWithDetails[]
  gameRelations: GroupedGameRelations
  gameDocuments?: GameDocument[]
  initialReviews: ReviewWithUser[]
  initialHasMore: boolean
  reviewVideos?: GameVideo[]
}

export function OverviewTab({
  game,
  gameAwards,
  gameRelations,
  gameDocuments = [],
  initialReviews,
  initialHasMore,
  reviewVideos,
}: OverviewTabProps) {
  const hasWikipediaContent = game.wikipedia_gameplay || game.wikipedia_reception
  const hasRelations = gameRelations.baseGame || gameRelations.expansions.length > 0 || gameRelations.otherRelations.length > 0
  const hasTaxonomy = (game.mechanics && game.mechanics.length > 0) ||
                      (game.themes && game.themes.length > 0) ||
                      (game.player_experiences && game.player_experiences.length > 0)
  const hasImages = game.images && game.images.length > 0
  const hasCrunchBreakdown = game.crunch_score && game.crunch_breakdown
  const hasDocuments = gameDocuments.length > 0 || game.rulebook_url

  const hasCredits = game.designers_list?.length || game.artists_list?.length || game.publishers_list?.length
  const hasSidebar = hasCrunchBreakdown || hasTaxonomy || hasCredits || hasDocuments

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
      {/* Main Content Column */}
      <div className={cn('space-y-12', hasSidebar ? 'lg:col-span-2' : 'lg:col-span-3')}>
        {/* About Section */}
        <section>
          <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">About</h2>
          {game.description && (
            <p className="text-muted-foreground leading-relaxed">
              {game.description}
            </p>
          )}
        </section>

        {/* Video Section */}
        {game.featured_video && (
          <section>
            <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">Watch</h2>
            <YouTubeEmbed
              videoId={game.featured_video.youtube_video_id}
              title={game.featured_video.title || `${game.name} - Overview`}
            />
          </section>
        )}

        {/* How It Plays - Teaser with CTA to How to Play tab */}
        {game.wikipedia_gameplay && (
          <section>
            <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">How It Plays</h2>
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
            <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">Gallery</h2>
            <ImageGallery images={game.images!} gameName={game.name} />
          </section>
        )}

        {/* Game Relations */}
        {hasRelations && (
          <section>
            <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">
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
            <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">Awards & Recognition</h2>
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
        <section className="space-y-6">
          <h2 className="text-[22px] font-light uppercase tracking-widest">Reviews</h2>

          {/* Review Videos */}
          {reviewVideos && reviewVideos.length > 0 && (
            <VideoCarousel videos={reviewVideos} gameName={game.name} />
          )}

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
            <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">External Links</h2>
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

          {/* Resources / Documents */}
          {hasDocuments && (
            <GameDocumentsCard
              documents={gameDocuments}
              rulebookUrl={game.rulebook_url}
            />
          )}
        </div>
      )}
    </div>
  )
}
