'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Edit2 } from 'lucide-react'

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
      <Card>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
              <div className={`h-8 w-8 rounded-lg ${iconBgClass} flex items-center justify-center`}>
                {icon}
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {title}
                  {hasContent && <Badge variant="outline" className="text-xs">Has content</Badge>}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEditing}
                className="gap-1"
              >
                <Edit2 className="h-3 w-3" />
                {isEditing ? 'View' : 'Edit'}
              </Button>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {isEditing ? editContent : viewContent}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
