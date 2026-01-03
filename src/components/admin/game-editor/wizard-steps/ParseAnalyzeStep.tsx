'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileSearch,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Sparkles,
  Tags,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type { CrunchBreakdown } from '@/lib/rulebook/types'
import { CrunchScoreDisplay } from '@/components/admin/rulebook'
import { WizardStepHeader } from './WizardStepHeader'

interface ParseAnalyzeStepProps {
  game: Game
  onComplete: () => void
  onSkip: () => void
}

type StepPhase = 'ready' | 'parsing' | 'complete' | 'resetting'

export function ParseAnalyzeStep({ game, onComplete, onSkip }: ParseAnalyzeStepProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<StepPhase>('ready')
  const [parseResult, setParseResult] = useState<{
    success: boolean
    wordCount?: number
    pageCount?: number
    crunchScore?: number
    taxonomy?: {
      themesCount: number
      experiencesCount: number
      newSuggestionsCount: number
    }
    error?: string
  } | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  const crunchBreakdown = game.crunch_breakdown as CrunchBreakdown | null
  const crunchScore = game.crunch_score

  // Check if step is already complete (has crunch score)
  useEffect(() => {
    if (crunchScore) {
      setPhase('complete')
      onComplete()
    }
  }, [crunchScore, onComplete])

  const parseRulebook = useCallback(async () => {
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

      if (result.success && result.crunchScore) {
        setPhase('complete')
        // Refresh server data - useEffect will call onComplete when crunchScore updates
        router.refresh()
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
  }, [game.id, game.rulebook_url, router])

  const resetContent = useCallback(async (options: {
    resetCrunch?: boolean
    resetTaxonomy?: boolean
    resetAll?: boolean
  }) => {
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
      if (result.reset.crunch) parts.push('Crunch Score')
      if (result.reset.taxonomy) parts.push('taxonomy')

      setResetMessage(`Reset ${parts.join(', ')} successfully.`)
      setPhase('ready')
      router.refresh()
    } catch (error) {
      setResetMessage('Reset failed. Please try again.')
      setPhase('ready')
    }
  }, [game.id, router])

  const isComplete = !!crunchScore

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <Card>
        <WizardStepHeader
          stepNumber={2}
          title="Parse & Analyze Rulebook"
          description="Extract text from the PDF, calculate complexity score, and identify themes."
          icon={<FileSearch className="h-5 w-5" />}
          isComplete={isComplete}
          badge={crunchScore ? `Score: ${crunchScore}/10` : undefined}
        />
        <CardContent className="space-y-5 pt-0">
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

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={crunchScore ? 'default' : 'outline'} className="gap-1">
              {crunchScore ? <CheckCircle2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              PDF Parsed
            </Badge>
            <Badge variant={crunchScore ? 'default' : 'outline'} className="gap-1">
              {crunchScore ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              Crunch Score
            </Badge>
            <Badge variant={game.rulebook_parsed_at ? 'default' : 'outline'} className="gap-1">
              {game.rulebook_parsed_at ? <CheckCircle2 className="h-3 w-3" /> : <Tags className="h-3 w-3" />}
              Taxonomy Extracted
            </Badge>
          </div>

          {/* Model info */}
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <span className="font-medium">Using:</span> Claude Haiku (fast, ~$0.02)
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {!crunchScore && (
              <Button
                onClick={parseRulebook}
                disabled={!game.rulebook_url || phase === 'parsing' || phase === 'resetting'}
                className="gap-2"
              >
                {phase === 'parsing' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSearch className="h-4 w-4" />
                )}
                {phase === 'parsing' ? 'Analyzing...' : 'Parse & Analyze'}
              </Button>
            )}

            {/* Reset dropdown */}
            {crunchScore && (
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
                  <DropdownMenuItem onClick={() => resetContent({ resetCrunch: true })}>
                    Reset Crunch Score
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => resetContent({ resetTaxonomy: true })}>
                    Reset Taxonomy
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => resetContent({ resetCrunch: true, resetTaxonomy: true })}
                    className="text-destructive"
                  >
                    Reset Both
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

          {/* Parse success info */}
          {parseResult?.success && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium">Analysis complete!</p>
                <p>
                  {parseResult.pageCount} pages, {parseResult.wordCount?.toLocaleString()} words
                </p>
                {parseResult.taxonomy && (
                  <p>
                    Found {parseResult.taxonomy.themesCount} themes, {parseResult.taxonomy.experiencesCount} experiences
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crunch Score Display */}
      {crunchScore && (
        <CrunchScoreDisplay
          score={Number(crunchScore)}
          breakdown={crunchBreakdown}
          generatedAt={game.crunch_generated_at}
          bggReference={game.crunch_bgg_reference ? Number(game.crunch_bgg_reference) : undefined}
        />
      )}
    </div>
  )
}
