'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { Info, BookOpen, Boxes, Zap, FileText, Sparkles, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Map icon names to actual components (resolved client-side)
const iconMap: Record<string, LucideIcon> = {
  info: Info,
  'book-open': BookOpen,
  boxes: Boxes,
  zap: Zap,
  'file-text': FileText,
  sparkles: Sparkles,
}

export interface TabConfig {
  id: string
  label: string
  icon: string // Icon name instead of component reference
  content: ReactNode
  available: boolean
}

interface GamePageTabsProps {
  tabs: TabConfig[]
  defaultTab?: string
}

export function GamePageTabs({ tabs, defaultTab = 'overview' }: GamePageTabsProps) {
  const availableTabs = tabs.filter(tab => tab.available)
  const tabListRef = useRef<HTMLDivElement>(null)

  // Always initialize with default to avoid hydration mismatch
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Sync with URL hash after hydration
  useEffect(() => {
    // Read initial hash on mount
    const hash = window.location.hash.slice(1)
    const validTab = availableTabs.find(t => t.id === hash)
    if (validTab) {
      setActiveTab(hash)
    }

    // Handle subsequent hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash.slice(1)
      const newValidTab = availableTabs.find(t => t.id === newHash)
      if (newValidTab) {
        setActiveTab(newHash)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [availableTabs])

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (tabListRef.current) {
      const activeButton = tabListRef.current.querySelector(`[data-tab="${activeTab}"]`)
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [activeTab])

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    // Update hash without triggering scroll
    window.history.pushState(null, '', `#${tabId}`)
  }

  const currentTab = availableTabs.find(t => t.id === activeTab) || availableTabs[0]

  return (
    <div className="mt-12">
      {/* Tab List - Sticky on scroll */}
      <div className="sticky top-16 z-30 -mx-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <div
          ref={tabListRef}
          role="tablist"
          className="flex overflow-x-auto scrollbar-hide gap-1 border-b border-border/50"
          aria-label="Game sections"
        >
          {availableTabs.map((tab) => {
            const Icon = iconMap[tab.icon] || Info
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                data-tab={tab.id}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'group relative flex items-center gap-2.5 whitespace-nowrap px-5 py-4 text-sm font-semibold uppercase tracking-widest transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {/* Hover background */}
                <span className="absolute inset-x-1 inset-y-1 rounded-lg bg-muted/0 group-hover:bg-muted/50 transition-colors duration-200" />
                <Icon className={cn('relative h-4 w-4', isActive && 'text-primary')} />
                <span className="relative">{tab.label}</span>
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${currentTab?.id}`}
        aria-labelledby={currentTab?.id}
        className="pt-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out"
        key={activeTab} // Force re-render for animation
      >
        {currentTab?.content}
      </div>
    </div>
  )
}
