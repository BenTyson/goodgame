'use client'

import { useState, useEffect } from 'react'
import { Clock, Loader2 } from 'lucide-react'
import { UserCard } from './UserCard'
import type { RecentlyActiveUser } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface RecentlyActiveSectionProps {
  currentUserId?: string
}

export function RecentlyActiveSection({ currentUserId }: RecentlyActiveSectionProps) {
  const [users, setUsers] = useState<RecentlyActiveUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const url = currentUserId
          ? `/api/users/suggested?type=recently-active&userId=${currentUserId}`
          : '/api/users/suggested?type=recently-active'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Error fetching recently active users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [currentUserId])

  // Don't show section if no users and done loading
  if (!isLoading && users.length === 0) {
    return null
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Recently Active</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Active members in the community
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                subtitle={user.recentActivitySummary || undefined}
                secondaryInfo={
                  user.lastActiveAt
                    ? [`Active ${formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })}`]
                    : undefined
                }
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
