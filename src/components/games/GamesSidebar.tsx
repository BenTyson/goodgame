'use client'

import { X, Dice5 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface GamesSidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
  children: React.ReactNode
}

export function GamesSidebar({
  isMobileOpen = false,
  onMobileClose,
  children,
}: GamesSidebarProps) {
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
          href="/games"
          className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
        >
          <Dice5 className="h-5 w-5" />
          <span className="font-semibold">The Games</span>
        </Link>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Filters (passed as children) */}
        {children}
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
