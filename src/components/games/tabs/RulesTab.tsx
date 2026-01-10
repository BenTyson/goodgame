'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, BookOpen, FileText, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { cleanWikipediaContentParagraphs } from '@/lib/utils/wikipedia'
import { VideoCarousel } from '../VideoCarousel'

// Placeholder content for when thumbnail is unavailable
function RulebookPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-muted to-muted/50">
      {/* Page lines decoration */}
      <div className="absolute inset-x-6 top-8 space-y-2 opacity-20">
        <div className="h-2 bg-foreground/30 rounded w-3/4" />
        <div className="h-2 bg-foreground/30 rounded w-full" />
        <div className="h-2 bg-foreground/30 rounded w-5/6" />
        <div className="h-2 bg-foreground/30 rounded w-full" />
        <div className="h-2 bg-foreground/30 rounded w-2/3" />
      </div>

      {/* Center icon */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
          <FileText className="h-12 w-12 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">PDF Document</span>
      </div>
    </div>
  )
}

// Rulebook card with visual document representation (thumbnail or placeholder)
function RulebookPreview({
  rulebookUrl,
  rulebookThumbnailUrl,
  gameName
}: {
  rulebookUrl: string
  rulebookThumbnailUrl?: string | null
  gameName?: string
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const showThumbnail = rulebookThumbnailUrl && !imageError

  return (
    <Card className="overflow-hidden p-0">
      {/* Full-bleed thumbnail/placeholder as header */}
      <a
        href={rulebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative overflow-hidden group aspect-[8.5/11]"
      >
        {showThumbnail ? (
          <>
            {/* Loading skeleton */}
            {!imageLoaded && (
              <Skeleton className="absolute inset-0 rounded-none" />
            )}
            {/* Actual thumbnail */}
            <Image
              src={rulebookThumbnailUrl}
              alt={`${gameName || 'Game'} rulebook preview`}
              fill
              className={cn(
                "object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </>
        ) : (
          <RulebookPlaceholder />
        )}

        {/* Top label overlay */}
        <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent pt-3 pb-6 px-4">
          <span className="text-white text-sm font-medium tracking-wide flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Official Rulebook
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <span className="text-white text-sm font-medium flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/20 backdrop-blur">
            View Rulebook
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>
      </a>

      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground text-center mb-4">
          The best way to learn {gameName || 'the game'} (other than playing it) is to read the rulebook!
        </p>
        <Button className="w-full gap-2" asChild>
          <a
            href={rulebookUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen className="h-4 w-4" />
            Read the Official Rules
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}

// Wikipedia gameplay section with subtle attribution
function WikipediaIntro({
  content,
  wikipediaUrl,
  title = 'Gameplay'
}: {
  content: string
  wikipediaUrl?: string | null
  title?: string
}) {
  const paragraphs = cleanWikipediaContentParagraphs(content)

  return (
    <div>
      <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">{title}</h2>
      <div className="space-y-3">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
      {wikipediaUrl && (
        <p className="text-xs text-muted-foreground/60 mt-4">
          via{' '}
          <Link
            href={wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            Wikipedia
          </Link>
          {' '}· CC BY-SA
        </p>
      )}
    </div>
  )
}

// Type for AI-generated content
interface AIRulesContent {
  quickStart: string[]
  overview: string
  coreRules?: { title: string; points: string[] }[]
  turnStructure: { phase?: string; title?: string; description: string }[]
  scoring?: { category: string; points: string }[]
  endGame?: string
  endGameConditions?: string[]
  winCondition?: string
  tips: string[]
}

// Type for legacy hardcoded content
interface LegacyRulesContent {
  quickStart: string[]
  overview: string
  setup: string[]
  turnStructure: { title: string; description: string }[]
  scoring: { category: string; points: string }[]
  tips: string[]
}

type RulesContent = AIRulesContent | LegacyRulesContent

// Helper to check if content is AI-generated format
function isAIContent(content: RulesContent): content is AIRulesContent {
  return 'coreRules' in content || 'endGame' in content || 'endGameConditions' in content
}

interface GameVideo {
  id: string
  youtube_video_id: string
  title: string | null
  video_type: string
}

export interface RulesTabProps {
  game: {
    slug: string
    bgg_id?: number | null
    amazon_asin?: string | null
    has_score_sheet?: boolean | null
    has_setup_guide?: boolean | null
    has_reference?: boolean | null
    rulebook_url?: string | null
    rulebook_thumbnail_url?: string | null
    name?: string
  }
  content: RulesContent | null
  wikipediaGameplay?: string | null
  wikipediaUrl?: string | null
  keyReminders?: string[] | null
  gameplayVideos?: GameVideo[]
}

export function RulesTab({ game, content, wikipediaGameplay, wikipediaUrl, keyReminders, gameplayVideos }: RulesTabProps) {
  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Rules content is being generated. Check back soon!</p>
      </div>
    )
  }

  const isAI = isAIContent(content)

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-10">
        {/* Intro - clean and minimal */}
        <p className="text-lg text-muted-foreground leading-relaxed">
          {content.overview}
        </p>

        {/* Quick Start - clean numbered list */}
        <div className="space-y-4">
          {content.quickStart.map((item, i) => (
            <div key={i} className="flex gap-4 items-start">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                {i + 1}
              </span>
              <p className="text-muted-foreground pt-0.5">{item}</p>
            </div>
          ))}
        </div>

        {/* Scoring */}
        {(isAI ? (content as AIRulesContent).scoring : (content as LegacyRulesContent).scoring) && (
          <div>
            <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">Scoring</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(isAI
                ? (content as AIRulesContent).scoring
                : (content as LegacyRulesContent).scoring
              )?.map((item, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-4">
                  <p className="font-medium text-sm mb-1">{item.category}</p>
                  <p className="text-xs text-muted-foreground">{item.points}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gameplay Videos */}
        {gameplayVideos && gameplayVideos.length > 0 && (
          <div>
            <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">Watch How to Play</h2>
            <VideoCarousel videos={gameplayVideos} gameName={game.name || 'this game'} />
          </div>
        )}

        {/* Wikipedia Introduction */}
        {wikipediaGameplay && (
          <WikipediaIntro
            content={wikipediaGameplay}
            wikipediaUrl={wikipediaUrl}
          />
        )}

        {/* Setup (legacy) or Core Rules (AI) */}
        {isAI && (content as AIRulesContent).coreRules ? (
          <div>
            <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">Core Rules</h2>
            <Card>
              <CardContent className="p-0 divide-y divide-border/50">
                {(content as AIRulesContent).coreRules!.map((rule, i) => (
                  <Collapsible key={i} defaultOpen={i === 0}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left cursor-pointer">
                      <span className="font-medium">{rule.title}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4">
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                          {rule.points.map((point, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="text-primary shrink-0">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : !isAI && (content as LegacyRulesContent).setup ? (
          <div>
            <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">Setup</h2>
            <ol className="space-y-2">
              {(content as LegacyRulesContent).setup.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

      </div>

      {/* Sidebar */}
      <div className="space-y-8">
        {/* Rulebook Preview */}
        {game.rulebook_url && (
          <RulebookPreview
            rulebookUrl={game.rulebook_url}
            rulebookThumbnailUrl={game.rulebook_thumbnail_url}
            gameName={game.name}
          />
        )}

        {/* Turn Structure */}
        {content.turnStructure && content.turnStructure.length > 0 && (
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-primary mb-4">Turn Structure</h3>
            <div className="space-y-3">
              {content.turnStructure.map((phase, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{'phase' in phase ? phase.phase : phase.title}</p>
                    <p className="text-xs text-muted-foreground">{phase.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* End Game */}
        {isAI && ((content as AIRulesContent).endGame || (content as AIRulesContent).endGameConditions) && (
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-primary mb-4">End Game</h3>
            <div className="space-y-3 text-sm">
              {(content as AIRulesContent).endGameConditions && (
                <ul className="space-y-1.5 text-muted-foreground">
                  {(content as AIRulesContent).endGameConditions!.map((condition, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary shrink-0">•</span>
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(content as AIRulesContent).winCondition && (
                <p className="text-muted-foreground pt-2 border-t border-border/50">
                  <span className="font-medium text-foreground">Winner: </span>
                  {(content as AIRulesContent).winCondition}
                </p>
              )}
              {!(content as AIRulesContent).endGameConditions && (content as AIRulesContent).endGame && (
                <p className="text-muted-foreground">
                  {(content as AIRulesContent).endGame}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tips */}
        {content.tips && content.tips.length > 0 && (
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-primary mb-4">Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {content.tips.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Buy button - simple and minimal */}
        {game.amazon_asin && (
          <Button variant="outline" className="w-full" asChild>
            <a
              href={`https://www.amazon.com/dp/${game.amazon_asin}?tag=goodgame-20`}
              target="_blank"
              rel="noopener sponsored"
            >
              Buy on Amazon
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
