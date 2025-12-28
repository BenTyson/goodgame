'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import { ActivityItem } from './ActivityItem'
import { Card, CardContent } from '@/components/ui/card'
import { getActivityFeed, getUserActivities } from '@/lib/supabase/activity-queries'
import type { ActivityWithDetails } from '@/types/database'

interface ActivityFeedProps {
  userId: string
  mode: 'personal' | 'profile'
  emptyMessage?: string
}

export function ActivityFeed({ userId, mode, emptyMessage }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  const fetchActivities = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const fetchFn = mode === 'personal' ? getActivityFeed : getUserActivities
      const response = await fetchFn(userId, isLoadMore ? cursor : undefined)

      if (isLoadMore) {
        setActivities(prev => [...prev, ...response.activities])
      } else {
        setActivities(response.activities)
      }

      setHasMore(response.hasMore)
      setCursor(response.nextCursor)
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError('Failed to load activities')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [userId, mode, cursor])

  // Initial load
  useEffect(() => {
    fetchActivities()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, mode])

  // Load more when scrolling
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore && !isLoading) {
      fetchActivities(true)
    }
  }, [inView, hasMore, isLoadingMore, isLoading, fetchActivities])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {emptyMessage || (mode === 'personal'
            ? 'No activity yet. Follow some users to see their updates here!'
            : 'No recent activity.'
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isLoadingMore && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  )
}
