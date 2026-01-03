'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
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
  Loader2,
  BookOpen,
  ListChecks,
  FileText,
  Sparkles,
  RotateCcw,
  ChevronDown,
  Cpu,
  Zap,
} from 'lucide-react'
import type { Game } from '@/types/database'
import { WizardStepHeader } from './WizardStepHeader'
import { StatusAlert } from './StatusAlert'
import { InfoPanel } from './InfoPanel'
import { cn } from '@/lib/utils'

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
      <WizardStepHeader
        stepNumber={4}
        title="Generate Content"
        description="Create rules summary, setup guide, and quick reference from the parsed rulebook."
        icon={<PenTool className="h-5 w-5" />}
        isComplete={!!hasAllContent}
      />
      <CardContent className="space-y-5 pt-0">
        {/* No parsed text warning */}
        {!hasParsedText && (
          <StatusAlert variant="warning" title="Rulebook not parsed yet">
            Go back to Step 2 to parse the rulebook first, or skip this step.
          </StatusAlert>
        )}

        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={hasRules ? 'default' : 'outline'}
            className="gap-1.5 px-3 py-1"
          >
            {hasRules ? <CheckCircle2 className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
            Rules Summary
          </Badge>
          <Badge
            variant={hasSetup ? 'default' : 'outline'}
            className="gap-1.5 px-3 py-1"
          >
            {hasSetup ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ListChecks className="h-3.5 w-3.5" />}
            Setup Guide
          </Badge>
          <Badge
            variant={hasReference ? 'default' : 'outline'}
            className="gap-1.5 px-3 py-1"
          >
            {hasReference ? <CheckCircle2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            Quick Reference
          </Badge>
        </div>

        {/* Model Selection */}
        {!hasAllContent && hasParsedText && (
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              AI Model
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setContentModel('sonnet')}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                  contentModel === 'sonnet'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    Sonnet
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">~$0.23, highest quality</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setContentModel('haiku')}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                  contentModel === 'haiku'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <div className="font-medium">Haiku</div>
                  <div className="text-xs text-muted-foreground">~$0.02, faster</div>
                </div>
              </button>
            </div>
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
          <StatusAlert variant="reset">
            {resetMessage}
          </StatusAlert>
        )}

        {/* Error messages */}
        {contentResult && !contentResult.success && (
          <StatusAlert variant="error" title="Generation failed">
            {contentResult.error}
          </StatusAlert>
        )}

        {/* Success message */}
        {contentResult?.success && (
          <StatusAlert variant="success" title="Content generated successfully!">
            Rules summary, setup guide, and quick reference are ready.
          </StatusAlert>
        )}

        {/* Complete state */}
        {hasAllContent && !contentResult && (
          <StatusAlert variant="success" title="All content generated">
            You can review the content in the next steps.
          </StatusAlert>
        )}
      </CardContent>
    </Card>
  )
}
