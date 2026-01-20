'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { ParticipantWithProfile, RSVPStatus } from '@/types/tables'

interface UseTableActionsOptions {
  tableId: string
  initialParticipants: ParticipantWithProfile[]
  initialRsvpStatus?: RSVPStatus
  initialInvited: string[]
  currentUserId?: string
}

interface UseTableActionsReturn {
  localParticipants: ParticipantWithProfile[]
  localRsvpStatus: RSVPStatus | undefined
  localInvited: string[]
  handleRSVP: (status: RSVPStatus) => Promise<void>
  handleInvite: (userIds: string[]) => Promise<void>
  handleRemoveParticipant: (userId: string) => Promise<void>
  handleCancel: () => Promise<void>
  handleDelete: () => Promise<void>
  handleLeave: () => Promise<void>
}

/**
 * Custom hook for managing table action handlers
 * Extracts action logic from TableDetailContent for better separation of concerns
 */
export function useTableActions({
  tableId,
  initialParticipants,
  initialRsvpStatus,
  initialInvited,
  currentUserId,
}: UseTableActionsOptions): UseTableActionsReturn {
  const router = useRouter()
  const [localParticipants, setLocalParticipants] = useState(initialParticipants)
  const [localRsvpStatus, setLocalRsvpStatus] = useState(initialRsvpStatus)
  const [localInvited, setLocalInvited] = useState(initialInvited)

  const handleRSVP = useCallback(
    async (status: RSVPStatus) => {
      if (!currentUserId) return

      const response = await fetch(`/api/tables/${tableId}/rsvp`, {
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
    },
    [tableId, currentUserId]
  )

  const handleInvite = useCallback(
    async (userIds: string[]) => {
      const response = await fetch(`/api/tables/${tableId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      })

      if (response.ok) {
        setLocalInvited((prev) => [...prev, ...userIds])
        router.refresh()
      }
    },
    [tableId, router]
  )

  const handleRemoveParticipant = useCallback(
    async (userId: string) => {
      const response = await fetch(`/api/tables/${tableId}/rsvp`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLocalParticipants((prev) => prev.filter((p) => p.userId !== userId))
        setLocalInvited((prev) => prev.filter((id) => id !== userId))
      }
    },
    [tableId]
  )

  const handleCancel = useCallback(async () => {
    const response = await fetch(`/api/tables/${tableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })

    if (response.ok) {
      router.refresh()
    }
  }, [tableId, router])

  const handleDelete = useCallback(async () => {
    const response = await fetch(`/api/tables/${tableId}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      router.push('/tables')
    }
  }, [tableId, router])

  const handleLeave = useCallback(async () => {
    const response = await fetch(`/api/tables/${tableId}/rsvp`, {
      method: 'DELETE',
    })

    if (response.ok) {
      router.push('/tables')
    }
  }, [tableId, router])

  return {
    localParticipants,
    localRsvpStatus,
    localInvited,
    handleRSVP,
    handleInvite,
    handleRemoveParticipant,
    handleCancel,
    handleDelete,
    handleLeave,
  }
}
