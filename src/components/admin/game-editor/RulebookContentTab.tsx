'use client'

import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type { CrunchBreakdown } from '@/lib/rulebook/types'
import {
  RulebookUrlSection,
  RulebookParseSection,
  CrunchScoreDisplay,
} from '@/components/admin/rulebook'
import { formatEndGame, parseGameContent, type Publisher } from '@/lib/admin/wizard'

interface RulebookContentTabProps {
  game: Game & { publishers_list?: Publisher[] }
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
  onRulebookUrlChange: (url: string | null) => void
}

export function RulebookContentTab({
  game,
  updateField,
  onRulebookUrlChange,
}: RulebookContentTabProps) {
  // Rulebook state
  const [rulebookUrl, setRulebookUrl] = useState(game.rulebook_url || '')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    error?: string
    contentLength?: number
    searchQuery?: string
  } | null>(null)
  const [discovering, setDiscovering] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseResult, setParseResult] = useState<{
    success: boolean
    wordCount?: number
    pageCount?: number
    crunchScore?: number
    error?: string
  } | null>(null)

  // Content section collapse state
  const [contentExpanded, setContentExpanded] = useState(true)

  // Parse JSONB content with type-safe fallbacks
  const { rulesContent, setupContent, referenceContent } = parseGameContent(game)
  const crunchBreakdown = game.crunch_breakdown as CrunchBreakdown | null
  const crunchScore = game.crunch_score

  // Rulebook handlers
  const validateUrl = async () => {
    if (!rulebookUrl) return
    setValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch('/api/admin/rulebook/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rulebookUrl }),
      })
      const result = await response.json()
      setValidationResult(result)
      if (result.valid) {
        onRulebookUrlChange(rulebookUrl)
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      })
    } finally {
      setValidating(false)
    }
  }

  const discoverUrl = async () => {
    setDiscovering(true)
    setValidationResult(null)

    try {
      const response = await fetch('/api/admin/rulebook/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          gameName: game.name,
          publisher: game.publisher,
        }),
      })
      const result = await response.json()

      if (result.found && result.url) {
        setRulebookUrl(result.url)
        setValidationResult({ valid: true })
        onRulebookUrlChange(result.url)
      } else {
        setValidationResult({
          valid: false,
          error: result.notes || 'No rulebook found automatically',
          searchQuery: result.searchQuery,
        })
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Discovery failed',
      })
    } finally {
      setDiscovering(false)
    }
  }

  const parseRulebook = async () => {
    if (!rulebookUrl) return
    setParsing(true)
    setParseResult(null)

    try {
      const response = await fetch('/api/admin/rulebook/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, url: rulebookUrl }),
      })
      const result = await response.json()
      setParseResult(result)
      if (result.success && result.crunchScore) {
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (error) {
      setParseResult({
        success: false,
        error: error instanceof Error ? error.message : 'Parsing failed',
      })
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Rulebook URL Section */}
      <RulebookUrlSection
        rulebookUrl={rulebookUrl}
        onRulebookUrlChange={setRulebookUrl}
        validationResult={validationResult}
        onValidationResultChange={setValidationResult}
        validating={validating}
        discovering={discovering}
        onValidate={validateUrl}
        onDiscover={discoverUrl}
        publishersList={game.publishers_list}
        rulebookSource={game.rulebook_source}
        rulebookParsedAt={game.rulebook_parsed_at}
      />

      {/* Parse & Generate Crunch Score */}
      <RulebookParseSection
        gameId={game.id}
        rulebookUrl={rulebookUrl}
        parsing={parsing}
        parseResult={parseResult}
        rulebookParsedAt={game.rulebook_parsed_at}
        onParse={parseRulebook}
      />

      {/* Crunch Score Display */}
      {crunchScore && (
        <CrunchScoreDisplay
          score={Number(crunchScore)}
          breakdown={crunchBreakdown}
          generatedAt={game.crunch_generated_at}
          bggReference={game.crunch_bgg_reference ? Number(game.crunch_bgg_reference) : undefined}
        />
      )}


      {/* Component List */}
      {game.component_list && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-teal-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Extracted Components</CardTitle>
                <CardDescription>Components detected from rulebook</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(game.component_list as Record<string, unknown>).map(([key, value]) => {
                if (key === 'other' && Array.isArray(value)) {
                  return (
                    <div key={key} className="col-span-full">
                      <span className="text-sm text-muted-foreground">Other: </span>
                      <span className="text-sm">{value.join(', ')}</span>
                    </div>
                  )
                }
                if (typeof value === 'number' && value > 0) {
                  return (
                    <div key={key} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <span className="font-medium">{value}</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )
                }
                return null
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collapsible Content Editor */}
      <Collapsible open={contentExpanded} onOpenChange={setContentExpanded}>
        <Card>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-orange-500" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Content Editor</CardTitle>
                  <CardDescription>Edit the generated rules, setup, and reference content</CardDescription>
                </div>
                {contentExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {/* Rules Content */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-orange-500" />
                  Rules Content
                </h4>
                <div className="space-y-2">
                  <Label>Overview</Label>
                  <Textarea
                    value={rulesContent.overview}
                    onChange={(e) =>
                      updateField('rules_content', { ...rulesContent, overview: e.target.value })
                    }
                    rows={3}
                    placeholder="A brief overview of the game..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quick Start Steps (one per line)</Label>
                  <Textarea
                    value={rulesContent.quickStart?.join('\n') || ''}
                    onChange={(e) =>
                      updateField('rules_content', {
                        ...rulesContent,
                        quickStart: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Strategy Tips (one per line)</Label>
                  <Textarea
                    value={rulesContent.tips?.join('\n') || ''}
                    onChange={(e) =>
                      updateField('rules_content', {
                        ...rulesContent,
                        tips: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>

              <hr />

              {/* Setup Content */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4 text-cyan-500" />
                  Setup Content
                </h4>
                <div className="space-y-2">
                  <Label>First Player Rule</Label>
                  <Input
                    value={setupContent.firstPlayerRule}
                    onChange={(e) =>
                      updateField('setup_content', { ...setupContent, firstPlayerRule: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Setup Tips (one per line)</Label>
                  <Textarea
                    value={setupContent.quickTips?.join('\n') || ''}
                    onChange={(e) =>
                      updateField('setup_content', {
                        ...setupContent,
                        quickTips: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    rows={4}
                  />
                </div>
              </div>

              <hr />

              {/* Reference Content */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-pink-500" />
                  Reference Content
                </h4>
                <div className="space-y-2">
                  <Label>End Game Condition</Label>
                  <Textarea
                    value={formatEndGame(referenceContent.endGame)}
                    onChange={(e) =>
                      updateField('reference_content', { ...referenceContent, endGame: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quick Reminders (one per line)</Label>
                  <Textarea
                    value={referenceContent.quickReminders?.join('\n') || ''}
                    onChange={(e) =>
                      updateField('reference_content', {
                        ...referenceContent,
                        quickReminders: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
