'use client'

import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { FileText, Settings } from 'lucide-react'
import type { Game } from '@/types/database'
import { formatEndGame, parseGameContent } from '@/lib/admin/wizard'

interface ContentTabProps {
  game: Game
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
}

export function ContentTab({ game, updateField }: ContentTabProps) {
  // Parse JSONB content with type-safe fallbacks
  const { rulesContent, setupContent, referenceContent } = parseGameContent(game)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">Rules Content</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Quick start guide and rules overview for players</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="uppercase tracking-wider text-xs text-primary">Overview</Label>
            <AutoResizeTextarea
              value={rulesContent.overview}
              onChange={(e) => updateField('rules_content', {
                ...rulesContent,
                overview: e.target.value
              })}
              minRows={3}
              maxRows={20}
              placeholder="A brief overview of the game and what makes it fun..."
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase tracking-wider text-xs text-primary">Quick Start Steps</Label>
            <AutoResizeTextarea
              value={rulesContent.quickStart?.join('\n') || ''}
              onChange={(e) => updateField('rules_content', {
                ...rulesContent,
                quickStart: e.target.value.split('\n').filter(Boolean)
              })}
              minRows={4}
              maxRows={20}
              placeholder="Step 1: Set up the board&#10;Step 2: Deal starting cards&#10;Step 3: Choose first player"
            />
            <p className="text-xs text-muted-foreground">One step per line</p>
          </div>

          <div className="space-y-2">
            <Label className="uppercase tracking-wider text-xs text-primary">Strategy Tips</Label>
            <AutoResizeTextarea
              value={rulesContent.tips?.join('\n') || ''}
              onChange={(e) => updateField('rules_content', {
                ...rulesContent,
                tips: e.target.value.split('\n').filter(Boolean)
              })}
              minRows={4}
              maxRows={20}
              placeholder="Focus on resource management early&#10;Don't neglect defense"
            />
            <p className="text-xs text-muted-foreground">One tip per line</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">Setup Content</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Setup instructions and component checklist</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="uppercase tracking-wider text-xs text-primary">First Player Rule</Label>
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
            <Label className="uppercase tracking-wider text-xs text-primary">Setup Tips</Label>
            <AutoResizeTextarea
              value={setupContent.quickTips?.join('\n') || ''}
              onChange={(e) => updateField('setup_content', {
                ...setupContent,
                quickTips: e.target.value.split('\n').filter(Boolean)
              })}
              minRows={4}
              maxRows={20}
              placeholder="Tip 1&#10;Tip 2&#10;Tip 3"
            />
            <p className="text-xs text-muted-foreground">One tip per line</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">Reference Content</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Quick reference card and end game conditions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="uppercase tracking-wider text-xs text-primary">End Game Condition</Label>
            <AutoResizeTextarea
              value={formatEndGame(referenceContent.endGame)}
              onChange={(e) => updateField('reference_content', {
                ...referenceContent,
                endGame: e.target.value
              })}
              minRows={2}
              maxRows={15}
              placeholder="The game ends when a player reaches 10 victory points..."
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase tracking-wider text-xs text-primary">Quick Reminders</Label>
            <AutoResizeTextarea
              value={referenceContent.quickReminders?.join('\n') || ''}
              onChange={(e) => updateField('reference_content', {
                ...referenceContent,
                quickReminders: e.target.value.split('\n').filter(Boolean)
              })}
              minRows={4}
              maxRows={20}
              placeholder="Draw a card at the end of your turn&#10;You can only build on your turn"
            />
            <p className="text-xs text-muted-foreground">One reminder per line</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
