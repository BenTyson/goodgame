'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { AdminUser } from '@/lib/supabase/admin-user-queries'
import { UserDetailPanel } from './UserDetailPanel'

interface UserTableProps {
  users: AdminUser[]
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffYears > 0) return `${diffYears}y ago`
  if (diffMonths > 0) return `${diffMonths}mo ago`
  if (diffWeeks > 0) return `${diffWeeks}w ago`
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMinutes > 0) return `${diffMinutes}m ago`
  return 'Just now'
}

function getInitials(displayName: string | null, username: string | null): string {
  if (displayName) {
    return displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }
  if (username) {
    return username.slice(0, 2).toUpperCase()
  }
  return '?'
}

export function UserTable({ users }: UserTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const handleRowClick = (userId: string) => {
    setSelectedUserId(userId)
    setIsPanelOpen(true)
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">User</TableHead>
              <TableHead className="w-[100px]">Role</TableHead>
              <TableHead className="w-[100px] text-right">Games</TableHead>
              <TableHead className="w-[100px] text-right">Followers</TableHead>
              <TableHead className="w-[120px] text-right">Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(user.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user.custom_avatar_url || user.avatar_url || undefined}
                        alt={user.display_name || user.username || 'User'}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.display_name, user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {user.display_name || user.username || 'Anonymous'}
                      </div>
                      {user.username && (
                        <div className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.role === 'admin' && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-0">
                      Admin
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {user.games_count}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {user.followers_count}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatRelativeTime(user.last_active_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserDetailPanel
        userId={selectedUserId}
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
      />
    </>
  )
}
