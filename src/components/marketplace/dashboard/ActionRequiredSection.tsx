'use client'

import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActionRequiredItemCard } from './ActionRequiredItem'
import type { ActionRequiredItem } from '@/types/marketplace'

interface ActionRequiredSectionProps {
  items: ActionRequiredItem[]
  onAction?: () => void
}

export function ActionRequiredSection({ items, onAction }: ActionRequiredSectionProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <h3 className="font-medium text-lg">All caught up!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No pending actions at the moment.
          </p>
        </CardContent>
      </Card>
    )
  }

  const highPriority = items.filter(i => i.urgency === 'high')
  const otherItems = items.filter(i => i.urgency !== 'high')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold">
          Action Required ({items.length})
        </h2>
      </div>

      {/* High priority items */}
      {highPriority.length > 0 && (
        <div className="space-y-3">
          {highPriority.map((item) => (
            <ActionRequiredItemCard
              key={item.id}
              item={item}
              onAction={onAction}
            />
          ))}
        </div>
      )}

      {/* Other items */}
      {otherItems.length > 0 && (
        <div className="space-y-3">
          {highPriority.length > 0 && (
            <p className="text-sm text-muted-foreground pt-2">
              Other items
            </p>
          )}
          {otherItems.map((item) => (
            <ActionRequiredItemCard
              key={item.id}
              item={item}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}
