'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { Icons } from './constants'

interface FilterSectionProps {
  id: string
  icon: LucideIcon
  label: string
  activeCount?: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function FilterSection({
  id,
  icon: Icon,
  label,
  activeCount = 0,
  isOpen,
  onOpenChange,
  children,
  className,
}: FilterSectionProps) {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      className={cn('border-b last:border-b-0', className)}
    >
      <CollapsibleTrigger
        className="flex w-full items-center justify-between py-3 px-1 text-sm font-medium hover:bg-accent/50 rounded-md transition-colors"
        aria-controls={`section-${id}-content`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
              {activeCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <Icons.chevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
        ) : (
          <Icons.chevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent
        id={`section-${id}-content`}
        className="overflow-hidden transition-all data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      >
        <div className="pb-3 pt-1 px-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
