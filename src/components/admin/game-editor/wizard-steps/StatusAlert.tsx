'use client'

import type { ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertVariant = 'success' | 'error' | 'warning' | 'info' | 'reset'

const variants: Record<AlertVariant, {
  bg: string
  text: string
  icon: typeof CheckCircle2
}> = {
  success: {
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/20',
    text: 'text-red-700 dark:text-red-300',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    icon: Info,
  },
  reset: {
    bg: 'bg-slate-500/10 border-slate-500/20',
    text: 'text-slate-700 dark:text-slate-300',
    icon: RotateCcw,
  },
}

interface StatusAlertProps {
  variant: AlertVariant
  title?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function StatusAlert({ variant, title, children, className, action }: StatusAlertProps) {
  const { bg, text, icon: Icon } = variants[variant]

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-lg border', bg, text, className)}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
