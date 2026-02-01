'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Game } from '@/types/database'
import type { PuffinContentFields, PuffinContentCompleteness } from '@/lib/bgg'
import { formatDate } from '@/lib/admin/utils'

interface PuffinTabProps {
  game: Game
}

// All 22 content fields with display labels, grouped
const FIELD_GROUPS: { title: string; fields: { key: keyof PuffinContentFields; label: string }[] }[] = [
  {
    title: 'Core',
    fields: [
      { key: 'tagline', label: 'Tagline' },
      { key: 'description', label: 'Description' },
      { key: 'quickStart', label: 'Quick Start' },
      { key: 'strategyTips', label: 'Strategy Tips' },
    ],
  },
  {
    title: 'Play Modes',
    fields: [
      { key: 'soloPlayNotes', label: 'Solo Play Notes' },
      { key: 'competitiveNotes', label: 'Competitive Notes' },
      { key: 'cooperativeNotes', label: 'Cooperative Notes' },
      { key: 'familyPlayNotes', label: 'Family Play Notes' },
    ],
  },
  {
    title: 'Player Experience',
    fields: [
      { key: 'playerInteraction', label: 'Player Interaction' },
      { key: 'learningCurve', label: 'Learning Curve' },
      { key: 'replayabilityFactors', label: 'Replayability Factors' },
      { key: 'thematicIntegration', label: 'Thematic Integration' },
      { key: 'componentQuality', label: 'Component Quality' },
    ],
  },
  {
    title: 'Teaching & Tips',
    fields: [
      { key: 'teachingScript', label: 'Teaching Script' },
      { key: 'commonMistakes', label: 'Common Mistakes' },
      { key: 'proTips', label: 'Pro Tips' },
      { key: 'setupTips', label: 'Setup Tips' },
      { key: 'houseRules', label: 'House Rules' },
    ],
  },
  {
    title: 'Context',
    fields: [
      { key: 'historicalContext', label: 'Historical Context' },
      { key: 'accessibilityNotes', label: 'Accessibility Notes' },
      { key: 'expansionNotes', label: 'Expansion Notes' },
      { key: 'similarGames', label: 'Similar Games' },
    ],
  },
]

function ContentField({ label, content, present }: { label: string; content: string | string[] | undefined; present: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {present ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        )}
        <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      </div>
      {present ? (
        <div
          className="text-sm bg-muted/50 rounded-lg p-3 overflow-y-auto prose prose-sm dark:prose-invert max-w-none whitespace-pre-line"
          style={{ maxHeight: label === 'Tagline' ? '60px' : '200px' }}
        >
          {Array.isArray(content) ? content.join(', ') : content}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/50 italic pl-5.5">Not generated</p>
      )}
    </div>
  )
}

export function PuffinTab({ game }: PuffinTabProps) {
  const puffinContent = game.puffin_content as PuffinContentFields | null
  const puffinCompleteness = game.puffin_content_completeness as PuffinContentCompleteness | null
  const hasPuffinContent = !!puffinContent

  if (!hasPuffinContent) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No AI Content</p>
            <p className="text-sm mt-1">
              This game has no Puffin AI-generated content yet.
              <br />
              Import content via the Puffin content pipeline API.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const fieldCount = puffinCompleteness?.fieldCount || 0
  const totalFields = puffinCompleteness?.totalFields || 22
  const completenessPercent = Math.round((fieldCount / totalFields) * 100)

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg uppercase">Puffin AI Content</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">AI-generated game content from Puffin</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {fieldCount}/{totalFields} fields
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{fieldCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Fields Present</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{completenessPercent}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Complete</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">{formatDate(game.puffin_content_updated_at)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Last Updated</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>

          {/* Metadata */}
          {(puffinContent.source || puffinContent.model) && (
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              {puffinContent.source && <span>Source: {puffinContent.source}</span>}
              {puffinContent.model && <span>Model: {puffinContent.model}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Groups */}
      {FIELD_GROUPS.map((group) => {
        const presentCount = group.fields.filter(f => !!puffinContent[f.key]).length

        return (
          <Card key={group.title}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base uppercase">{group.title}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {presentCount}/{group.fields.length} fields
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group.fields.map((field) => (
                  <ContentField
                    key={field.key}
                    label={field.label}
                    content={puffinContent[field.key]}
                    present={!!puffinContent[field.key]}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
