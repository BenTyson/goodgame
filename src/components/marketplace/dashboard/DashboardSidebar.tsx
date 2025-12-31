'use client'

import { X, Home } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SidebarNav, type DashboardTab } from './SidebarNav'
import { SidebarQuickActions } from './SidebarQuickActions'
import type { SellerDashboardStats } from '@/types/marketplace'

interface DashboardSidebarProps {
  stats: SellerDashboardStats
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  isCollapsed?: boolean
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function DashboardSidebar({
  stats,
  activeTab,
  onTabChange,
  isCollapsed = false,
  isMobileOpen = false,
  onMobileClose,
}: DashboardSidebarProps) {
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header / Logo */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-4 border-b',
          isCollapsed && 'justify-center px-2'
        )}
      >
        {isMobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="md:hidden mr-2"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        <Link
          href="/marketplace"
          className={cn(
            'flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Back to Marketplace' : undefined}
        >
          <Home className="h-5 w-5" />
          {!isCollapsed && (
            <span className="font-semibold">Seller Dashboard</span>
          )}
        </Link>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 relative">
        {/* Navigation */}
        <SidebarNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Footer - Quick Actions & Stats */}
      <div className="border-t p-3">
        <SidebarQuickActions
          totalEarningsCents={stats.totalEarningsCents}
          rating={stats.rating}
          feedbackCount={stats.feedbackCount}
          trustLevel={stats.trustLevel}
          isCollapsed={isCollapsed}
        />
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-muted/50 border-r flex-shrink-0 transition-all duration-300 sticky top-0 h-screen',
          // Desktop: fixed width
          'hidden lg:flex lg:flex-col',
          isCollapsed ? 'lg:w-16' : 'lg:w-60',
          // Tablet: collapsed
          'md:flex md:flex-col md:w-16',
          // Mobile: overlay drawer
          isMobileOpen && 'fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-background md:relative md:w-16'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

export type { DashboardTab }
