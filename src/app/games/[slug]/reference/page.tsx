import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Zap, ExternalLink, Users, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PrintButton } from '@/components/ui/print-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getGameBySlug, getAllGameSlugs } from '@/lib/supabase/queries'
import type { ReferenceContent } from '@/types/database'

interface ReferencePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ReferencePageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game) {
    return {
      title: 'Game Not Found',
    }
  }

  return {
    title: `${game.name} Quick Reference`,
    description: `Quick reference card for ${game.name}. Key rules, turn structure, and important reminders at a glance.`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllGameSlugs()
  return slugs.map((slug) => ({ slug }))
}

// Helper to safely render endGame
function renderEndGame(endGame: ReferenceContent['endGame']): string {
  if (!endGame) return ''
  if (typeof endGame === 'string') return endGame
  const parts: string[] = []
  if (endGame.triggers?.length) parts.push(endGame.triggers.join('. '))
  if (endGame.finalRound) parts.push(endGame.finalRound)
  if (endGame.winner) parts.push(endGame.winner)
  if (endGame.tiebreakers?.length) parts.push(`Tiebreakers: ${endGame.tiebreakers.join(', ')}`)
  return parts.join(' ')
}

export default async function ReferencePage({ params }: ReferencePageProps) {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game || !game.has_reference) {
    notFound()
  }

  const content = game.reference_content as ReferenceContent | null

  // Check if we have any meaningful content (either new AI schema or legacy)
  const hasContent = content && (
    content.turnSummary?.length ||
    content.actions?.length ||
    content.scoring?.length ||
    content.reminders?.length ||
    content.keyRules?.length ||
    content.costs?.length ||
    content.quickReminders?.length
  )

  if (!hasContent) {
    return (
      <div className="container py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <nav className="text-sm text-muted-foreground">
            <Link href="/games" className="hover:text-foreground">Games</Link>
            <span className="mx-2">/</span>
            <Link href={`/games/${game.slug}`} className="hover:text-foreground">{game.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Reference</span>
          </nav>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/games/${game.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">{game.name} Quick Reference</h1>
          <p className="text-muted-foreground">Reference content is being generated. Check back soon!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb & Back */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <nav className="text-sm text-muted-foreground">
          <Link href="/games" className="hover:text-foreground">Games</Link>
          <span className="mx-2">/</span>
          <Link href={`/games/${game.slug}`} className="hover:text-foreground">{game.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Reference</span>
        </nav>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/games/${game.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 print:mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 print:hidden">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl print:text-2xl">
              {game.name} Quick Reference
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground print:hidden">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {game.player_count_min}-{game.player_count_max} players
              </span>
              {game.play_time_min && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {game.play_time_min}-{game.play_time_max} min
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reference Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-3">
        {/* Turn Summary */}
        {content.turnSummary && content.turnSummary.length > 0 && (
          <Card className="print:break-inside-avoid print:shadow-none print:border">
            <CardHeader className="pb-2 print:pb-1">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                  1
                </span>
                Turn Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {content.turnSummary.map((item, i) => {
                  // Handle both string and object formats
                  if (typeof item === 'string') {
                    return (
                      <li key={i} className="text-sm text-muted-foreground print:text-gray-600">
                        • {item}
                      </li>
                    )
                  }
                  // Object format: { phase, action } or { step, description }
                  const obj = item as { phase?: string; action?: string; step?: string; description?: string }
                  const label = obj.phase || obj.step || ''
                  const desc = obj.action || obj.description || ''
                  return (
                    <li key={i} className="text-sm">
                      {label && <span className="font-medium text-primary">{label}: </span>}
                      <span className="text-muted-foreground print:text-gray-600">{desc}</span>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Actions (new schema) or Key Rules (legacy) */}
        {content.actions && content.actions.length > 0 ? (
          <Card className="print:break-inside-avoid print:shadow-none print:border">
            <CardHeader className="pb-2 print:pb-1">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                  2
                </span>
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {content.actions.map((action, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{action.name}</span>
                    {action.cost && <span className="text-muted-foreground"> ({action.cost})</span>}
                    <p className="text-muted-foreground print:text-gray-600 text-xs mt-0.5">
                      {action.effect}
                      {action.limit && ` - ${action.limit}`}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : content.keyRules && content.keyRules.length > 0 ? (
          <Card className="print:break-inside-avoid print:shadow-none print:border">
            <CardHeader className="pb-2 print:pb-1">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                  2
                </span>
                Key Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {content.keyRules.map((rule, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{rule.rule}:</span>{' '}
                    <span className="text-muted-foreground print:text-gray-600">{rule.detail}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Symbols (if any) */}
        {content.symbols && content.symbols.length > 0 && (
          <Card className="print:break-inside-avoid print:shadow-none print:border">
            <CardHeader className="pb-2 print:pb-1">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                  3
                </span>
                Symbols
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {content.symbols.map((symbol, i) => (
                  <div key={i} className="text-sm flex justify-between gap-2">
                    <span className="font-medium">{symbol.symbol}</span>
                    <span className="text-muted-foreground text-right">{symbol.meaning}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scoring (new schema) or Costs (legacy) */}
        {content.scoring && content.scoring.length > 0 ? (
          <Card className="print:break-inside-avoid print:shadow-none print:border">
            <CardHeader className="pb-2 print:pb-1">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                  {content.symbols?.length ? 4 : 3}
                </span>
                Scoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody>
                  {content.scoring.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1">
                        {item.category}
                        {item.notes && (
                          <span className="text-xs text-muted-foreground block">{item.notes}</span>
                        )}
                      </td>
                      <td className="py-1 text-right font-medium text-muted-foreground">
                        {item.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : content.costs && content.costs.length > 0 ? (
          <Card className="print:break-inside-avoid print:shadow-none print:border">
            <CardHeader className="pb-2 print:pb-1">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                  3
                </span>
                Costs & Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody>
                  {content.costs.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1">{item.item}</td>
                      <td className="py-1 text-right font-medium text-muted-foreground">
                        {item.cost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : null}

        {/* Important Numbers */}
        {content.importantNumbers && content.importantNumbers.length > 0 && (
          <Card className="print:break-inside-avoid print:shadow-none print:border">
            <CardHeader className="pb-2 print:pb-1">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                  #
                </span>
                Key Numbers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {content.importantNumbers.map((num, i) => (
                  <div key={i} className="text-sm flex justify-between gap-2">
                    <span className="text-muted-foreground">{num.what}</span>
                    <span className="font-medium">{num.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reminders & End Game (supports both new and legacy schemas) */}
        {(content.reminders?.length || content.quickReminders?.length || content.endGame) && (
          <Card className="print:break-inside-avoid print:shadow-none print:border">
            <CardHeader className="pb-2 print:pb-1">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                  !
                </span>
                Remember
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* New schema reminders */}
              {content.reminders && content.reminders.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {content.reminders.map((reminder, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground print:text-gray-600">{reminder}</span>
                    </li>
                  ))}
                </ul>
              )}
              {/* Legacy schema quickReminders */}
              {!content.reminders?.length && content.quickReminders && content.quickReminders.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {content.quickReminders.map((reminder, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground print:text-gray-600">{reminder}</span>
                    </li>
                  ))}
                </ul>
              )}
              {content.endGame && (
                <>
                  {(content.reminders?.length || content.quickReminders?.length) && <Separator className="print:hidden" />}
                  <div className="text-sm">
                    <span className="font-medium text-primary">End Game: </span>
                    <span className="text-muted-foreground print:text-gray-600">
                      {renderEndGame(content.endGame)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation Links */}
      <div className="mt-8 print:hidden">
        <Separator className="mb-8" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {game.has_rules && (
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/games/${game.slug}/rules`}>Full Rules Summary</Link>
            </Button>
          )}
          {game.has_score_sheet && (
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/games/${game.slug}/score-sheet`}>Score Sheet</Link>
            </Button>
          )}
          {game.has_setup_guide && (
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/games/${game.slug}/setup`}>Setup Guide</Link>
            </Button>
          )}
          {game.bgg_id && (
            <Button variant="outline" className="justify-start gap-2" asChild>
              <a
                href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                BGG Page
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
