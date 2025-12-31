'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  StripeOnboardingBanner,
  ActionRequiredSection,
  DashboardTabs,
  HorizontalStats,
} from '@/components/marketplace/dashboard'
import { DashboardSidebar, type DashboardTab } from '@/components/marketplace/dashboard/DashboardSidebar'
import { MobileMenuTrigger } from '@/components/marketplace/dashboard/MobileMenuTrigger'
import type { SellerDashboardData } from '@/types/marketplace'

const VALID_TABS: DashboardTab[] = ['listings', 'offers', 'sales', 'messages']

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

  // Sync tab state when URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab') as DashboardTab | null
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

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
          />

          {/* Stripe Onboarding Banner */}
          {data.stripeStatus.requiresAction && (
            <div className="mb-6">
              <StripeOnboardingBanner status={data.stripeStatus} />
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
