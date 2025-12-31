'use client'

import Link from 'next/link'
import {
  Plus,
  Package,
  Tag,
  MessageCircle,
  DollarSign,
  Bookmark,
  Settings,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuickAction {
  icon: React.ElementType
  label: string
  href: string
  variant?: 'default' | 'outline' | 'ghost'
  primary?: boolean
}

const quickActions: QuickAction[] = [
  {
    icon: Plus,
    label: 'New Listing',
    href: '/marketplace/listings/new',
    primary: true,
  },
  {
    icon: Package,
    label: 'My Listings',
    href: '/marketplace/my-listings',
    variant: 'outline',
  },
  {
    icon: Tag,
    label: 'Offers',
    href: '/marketplace/offers',
    variant: 'outline',
  },
  {
    icon: DollarSign,
    label: 'Transactions',
    href: '/marketplace/transactions',
    variant: 'outline',
  },
  {
    icon: MessageCircle,
    label: 'Messages',
    href: '/marketplace/messages',
    variant: 'outline',
  },
  {
    icon: Bookmark,
    label: 'Saved Searches',
    href: '/marketplace/saved-searches',
    variant: 'outline',
  },
]

export function QuickActionsPanel() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.href}
              variant={action.primary ? 'default' : 'outline'}
              size="sm"
              className="h-auto py-3 flex-col gap-1"
              asChild
            >
              <Link href={action.href}>
                <Icon className="h-5 w-5" />
                <span className="text-xs">{action.label}</span>
              </Link>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
