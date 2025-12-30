'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ConversationPreview } from '@/lib/supabase/conversation-queries'

interface ConversationListProps {
  conversations: ConversationPreview[]
  currentUserId: string
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-lg font-semibold mb-2">No messages yet</h2>
          <p className="text-muted-foreground">
            When you contact a seller or receive a message, it will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}

interface ConversationItemProps {
  conversation: ConversationPreview
  currentUserId: string
}

function ConversationItem({ conversation, currentUserId }: ConversationItemProps) {
  const isBuyer = conversation.buyer_id === currentUserId
  const otherUser = conversation.other_user
  const displayName = otherUser.display_name || otherUser.username || 'Unknown User'
  const avatarUrl = otherUser.custom_avatar_url || otherUser.avatar_url
  const initials = displayName.slice(0, 2).toUpperCase()

  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
    : formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })

  return (
    <Link href={`/marketplace/messages/${conversation.id}`}>
      <Card className={`transition-colors hover:bg-accent/50 ${conversation.unread_count > 0 ? 'bg-accent/20' : ''}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Game thumbnail */}
            <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              {conversation.listing.game.thumbnail_url ? (
                <Image
                  src={conversation.listing.game.thumbnail_url}
                  alt={conversation.listing.game.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Conversation info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className={`font-medium truncate ${conversation.unread_count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {displayName}
                  </span>
                  {conversation.unread_count > 0 && (
                    <Badge variant="default" className="h-5 px-1.5 text-xs">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {timeAgo}
                </span>
              </div>

              <p className={`text-sm mt-1 ${conversation.unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {conversation.listing.game.name}
              </p>

              {conversation.last_message_preview && (
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {conversation.last_message_preview}
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {isBuyer ? 'You are the buyer' : 'You are the seller'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
