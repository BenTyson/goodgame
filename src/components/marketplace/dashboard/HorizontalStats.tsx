'use client'

import { Package, Tag, AlertCircle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HorizontalStatsProps {
  activeListings: number
  pendingOffers: number
  actionRequired: number
  unreadMessages: number
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: number
  hasAlert?: boolean
}

function StatItem({ icon, label, value, hasAlert }: StatItemProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={cn(
        'text-muted-foreground',
        hasAlert && value > 0 && 'text-amber-600 dark:text-amber-400'
      )}>
        {icon}
      </span>
      <span className="text-muted-foreground hidden sm:inline">{label}</span>
      <span className={cn(
        'font-semibold',
        hasAlert && value > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
      )}>
        {value}
      </span>
    </div>
  )
}

export function HorizontalStats({
  activeListings,
  pendingOffers,
  actionRequired,
  unreadMessages,
}: HorizontalStatsProps) {
  return (
    <div className="flex items-center gap-6 text-sm py-2 px-1 border-b mb-4">
      <StatItem
        icon={<Package className="h-4 w-4" />}
        label="Listings"
        value={activeListings}
      />
      <StatItem
        icon={<Tag className="h-4 w-4" />}
        label="Offers"
        value={pendingOffers}
        hasAlert={pendingOffers > 0}
      />
      <StatItem
        icon={<AlertCircle className="h-4 w-4" />}
        label="Action"
        value={actionRequired}
        hasAlert={actionRequired > 0}
      />
      <StatItem
        icon={<MessageSquare className="h-4 w-4" />}
        label="Messages"
        value={unreadMessages}
        hasAlert={unreadMessages > 0}
      />
    </div>
  )
}
