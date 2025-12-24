'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getUserGameStatus, addToShelf, removeFromShelf } from '@/lib/supabase/user-queries'
import type { ShelfStatus, UserGame } from '@/types/database'

const SHELF_STATUSES: { value: ShelfStatus; label: string; icon: string }[] = [
  { value: 'owned', label: 'Owned', icon: '📦' },
  { value: 'want_to_buy', label: 'Want to Buy', icon: '🛒' },
  { value: 'want_to_play', label: 'Want to Play', icon: '🎯' },
  { value: 'wishlist', label: 'Wishlist', icon: '⭐' },
  { value: 'previously_owned', label: 'Previously Owned', icon: '📤' },
]

interface AddToShelfButtonProps {
  gameId: string
  variant?: 'default' | 'compact'
}

export function AddToShelfButton({ gameId, variant = 'default' }: AddToShelfButtonProps) {
  const { user, signInWithGoogle } = useAuth()
  const [shelfEntry, setShelfEntry] = useState<UserGame | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (user) {
      setIsFetching(true)
      getUserGameStatus(user.id, gameId)
        .then(setShelfEntry)
        .finally(() => setIsFetching(false))
    } else {
      setIsFetching(false)
    }
  }, [user, gameId])

  const handleAdd = async (status: ShelfStatus) => {
    if (!user) {
      // Prompt login
      signInWithGoogle()
      return
    }

    setIsLoading(true)
    try {
      const result = await addToShelf({
        user_id: user.id,
        game_id: gameId,
        status,
      })
      setShelfEntry(result)
    } catch (error) {
      console.error('Error adding to shelf:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!shelfEntry) return
    setIsLoading(true)
    try {
      await removeFromShelf(shelfEntry.id)
      setShelfEntry(null)
    } catch (error) {
      console.error('Error removing from shelf:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentStatus = shelfEntry
    ? SHELF_STATUSES.find(s => s.value === shelfEntry.status)
    : null

  // Show loading state while fetching initial status
  if (user && isFetching) {
    return (
      <Button
        variant="outline"
        size={variant === 'compact' ? 'sm' : 'default'}
        disabled
      >
        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading...
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={shelfEntry ? 'secondary' : 'outline'}
          size={variant === 'compact' ? 'sm' : 'default'}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : shelfEntry ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {shelfEntry ? currentStatus?.label : 'Add to Shelf'}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {SHELF_STATUSES.map((status) => (
          <DropdownMenuItem
            key={status.value}
            onClick={() => handleAdd(status.value)}
            className="cursor-pointer"
          >
            <span className="mr-2">{status.icon}</span>
            {status.label}
            {shelfEntry?.status === status.value && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        {shelfEntry && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleRemove}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              Remove from Shelf
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
