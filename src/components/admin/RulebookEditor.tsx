'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  BookOpen,
  Scale,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type { BNCSBreakdown } from '@/lib/rulebook/types'

interface RulebookEditorProps {
  game: Game
  onRulebookUrlChange: (url: string | null) => void
  onBncsUpdate?: (score: number, breakdown: BNCSBreakdown) => void
}

export function RulebookEditor({
  game,
  onRulebookUrlChange,
}: RulebookEditorProps) {
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
    error?: string
  } | null>(null)

  // Parse BNCS breakdown from game
  const bncsBreakdown = game.bncs_breakdown as BNCSBreakdown | null
  const bncsScore = game.bncs_score

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

      // Refresh page to show updated BNCS
      if (result.success) {
        window.location.reload()
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getComplexityLabel = (score: number): string => {
    if (score < 1.8) return 'Gateway'
    if (score < 2.5) return 'Family'
    if (score < 3.2) return 'Medium'
    if (score < 4.0) return 'Heavy'
    return 'Expert'
  }

  const getComplexityColor = (score: number): string => {
    if (score < 1.8) return 'bg-green-100 text-green-800'
    if (score < 2.5) return 'bg-teal-100 text-teal-800'
    if (score < 3.2) return 'bg-amber-100 text-amber-800'
    if (score < 4.0) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      {/* Rulebook URL */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Rulebook PDF</CardTitle>
              <CardDescription>
                Link to the official publisher rulebook for AI content extraction
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rulebook_url">Rulebook URL</Label>
            <div className="flex gap-2">
              <Input
                id="rulebook_url"
                type="url"
                value={rulebookUrl}
                onChange={(e) => {
                  setRulebookUrl(e.target.value)
                  setValidationResult(null)
                }}
                placeholder="https://publisher.com/game-rulebook.pdf"
                className="flex-1"
              />
              {rulebookUrl && (
                <a
                  href={rulebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={validateUrl}
              disabled={!rulebookUrl || validating}
            >
              {validating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Validate URL
            </Button>

            <Button
              variant="outline"
              onClick={discoverUrl}
              disabled={discovering}
            >
              {discovering ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Auto-Discover
            </Button>
          </div>

          {validationResult && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg ${
                validationResult.valid
                  ? 'bg-green-50 text-green-800'
                  : 'bg-amber-50 text-amber-800'
              }`}
            >
              {validationResult.valid ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div className="text-sm flex-1">
                {validationResult.valid ? (
                  <>
                    Valid PDF
                    {validationResult.contentLength && (
                      <span className="text-green-600 ml-1">
                        ({formatFileSize(validationResult.contentLength)})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <p>{validationResult.error}</p>
                    {validationResult.searchQuery && (
                      <div className="mt-2">
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(validationResult.searchQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-900 underline"
                        >
                          <Search className="h-3.5 w-3.5" />
                          Search Google for rulebook
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {game.rulebook_source && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Source: {game.rulebook_source}
              {game.rulebook_parsed_at && (
                <span className="ml-2">
                  (Parsed {new Date(game.rulebook_parsed_at).toLocaleDateString()})
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parse & Generate BNCS */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Content Extraction</CardTitle>
              <CardDescription>
                Parse rulebook PDF and generate BNCS complexity score
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={parseRulebook}
            disabled={!rulebookUrl || parsing}
            className="w-full sm:w-auto"
          >
            {parsing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {parsing ? 'Parsing Rulebook...' : 'Parse & Generate BNCS'}
          </Button>

          {parseResult && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg ${
                parseResult.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {parseResult.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                {parseResult.success ? (
                  <>
                    Successfully parsed {parseResult.pageCount} pages
                    ({parseResult.wordCount?.toLocaleString()} words)
                  </>
                ) : (
                  parseResult.error
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BNCS Score Display */}
      {bncsScore && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Scale className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Board Nomads Complexity Score</CardTitle>
                <CardDescription>
                  AI-generated complexity analysis from rulebook
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Score */}
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">
                {Number(bncsScore).toFixed(1)}
              </div>
              <div>
                <Badge className={getComplexityColor(Number(bncsScore))}>
                  {getComplexityLabel(Number(bncsScore))}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  out of 5.0
                </p>
              </div>
            </div>

            {/* Breakdown */}
            {bncsBreakdown && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-medium">Complexity Breakdown</h4>
                <div className="grid gap-3">
                  <ScoreBar
                    label="Rules Density"
                    value={bncsBreakdown.rulesDensity}
                    description="Amount of rules to learn"
                  />
                  <ScoreBar
                    label="Decision Space"
                    value={bncsBreakdown.decisionSpace}
                    description="Choices per turn"
                  />
                  <ScoreBar
                    label="Learning Curve"
                    value={bncsBreakdown.learningCurve}
                    description="Time to understand"
                  />
                  <ScoreBar
                    label="Strategic Depth"
                    value={bncsBreakdown.strategicDepth}
                    description="Mastery difficulty"
                  />
                  <ScoreBar
                    label="Component Complexity"
                    value={bncsBreakdown.componentComplexity}
                    description="Game state tracking"
                  />
                </div>

                {bncsBreakdown.reasoning && (
                  <div className="pt-3">
                    <p className="text-sm text-muted-foreground italic">
                      {bncsBreakdown.reasoning}
                    </p>
                  </div>
                )}
              </div>
            )}

            {game.bncs_generated_at && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Generated {new Date(game.bncs_generated_at).toLocaleDateString()}
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
    </div>
  )
}

// Score bar component for BNCS breakdown
function ScoreBar({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  const percentage = ((value - 1) / 4) * 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
