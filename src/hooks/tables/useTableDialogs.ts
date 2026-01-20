'use client'

import { useState, useCallback } from 'react'

interface UseTableDialogsReturn {
  inviteOpen: boolean
  setInviteOpen: (open: boolean) => void
  deleteOpen: boolean
  setDeleteOpen: (open: boolean) => void
  cancelOpen: boolean
  setCancelOpen: (open: boolean) => void
  leaveOpen: boolean
  setLeaveOpen: (open: boolean) => void
  recapOpen: boolean
  setRecapOpen: (open: boolean) => void
  closeAll: () => void
}

/**
 * Custom hook for managing table dialog state
 * Extracts dialog state management from TableDetailContent
 */
export function useTableDialogs(): UseTableDialogsReturn {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)

  const closeAll = useCallback(() => {
    setInviteOpen(false)
    setDeleteOpen(false)
    setCancelOpen(false)
    setLeaveOpen(false)
    setRecapOpen(false)
  }, [])

  return {
    inviteOpen,
    setInviteOpen,
    deleteOpen,
    setDeleteOpen,
    cancelOpen,
    setCancelOpen,
    leaveOpen,
    setLeaveOpen,
    recapOpen,
    setRecapOpen,
    closeAll,
  }
}
