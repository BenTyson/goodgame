'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  BellOff,
  Trash2,
  Edit2,
  Search,
  ChevronRight,
  Clock,
  Mail,
  Zap,
  Calendar,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { SavedSearch, AlertFrequency, SavedSearchFilters } from '@/types/marketplace'

interface SavedSearchCardProps {
  search: SavedSearch
  onToggleAlerts?: (id: string, enabled: boolean) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onEdit?: (search: SavedSearch) => void
}

/**
 * Format relative time
 */
function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

/**
 * Get frequency icon
 */
function getFrequencyIcon(frequency: AlertFrequency) {
  switch (frequency) {
    case 'instant':
      return Zap
    case 'daily':
      return Clock
    case 'weekly':
      return Calendar
  }
}

/**
 * Build filter summary string
 */
function buildFilterSummary(filters: SavedSearchFilters): string[] {
  const parts: string[] = []

  if (filters.listing_types?.length) {
    const typeLabels: Record<string, string> = {
      sell: 'For Sale',
      trade: 'For Trade',
      want: 'Wanted',
    }
    parts.push(filters.listing_types.map((t) => typeLabels[t] || t).join(', '))
  }

  if (filters.conditions?.length) {
    parts.push(`${filters.conditions.length} condition${filters.conditions.length > 1 ? 's' : ''}`)
  }

  if (filters.price_min_cents || filters.price_max_cents) {
    const min = filters.price_min_cents ? `$${(filters.price_min_cents / 100).toFixed(0)}` : ''
    const max = filters.price_max_cents ? `$${(filters.price_max_cents / 100).toFixed(0)}` : ''
    if (min && max) {
      parts.push(`${min} - ${max}`)
    } else if (min) {
      parts.push(`${min}+`)
    } else if (max) {
      parts.push(`Under ${max}`)
    }
  }

  if (filters.max_distance_miles) {
    parts.push(`Within ${filters.max_distance_miles} mi`)
  }

  if (filters.shipping_preferences?.length) {
    const shipLabels: Record<string, string> = {
      will_ship: 'Ships',
      local_only: 'Local',
      ship_only: 'Ship Only',
    }
    parts.push(filters.shipping_preferences.map((s) => shipLabels[s] || s).join(', '))
  }

  return parts
}

export function SavedSearchCard({
  search,
  onToggleAlerts,
  onDelete,
  onEdit,
}: SavedSearchCardProps) {
  const router = useRouter()
  const [isTogglingAlerts, setIsTogglingAlerts] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const FrequencyIcon = getFrequencyIcon(search.alert_frequency)
  const filterParts = buildFilterSummary(search.filters)

  const handleRunSearch = () => {
    // Build search URL from filters
    const params = new URLSearchParams()

    if (search.filters.query) {
      params.set('query', search.filters.query)
    }
    if (search.filters.listing_types?.length) {
      params.set('types', search.filters.listing_types.join(','))
    }
    if (search.filters.conditions?.length) {
      params.set('conditions', search.filters.conditions.join(','))
    }
    if (search.filters.price_min_cents) {
      params.set('price_min', String(search.filters.price_min_cents))
    }
    if (search.filters.price_max_cents) {
      params.set('price_max', String(search.filters.price_max_cents))
    }
    if (search.filters.max_distance_miles) {
      params.set('distance', String(search.filters.max_distance_miles))
    }
    if (search.filters.location_postal) {
      params.set('postal', search.filters.location_postal)
    }

    router.push(`/marketplace?${params.toString()}`)
  }

  const handleToggleAlerts = async () => {
    if (!onToggleAlerts) return
    setIsTogglingAlerts(true)
    try {
      await onToggleAlerts(search.id, !search.alerts_enabled)
    } finally {
      setIsTogglingAlerts(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(search.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="group overflow-hidden transition-all hover:[box-shadow:var(--shadow-card-hover)]">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 p-2.5 rounded-lg',
              search.alerts_enabled
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Search className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Name & Query */}
            <div>
              <h3 className="font-semibold text-sm leading-tight line-clamp-1">
                {search.name}
              </h3>
              {search.filters.query && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Search: "{search.filters.query}"
                </p>
              )}
            </div>

            {/* Filter Badges */}
            {filterParts.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filterParts.slice(0, 4).map((part, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {part}
                  </Badge>
                ))}
                {filterParts.length > 4 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    +{filterParts.length - 4} more
                  </Badge>
                )}
              </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {/* Matches */}
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">{search.match_count}</span>
                <span>match{search.match_count !== 1 ? 'es' : ''}</span>
              </div>

              {/* Last Match */}
              {search.last_match_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Last: {formatRelativeTime(search.last_match_at)}</span>
                </div>
              )}

              {/* Alert Frequency */}
              {search.alerts_enabled && (
                <div className="flex items-center gap-1">
                  <FrequencyIcon className="h-3 w-3" />
                  <span className="capitalize">{search.alert_frequency}</span>
                  {search.alert_email && <Mail className="h-3 w-3 ml-0.5" />}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Toggle Alerts */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleToggleAlerts}
              disabled={isTogglingAlerts}
              title={search.alerts_enabled ? 'Pause alerts' : 'Enable alerts'}
            >
              {search.alerts_enabled ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {/* Edit */}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(search)}
                title="Edit search"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive"
                  title="Delete search"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete saved search?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{search.name}" and stop all alerts.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Run Search */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRunSearch}
              title="Run search"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading skeleton for SavedSearchCard
 */
export function SavedSearchCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            <div className="flex gap-1">
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-1">
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
