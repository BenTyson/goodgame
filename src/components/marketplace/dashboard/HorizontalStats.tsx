'use client'

import Link from 'next/link'
import { Package, Tag, AlertCircle, MessageSquare, CreditCard, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentStatus {
  connected: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
}

interface HorizontalStatsProps {
  activeListings: number
  pendingOffers: number
  actionRequired: number
  unreadMessages: number
  paymentStatus?: PaymentStatus
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

function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  const isActive = status.connected && status.chargesEnabled && status.payoutsEnabled
  const isPending = status.connected && (!status.chargesEnabled || !status.payoutsEnabled)

  if (isActive) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        <span className="hidden sm:inline">Payments</span>
        <span className="font-medium">Active</span>
      </div>
    )
  }

  if (isPending) {
    return (
      <Link
        href="/marketplace/dashboard?tab=account"
        className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
      >
        <AlertTriangle className="h-4 w-4" />
        <span className="hidden sm:inline">Payments</span>
        <span className="font-medium">Pending</span>
      </Link>
    )
  }

  return (
    <Link
      href="/marketplace/dashboard?tab=account"
      className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
    >
      <CreditCard className="h-4 w-4" />
      <span className="hidden sm:inline">Payments</span>
      <span className="font-medium">Not Set Up</span>
    </Link>
  )
}

export function HorizontalStats({
  activeListings,
  pendingOffers,
  actionRequired,
  unreadMessages,
  paymentStatus,
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
      {paymentStatus && (
        <div className="ml-auto">
          <PaymentStatusChip status={paymentStatus} />
        </div>
      )}
    </div>
  )
}
