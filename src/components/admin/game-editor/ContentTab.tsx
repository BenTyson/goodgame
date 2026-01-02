'use client'

import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { FileText, Settings } from 'lucide-react'
import type { Game, RulesContent, SetupContent, ReferenceContent } from '@/types/database'

// Helper to format endGame which can be string or object
function formatEndGame(endGame: ReferenceContent['endGame']): string {
  if (!endGame) return ''
  if (typeof endGame === 'string') return endGame
  const parts: string[] = []
  if (endGame.triggers?.length) parts.push(`Triggers: ${endGame.triggers.join('; ')}`)
  if (endGame.finalRound) parts.push(`Final Round: ${endGame.finalRound}`)
  if (endGame.winner) parts.push(`Winner: ${endGame.winner}`)
  if (endGame.tiebreakers?.length) parts.push(`Tiebreakers: ${endGame.tiebreakers.join('; ')}`)
  return parts.join('\n')
}

interface ContentTabProps {
  game: Game
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
}

export function ContentTab({ game, updateField }: ContentTabProps) {
  // Parse JSONB content with fallbacks
  const rulesContent = (game.rules_content as unknown as RulesContent) || {
    quickStart: [],
    overview: '',
    setup: [],
    turnStructure: [],
    scoring: [],
    tips: []
  }

  const setupContent = (game.setup_content as unknown as SetupContent) || {
    playerSetup: [],
    boardSetup: [],
    componentChecklist: [],
    firstPlayerRule: '',
    quickTips: []
  }

  const referenceContent = (game.reference_content as unknown as ReferenceContent) || {
    turnSummary: [],
    keyRules: [],
    costs: [],
    quickReminders: [],
    endGame: ''
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Rules Content</CardTitle>
              <CardDescription>Quick start guide and rules overview for players</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Overview</Label>
            <Textarea
              value={rulesContent.overview}
              onChange={(e) => updateField('rules_content', {
                ...rulesContent,
                overview: e.target.value
              })}
              rows={3}
              placeholder="A brief overview of the game and what makes it fun..."
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Start Steps</Label>
            <Textarea
              value={rulesContent.quickStart?.join('\n') || ''}
              onChange={(e) => updateField('rules_content', {
                ...rulesContent,
                quickStart: e.target.value.split('\n').filter(Boolean)
              })}
              rows={4}
              placeholder="Step 1: Set up the board&#10;Step 2: Deal starting cards&#10;Step 3: Choose first player"
            />
            <p className="text-xs text-muted-foreground">One step per line</p>
          </div>

          <div className="space-y-2">
            <Label>Strategy Tips</Label>
            <Textarea
              value={rulesContent.tips?.join('\n') || ''}
              onChange={(e) => updateField('rules_content', {
                ...rulesContent,
                tips: e.target.value.split('\n').filter(Boolean)
              })}
              rows={4}
              placeholder="Focus on resource management early&#10;Don't neglect defense"
            />
            <p className="text-xs text-muted-foreground">One tip per line</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Settings className="h-4 w-4 text-cyan-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Setup Content</CardTitle>
              <CardDescription>Setup instructions and component checklist</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>First Player Rule</Label>
            <Input
              value={setupContent.firstPlayerRule}
              onChange={(e) => updateField('setup_content', {
                ...setupContent,
                firstPlayerRule: e.target.value
              })}
              placeholder="e.g., The player who most recently traveled goes first"
            />
          </div>

          <div className="space-y-2">
            <Label>Setup Tips</Label>
            <Textarea
              value={setupContent.quickTips?.join('\n') || ''}
              onChange={(e) => updateField('setup_content', {
                ...setupContent,
                quickTips: e.target.value.split('\n').filter(Boolean)
              })}
              rows={4}
              placeholder="Tip 1&#10;Tip 2&#10;Tip 3"
            />
            <p className="text-xs text-muted-foreground">One tip per line</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-pink-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Reference Content</CardTitle>
              <CardDescription>Quick reference card and end game conditions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>End Game Condition</Label>
            <Textarea
              value={formatEndGame(referenceContent.endGame)}
              onChange={(e) => updateField('reference_content', {
                ...referenceContent,
                endGame: e.target.value
              })}
              rows={2}
              placeholder="The game ends when a player reaches 10 victory points..."
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Reminders</Label>
            <Textarea
              value={referenceContent.quickReminders?.join('\n') || ''}
              onChange={(e) => updateField('reference_content', {
                ...referenceContent,
                quickReminders: e.target.value.split('\n').filter(Boolean)
              })}
              rows={4}
              placeholder="Draw a card at the end of your turn&#10;You can only build on your turn"
            />
            <p className="text-xs text-muted-foreground">One reminder per line</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
