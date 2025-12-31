'use client'

import { Package, Tag, Receipt, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DashboardTab = 'listings' | 'offers' | 'sales' | 'messages'

interface SidebarNavProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  isCollapsed?: boolean
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  tab: DashboardTab
  isActive: boolean
  isCollapsed?: boolean
  onClick: () => void
}

function NavItem({ icon, label, isActive, isCollapsed, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer',
        'text-left text-sm font-medium',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? label : undefined}
    >
      <span className={cn('flex-shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground')}>
        {icon}
      </span>
      {!isCollapsed && <span>{label}</span>}
    </button>
  )
}

export function SidebarNav({ activeTab, onTabChange, isCollapsed }: SidebarNavProps) {
  const navItems: { tab: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'listings', label: 'Listings', icon: <Package className="h-5 w-5" /> },
    { tab: 'offers', label: 'Offers', icon: <Tag className="h-5 w-5" /> },
    { tab: 'sales', label: 'Sales', icon: <Receipt className="h-5 w-5" /> },
    { tab: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
  ]

  return (
    <nav className="space-y-1">
      {!isCollapsed && (
        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Navigation
        </h3>
      )}
      {navItems.map((item) => (
        <NavItem
          key={item.tab}
          tab={item.tab}
          icon={item.icon}
          label={item.label}
          isActive={activeTab === item.tab}
          isCollapsed={isCollapsed}
          onClick={() => onTabChange(item.tab)}
        />
      ))}
    </nav>
  )
}
