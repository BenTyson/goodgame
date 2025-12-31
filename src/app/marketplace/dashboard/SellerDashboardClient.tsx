'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, AlertCircle, Clock, X } from 'lucide-react'
import {
  ActionRequiredSection,
  DashboardTabs,
  HorizontalStats,
} from '@/components/marketplace/dashboard'
import { DashboardSidebar, type DashboardTab } from '@/components/marketplace/dashboard/DashboardSidebar'
import { MobileMenuTrigger } from '@/components/marketplace/dashboard/MobileMenuTrigger'
import type { SellerDashboardData } from '@/types/marketplace'

const VALID_TABS: DashboardTab[] = ['listings', 'offers', 'sales', 'messages', 'account']

const STRIPE_MESSAGES = {
  connected: {
    type: 'success' as const,
    text: 'Payment setup complete! You can now receive payments for marketplace sales.',
    icon: CheckCircle2,
  },
  pending: {
    type: 'warning' as const,
    text: 'Almost there! Stripe is verifying your details. This usually takes 1-2 business days.',
    icon: Clock,
  },
  error: {
    type: 'error' as const,
    text: 'Payment setup incomplete. Please try again or contact support if the issue persists.',
    icon: AlertCircle,
  },
}

interface SellerDashboardClientProps {
  data: SellerDashboardData
}

export function SellerDashboardClient({ data }: SellerDashboardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial tab from URL or default to 'listings'
  const tabParam = searchParams.get('tab') as DashboardTab | null
  const initialTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'listings'

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stripeNotification, setStripeNotification] = useState<{
    type: 'success' | 'warning' | 'error'
    text: string
    icon: typeof CheckCircle2
  } | null>(null)

  // Sync tab state when URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab') as DashboardTab | null
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Handle Stripe callback notification
  useEffect(() => {
    const stripeStatus = searchParams.get('stripe')
    if (stripeStatus && stripeStatus in STRIPE_MESSAGES) {
      const messageConfig = STRIPE_MESSAGES[stripeStatus as keyof typeof STRIPE_MESSAGES]
      setStripeNotification(messageConfig)
      // Clear the query param from URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete('stripe')
      params.delete('message')
      const newUrl = params.toString()
        ? `/marketplace/dashboard?${params.toString()}`
        : '/marketplace/dashboard'
      router.replace(newUrl, { scroll: false })
    }
  }, [searchParams, router])

  const handleRefresh = () => {
    router.refresh()
  }

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
    // Update URL without full navigation
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/marketplace/dashboard?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar
        stats={data.stats}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 bg-background border-b px-4 py-3 flex items-center gap-3">
          <MobileMenuTrigger
            onClick={() => setMobileMenuOpen(true)}
            actionCount={data.stats.actionRequired}
          />
          <h1 className="text-lg font-semibold">Seller Dashboard</h1>
        </div>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
          {/* Quick Stats Bar */}
          <HorizontalStats
            activeListings={data.stats.activeListings}
            pendingOffers={data.stats.pendingOffers}
            actionRequired={data.stats.actionRequired}
            unreadMessages={data.stats.unreadMessages}
            paymentStatus={{
              connected: data.stripeStatus.connected,
              chargesEnabled: data.stripeStatus.chargesEnabled,
              payoutsEnabled: data.stripeStatus.payoutsEnabled,
            }}
          />

          {/* Stripe callback notification */}
          {stripeNotification && (
            <div
              className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
                stripeNotification.type === 'success'
                  ? 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : stripeNotification.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}
            >
              <stripeNotification.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">
                  {stripeNotification.type === 'success'
                    ? 'Payment Setup Complete'
                    : stripeNotification.type === 'warning'
                    ? 'Verification In Progress'
                    : 'Setup Incomplete'}
                </p>
                <p className="text-sm mt-1 opacity-90">{stripeNotification.text}</p>
              </div>
              <button
                onClick={() => setStripeNotification(null)}
                className="text-current opacity-50 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Action Required Section */}
          {data.actionItems.length > 0 && (
            <div className="mb-6">
              <ActionRequiredSection
                items={data.actionItems}
                onAction={handleRefresh}
              />
            </div>
          )}

          {/* Tabs Content */}
          <DashboardTabs
            listings={data.listings}
            offers={data.recentOffers}
            transactions={data.recentTransactions}
            onRefresh={handleRefresh}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </main>
    </div>
  )
}
