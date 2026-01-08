import { Baby, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface AgeRatingProps {
  /** Minimum recommended age */
  age: number
  /** Display variant */
  variant?: 'default' | 'compact' | 'badge'
  /** Show tooltip with more info */
  showTooltip?: boolean
  className?: string
}

// Age tier classification
function getAgeTier(age: number): { label: string; icon: React.ReactNode; color: string } {
  if (age <= 6) {
    return {
      label: 'Young Kids',
      icon: <Baby className="h-4 w-4" />,
      color: 'text-green-600 dark:text-green-400 border-green-500/30 bg-green-500/5'
    }
  }
  if (age <= 10) {
    return {
      label: 'Kids',
      icon: <Baby className="h-4 w-4" />,
      color: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
    }
  }
  if (age <= 13) {
    return {
      label: 'Family',
      icon: <User className="h-4 w-4" />,
      color: 'text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/5'
    }
  }
  if (age <= 16) {
    return {
      label: 'Teen',
      icon: <User className="h-4 w-4" />,
      color: 'text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-500/5'
    }
  }
  return {
    label: 'Adult',
    icon: <User className="h-4 w-4" />,
    color: 'text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-500/5'
  }
}

export function AgeRating({
  age,
  variant = 'default',
  showTooltip = true,
  className
}: AgeRatingProps) {
  if (!age || age < 0) return null

  const tier = getAgeTier(age)

  const content = (
    <>
      {variant === 'badge' ? (
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5',
            tier.color,
            className
          )}
        >
          {tier.icon}
          <span>Ages {age}+</span>
        </Badge>
      ) : variant === 'compact' ? (
        <div className={cn('flex items-center gap-1.5 text-sm', className)}>
          <span className={tier.color}>{tier.icon}</span>
          <span className="font-medium">{age}+</span>
        </div>
      ) : (
        <div className={cn('flex items-center gap-2', className)}>
          <div className={cn(
            'flex items-center justify-center h-8 w-8 rounded-lg',
            tier.color.includes('bg-') ? '' : 'bg-muted'
          )}>
            <span className={tier.color.split(' ')[0]}>{tier.icon}</span>
          </div>
          <div>
            <div className="font-semibold">Ages {age}+</div>
            <div className="text-xs text-muted-foreground">{tier.label}</div>
          </div>
        </div>
      )}
    </>
  )

  if (showTooltip && variant !== 'default') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">{content}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Recommended for ages {age} and up</p>
            <p className="text-xs text-muted-foreground">{tier.label} game</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}
