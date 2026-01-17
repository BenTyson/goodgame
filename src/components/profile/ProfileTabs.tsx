'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { LayoutGrid, Package, MessageSquare, Activity, Users } from 'lucide-react'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'games', label: 'Games', icon: Package },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'activity', label: 'Activity', icon: Activity },
] as const

export type ProfileTab = (typeof tabs)[number]['id']

interface ProfileTabsProps {
  username: string
}

export function ProfileTabs({ username }: ProfileTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const activeTab = (searchParams.get('tab') as ProfileTab) || 'overview'

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (tabId === 'overview') {
      params.delete('tab')
    } else {
      params.set('tab', tabId)
    }

    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
  }

  return (
    <div className="border-b border-border mb-6">
      <nav className="flex overflow-x-auto scrollbar-hide -mb-px" aria-label="Profile sections">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export function useProfileTab(): ProfileTab {
  const searchParams = useSearchParams()
  return (searchParams.get('tab') as ProfileTab) || 'overview'
}
