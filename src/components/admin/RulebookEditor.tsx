'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PenTool,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type { CrunchBreakdown } from '@/lib/rulebook/types'
import {
  RulebookUrlSection,
  RulebookParseSection,
  CrunchScoreDisplay,
  ContentGenerationModal,
} from './rulebook'
import type { ContentResult } from './rulebook'

interface Publisher {
  id: string
  name: string
  slug: string
  website: string | null
}

interface RulebookEditorProps {
  game: Game & { publishers_list?: Publisher[] }
  onRulebookUrlChange: (url: string | null) => void
}

export function RulebookEditor({
  game,
  onRulebookUrlChange,
}: RulebookEditorProps) {
  // URL and validation state
  const [rulebookUrl, setRulebookUrl] = useState(game.rulebook_url || '')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    error?: string
    contentLength?: number
    searchQuery?: string
  } | null>(null)
  const [discovering, setDiscovering] = useState(false)

  // Parsing state
  const [parsing, setParsing] = useState(false)
  const [parseResult, setParseResult] = useState<{
    success: boolean
    wordCount?: number
    pageCount?: number
    crunchScore?: number
    crunchError?: string
    error?: string
  } | null>(null)

  // Content generation state
  const [generatingContent, setGeneratingContent] = useState(false)
  const [contentResult, setContentResult] = useState<ContentResult | null>(null)
  const [showContentModal, setShowContentModal] = useState(false)

  // Parse Crunch breakdown from game
  const crunchBreakdown = game.crunch_breakdown as CrunchBreakdown | null
  const crunchScore = game.crunch_score

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
        body: JSON.stringify({
          gameId: game.id,
          url: rulebookUrl,
        }),
      })

      const result = await response.json()
      setParseResult(result)

      // Only reload if Crunch Score was successfully generated
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

  const generateContent = async () => {
    if (!rulebookUrl) return

    setGeneratingContent(true)
    setContentResult(null)

    try {
      const response = await fetch('/api/admin/rulebook/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          contentTypes: ['rules', 'setup', 'reference'],
        }),
      })

      const result = await response.json()
      setContentResult(result)

      if (result.success) {
        setShowContentModal(true)
      }
    } catch (error) {
      setContentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Content generation failed',
      })
    } finally {
      setGeneratingContent(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Rulebook URL */}
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

      {/* Generate Content */}
      {game.crunch_score && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <PenTool className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Generate Game Content</CardTitle>
                <CardDescription>
                  Create rules summary, setup guide, and quick reference from the rulebook
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current content status */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={game.has_rules ? 'default' : 'outline'}>
                {game.has_rules ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                Rules
              </Badge>
              <Badge variant={game.has_setup_guide ? 'default' : 'outline'}>
                {game.has_setup_guide ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                Setup Guide
              </Badge>
              <Badge variant={game.has_reference ? 'default' : 'outline'}>
                {game.has_reference ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                Quick Reference
              </Badge>
            </div>

            <Button
              onClick={generateContent}
              disabled={!rulebookUrl || generatingContent}
              className="w-full sm:w-auto"
            >
              {generatingContent ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PenTool className="h-4 w-4 mr-2" />
              )}
              {generatingContent ? 'Generating Content...' : 'Generate All Content'}
            </Button>

            {contentResult && !contentResult.success && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-800">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm">{contentResult.error}</div>
              </div>
            )}
          </CardContent>
        </Card>
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
                <CardDescription>
                  Components detected from rulebook
                </CardDescription>
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

      {/* Content Generation Result Modal */}
      <ContentGenerationModal
        open={showContentModal}
        onOpenChange={setShowContentModal}
        contentResult={contentResult}
        gameSlug={game.slug}
      />
    </div>
  )
}
