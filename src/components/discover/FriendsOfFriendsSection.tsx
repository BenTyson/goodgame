'use client'

import { useState, useEffect } from 'react'
import { Users, Loader2 } from 'lucide-react'
import { UserCard } from './UserCard'
import type { FriendOfFriend } from '@/types/database'

interface FriendsOfFriendsSectionProps {
  userId: string
}

export function FriendsOfFriendsSection({ userId }: FriendsOfFriendsSectionProps) {
  const [suggestions, setSuggestions] = useState<FriendOfFriend[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const response = await fetch(`/api/users/suggested?type=friends-of-friends&userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.users || [])
        }
      } catch (error) {
        console.error('Error fetching friends of friends:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [userId])

  // Don't show section if no suggestions and done loading
  if (!isLoading && suggestions.length === 0) {
    return null
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Friends of Friends</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            People your friends know
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                subtitle={`${user.mutualFriendCount} mutual ${user.mutualFriendCount === 1 ? 'friend' : 'friends'}`}
                secondaryInfo={
                  user.mutualFriendNames.length > 0
                    ? [`Friends with: ${formatMutualFriends(user.mutualFriendNames)}`]
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

function formatMutualFriends(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return names.join(' and ')
  return `${names.slice(0, 2).join(', ')}, +${names.length - 2} more`
}
