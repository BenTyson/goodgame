'use client'

import { Check, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WizardStep } from '@/lib/admin/wizard'

export type { WizardStep }

interface WizardStepIndicatorProps {
  steps: WizardStep[]
  currentStep: number
  completedSteps: number[]
  skippedSteps?: number[]
  onStepClick?: (step: number) => void
  canNavigateToStep?: (step: number) => boolean
}

export function WizardStepIndicator({
  steps,
  currentStep,
  completedSteps,
  skippedSteps = [],
  onStepClick,
  canNavigateToStep,
}: WizardStepIndicatorProps) {
  const handleStepClick = (step: number) => {
    if (canNavigateToStep?.(step) !== false) {
      onStepClick?.(step)
    }
  }

  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const stepNumber = step.id
          const isComplete = completedSteps.includes(stepNumber)
          const isSkipped = skippedSteps.includes(stepNumber)
          const isCurrent = stepNumber === currentStep
          const canClick = canNavigateToStep?.(stepNumber) !== false && onStepClick

          return (
            <li key={step.id} className="relative flex-1 group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-[calc(50%+16px)] right-0 top-[18px] h-[2px] transition-colors',
                    isComplete ? 'bg-primary' : 'bg-border'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step button and label */}
              <button
                type="button"
                onClick={() => handleStepClick(stepNumber)}
                disabled={!canClick}
                className={cn(
                  'relative flex flex-col items-center w-full pt-0.5 pb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg transition-colors',
                  canClick && 'cursor-pointer',
                  !canClick && 'cursor-default'
                )}
              >
                {/* Circle */}
                <span
                  className={cn(
                    'relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200',
                    // Complete
                    isComplete && 'bg-primary text-primary-foreground shadow-sm',
                    // Skipped
                    isSkipped && !isComplete && 'bg-muted text-muted-foreground border-2 border-dashed',
                    // Current
                    isCurrent && !isComplete && !isSkipped && 'bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20',
                    // Future
                    !isComplete && !isSkipped && !isCurrent && 'bg-muted/80 text-muted-foreground border border-border',
                    // Hover
                    canClick && !isCurrent && 'group-hover:ring-2 group-hover:ring-primary/30'
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : isSkipped ? (
                    <SkipForward className="h-3.5 w-3.5" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </span>

                {/* Labels */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors',
                    isCurrent && 'text-foreground',
                    isComplete && !isCurrent && 'text-primary',
                    !isCurrent && !isComplete && 'text-muted-foreground',
                    canClick && 'group-hover:text-foreground'
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-[10px] text-muted-foreground mt-0.5 hidden md:block">
                    {step.description}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
