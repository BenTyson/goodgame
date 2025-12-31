'use client'

import { Package, Tag, AlertCircle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarStatsProps {
  activeListings: number
  pendingOffers: number
  actionRequired: number
  unreadMessages: number
  isCollapsed?: boolean
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: number
  isCollapsed?: boolean
  variant?: 'default' | 'warning'
}

function StatItem({ icon, label, value, isCollapsed, variant = 'default' }: StatItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
        'hover:bg-muted',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? `${label}: ${value}` : undefined}
    >
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-md',
          variant === 'warning' && value > 0
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {icon}
      </div>
      {!isCollapsed && (
        <>
          <span className="flex-1 text-sm text-muted-foreground">{label}</span>
          <span
            className={cn(
              'text-sm font-semibold min-w-[24px] text-center',
              variant === 'warning' && value > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
            )}
          >
            {value}
          </span>
        </>
      )}
      {isCollapsed && value > 0 && (
        <span
          className={cn(
            'absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-medium flex items-center justify-center',
            variant === 'warning' ? 'bg-amber-500 text-white' : 'bg-muted-foreground text-white'
          )}
        >
          {value > 9 ? '9+' : value}
        </span>
      )}
    </div>
  )
}

export function SidebarStats({
  activeListings,
  pendingOffers,
  actionRequired,
  unreadMessages,
  isCollapsed,
}: SidebarStatsProps) {
  return (
    <div className="space-y-1">
      {!isCollapsed && (
        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Quick Stats
        </h3>
      )}
      <StatItem
        icon={<Package className="h-4 w-4" />}
        label="Listings"
        value={activeListings}
        isCollapsed={isCollapsed}
      />
      <StatItem
        icon={<Tag className="h-4 w-4" />}
        label="Offers"
        value={pendingOffers}
        isCollapsed={isCollapsed}
        variant={pendingOffers > 0 ? 'warning' : 'default'}
      />
      <StatItem
        icon={<AlertCircle className="h-4 w-4" />}
        label="Action Required"
        value={actionRequired}
        isCollapsed={isCollapsed}
        variant={actionRequired > 0 ? 'warning' : 'default'}
      />
      <StatItem
        icon={<MessageSquare className="h-4 w-4" />}
        label="Messages"
        value={unreadMessages}
        isCollapsed={isCollapsed}
        variant={unreadMessages > 0 ? 'warning' : 'default'}
      />
    </div>
  )
}
