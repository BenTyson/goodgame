'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cog, Calculator } from 'lucide-react'
import type { CrunchBreakdown } from '@/lib/rulebook/types'
import { getCrunchLabel, getCrunchBadgeClasses } from '@/lib/rulebook/complexity-utils'

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

export function CrunchScoreDisplay({ score, breakdown, generatedAt, bggReference }: CrunchScoreDisplayProps) {
  // Calculate the raw AI score from breakdown if available
  const aiScore = breakdown ? calculateAiScore(breakdown) : null
  const bggNormalized = bggReference ? normalizeBGGWeight(bggReference) : null

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Cog className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Crunch Score</CardTitle>
            <CardDescription>
              AI-generated complexity rating from rulebook
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-primary">
            {Number(score).toFixed(1)}
          </div>
          <div>
            <Badge className={getCrunchBadgeClasses(Number(score))}>
              {getCrunchLabel(Number(score))}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              out of 10.0
            </p>
          </div>
        </div>

        {/* BGG Calibration Breakdown - show when BGG reference was used */}
        {aiScore !== null && bggReference != null && bggNormalized !== null && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Score Calculation</span>
            </div>
            <div className="font-mono text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">AI Analysis:</span>
                <span className="font-semibold">{aiScore.toFixed(1)}</span>
                <span className="text-muted-foreground">× 85%</span>
                <span>=</span>
                <span>{(aiScore * 0.85).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">BGG Weight:</span>
                <span className="font-semibold">{bggReference.toFixed(1)}</span>
                <span className="text-muted-foreground">→ {bggNormalized.toFixed(1)}</span>
                <span className="text-muted-foreground">× 15%</span>
                <span>=</span>
                <span>{(bggNormalized * 0.15).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t mt-1">
                <span className="text-muted-foreground">Final Score:</span>
                <span className="font-bold text-primary">{Number(score).toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Show pure AI score notice if no BGG reference */}
        {aiScore !== null && bggReference == null && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Pure AI analysis (no BGG calibration available)
              </span>
            </div>
          </div>
        )}

        {/* Breakdown */}
        {breakdown && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Complexity Breakdown</h4>
            <div className="grid gap-3">
              <ScoreBar
                label="Rules Density"
                value={breakdown.rulesDensity}
                description="Amount of rules to learn"
              />
              <ScoreBar
                label="Decision Space"
                value={breakdown.decisionSpace}
                description="Choices per turn"
              />
              <ScoreBar
                label="Learning Curve"
                value={breakdown.learningCurve}
                description="Time to understand"
              />
              <ScoreBar
                label="Strategic Depth"
                value={breakdown.strategicDepth}
                description="Mastery difficulty"
              />
              <ScoreBar
                label="Component Complexity"
                value={breakdown.componentComplexity}
                description="Game state tracking"
              />
            </div>

            {breakdown.reasoning && (
              <div className="pt-3">
                <p className="text-sm text-muted-foreground italic">
                  {breakdown.reasoning}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        {generatedAt && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Generated {new Date(generatedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Legacy export for backward compatibility
export { CrunchScoreDisplay as BNCSScoreDisplay }
