'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Scale } from 'lucide-react'
import type { BNCSBreakdown } from '@/lib/rulebook/types'
import { getComplexityLabel } from '@/lib/rulebook/complexity-utils'

interface BNCSScoreDisplayProps {
  score: number
  breakdown: BNCSBreakdown | null
  generatedAt: string | null
}

// Badge-specific styling (different from complexity.ts which returns text-only colors)
function getComplexityBadgeClasses(score: number): string {
  if (score < 1.8) return 'bg-green-100 text-green-800'
  if (score < 2.5) return 'bg-teal-100 text-teal-800'
  if (score < 3.2) return 'bg-amber-100 text-amber-800'
  if (score < 4.0) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
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

export function BNCSScoreDisplay({ score, breakdown, generatedAt }: BNCSScoreDisplayProps) {
  return (
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
            {Number(score).toFixed(1)}
          </div>
          <div>
            <Badge className={getComplexityBadgeClasses(Number(score))}>
              {getComplexityLabel(Number(score))}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              out of 5.0
            </p>
          </div>
        </div>

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

        {generatedAt && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Generated {new Date(generatedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
