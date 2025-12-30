'use client'

import * as React from 'react'
import {
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  Circle,
  DollarSign,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { TransactionStatus } from '@/types/marketplace'

interface TimelineStep {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  statuses: TransactionStatus[]
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    id: 'payment',
    label: 'Payment',
    description: 'Buyer completes payment',
    icon: CreditCard,
    statuses: ['pending_payment', 'payment_processing'],
  },
  {
    id: 'processing',
    label: 'Secured',
    description: 'Payment held in escrow',
    icon: DollarSign,
    statuses: ['payment_held'],
  },
  {
    id: 'shipped',
    label: 'Shipped',
    description: 'Item shipped by seller',
    icon: Truck,
    statuses: ['shipped'],
  },
  {
    id: 'delivered',
    label: 'Delivered',
    description: 'Delivery confirmed',
    icon: Package,
    statuses: ['delivered'],
  },
  {
    id: 'completed',
    label: 'Complete',
    description: 'Funds released',
    icon: CheckCircle,
    statuses: ['completed'],
  },
]

interface TransactionTimelineProps {
  status: TransactionStatus
  paidAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  releasedAt?: string | null
  className?: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TransactionTimeline({
  status,
  paidAt,
  shippedAt,
  deliveredAt,
  releasedAt,
  className,
}: TransactionTimelineProps) {
  // Find current step index
  const currentStepIndex = TIMELINE_STEPS.findIndex(step =>
    step.statuses.includes(status)
  )

  // Handle special statuses
  const isRefundOrCancelled = ['refund_requested', 'refunded', 'disputed', 'cancelled'].includes(status)

  return (
    <div className={cn('space-y-0', className)}>
      {TIMELINE_STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex || (index === currentStepIndex && status === 'completed')
        const isCurrent = index === currentStepIndex && status !== 'completed'
        const isPending = index > currentStepIndex

        const Icon = step.icon

        // Get timestamp for this step
        let timestamp: string | null = null
        if (step.id === 'payment' && paidAt) timestamp = formatDate(paidAt)
        if (step.id === 'shipped' && shippedAt) timestamp = formatDate(shippedAt)
        if (step.id === 'delivered' && deliveredAt) timestamp = formatDate(deliveredAt)
        if (step.id === 'completed' && releasedAt) timestamp = formatDate(releasedAt)

        return (
          <div key={step.id} className="flex gap-4">
            {/* Line and circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-primary text-primary-foreground',
                  isPending && 'bg-muted text-muted-foreground',
                  isRefundOrCancelled && isCurrent && 'bg-destructive text-destructive-foreground'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : isCurrent ? (
                  <Icon className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {/* Connecting line */}
              {index < TIMELINE_STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-12 -my-1',
                    index < currentStepIndex ? 'bg-green-500' : 'bg-muted'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-8 -mt-0.5">
              <p
                className={cn(
                  'font-medium',
                  isPending && 'text-muted-foreground'
                )}
              >
                {step.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
              {timestamp && (
                <p className="text-xs text-muted-foreground mt-1">
                  {timestamp}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
