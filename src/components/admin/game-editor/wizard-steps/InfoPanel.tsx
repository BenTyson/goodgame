'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PanelVariant = 'muted' | 'primary' | 'accent'

const variants: Record<PanelVariant, string> = {
  muted: 'bg-muted/50 border-border',
  primary: 'bg-primary/5 border-primary/20',
  accent: 'bg-blue-500/5 border-blue-500/20',
}

interface InfoPanelProps {
  variant?: PanelVariant
  icon?: ReactNode
  title?: string
  children: ReactNode
  className?: string
}

export function InfoPanel({ variant = 'muted', icon, title, children, className }: InfoPanelProps) {
  return (
    <div className={cn('rounded-lg border p-4', variants[variant], className)}>
      {(icon || title) && (
        <div className="flex items-center gap-2 mb-2">
          {icon}
          {title && <span className="text-sm font-medium">{title}</span>}
        </div>
      )}
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}

// Compact variant for inline info
interface InfoChipProps {
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function InfoChip({ icon, children, className }: InfoChipProps) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md',
      'bg-muted/60 text-sm text-muted-foreground',
      className
    )}>
      {icon}
      {children}
    </div>
  )
}
