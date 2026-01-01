'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Dice5, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminSidebar } from './AdminSidebar'
import { LogoutButton } from './LogoutButton'

interface AdminLayoutClientProps {
  userEmail: string
  children: React.ReactNode
}

export function AdminLayoutClient({ userEmail, children }: AdminLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 md:h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile hamburger button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to site</span>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Dice5 className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </div>
              <span className="font-semibold text-sm md:text-base">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              {userEmail}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar
          isMobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
