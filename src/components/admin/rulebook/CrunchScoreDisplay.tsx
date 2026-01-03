'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cog, Calculator, Info } from 'lucide-react'
import type { CrunchBreakdown } from '@/lib/rulebook/types'
import { getCrunchLabel, getCrunchBadgeClasses } from '@/lib/rulebook/complexity-utils'
import { cn } from '@/lib/utils'

interface CrunchScoreDisplayProps {
  score: number
  breakdown: CrunchBreakdown | null
  generatedAt?: string | null
  bggReference?: number | null
}

/**
 * Calculate the raw AI score from breakdown dimensions
 * Uses the same weighted formula as complexity.ts
 */
function calculateAiScore(breakdown: CrunchBreakdown): number {
  const weighted =
    breakdown.rulesDensity * 1.5 +
    breakdown.learningCurve * 1.5 +
    breakdown.decisionSpace * 1.0 +
    breakdown.strategicDepth * 1.0 +
    breakdown.componentComplexity * 1.0

  return Math.round((weighted / 6.0) * 10) / 10
}

/**
 * Normalize BGG weight (1-5) to Crunch scale (1-10)
 */
function normalizeBGGWeight(bggWeight: number): number {
  const normalized = (bggWeight - 1) / 4 * 9 + 1
  return Math.round(normalized * 10) / 10
}

// Score bar component for Crunch breakdown (1-10 scale)
function ScoreBar({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  // 1-10 scale: percentage = (value - 1) / 9 * 100
  const percentage = ((value - 1) / 9) * 100

  // Color based on value
  const getBarColor = (val: number) => {
    if (val <= 3) return 'bg-emerald-500'
    if (val <= 5) return 'bg-blue-500'
    if (val <= 7) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getBarColor(value))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

export function CrunchScoreDisplay({ score, breakdown, generatedAt, bggReference }: CrunchScoreDisplayProps) {
  // Calculate the raw AI score from breakdown if available
  const aiScore = breakdown ? calculateAiScore(breakdown) : null
  const bggNormalized = bggReference ? normalizeBGGWeight(bggReference) : null

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center ring-1 ring-inset ring-amber-500/20">
          <Cog className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Crunch Score</h3>
          <p className="text-sm text-muted-foreground">AI complexity analysis</p>
        </div>
      </div>

      <CardContent className="pt-5 space-y-5">
        {/* Score Display */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="text-5xl font-bold tabular-nums text-primary">
              {Number(score).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground text-center mt-1">/ 10</div>
          </div>
          <div className="flex-1">
            <Badge className={cn('text-sm px-3 py-1', getCrunchBadgeClasses(Number(score)))}>
              {getCrunchLabel(Number(score))}
            </Badge>
            {generatedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Generated {new Date(generatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Calibration Info */}
        {aiScore !== null && bggReference != null && bggNormalized !== null && (
          <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              Score Calculation
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AI Analysis</span>
                <span className="font-mono">{aiScore.toFixed(1)} × 85%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">BGG Weight</span>
                <span className="font-mono">{bggNormalized.toFixed(1)} × 15%</span>
              </div>
            </div>
          </div>
        )}

        {/* Pure AI notice */}
        {aiScore !== null && bggReference == null && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            Pure AI analysis (no BGG calibration)
          </div>
        )}

        {/* Breakdown */}
        {breakdown && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold">Complexity Dimensions</h4>
            <div className="grid gap-4">
              <ScoreBar
                label="Rules Density"
                value={breakdown.rulesDensity}
                description="Volume of rules to learn"
              />
              <ScoreBar
                label="Decision Space"
                value={breakdown.decisionSpace}
                description="Choices available per turn"
              />
              <ScoreBar
                label="Learning Curve"
                value={breakdown.learningCurve}
                description="Time to understand basics"
              />
              <ScoreBar
                label="Strategic Depth"
                value={breakdown.strategicDepth}
                description="Difficulty to master"
              />
              <ScoreBar
                label="Component Complexity"
                value={breakdown.componentComplexity}
                description="Game state tracking overhead"
              />
            </div>

            {breakdown.reasoning && (
              <p className="text-sm text-muted-foreground italic pt-2 border-t">
                {breakdown.reasoning}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Legacy export for backward compatibility
export { CrunchScoreDisplay as BNCSScoreDisplay }
