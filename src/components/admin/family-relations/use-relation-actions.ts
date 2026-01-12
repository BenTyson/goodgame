import { useState, useCallback } from 'react'
import type { RelationType } from '@/types/database'

interface UseRelationActionsOptions {
  onRelationCreated?: () => void
}

interface RelationActions {
  createRelation: (sourceId: string, targetId: string, relationType: RelationType) => Promise<boolean>
  updateRelation: (
    oldRelationId: string,
    sourceId: string,
    targetId: string,
    relationType: RelationType
  ) => Promise<boolean>
  deleteRelation: (relationId: string) => Promise<boolean>
  isCreating: boolean
  isUpdating: boolean
  deletingId: string | null
}

/**
 * Hook for managing game relation CRUD operations.
 */
export function useRelationActions({ onRelationCreated }: UseRelationActionsOptions = {}): RelationActions {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const createRelation = useCallback(async (
    sourceId: string,
    targetId: string,
    relationType: RelationType
  ): Promise<boolean> => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/game-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceGameId: sourceId,
          targetGameId: targetId,
          relationType,
        }),
      })

      if (response.ok) {
        onRelationCreated?.()
        return true
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create relation')
        return false
      }
    } catch (error) {
      alert('Failed to create relation')
      return false
    } finally {
      setIsCreating(false)
    }
  }, [onRelationCreated])

  const deleteRelation = useCallback(async (relationId: string): Promise<boolean> => {
    setDeletingId(relationId)
    try {
      const response = await fetch('/api/admin/game-relations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationId }),
      })

      if (response.ok) {
        onRelationCreated?.()
        return true
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete relation')
        return false
      }
    } catch (error) {
      alert('Failed to delete relation')
      return false
    } finally {
      setDeletingId(null)
    }
  }, [onRelationCreated])

  const updateRelation = useCallback(async (
    oldRelationId: string,
    sourceId: string,
    targetId: string,
    relationType: RelationType
  ): Promise<boolean> => {
    setIsUpdating(true)
    try {
      // Delete old relation first
      const deleteResponse = await fetch('/api/admin/game-relations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationId: oldRelationId }),
      })

      if (!deleteResponse.ok) {
        const data = await deleteResponse.json()
        throw new Error(data.error || 'Failed to delete old relation')
      }

      // Create new relation
      const createResponse = await fetch('/api/admin/game-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceGameId: sourceId,
          targetGameId: targetId,
          relationType,
        }),
      })

      if (createResponse.ok) {
        onRelationCreated?.()
        return true
      } else {
        const data = await createResponse.json()
        alert(data.error || 'Failed to create new relation')
        return false
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update relation')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [onRelationCreated])

  return {
    createRelation,
    updateRelation,
    deleteRelation,
    isCreating,
    isUpdating,
    deletingId,
  }
}
