'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  PenTool,
  FileText,
  Eye,
  X,
} from 'lucide-react'

export interface ContentResult {
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
}

interface ContentGenerationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentResult: ContentResult | null
  gameSlug: string
}

export function ContentGenerationModal({
  open,
  onOpenChange,
  contentResult,
  gameSlug,
}: ContentGenerationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onOpenChange(false)
              window.location.reload()
            }}
          >
            Close & Refresh
          </Button>
          <Button
            onClick={() => window.open(`/games/${gameSlug}`, '_blank')}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Game Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
