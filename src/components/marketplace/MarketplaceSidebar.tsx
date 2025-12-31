'use client'

import { X, Store, Package, Tag, Bookmark, LayoutDashboard, Plus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { MarketplaceFilters } from './filters/MarketplaceFilterSidebar'

interface MarketplaceSidebarProps {
  filters: MarketplaceFilters
  onFiltersChange: (filters: MarketplaceFilters) => void
  onClearAll: () => void
  isAuthenticated: boolean
  isMobileOpen?: boolean
  onMobileClose?: () => void
  children: React.ReactNode
}

interface QuickLinkProps {
  href: string
  icon: React.ReactNode
  label: string
}

function QuickLink({ href, icon, label }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

export function MarketplaceSidebar({
  isAuthenticated,
  isMobileOpen = false,
  onMobileClose,
  children,
}: MarketplaceSidebarProps) {
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
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
          className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
        >
          <Store className="h-5 w-5" />
          <span className="font-semibold">Marketplace</span>
        </Link>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Filters (passed as children) */}
        {children}

        {/* Quick Links (authenticated users only) */}
        {isAuthenticated && (
          <>
            <div className="border-t pt-4">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Quick Links
              </h3>
              <nav className="space-y-1">
                <QuickLink
                  href="/marketplace/dashboard?tab=listings"
                  icon={<Package className="h-4 w-4" />}
                  label="My Listings"
                />
                <QuickLink
                  href="/marketplace/dashboard?tab=offers"
                  icon={<Tag className="h-4 w-4" />}
                  label="My Offers"
                />
                <QuickLink
                  href="/marketplace/dashboard?tab=sales"
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  label="My Sales"
                />
                <QuickLink
                  href="/marketplace/saved-searches"
                  icon={<Bookmark className="h-4 w-4" />}
                  label="Saved Searches"
                />
              </nav>
            </div>
          </>
        )}
      </div>

      {/* Footer - Action Button */}
      {isAuthenticated && (
        <div className="border-t p-3">
          <Button asChild className="w-full">
            <Link href="/marketplace/listings/new">
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Link>
          </Button>
        </div>
      )}
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
          // Desktop: show
          'hidden lg:flex lg:flex-col lg:w-64',
          // Mobile: overlay drawer
          isMobileOpen && 'fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-background'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
