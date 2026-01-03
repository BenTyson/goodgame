'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
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
  Loader2,
  FileText,
  Sparkles,
  Tags,
  RotateCcw,
  ChevronDown,
  Cpu,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type { CrunchBreakdown } from '@/lib/rulebook/types'
import { CrunchScoreDisplay } from '@/components/admin/rulebook'
import { WizardStepHeader } from './WizardStepHeader'
import { StatusAlert } from './StatusAlert'
import { InfoPanel } from './InfoPanel'

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
    crunchError?: string
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

      // Consider step complete if PDF was successfully parsed (wordCount exists)
      const parsedSuccessfully = result.success && result.wordCount > 0

      if (parsedSuccessfully) {
        setPhase('complete')
        onComplete()
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
  }, [game.id, game.rulebook_url, router, onComplete])

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
            <StatusAlert variant="warning" title="No rulebook URL set">
              Go back to Step 1 to add a rulebook URL, or skip this step.
            </StatusAlert>
          )}

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={crunchScore ? 'default' : 'outline'}
              className="gap-1.5 px-3 py-1"
            >
              {crunchScore ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              PDF Parsed
            </Badge>
            <Badge
              variant={crunchScore ? 'default' : 'outline'}
              className="gap-1.5 px-3 py-1"
            >
              {crunchScore ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Crunch Score
            </Badge>
            <Badge
              variant={game.rulebook_parsed_at ? 'default' : 'outline'}
              className="gap-1.5 px-3 py-1"
            >
              {game.rulebook_parsed_at ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Tags className="h-3.5 w-3.5" />
              )}
              Taxonomy
            </Badge>
          </div>

          {/* Model info */}
          <InfoPanel
            icon={<Cpu className="h-4 w-4 text-muted-foreground" />}
            title="Claude Haiku"
          >
            Fast analysis, ~$0.02 per rulebook
          </InfoPanel>

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
            <StatusAlert variant="reset">
              {resetMessage}
            </StatusAlert>
          )}

          {/* Error messages */}
          {parseResult && !parseResult.success && (
            <StatusAlert variant="error" title="Analysis failed">
              {parseResult.error}
            </StatusAlert>
          )}

          {/* Parse success info */}
          {parseResult?.success && (
            <StatusAlert
              variant={parseResult.crunchError ? 'warning' : 'success'}
              title={parseResult.crunchError ? 'PDF parsed (crunch score failed)' : 'Analysis complete!'}
            >
              <div className="space-y-1">
                <p>{parseResult.pageCount} pages, {parseResult.wordCount?.toLocaleString()} words</p>
                {parseResult.taxonomy && (
                  <p>
                    Found {parseResult.taxonomy.themesCount} themes, {parseResult.taxonomy.experiencesCount} experiences
                  </p>
                )}
                {parseResult.crunchError && (
                  <p className="text-xs opacity-80 mt-1">
                    Crunch score calculation failed. You can retry or proceed without it.
                  </p>
                )}
              </div>
            </StatusAlert>
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
