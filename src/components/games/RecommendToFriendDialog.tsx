'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2, Send, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getMutualFriends } from '@/lib/supabase/friend-queries'
import type { FriendWithProfile } from '@/types/database'
import Link from 'next/link'

interface RecommendToFriendDialogProps {
  isOpen: boolean
  onClose: () => void
  gameId: string
  gameName: string
  gameSlug: string
  userId: string
}

export function RecommendToFriendDialog({
  isOpen,
  onClose,
  gameId,
  gameName,
  gameSlug,
  userId,
}: RecommendToFriendDialogProps) {
  const [friends, setFriends] = useState<FriendWithProfile[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(true)
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Fetch friends when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingFriends(true)
      setSelectedFriends(new Set())
      setMessage('')
      setSent(false)

      getMutualFriends(userId)
        .then(setFriends)
        .catch(console.error)
        .finally(() => setIsLoadingFriends(false))
    }
  }, [isOpen, userId])

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(friendId)) {
        newSet.delete(friendId)
      } else {
        newSet.add(friendId)
      }
      return newSet
    })
  }

  const handleSend = async () => {
    if (selectedFriends.size === 0) return

    setIsSending(true)
    try {
      const response = await fetch('/api/recommendations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          recipientIds: Array.from(selectedFriends),
          message: message.trim() || undefined,
        }),
      })

      if (response.ok) {
        setSent(true)
        // Close dialog after showing success
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        console.error('Failed to send recommendations')
      }
    } catch (error) {
      console.error('Error sending recommendations:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recommend to Friends</DialogTitle>
          <DialogDescription>
            Share <span className="font-medium text-foreground">{gameName}</span> with your friends
          </DialogDescription>
        </DialogHeader>

        {/* Success State */}
        {sent ? (
          <div className="py-8 text-center">
            <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium">Recommendation sent!</p>
            <p className="text-sm text-muted-foreground">
              Your friends will be notified
            </p>
          </div>
        ) : (
          <>
            {/* Friends List */}
            <div className="py-4">
              {isLoadingFriends ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="font-medium mb-2">No friends yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Follow users who follow you back to become friends
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/discover">Discover People</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {friends.map((friend) => {
                    const displayName = friend.displayName || friend.username || 'Friend'
                    const avatarUrl = friend.customAvatarUrl || friend.avatarUrl
                    const initials = displayName.slice(0, 2).toUpperCase()
                    const isSelected = selectedFriends.has(friend.id)

                    return (
                      <label
                        key={friend.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-accent border border-transparent'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleFriend(friend.id)}
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{displayName}</p>
                          {friend.username && (
                            <p className="text-sm text-muted-foreground truncate">
                              @{friend.username}
                            </p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Message Input */}
            {friends.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Add a message (optional)
                </label>
                <Textarea
                  placeholder="I think you'd love this game..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/500
                </p>
              </div>
            )}

            {/* Footer */}
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={selectedFriends.size === 0 || isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedFriends.size || ''} {selectedFriends.size === 1 ? 'Friend' : 'Friends'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
