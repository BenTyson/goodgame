'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  Clock,
  Truck,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  ChevronRight,
  Loader2,
  CreditCard,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { ActionRequiredItem as ActionRequiredItemType } from '@/types/marketplace'

interface ActionRequiredItemProps {
  item: ActionRequiredItemType
  onAction?: () => void
}

const urgencyStyles = {
  high: {
    border: 'border-l-4 border-l-red-500',
    bg: 'bg-red-50/50 dark:bg-red-950/30',
    icon: 'text-red-500 dark:text-red-400',
  },
  medium: {
    border: 'border-l-4 border-l-amber-500',
    bg: 'bg-amber-50/50 dark:bg-amber-950/30',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  low: {
    border: 'border-l-4 border-l-blue-500',
    bg: 'bg-blue-50/50 dark:bg-blue-950/30',
    icon: 'text-blue-500 dark:text-blue-400',
  },
}

const typeIcons = {
  offer_pending: Clock,
  transaction_ship: Truck,
  feedback_pending: MessageSquare,
  listing_expiring: AlertCircle,
  payment_setup: CreditCard,
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function ActionRequiredItemCard({ item, onAction }: ActionRequiredItemProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null)

  const styles = urgencyStyles[item.urgency]
  const Icon = typeIcons[item.type]

  const handleOfferAction = async (action: 'accept' | 'decline') => {
    if (!item.offerId) return

    setIsLoading(true)
    setActionType(action)

    try {
      const response = await fetch(`/api/marketplace/offers/${item.offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('Failed to process offer')
      }

      router.refresh()
      onAction?.()
    } catch (error) {
      console.error('Error processing offer:', error)
    } finally {
      setIsLoading(false)
      setActionType(null)
    }
  }

  return (
    <Card className={cn('overflow-hidden', styles.border, styles.bg)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Game Image */}
          {item.gameImage && (
            <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              <Image
                src={item.gameImage}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn('h-4 w-4 flex-shrink-0', styles.icon)} />
                  <h4 className="font-medium truncate">{item.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {item.subtitle}
                </p>
                {item.amountCents && (
                  <p className="text-sm font-semibold mt-1">
                    {formatCurrency(item.amountCents)}
                  </p>
                )}
                {item.expiresAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires {formatDistanceToNow(new Date(item.expiresAt), { addSuffix: true })}
                  </p>
                )}
              </div>

              {/* User Avatar */}
              {item.otherUserAvatar && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={item.otherUserAvatar} alt={item.otherUserName || ''} />
                  <AvatarFallback>
                    {(item.otherUserName || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              {item.type === 'offer_pending' && item.offerId ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleOfferAction('accept')}
                    disabled={isLoading}
                    className="gap-1"
                  >
                    {isLoading && actionType === 'accept' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOfferAction('decline')}
                    disabled={isLoading}
                    className="gap-1"
                  >
                    {isLoading && actionType === 'decline' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Decline
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={item.ctaHref}>
                      Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </>
              ) : (
                <Button size="sm" asChild>
                  <Link href={item.ctaHref}>
                    {item.ctaLabel}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
