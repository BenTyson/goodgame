'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, BellOff, Search, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  SavedSearchCard,
  SavedSearchCardSkeleton,
} from '@/components/marketplace/discovery'
import type { SavedSearch } from '@/types/marketplace'

interface SavedSearchesClientProps {
  initialSearches: SavedSearch[]
}

export function SavedSearchesClient({
  initialSearches,
}: SavedSearchesClientProps) {
  const [searches, setSearches] = useState<SavedSearch[]>(initialSearches)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'paused'>('all')

  // Filter searches by tab
  const filteredSearches = searches.filter((search) => {
    if (activeTab === 'active') return search.alerts_enabled && search.status === 'active'
    if (activeTab === 'paused') return !search.alerts_enabled || search.status === 'paused'
    return true
  })

  const activeCount = searches.filter(
    (s) => s.alerts_enabled && s.status === 'active'
  ).length
  const pausedCount = searches.filter(
    (s) => !s.alerts_enabled || s.status === 'paused'
  ).length

  // Toggle alerts
  const handleToggleAlerts = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/marketplace/saved-searches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts_enabled: enabled }),
      })

      if (!res.ok) throw new Error('Failed to update')

      const { savedSearch } = await res.json()
      setSearches((prev) =>
        prev.map((s) => (s.id === id ? savedSearch : s))
      )
    } catch (error) {
      console.error('Error toggling alerts:', error)
    }
  }

  // Delete search
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/marketplace/saved-searches/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      setSearches((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Error deleting search:', error)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/marketplace">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Saved Searches</h1>
            <p className="text-sm text-muted-foreground">
              Get notified when new listings match your criteria
            </p>
          </div>
        </div>

        <Link href="/marketplace">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Search
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Search className="h-4 w-4" />
            All ({searches.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <Bell className="h-4 w-4" />
            Active ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="paused" className="gap-2">
            <BellOff className="h-4 w-4" />
            Paused ({pausedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredSearches.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div className="space-y-3">
              {filteredSearches.map((search) => (
                <SavedSearchCard
                  key={search.id}
                  search={search}
                  onToggleAlerts={handleToggleAlerts}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ tab }: { tab: 'all' | 'active' | 'paused' }) {
  if (tab === 'all') {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No saved searches yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Save a search from the marketplace to get notified when new listings match.
        </p>
        <Link href="/marketplace">
          <Button>
            <Search className="h-4 w-4 mr-2" />
            Browse Marketplace
          </Button>
        </Link>
      </div>
    )
  }

  if (tab === 'active') {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No active alerts</h3>
        <p className="text-sm text-muted-foreground">
          Enable alerts on a saved search to get notified.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <BellOff className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">No paused alerts</h3>
      <p className="text-sm text-muted-foreground">
        All your saved searches have alerts enabled.
      </p>
    </div>
  )
}
