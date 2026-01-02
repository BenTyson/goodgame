'use client'

import { X, Settings, LayoutDashboard, Gamepad2, ListTodo, Users2, Building2, Tags, Globe, Database } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Games', href: '/admin/games', icon: Gamepad2, exact: false },
  { name: 'Taxonomy', href: '/admin/taxonomy', icon: Tags, exact: false },
  { name: 'Families', href: '/admin/families', icon: Users2, exact: false },
  { name: 'Publishers', href: '/admin/publishers', icon: Building2, exact: false },
  { name: 'Queue', href: '/admin/queue', icon: ListTodo, exact: false },
  { name: 'Data', href: '/admin/data', icon: Database, exact: false },
  { name: 'Wikidata', href: '/admin/wikidata', icon: Globe, exact: false },
]

interface AdminSidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function AdminSidebar({
  isMobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (item: typeof adminNav[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        {isMobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="lg:hidden mr-2"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        <Link
          href="/admin"
          className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
          onClick={onMobileClose}
        >
          <Settings className="h-5 w-5" />
          <span className="font-semibold">Admin</span>
        </Link>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {adminNav.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className={cn('h-4 w-4', !active && 'opacity-70')} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
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
