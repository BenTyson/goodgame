'use client'

import { CheckCircle2, ExternalLink, Boxes } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SetupChecklist } from '@/components/setup/SetupChecklist'
import { GameDocumentsCard } from '../GameDocumentsCard'
import { DocumentPreview } from '../DocumentPreview'
import type { GameDocument } from '@/types/database'

// Type for AI-generated content
interface AISetupContent {
  overview: string
  estimatedTime?: string
  beforeYouStart?: string[]
  components: { name: string; quantity: string; description: string }[]
  steps: { step: number; title: string; instruction: string; tip?: string }[]
  playerSetup: { description: string; items: string[] }
  firstPlayer?: string
  firstPlayerRule?: string
  quickTips?: string[]
  setupTips?: string[]
  commonMistakes: string[]
}

// Type for legacy hardcoded content
interface LegacySetupContent {
  playerSetup: { title: string; description: string; tip?: string }[]
  boardSetup: { title: string; description: string; tip?: string }[]
  componentChecklist: { name: string; quantity: string }[]
  firstPlayerRule: string
  quickTips: string[]
}

type SetupContent = AISetupContent | LegacySetupContent

// Helper to check if content is AI-generated format
function isAIContent(content: SetupContent): content is AISetupContent {
  return 'steps' in content || 'beforeYouStart' in content
}

export interface SetupTabProps {
  game: {
    name: string
    slug: string
    bgg_id?: number | null
    amazon_asin?: string | null
    rulebook_url?: string | null
  }
  content: SetupContent | null
  gameDocuments?: GameDocument[]
}

export function SetupTab({ game, content, gameDocuments = [] }: SetupTabProps) {
  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Setup guide is being generated. Check back soon!</p>
      </div>
    )
  }

  const isAI = isAIContent(content)

  // Get component list based on content type
  const componentList = isAI
    ? (content as AISetupContent).components.map(c => ({ name: c.name, quantity: c.quantity }))
    : (content as LegacySetupContent).componentChecklist

  // Get tips based on content type
  const tips = isAI
    ? (content as AISetupContent).commonMistakes
    : (content as LegacySetupContent).quickTips

  // Get first player rule
  const firstPlayerRule = isAI
    ? ((content as AISetupContent).firstPlayerRule || (content as AISetupContent).firstPlayer)
    : (content as LegacySetupContent).firstPlayerRule

  // Get setup tips (AI content only)
  const setupTips = isAI
    ? ((content as AISetupContent).quickTips || (content as AISetupContent).setupTips)
    : undefined

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-8">
        {/* AI Content - Before You Start */}
        {isAI && (content as AISetupContent).beforeYouStart && (
          <section>
            <h3 className="text-[22px] font-light uppercase tracking-widest mb-4">Before You Start</h3>
            <ul className="space-y-1.5">
              {(content as AISetupContent).beforeYouStart!.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Setup Steps */}
        {isAI ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">Setup Steps</h2>
              <div className="space-y-3">
                {(content as AISetupContent).steps.map((step) => (
                  <div key={step.step} className="group flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/50 text-primary text-xs font-medium">
                      {step.step}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.instruction}</p>
                      {step.tip && (
                        <p className="text-xs text-muted-foreground/70 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Tip: {step.tip}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Setup */}
            {(content as AISetupContent).playerSetup && (
              <div>
                <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">Player Setup</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  {(content as AISetupContent).playerSetup.description}
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {(content as AISetupContent).playerSetup.items.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary/50 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* First Player */}
            {firstPlayerRule && (
              <div>
                <h2 className="text-[22px] font-light uppercase tracking-widest mb-4">First Player</h2>
                <p className="text-sm text-muted-foreground">{firstPlayerRule}</p>
              </div>
            )}
          </div>
        ) : (
          /* Legacy content - Interactive Setup Checklists */
          <SetupChecklist
            playerSetup={(content as LegacySetupContent).playerSetup}
            boardSetup={(content as LegacySetupContent).boardSetup}
            firstPlayerRule={(content as LegacySetupContent).firstPlayerRule}
          />
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Setup Guide Preview */}
        {(() => {
          const setupGuide = gameDocuments.find(d => d.document_type === 'setup_guide')
          if (!setupGuide) return null
          return (
            <DocumentPreview
              documentUrl={setupGuide.url}
              thumbnailUrl={setupGuide.thumbnail_url}
              label="Setup Guide"
              hoverText="View Guide"
              buttonText="View Setup Guide"
              gameName={game.name}
              icon={Boxes}
            />
          )
        })()}

        {/* Component Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {componentList.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium">{item.quantity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Tips & Mistakes - Combined */}
        {((setupTips && setupTips.length > 0) || tips.length > 0) && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              {/* Setup Tips */}
              {setupTips && setupTips.length > 0 && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tips</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {setupTips.map((tip, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary/50 shrink-0">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Common Mistakes */}
              {tips.length > 0 && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {isAI ? 'Common Mistakes' : 'Quick Tips'}
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {tips.map((tip, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary/50 shrink-0">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Buy card */}
        {game.amazon_asin && (
          <Card>
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

        {/* Resources */}
        <GameDocumentsCard
          documents={gameDocuments}
          rulebookUrl={game.rulebook_url}
        />
      </div>
    </div>
  )
}
