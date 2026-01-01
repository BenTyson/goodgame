'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  PenTool,
  X,
  Eye,
  Globe,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type { BNCSBreakdown } from '@/lib/rulebook/types'

interface Publisher {
  id: string
  name: string
  slug: string
  website: string | null
}

interface RulebookEditorProps {
  game: Game & { publishers_list?: Publisher[] }
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
    bncsScore?: number
    bncsError?: string
    error?: string
  } | null>(null)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [contentResult, setContentResult] = useState<{
    success: boolean
    generated?: { rules: boolean; setup: boolean; reference: boolean }
    content?: {
      rules?: {
        quickStartCount: number
        coreRulesCount: number
        turnStructureCount: number
        hasEndGameConditions: boolean
        hasWinCondition: boolean
        tipsCount: number
      }
      setup?: {
        stepsCount: number
        componentsCount: number
        hasFirstPlayerRule: boolean
        quickTipsCount: number
        commonMistakesCount: number
      }
      reference?: {
        turnPhasesCount: number
        keyActionsCount: number
        importantRulesCount: number
        hasEndGame: boolean
        scoringCount: number
      }
    }
    errors?: { rules?: string; setup?: string; reference?: string }
    processingTimeMs?: number
    error?: string
  } | null>(null)
  const [showContentModal, setShowContentModal] = useState(false)
  const [parsedText, setParsedText] = useState<string | null>(null)
  const [loadingParsedText, setLoadingParsedText] = useState(false)
  const [showParsedText, setShowParsedText] = useState(false)
  const [copied, setCopied] = useState(false)

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

      // Only reload if BNCS was successfully generated
      if (result.success && result.bncsScore) {
        // Wait a moment so user can see the result
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

      // Show modal with content overview if successful
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

  const fetchParsedText = async () => {
    setLoadingParsedText(true)
    try {
      const response = await fetch(`/api/admin/rulebook/parsed-text?gameId=${game.id}`)
      const result = await response.json()
      if (result.text) {
        setParsedText(result.text)
        setShowParsedText(true)
      } else {
        setParsedText(null)
      }
    } catch (error) {
      console.error('Failed to fetch parsed text:', error)
      setParsedText(null)
    } finally {
      setLoadingParsedText(false)
    }
  }

  const copyParsedText = async () => {
    if (parsedText) {
      await navigator.clipboard.writeText(parsedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
          {/* Publisher Website Link */}
          {game.publishers_list && game.publishers_list.length > 0 && game.publishers_list.some(p => p.website) && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Publisher website - check for rulebook downloads:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {game.publishers_list.filter(p => p.website).map((publisher) => (
                    <a
                      key={publisher.id}
                      href={publisher.website!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {publisher.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

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
            <div className="space-y-2">
              <div
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  parseResult.success
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
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
                      {parseResult.bncsScore && (
                        <span className="ml-2 font-medium">
                          BNCS: {parseResult.bncsScore.toFixed(1)}
                        </span>
                      )}
                    </>
                  ) : (
                    parseResult.error
                  )}
                </div>
              </div>
              {parseResult.bncsError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong>BNCS Generation Failed:</strong> {parseResult.bncsError}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View Parsed Text */}
          {game.rulebook_parsed_at && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (parsedText) {
                    setShowParsedText(!showParsedText)
                  } else {
                    fetchParsedText()
                  }
                }}
                disabled={loadingParsedText}
                className="w-full sm:w-auto"
              >
                {loadingParsedText ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : showParsedText ? (
                  <ChevronUp className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-2" />
                )}
                {loadingParsedText ? 'Loading...' : showParsedText ? 'Hide Parsed Text' : 'View Parsed Text'}
              </Button>

              {showParsedText && parsedText && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {parsedText.length.toLocaleString()} characters
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyParsedText}
                      className="h-8"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-auto rounded-lg bg-muted p-4 font-mono text-xs whitespace-pre-wrap">
                    {parsedText}
                  </div>
                </div>
              )}

              {showParsedText && !parsedText && !loadingParsedText && (
                <div className="mt-3 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                  No parsed text found. Parse the rulebook first.
                </div>
              )}
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

      {/* Generate Content */}
      {game.bncs_score && (
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

            {contentResult && (
              <div className="space-y-2">
                <div
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    contentResult.success
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {contentResult.success ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm">
                    {contentResult.success && contentResult.generated ? (
                      <>
                        Generated content:
                        {contentResult.generated.rules && ' Rules'}
                        {contentResult.generated.setup && ' Setup'}
                        {contentResult.generated.reference && ' Reference'}
                      </>
                    ) : (
                      contentResult.error
                    )}
                  </div>
                </div>
                {contentResult.errors && Object.keys(contentResult.errors).length > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-amber-800">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Partial errors:</strong>
                      <ul className="mt-1 list-disc list-inside">
                        {contentResult.errors.rules && <li>Rules: {contentResult.errors.rules}</li>}
                        {contentResult.errors.setup && <li>Setup: {contentResult.errors.setup}</li>}
                        {contentResult.errors.reference && <li>Reference: {contentResult.errors.reference}</li>}
                      </ul>
                    </div>
                  </div>
                )}
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
      <Dialog open={showContentModal} onOpenChange={setShowContentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Content Generated Successfully
            </DialogTitle>
            <DialogDescription>
              Here&apos;s an overview of the content that was generated from the rulebook.
              {contentResult?.processingTimeMs && (
                <span className="ml-1">
                  (took {(contentResult.processingTimeMs / 1000).toFixed(1)}s)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Rules Content Summary */}
            {contentResult?.content?.rules && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Rules Summary
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    {contentResult.content.rules.quickStartCount} Quick Start Steps
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    {contentResult.content.rules.coreRulesCount} Core Rules Sections
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    {contentResult.content.rules.turnStructureCount} Turn Phases
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    {contentResult.content.rules.tipsCount} Tips
                  </div>
                  <div className="flex items-center gap-2">
                    {contentResult.content.rules.hasEndGameConditions ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    End Game Conditions
                  </div>
                  <div className="flex items-center gap-2">
                    {contentResult.content.rules.hasWinCondition ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    Win Condition
                  </div>
                </div>
              </div>
            )}

            {/* Setup Content Summary */}
            {contentResult?.content?.setup && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-green-500" />
                  Setup Guide
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    {contentResult.content.setup.stepsCount} Setup Steps
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    {contentResult.content.setup.componentsCount} Components
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    {contentResult.content.setup.quickTipsCount} Quick Tips
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    {contentResult.content.setup.commonMistakesCount} Common Mistakes
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    {contentResult.content.setup.hasFirstPlayerRule ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    First Player Rule
                  </div>
                </div>
              </div>
            )}

            {/* Reference Content Summary */}
            {contentResult?.content?.reference && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Quick Reference
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                    {contentResult.content.reference.turnPhasesCount} Turn Phases
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                    {contentResult.content.reference.keyActionsCount} Key Actions
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                    {contentResult.content.reference.importantRulesCount} Important Rules
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                    {contentResult.content.reference.scoringCount} Scoring Categories
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    {contentResult.content.reference.hasEndGame ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    End Game Summary
                  </div>
                </div>
              </div>
            )}

            {/* Errors if any */}
            {contentResult?.errors && Object.keys(contentResult.errors).length > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-amber-500">
                  <AlertCircle className="h-4 w-4" />
                  Generation Errors
                </h4>
                <ul className="text-sm text-amber-400 list-disc list-inside">
                  {contentResult.errors.rules && <li>Rules: {contentResult.errors.rules}</li>}
                  {contentResult.errors.setup && <li>Setup: {contentResult.errors.setup}</li>}
                  {contentResult.errors.reference && <li>Reference: {contentResult.errors.reference}</li>}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowContentModal(false)
                window.location.reload()
              }}
            >
              Close & Refresh
            </Button>
            <Button
              onClick={() => window.open(`/games/${game.slug}`, '_blank')}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View Game Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
