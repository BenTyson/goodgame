'use client'

import { useState, useEffect } from 'react'
import { Search, Check, Loader2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import type { FriendWithProfile } from '@/types/database'

interface InviteFriendsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  friends: FriendWithProfile[]
  alreadyInvited: string[] // user IDs
  onInvite: (userIds: string[]) => Promise<void>
  loading?: boolean
}

export function InviteFriendsDialog({
  open,
  onOpenChange,
  friends,
  alreadyInvited,
  onInvite,
  loading,
}: InviteFriendsDialogProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  // Filter friends by search and exclude already invited
  const availableFriends = friends.filter((friend) => {
    if (alreadyInvited.includes(friend.id)) return false
    if (!search) return true

    const searchLower = search.toLowerCase()
    const name = (friend.displayName || friend.username || '').toLowerCase()
    return name.includes(searchLower)
  })

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelected(new Set())
      setSearch('')
    }
  }, [open])

  const handleToggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selected.size === availableFriends.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(availableFriends.map((f) => f.id)))
    }
  }

  const handleInvite = async () => {
    if (selected.size === 0) return
    setSubmitting(true)
    try {
      await onInvite(Array.from(selected))
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const allInvited = friends.length > 0 && friends.length === alreadyInvited.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite Friends
          </DialogTitle>
          <DialogDescription>
            Select friends to invite to this table
          </DialogDescription>
        </DialogHeader>

        {allInvited ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>All your friends have already been invited!</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>You don&apos;t have any friends yet.</p>
            <p className="text-sm mt-2">
              Follow people who follow you back to become friends.
            </p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Select all */}
            {availableFriends.length > 1 && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">
                  {selected.size} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selected.size === availableFriends.length ? 'Deselect all' : 'Select all'}
                </Button>
              </div>
            )}

            {/* Friends list */}
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableFriends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {search ? 'No friends match your search' : 'No friends available to invite'}
                </p>
              ) : (
                availableFriends.map((friend) => {
                  const displayName = friend.displayName || friend.username || 'Unknown'
                  const avatar = friend.customAvatarUrl || friend.avatarUrl
                  const initials = displayName.slice(0, 2).toUpperCase()
                  const isSelected = selected.has(friend.id)

                  return (
                    <label
                      key={friend.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                        isSelected ? 'bg-primary/10' : 'hover:bg-accent'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(friend.id)}
                      />
                      <Avatar className="h-9 w-9">
                        {avatar && <AvatarImage src={avatar} alt={displayName} />}
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{displayName}</p>
                        {friend.username && (
                          <p className="text-xs text-muted-foreground">@{friend.username}</p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </label>
                  )
                })
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={selected.size === 0 || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Inviting...
              </>
            ) : (
              `Invite ${selected.size > 0 ? `(${selected.size})` : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
