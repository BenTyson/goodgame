'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { CardTitle, CardDescription } from '@/components/ui/card'

type IconColorVariant =
  | 'primary'
  | 'blue'
  | 'green'
  | 'amber'
  | 'red'
  | 'purple'
  | 'violet'
  | 'cyan'
  | 'slate'

interface CardHeaderWithIconProps {
  icon: LucideIcon
  iconColor: IconColorVariant
  title: string
  description?: string
  badge?: ReactNode
  action?: ReactNode
}

// Static color mappings for Tailwind JIT (can't use dynamic class names)
const iconColorClasses: Record<IconColorVariant, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  green: { bg: 'bg-green-500/10', text: 'text-green-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  red: { bg: 'bg-red-500/10', text: 'text-red-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-500' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-500' },
}

/**
 * Shared card header component with icon, title, description, and optional badge/action
 * Used across admin tabs for consistent card styling
 *
 * @example
 * <CardHeaderWithIcon
 *   icon={Workflow}
 *   iconColor="primary"
 *   title="Vecna Pipeline Status"
 *   description="Content processing state and history"
 *   action={<Button>Open</Button>}
 * />
 */
export function CardHeaderWithIcon({
  icon: Icon,
  iconColor,
  title,
  description,
  badge,
  action,
}: CardHeaderWithIconProps) {
  const colors = iconColorClasses[iconColor]

  return (
    <div className="flex items-center gap-2">
      <div className={`h-8 w-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
        <Icon className={`h-4 w-4 ${colors.text}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          {badge}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </div>
      {action}
    </div>
  )
}
