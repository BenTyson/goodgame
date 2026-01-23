'use client'

import { X, Settings, LayoutDashboard, Dices, Users2, Building2, Tags, Database, Download, Wand2, Trophy, UserCog } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Vecna', href: '/admin/vecna', icon: Wand2, exact: false },
  { name: 'Games', href: '/admin/games', icon: Dices, exact: false },
  { name: 'Import', href: '/admin/import', icon: Download, exact: false },
  { name: 'Taxonomy', href: '/admin/taxonomy', icon: Tags, exact: false },
  { name: 'Awards', href: '/admin/awards', icon: Trophy, exact: false },
  { name: 'Users', href: '/admin/users', icon: UserCog, exact: false },
  { name: 'Families', href: '/admin/families', icon: Users2, exact: false },
  { name: 'Publishers', href: '/admin/publishers', icon: Building2, exact: false },
  { name: 'Data', href: '/admin/data', icon: Database, exact: false },
]

interface AdminSidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
  collapsed?: boolean
}

export function AdminSidebar({
  isMobileOpen = false,
  onMobileClose,
  collapsed = false,
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
      <div className={cn(
        "flex items-center gap-3 py-4 border-b",
        collapsed ? "px-2 justify-center" : "px-4"
      )}>
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
          title={collapsed ? "Admin" : undefined}
        >
          <Settings className="h-5 w-5" />
          {!collapsed && <span className="font-semibold">Admin</span>}
        </Link>
      </div>

      {/* Scrollable Navigation */}
      <nav className={cn(
        "flex-1 overflow-y-auto py-4 space-y-1",
        collapsed ? "px-2" : "px-3"
      )}>
        {adminNav.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              title={collapsed ? item.name : undefined}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-all',
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className={cn('h-4 w-4 flex-shrink-0', !active && 'opacity-70')} />
              {!collapsed && item.name}
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
          // Desktop: show with variable width
          'hidden lg:flex lg:flex-col',
          collapsed ? 'lg:w-14' : 'lg:w-64',
          // Mobile: overlay drawer (always full width)
          isMobileOpen && 'fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-background'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
