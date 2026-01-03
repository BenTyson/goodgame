'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  PenTool,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  ListChecks,
  FileText,
  Sparkles,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import type { Game } from '@/types/database'

interface GenerateContentStepProps {
  game: Game
  onComplete: () => void
  onSkip: () => void
}

type StepPhase = 'ready' | 'generating' | 'complete' | 'resetting'

export function GenerateContentStep({ game, onComplete, onSkip }: GenerateContentStepProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<StepPhase>('ready')
  const [contentModel, setContentModel] = useState<'sonnet' | 'haiku'>('sonnet')
  const [contentResult, setContentResult] = useState<{
    success: boolean
    error?: string
  } | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  const hasRules = game.has_rules
  const hasSetup = game.has_setup_guide
  const hasReference = game.has_reference
  const hasAllContent = hasRules && hasSetup && hasReference
  const hasParsedText = !!game.rulebook_parsed_at

  // Check if step is already complete
  useEffect(() => {
    if (hasAllContent) {
      setPhase('complete')
      onComplete()
    }
  }, [hasAllContent, onComplete])

  const generateContent = useCallback(async () => {
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
        // Refresh server data - useEffect will call onComplete when content flags update
        router.refresh()
      } else {
        setPhase('ready')
      }
    } catch (error) {
      setContentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Content generation failed',
      })
      setPhase('ready')
    }
  }, [game.id, contentModel, router])

  const resetContent = useCallback(async () => {
    setPhase('resetting')
    setResetMessage(null)

    try {
      const response = await fetch(`/api/admin/games/${game.id}/reset-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetContent: true }),
      })

      if (!response.ok) {
        throw new Error('Reset failed')
      }

      setResetMessage('Reset content successfully.')
      setPhase('ready')
      router.refresh()
    } catch (error) {
      setResetMessage('Reset failed. Please try again.')
      setPhase('ready')
    }
  }, [game.id, router])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <PenTool className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <CardTitle>Generate Content</CardTitle>
            <CardDescription>
              Create rules summary, setup guide, and quick reference from the parsed rulebook.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* No parsed text warning */}
        {!hasParsedText && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Rulebook not parsed yet</p>
              <p>Go back to Step 2 to parse the rulebook first, or skip this step.</p>
            </div>
          </div>
        )}

        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={hasRules ? 'default' : 'outline'} className="gap-1">
            {hasRules ? <CheckCircle2 className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
            Rules Summary
          </Badge>
          <Badge variant={hasSetup ? 'default' : 'outline'} className="gap-1">
            {hasSetup ? <CheckCircle2 className="h-3 w-3" /> : <ListChecks className="h-3 w-3" />}
            Setup Guide
          </Badge>
          <Badge variant={hasReference ? 'default' : 'outline'} className="gap-1">
            {hasReference ? <CheckCircle2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            Quick Reference
          </Badge>
        </div>

        {/* Model Selection */}
        {!hasAllContent && hasParsedText && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
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
                <span className="text-xs opacity-70">(Recommended)</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={contentModel === 'haiku' ? 'default' : 'outline'}
                onClick={() => setContentModel('haiku')}
                className="gap-1.5"
              >
                Haiku
                <span className="text-xs opacity-70">(Faster)</span>
              </Button>
            </div>
          </div>
        )}

        {/* Cost estimate */}
        {!hasAllContent && hasParsedText && (
          <div className="text-sm text-muted-foreground">
            Estimated cost: <span className="font-medium">{contentModel === 'sonnet' ? '~$0.23' : '~$0.02'}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {!hasAllContent && hasParsedText && (
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
              {phase === 'generating' ? 'Generating...' : 'Generate All Content'}
            </Button>
          )}

          {/* Reset button */}
          {hasAllContent && (
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
                  Reset Content
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={resetContent}
                  className="text-destructive"
                >
                  Reset All Generated Content
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
        {contentResult && !contentResult.success && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">{contentResult.error}</div>
          </div>
        )}

        {/* Success message */}
        {contentResult?.success && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Content generated successfully!</p>
              <p>Rules summary, setup guide, and quick reference are ready.</p>
            </div>
          </div>
        )}

        {/* Complete state */}
        {hasAllContent && !contentResult && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">All content generated</p>
              <p>You can review the content in the next steps.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
