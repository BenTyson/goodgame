'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  PenTool,
  BookOpen,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type { BNCSBreakdown } from '@/lib/rulebook/types'
import { BNCSScoreDisplay } from '@/components/admin/rulebook'

interface ParseGenerateStepProps {
  game: Game
  onComplete: () => void
  onSkip: () => void
}

type StepPhase = 'ready' | 'parsing' | 'parsed' | 'generating' | 'complete' | 'resetting'

export function ParseGenerateStep({ game, onComplete, onSkip }: ParseGenerateStepProps) {
  const [phase, setPhase] = useState<StepPhase>('ready')
  const [parseResult, setParseResult] = useState<{
    success: boolean
    wordCount?: number
    pageCount?: number
    bncsScore?: number
    error?: string
  } | null>(null)
  const [contentResult, setContentResult] = useState<{
    success: boolean
    error?: string
  } | null>(null)
  const [contentModel, setContentModel] = useState<'sonnet' | 'haiku'>('sonnet')
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  const bncsBreakdown = game.bncs_breakdown as BNCSBreakdown | null
  const bncsScore = game.bncs_score
  const hasContent = game.has_rules && game.has_setup_guide && game.has_reference

  // Check if step is already complete
  useEffect(() => {
    if (bncsScore && hasContent) {
      setPhase('complete')
      onComplete()
    } else if (bncsScore) {
      setPhase('parsed')
    }
  }, [bncsScore, hasContent, onComplete])

  const parseRulebook = async () => {
    if (!game.rulebook_url) return

    setPhase('parsing')
    setParseResult(null)

    try {
      const response = await fetch('/api/admin/rulebook/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          url: game.rulebook_url,
        }),
      })

      const result = await response.json()
      setParseResult(result)

      if (result.success && result.bncsScore) {
        setPhase('parsed')
        // Reload to get updated BNCS data
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setPhase('ready')
      }
    } catch (error) {
      setParseResult({
        success: false,
        error: error instanceof Error ? error.message : 'Parsing failed',
      })
      setPhase('ready')
    }
  }

  const generateContent = async () => {
    if (!game.rulebook_url) return

    setPhase('generating')
    setContentResult(null)

    try {
      const response = await fetch('/api/admin/rulebook/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          contentTypes: ['rules', 'setup', 'reference'],
          model: contentModel,
        }),
      })

      const result = await response.json()
      setContentResult(result)

      if (result.success) {
        setPhase('complete')
        onComplete()
        // Reload to get updated content
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setPhase('parsed')
      }
    } catch (error) {
      setContentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Content generation failed',
      })
      setPhase('parsed')
    }
  }

  const runFullPipeline = async () => {
    await parseRulebook()
    // Note: generateContent will be called after reload if parse succeeds
  }

  const resetContent = async (options: {
    resetRulebook?: boolean
    resetBNCS?: boolean
    resetContent?: boolean
    resetTaxonomy?: boolean
    resetAll?: boolean
  }) => {
    const previousPhase = phase
    setPhase('resetting')
    setResetMessage(null)

    try {
      const response = await fetch(`/api/admin/games/${game.id}/reset-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        throw new Error('Reset failed')
      }

      const result = await response.json()
      const parts = []
      if (result.reset.rulebook) parts.push('rulebook')
      if (result.reset.bncs) parts.push('BNCS')
      if (result.reset.content) parts.push('content')
      if (result.reset.taxonomy) parts.push('taxonomy')

      setResetMessage(`Reset ${parts.join(', ')} successfully. Reloading...`)
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      setResetMessage('Reset failed. Please try again.')
      setPhase(previousPhase)
    }
  }

  // Calculate progress
  const getProgress = () => {
    switch (phase) {
      case 'ready': return 0
      case 'parsing': return 25
      case 'parsed': return 50
      case 'generating': return 75
      case 'complete': return 100
      case 'resetting': return 0
    }
  }

  const hasAnyContent = bncsScore || hasContent

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Parse Rulebook & Generate Content</CardTitle>
              <CardDescription>
                Extract text from the PDF, analyze complexity, and generate game guides.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* No rulebook warning */}
          {!game.rulebook_url && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">No rulebook URL set</p>
                <p>Go back to Step 1 to add a rulebook URL, or skip this step.</p>
              </div>
            </div>
          )}

          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{getProgress()}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>

          {/* Step status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={bncsScore ? 'default' : 'outline'} className="gap-1">
              {bncsScore ? <CheckCircle2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              PDF Parsed
            </Badge>
            <Badge variant={bncsScore ? 'default' : 'outline'} className="gap-1">
              {bncsScore ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              BNCS Score
            </Badge>
            <Badge variant={game.has_rules ? 'default' : 'outline'} className="gap-1">
              {game.has_rules ? <CheckCircle2 className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
              Rules
            </Badge>
            <Badge variant={game.has_setup_guide ? 'default' : 'outline'} className="gap-1">
              {game.has_setup_guide ? <CheckCircle2 className="h-3 w-3" /> : <PenTool className="h-3 w-3" />}
              Setup Guide
            </Badge>
            <Badge variant={game.has_reference ? 'default' : 'outline'} className="gap-1">
              {game.has_reference ? <CheckCircle2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              Quick Reference
            </Badge>
          </div>

          {/* Model Selection (show when ready to generate content) */}
          {bncsScore && !hasContent && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <Label className="text-sm font-medium">AI Model:</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={contentModel === 'sonnet' ? 'default' : 'outline'}
                  onClick={() => setContentModel('sonnet')}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Sonnet
                  <span className="text-xs opacity-70">~$0.23</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={contentModel === 'haiku' ? 'default' : 'outline'}
                  onClick={() => setContentModel('haiku')}
                  className="gap-1.5"
                >
                  Haiku
                  <span className="text-xs opacity-70">~$0.02</span>
                </Button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {!bncsScore && (
              <Button
                onClick={runFullPipeline}
                disabled={!game.rulebook_url || phase === 'parsing' || phase === 'resetting'}
                className="gap-2"
              >
                {phase === 'parsing' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Parse & Generate BNCS
              </Button>
            )}
            {bncsScore && !hasContent && (
              <Button
                onClick={generateContent}
                disabled={phase === 'generating' || phase === 'resetting'}
                className="gap-2"
              >
                {phase === 'generating' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PenTool className="h-4 w-4" />
                )}
                Generate All Content
              </Button>
            )}

            {/* Reset dropdown */}
            {hasAnyContent && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={phase === 'resetting'}
                    className="gap-2"
                  >
                    {phase === 'resetting' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Reset
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => resetContent({ resetBNCS: true })}>
                    Reset BNCS Score Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => resetContent({ resetContent: true })}>
                    Reset Generated Content Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => resetContent({ resetTaxonomy: true })}>
                    Reset Taxonomy Only
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => resetContent({ resetAll: true })}
                    className="text-destructive"
                  >
                    Reset Everything
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Reset message */}
          {resetMessage && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
              <RotateCcw className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">{resetMessage}</div>
            </div>
          )}

          {/* Error messages */}
          {parseResult && !parseResult.success && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">{parseResult.error}</div>
            </div>
          )}
          {contentResult && !contentResult.success && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">{contentResult.error}</div>
            </div>
          )}

          {/* Parse success info */}
          {parseResult?.success && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Parsing complete!</p>
                <p>
                  {parseResult.pageCount} pages, {parseResult.wordCount?.toLocaleString()} words
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BNCS Score Display */}
      {bncsScore && (
        <BNCSScoreDisplay
          score={Number(bncsScore)}
          breakdown={bncsBreakdown}
          generatedAt={game.bncs_generated_at}
        />
      )}
    </div>
  )
}
