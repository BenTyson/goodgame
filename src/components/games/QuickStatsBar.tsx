'use client'

import { Users, Clock, Brain, User } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getComplexityLabel } from '@/lib/utils/complexity'
import type { CrunchBreakdown, Json, ComplexityTier } from '@/types/database'

interface QuickStatsBarProps {
  playerCountMin: number
  playerCountMax: number
  playerCountBest?: number[] | null
  playTimeMin?: number | null
  playTimeMax?: number | null
  crunchScore?: number | null
  crunchBreakdown?: Json | null
  weight?: number | null
  complexityTier?: ComplexityTier | null
  minAge?: number | null
  className?: string
}

export function QuickStatsBar({
  playerCountMin,
  playerCountMax,
  playerCountBest,
  playTimeMin,
  playTimeMax,
  crunchScore,
  weight,
  complexityTier,
  minAge,
  className,
}: QuickStatsBarProps) {
  // Format player count
  const playerText = playerCountMin === playerCountMax
    ? `${playerCountMin} Player${playerCountMin !== 1 ? 's' : ''}`
    : `${playerCountMin}-${playerCountMax} Players`

  // Format play time
  const timeText = playTimeMin
    ? playTimeMin === playTimeMax
      ? `${playTimeMin} min`
      : `${playTimeMin}-${playTimeMax} min`
    : null

  // Get complexity info (prefer crunch score over BGG weight)
  const hasComplexity = crunchScore || weight
  const complexityLabel = crunchScore
    ? getComplexityLabel(crunchScore)
    : complexityTier?.name || null

  // Build stats array
  const stats: Array<{
    icon: React.ReactNode
    text: string
    tooltip?: string
  }> = []

  stats.push({
    icon: <Users className="h-4 w-4" />,
    text: playerText,
    tooltip: playerCountBest?.length
      ? `Best with ${playerCountBest.join(', ')} players`
      : undefined,
  })

  if (timeText) {
    stats.push({
      icon: <Clock className="h-4 w-4" />,
      text: timeText,
    })
  }

  if (hasComplexity && complexityLabel) {
    stats.push({
      icon: <Brain className="h-4 w-4" />,
      text: complexityLabel,
      tooltip: crunchScore
        ? `Complexity: ${crunchScore.toFixed(1)}/10 (AI-analyzed)`
        : weight
        ? `BGG Weight: ${weight.toFixed(1)}/5`
        : undefined,
    })
  }

  if (minAge) {
    stats.push({
      icon: <User className="h-4 w-4" />,
      text: `${minAge}+`,
      tooltip: `Recommended for ages ${minAge} and up`,
    })
  }

  return (
    <TooltipProvider>
      <div className={cn('flex flex-wrap items-center gap-x-6 gap-y-2', className)}>
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-x-1.5">
            {stat.tooltip ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 cursor-help text-muted-foreground hover:text-foreground transition-colors">
                    {stat.icon}
                    <span className="text-sm font-medium text-foreground">{stat.text}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stat.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {stat.icon}
                <span className="text-sm font-medium text-foreground">{stat.text}</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}
