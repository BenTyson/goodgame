'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { UserCard } from './UserCard'
import type { SuggestedFriend } from '@/types/database'

interface SuggestedUsersSectionProps {
  userId: string
}

export function SuggestedUsersSection({ userId }: SuggestedUsersSectionProps) {
  const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const response = await fetch(`/api/users/suggested?type=mutual-games&userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.users || [])
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
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
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">People You May Know</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Based on games in your collection
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                subtitle={`${user.mutualGamesCount} games in common`}
                secondaryInfo={
                  user.sampleMutualGames.length > 0
                    ? [`You both have: ${formatMutualGames(user.sampleMutualGames)}`]
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

function formatMutualGames(games: string[]): string {
  if (games.length === 0) return ''
  if (games.length <= 3) return games.join(', ')
  return `${games.slice(0, 2).join(', ')}, +${games.length - 2} more`
}
