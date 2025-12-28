'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bell, Check, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/supabase/notification-queries'
import type { NotificationWithDetails } from '@/types/database'

export function NotificationBell() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [notifications, setNotifications] = React.useState<NotificationWithDetails[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  // Fetch unread count on mount and periodically
  React.useEffect(() => {
    if (!user) return

    const fetchCount = async () => {
      try {
        const count = await getUnreadNotificationCount(user.id)
        setUnreadCount(count)
      } catch (error) {
        console.error('Error fetching notification count:', error)
      }
    }

    fetchCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Fetch notifications when dropdown opens
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
    if (open && user) {
      setIsLoading(true)
      try {
        const result = await getNotifications(user.id, undefined, 10)
        setNotifications(result.notifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Mark single notification as read
  const handleNotificationClick = async (notification: NotificationWithDetails) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id)
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }
  }

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!user) return
    try {
      await markAllNotificationsRead(user.id)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Don't render if not logged in
  if (!user) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault()
                handleMarkAllRead()
              }}
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface NotificationItemProps {
  notification: NotificationWithDetails
  onClick: () => void
}

function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { notification_type, actor, is_read, created_at } = notification

  // Render different content based on notification type
  const renderContent = () => {
    switch (notification_type) {
      case 'new_follower':
        if (!actor) return null
        return (
          <Link
            href={`/u/${actor.username}`}
            className="flex items-center gap-3 w-full"
            onClick={onClick}
          >
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {actor.custom_avatar_url || actor.avatar_url ? (
                <img
                  src={actor.custom_avatar_url || actor.avatar_url || ''}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{actor.display_name || actor.username}</span>
                {' '}started following you
              </p>
              <p className="text-xs text-muted-foreground">
                {created_at && formatDistanceToNow(new Date(created_at), { addSuffix: true })}
              </p>
            </div>
          </Link>
        )

      case 'rating':
        // For future rating notifications
        return null

      default:
        return null
    }
  }

  const content = renderContent()
  if (!content) return null

  return (
    <DropdownMenuItem
      className={cn(
        'flex items-start p-3 cursor-pointer focus:bg-accent',
        !is_read && 'bg-accent/50'
      )}
      onSelect={(e) => e.preventDefault()}
    >
      {content}
      {!is_read && (
        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </DropdownMenuItem>
  )
}
