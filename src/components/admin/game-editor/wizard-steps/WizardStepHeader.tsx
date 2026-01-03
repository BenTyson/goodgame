'use client'

import type { ReactNode } from 'react'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WizardStepHeaderProps {
  stepNumber: number
  title: string
  description: string
  icon: ReactNode
  isComplete?: boolean
  badge?: string
  action?: ReactNode
}

// Consistent color scheme per step
const stepColors: Record<number, { bg: string; text: string; ring: string }> = {
  1: { bg: 'bg-violet-500/10', text: 'text-violet-500', ring: 'ring-violet-500/20' },
  2: { bg: 'bg-blue-500/10', text: 'text-blue-500', ring: 'ring-blue-500/20' },
  3: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', ring: 'ring-indigo-500/20' },
  4: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', ring: 'ring-cyan-500/20' },
  5: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', ring: 'ring-emerald-500/20' },
  6: { bg: 'bg-teal-500/10', text: 'text-teal-500', ring: 'ring-teal-500/20' },
  7: { bg: 'bg-amber-500/10', text: 'text-amber-500', ring: 'ring-amber-500/20' },
  8: { bg: 'bg-green-500/10', text: 'text-green-500', ring: 'ring-green-500/20' },
}

export function WizardStepHeader({
  stepNumber,
  title,
  description,
  icon,
  isComplete,
  badge,
  action,
}: WizardStepHeaderProps) {
  const colors = stepColors[stepNumber] || stepColors[1]

  return (
    <CardHeader className="pb-4">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'h-11 w-11 rounded-xl flex items-center justify-center shrink-0',
            'ring-1',
            colors.bg,
            colors.ring,
            isComplete && 'bg-green-500/10 ring-green-500/20'
          )}
        >
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <span className={colors.text}>{icon}</span>
          )}
        </div>

        {/* Title & Description */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-lg">{title}</CardTitle>
            {badge && (
              <Badge variant="secondary" className="text-xs font-normal">
                {badge}
              </Badge>
            )}
          </div>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
        </div>

        {/* Optional Action */}
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </CardHeader>
  )
}

export { stepColors }
