'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Quote, BookOpen, FileText, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
  wikipediaUrl
}: {
  content: string
  wikipediaUrl?: string | null
}) {
  // Clean content: remove citation markers, preserve paragraph breaks
  const cleaned = content.replace(/\[\d+\]/g, '').trim()
  // Split into paragraphs by double newlines
  const paragraphs = cleaned.split(/\n\n+/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="relative">
        <Quote className="absolute -left-1 -top-1 h-6 w-6 text-muted-foreground/20" />
        <blockquote className="pl-6 border-l-2 border-primary/30 space-y-3">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </blockquote>
      </div>
      {wikipediaUrl && (
        <p className="text-xs text-muted-foreground/60">
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
}

export function RulesTab({ game, content, wikipediaGameplay, wikipediaUrl, keyReminders }: RulesTabProps) {
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
      <div className="lg:col-span-2 space-y-8">
        {/* Intro */}
        <div>
          <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">Intro to {game.name || 'the Game'}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {content.overview}
          </p>
        </div>

        {/* Quick Start */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Quick Start (TL;DR)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {content.quickStart.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary font-bold">{i + 1}.</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

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

        {/* Turn Structure */}
        <div>
          <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">Turn Structure</h2>
          <div className="space-y-3">
            {content.turnStructure.map((phase, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{'phase' in phase ? phase.phase : phase.title}</p>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Rulebook Preview */}
        {game.rulebook_url && (
          <RulebookPreview
            rulebookUrl={game.rulebook_url}
            rulebookThumbnailUrl={game.rulebook_thumbnail_url}
            gameName={game.name}
          />
        )}

        {/* Scoring */}
        {(isAI ? (content as AIRulesContent).scoring : (content as LegacyRulesContent).scoring) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(isAI
                  ? (content as AIRulesContent).scoring
                  : (content as LegacyRulesContent).scoring
                )?.map((item, i) => (
                  <div key={i} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-sm">{item.category}</p>
                    <p className="text-sm text-muted-foreground">{item.points}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* End Game & Winning */}
        {isAI && ((content as AIRulesContent).endGame || (content as AIRulesContent).endGameConditions) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">End Game & Winning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(content as AIRulesContent).endGameConditions && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Game Ends When:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {(content as AIRulesContent).endGameConditions!.map((condition, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary">•</span>
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(content as AIRulesContent).winCondition && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Winner:</h4>
                  <p className="text-sm text-muted-foreground">
                    {(content as AIRulesContent).winCondition}
                  </p>
                </div>
              )}
              {!(content as AIRulesContent).endGameConditions && (content as AIRulesContent).endGame && (
                <p className="text-sm text-muted-foreground">
                  {(content as AIRulesContent).endGame}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Key Reminders */}
        {keyReminders && keyReminders.length > 0 && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg">Key Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {keyReminders.map((reminder, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500">•</span>
                    {reminder}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Tips card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Strategy Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {content.tips.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Buy card */}
        {game.amazon_asin && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-3">
                Ready to play?
              </p>
              <Button className="w-full" asChild>
                <a
                  href={`https://www.amazon.com/dp/${game.amazon_asin}?tag=goodgame-20`}
                  target="_blank"
                  rel="noopener sponsored"
                >
                  Buy on Amazon
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
