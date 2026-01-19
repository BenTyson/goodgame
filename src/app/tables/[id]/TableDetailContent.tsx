'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { format, isPast } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  UserPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RSVPButtons, ParticipantsList, InviteFriendsDialog } from '@/components/tables'
import type { TableWithDetails, ParticipantWithProfile, RSVPStatus } from '@/types/tables'
import { TABLE_STATUS_CONFIG } from '@/types/tables'
import type { FriendWithProfile } from '@/types/database'

interface TableDetailContentProps {
  table: TableWithDetails
  participants: ParticipantWithProfile[]
  currentUserId?: string
  friends: FriendWithProfile[]
  alreadyInvited: string[]
}

export function TableDetailContent({
  table,
  participants,
  currentUserId,
  friends,
  alreadyInvited,
}: TableDetailContentProps) {
  const router = useRouter()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [localParticipants, setLocalParticipants] = useState(participants)
  const [localRsvpStatus, setLocalRsvpStatus] = useState(table.userRsvpStatus)
  const [localInvited, setLocalInvited] = useState(alreadyInvited)

  const isHost = currentUserId === table.host.id
  const isParticipant = localParticipants.some((p) => p.userId === currentUserId)
  const scheduledDate = new Date(table.scheduledAt)
  const isPastTable = isPast(scheduledDate)
  const statusConfig = TABLE_STATUS_CONFIG[table.status]

  const handleRSVP = async (status: RSVPStatus) => {
    if (!currentUserId) return

    const response = await fetch(`/api/tables/${table.id}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvpStatus: status }),
    })

    if (response.ok) {
      setLocalRsvpStatus(status)
      setLocalParticipants((prev) =>
        prev.map((p) =>
          p.userId === currentUserId
            ? { ...p, rsvpStatus: status, rsvpUpdatedAt: new Date().toISOString() }
            : p
        )
      )
    }
  }

  const handleInvite = async (userIds: string[]) => {
    const response = await fetch(`/api/tables/${table.id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    })

    if (response.ok) {
      setLocalInvited((prev) => [...prev, ...userIds])
      router.refresh()
    }
  }

  const handleRemoveParticipant = async (userId: string) => {
    const response = await fetch(`/api/tables/${table.id}/rsvp`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setLocalParticipants((prev) => prev.filter((p) => p.userId !== userId))
      setLocalInvited((prev) => prev.filter((id) => id !== userId))
    }
  }

  const handleCancel = async () => {
    const response = await fetch(`/api/tables/${table.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })

    if (response.ok) {
      router.refresh()
    }
    setCancelOpen(false)
  }

  const handleDelete = async () => {
    const response = await fetch(`/api/tables/${table.id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      router.push('/tables')
    }
    setDeleteOpen(false)
  }

  const handleLeave = async () => {
    const response = await fetch(`/api/tables/${table.id}/rsvp`, {
      method: 'DELETE',
    })

    if (response.ok) {
      router.push('/tables')
    }
    setLeaveOpen(false)
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link href="/tables">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tables
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero */}
          <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
            {/* Game image banner */}
            <div className="relative h-48 bg-muted">
              {table.game.boxImageUrl ? (
                <Image
                  src={table.game.boxImageUrl}
                  alt={table.game.name}
                  fill
                  className="object-cover opacity-80"
                />
              ) : table.game.thumbnailUrl ? (
                <Image
                  src={table.game.thumbnailUrl}
                  alt={table.game.name}
                  fill
                  className="object-cover opacity-80"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Status badge */}
              {table.status !== 'scheduled' && (
                <Badge
                  className={cn(
                    'absolute top-4 right-4',
                    statusConfig.color,
                    statusConfig.bgColor
                  )}
                >
                  {statusConfig.label}
                </Badge>
              )}

              {/* Title overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h1 className="text-2xl font-bold">
                  {table.title || table.game.name}
                </h1>
                {table.title && (
                  <Link
                    href={`/games/${table.game.slug}`}
                    className="text-white/80 hover:text-white text-sm"
                  >
                    {table.game.name}
                  </Link>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{format(scheduledDate, 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-muted-foreground">{format(scheduledDate, 'h:mm a')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{table.durationMinutes / 60} hours</p>
                    <p className="text-muted-foreground">Expected duration</p>
                  </div>
                </div>
                {table.locationName && (
                  <div className="flex items-center gap-3 text-sm sm:col-span-2">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">{table.locationName}</p>
                      {table.locationAddress && (
                        <p className="text-muted-foreground">{table.locationAddress}</p>
                      )}
                    </div>
                  </div>
                )}
                {table.maxPlayers && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Max {table.maxPlayers} players</p>
                      <p className="text-muted-foreground">{table.attendingCount} attending</p>
                    </div>
                  </div>
                )}
              </div>

              {table.description && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {table.description}
                  </p>
                </div>
              )}

              {/* RSVP section */}
              {isParticipant && table.status === 'scheduled' && !isPastTable && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm font-medium mb-3">Your Response</p>
                  <RSVPButtons
                    currentStatus={localRsvpStatus || 'invited'}
                    onRSVP={handleRSVP}
                    isHost={isHost}
                    disabled={isPastTable || table.status !== 'scheduled'}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Host actions */}
          {isHost && table.status === 'scheduled' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/tables/${table.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Table
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-amber-600"
                    onClick={() => setCancelOpen(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Table
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Table
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Leave button (non-host participants) */}
          {!isHost && isParticipant && table.status === 'scheduled' && (
            <Button
              variant="outline"
              className="w-full text-muted-foreground"
              onClick={() => setLeaveOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Table
            </Button>
          )}

          {/* Participants */}
          <div className="rounded-xl border border-border/50 bg-card/50">
            <div className="p-4 border-b border-border/50">
              <h2 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Crew ({localParticipants.length})
              </h2>
            </div>
            <ParticipantsList
              participants={localParticipants}
              currentUserId={currentUserId}
              isHost={isHost}
              onRemoveParticipant={isHost ? handleRemoveParticipant : undefined}
            />
          </div>
        </div>
      </div>

      {/* Invite Dialog */}
      <InviteFriendsDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        friends={friends}
        alreadyInvited={localInvited}
        onInvite={handleInvite}
      />

      {/* Cancel Confirmation */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this table?</AlertDialogTitle>
            <AlertDialogDescription>
              All participants will be notified that the table has been cancelled.
              You can delete the table afterwards if you want to remove it completely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Table</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Cancel Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this table?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The table and all participant data
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this table?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be a participant. The host may need to invite you
              again if you want to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave}>
              Leave Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
