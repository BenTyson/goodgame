'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WizardStep {
  id: number
  title: string
  description?: string
}

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
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = step.id
          const isComplete = completedSteps.includes(stepNumber)
          const isSkipped = skippedSteps.includes(stepNumber)
          const isCurrent = stepNumber === currentStep
          const isPast = stepNumber < currentStep
          const canClick = canNavigateToStep?.(stepNumber) !== false && onStepClick

          return (
            <li key={step.id} className="relative flex-1">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-[calc(50%+20px)] right-[calc(-50%+20px)] top-4 h-0.5',
                    isComplete || isPast ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step */}
              <div className="relative flex flex-col items-center group">
                <button
                  type="button"
                  onClick={() => handleStepClick(stepNumber)}
                  disabled={!canClick}
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all',
                    isComplete && 'bg-primary text-primary-foreground',
                    isSkipped && 'bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground/50',
                    isCurrent && !isComplete && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isComplete && !isSkipped && !isCurrent && 'bg-muted text-muted-foreground',
                    canClick && 'cursor-pointer hover:ring-2 hover:ring-primary/30',
                    !canClick && 'cursor-default'
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </button>

                {/* Label */}
                <div className="mt-2 text-center">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isCurrent ? 'text-foreground' : 'text-muted-foreground',
                      isComplete && 'text-primary'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
