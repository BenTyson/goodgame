'use client'

import { useState, useRef, useEffect } from 'react'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { Send, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import type { Message } from '@/lib/supabase/conversation-queries'

interface OtherUser {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  custom_avatar_url: string | null
}

interface MessageThreadProps {
  conversationId: string
  messages: Message[]
  currentUserId: string
  otherUser: OtherUser
}

export function MessageThread({
  conversationId,
  messages: initialMessages,
  currentUserId,
  otherUser,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on load and new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [newMessage])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    const content = newMessage.trim()
    setNewMessage('')
    setIsSending(true)
    setError(null)

    // Optimistically add message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      is_read: false,
      read_at: null,
      is_system_message: false,
      system_message_type: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMessage])

    try {
      const response = await fetch(`/api/marketplace/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      const data = await response.json()

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? data.message : m))
      )
    } catch (err) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
      setNewMessage(content) // Restore message to input
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-[calc(100vh-24rem)] min-h-[400px]">
      {/* Messages list */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="h-full overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">
                      {formatDateHeader(group.date)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-3">
                    {group.messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.sender_id === currentUserId}
                        otherUser={otherUser}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message input */}
      <div className="mt-4">
        {error && (
          <p className="text-sm text-destructive mb-2">{error}</p>
        )}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-[150px] resize-none"
            disabled={isSending}
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="h-11 w-11 flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  otherUser: OtherUser
}

function MessageBubble({ message, isOwn, otherUser }: MessageBubbleProps) {
  const displayName = otherUser.display_name || otherUser.username || 'Unknown'
  const avatarUrl = otherUser.custom_avatar_url || otherUser.avatar_url
  const initials = displayName.slice(0, 2).toUpperCase()

  if (message.is_system_message) {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </p>
      </div>
    )
  }

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {formatMessageTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}

function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: Map<string, Message[]> = new Map()

  messages.forEach((message) => {
    const date = new Date(message.created_at).toDateString()
    if (!groups.has(date)) {
      groups.set(date, [])
    }
    groups.get(date)!.push(message)
  })

  return Array.from(groups.entries()).map(([date, msgs]) => ({
    date,
    messages: msgs,
  }))
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  return format(date, 'h:mm a')
}
