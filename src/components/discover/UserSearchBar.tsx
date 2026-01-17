'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserCard } from './UserCard'
import type { UserSearchResult } from '@/types/database'

interface UserSearchBarProps {
  currentUserId?: string
}

export function UserSearchBar({ currentUserId }: UserSearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Debounced search
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}${
          currentUserId ? `&userId=${currentUserId}` : ''
        }`
      )
      if (response.ok) {
        const data = await response.json()
        setResults(data.users || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
      setHasSearched(true)
    }
  }, [currentUserId])

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, search])

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setHasSearched(false)
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-12 text-base"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={clearSearch}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No users found matching &quot;{query}&quot;
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {results.length} {results.length === 1 ? 'result' : 'results'} for &quot;{query}&quot;
              </p>
              <div className="grid gap-2">
                {results.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isFollowing={user.isFollowing}
                    isFriend={user.isFriend}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
