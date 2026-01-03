'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Edit2, Eye, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContentSectionProps {
  title: string
  icon: ReactNode
  iconBgClass: string
  hasContent: boolean
  defaultExpanded?: boolean
  viewContent: ReactNode
  editContent: ReactNode
}

export function ContentSection({
  title,
  icon,
  iconBgClass,
  hasContent,
  defaultExpanded = true,
  viewContent,
  editContent,
}: ContentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isEditing, setIsEditing] = useState(false)

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const toggleEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing((prev) => !prev)
  }, [])

  return (
    <Collapsible open={isExpanded} onOpenChange={toggleExpanded}>
      <Card className={cn(
        'transition-shadow',
        isExpanded && 'shadow-sm'
      )}>
        {/* Header */}
        <CollapsibleTrigger asChild>
          <div className={cn(
            'flex items-center gap-3 p-4 cursor-pointer transition-colors',
            'hover:bg-muted/30',
            isExpanded && 'border-b'
          )}>
            {/* Icon */}
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center ring-1 ring-inset ring-black/5',
              iconBgClass
            )}>
              {icon}
            </div>

            {/* Title + Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                {hasContent ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Circle className="h-3.5 w-3.5" />
                    Empty
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant={isEditing ? 'secondary' : 'ghost'}
                size="sm"
                onClick={toggleEditing}
                className="gap-1.5 h-8"
              >
                {isEditing ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </>
                ) : (
                  <>
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </>
                )}
              </Button>
              <ChevronDown className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isExpanded && 'rotate-180'
              )} />
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <CardContent className="pt-4 pb-5">
            {isEditing ? editContent : viewContent}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
