'use client'

import { cn } from '@/lib/utils'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import {
  type Phase,
  type VecnaState,
  PHASE_CONFIG,
  getPhaseForState,
  isBlockedState,
  isProcessingState,
} from '@/lib/vecna'

// Re-export isProcessingState is from pipeline.ts, isBlockedState from types.ts

interface PipelineProgressBarProps {
  state: VecnaState
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
}

const phases: Phase[] = ['import', 'parse', 'generate', 'publish']

export function PipelineProgressBar({
  state,
  className,
  size = 'md',
  showLabels = true,
}: PipelineProgressBarProps) {
  const currentPhase = getPhaseForState(state)
  const currentPhaseIndex = phases.indexOf(currentPhase)
  const isBlocked = isBlockedState(state)
  const isProcessing = isProcessingState(state)
  const isComplete = state === 'published'

  // Size configurations
  const sizeConfig = {
    sm: {
      circle: 'w-5 h-5',
      icon: 'w-3 h-3',
      line: 'h-0.5',
      text: 'text-[10px]',
      gap: 'gap-1',
    },
    md: {
      circle: 'w-7 h-7',
      icon: 'w-4 h-4',
      line: 'h-1',
      text: 'text-xs',
      gap: 'gap-1.5',
    },
    lg: {
      circle: 'w-9 h-9',
      icon: 'w-5 h-5',
      line: 'h-1.5',
      text: 'text-sm',
      gap: 'gap-2',
    },
  }

  const config = sizeConfig[size]

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => {
          const phaseIndex = index
          const isPhaseComplete = isComplete || phaseIndex < currentPhaseIndex
          const isCurrentPhase = phaseIndex === currentPhaseIndex
          const isPending = phaseIndex > currentPhaseIndex

          return (
            <div key={phase} className="flex items-center flex-1 last:flex-none">
              {/* Phase circle */}
              <div className={cn('flex flex-col items-center', config.gap)}>
                <div
                  className={cn(
                    'rounded-full flex items-center justify-center transition-all',
                    config.circle,
                    // Complete
                    isPhaseComplete && 'bg-green-500 text-white',
                    // Current + blocked
                    isCurrentPhase && isBlocked && 'bg-amber-500 text-white',
                    // Current + processing
                    isCurrentPhase && isProcessing && 'bg-primary text-white',
                    // Current (normal)
                    isCurrentPhase && !isBlocked && !isProcessing && 'bg-primary text-white',
                    // Pending
                    isPending && 'bg-muted text-muted-foreground border-2 border-muted-foreground/20'
                  )}
                >
                  {isPhaseComplete && <Check className={config.icon} />}
                  {isCurrentPhase && isBlocked && <AlertCircle className={config.icon} />}
                  {isCurrentPhase && isProcessing && (
                    <Loader2 className={cn(config.icon, 'animate-spin')} />
                  )}
                  {isCurrentPhase && !isBlocked && !isProcessing && (
                    <span className={cn('font-bold', config.text)}>{index + 1}</span>
                  )}
                  {isPending && (
                    <span className={cn('font-medium', config.text)}>{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                {showLabels && (
                  <span
                    className={cn(
                      'font-medium whitespace-nowrap',
                      config.text,
                      isPhaseComplete && 'text-green-600',
                      isCurrentPhase && isBlocked && 'text-amber-600',
                      isCurrentPhase && !isBlocked && 'text-primary',
                      isPending && 'text-muted-foreground'
                    )}
                  >
                    {PHASE_CONFIG[phase].label}
                  </span>
                )}
              </div>

              {/* Connecting line */}
              {index < phases.length - 1 && (
                <div
                  className={cn(
                    'flex-1 mx-2 rounded-full transition-colors',
                    config.line,
                    isPhaseComplete ? 'bg-green-500' : 'bg-muted'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Compact variant for sidebar/list items
export function PipelineProgressDots({
  state,
  className,
}: {
  state: VecnaState
  className?: string
}) {
  const currentPhase = getPhaseForState(state)
  const currentPhaseIndex = phases.indexOf(currentPhase)
  const isBlocked = isBlockedState(state)
  const isComplete = state === 'published'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {phases.map((phase, index) => {
        const isPhaseComplete = isComplete || index < currentPhaseIndex
        const isCurrentPhase = index === currentPhaseIndex

        return (
          <div
            key={phase}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              isPhaseComplete && 'bg-green-500',
              isCurrentPhase && isBlocked && 'bg-amber-500',
              isCurrentPhase && !isBlocked && 'bg-primary',
              !isPhaseComplete && !isCurrentPhase && 'bg-muted'
            )}
            title={PHASE_CONFIG[phase].label}
          />
        )
      })}
    </div>
  )
}
