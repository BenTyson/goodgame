'use client'

import Link from 'next/link'
import { BookOpen, Boxes, FileText, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PrintButton } from '@/components/ui/print-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReferenceContent } from '@/types/database'

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

export interface ReferenceTabProps {
  game: {
    slug: string
    name: string
    bgg_id?: number | null
    has_rules?: boolean | null
    has_setup_guide?: boolean | null
    has_score_sheet?: boolean | null
  }
  content: ReferenceContent | null
}

export function ReferenceTab({ game, content }: ReferenceTabProps) {
  // Check if we have any meaningful content
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
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-muted-foreground mb-6">
          A printable quick reference card is being generated for this game. Check back soon!
        </p>

        {/* Alternative resources */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">In the meantime, try these resources:</p>
          <div className="flex flex-col gap-2">
            {game.has_rules && (
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => window.location.hash = 'rules'}>
                <BookOpen className="h-4 w-4" />
                Full Rules Summary
              </Button>
            )}
            {game.has_setup_guide && (
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => window.location.hash = 'setup'}>
                <Boxes className="h-4 w-4" />
                Setup Guide
              </Button>
            )}
            {game.has_score_sheet && (
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => window.location.hash = 'score-sheet'}>
                <FileText className="h-4 w-4" />
                Score Sheet
              </Button>
            )}
            {game.bgg_id && (
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <a
                  href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on BoardGameGeek
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Print Button */}
      <div className="flex justify-end print:hidden">
        <PrintButton />
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
                  if (typeof item === 'string') {
                    return (
                      <li key={i} className="text-sm text-muted-foreground print:text-gray-600">
                        • {item}
                      </li>
                    )
                  }
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

        {/* Actions or Key Rules */}
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

        {/* Symbols */}
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

        {/* Scoring or Costs */}
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

        {/* Reminders & End Game */}
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
                <div className="text-sm pt-2 border-t">
                  <span className="font-medium text-primary">End Game: </span>
                  <span className="text-muted-foreground print:text-gray-600">
                    {renderEndGame(content.endGame)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
