'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Users2,
  Link2,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GamePicker } from './GamePicker'
import { useAsyncAction } from '@/hooks/admin'
import type {
  Game,
  GameFamily,
  GameRelation,
  RelationType,
} from '@/types/database'
import { RELATION_TYPE_LABELS } from '@/types/database'

interface GameRelationsEditorProps {
  game: Game
  onFamilyChange?: (familyId: string | null) => void
}

interface RelationWithGame extends GameRelation {
  target_game: Game
}

interface InverseRelationWithGame extends GameRelation {
  source_game: Game
}

const RELATION_TYPES: RelationType[] = [
  'expansion_of',
  'sequel_to',
  'prequel_to',
  'reimplementation_of',
  'spin_off_of',
  'standalone_in_series',
]

export function GameRelationsEditor({ game, onFamilyChange }: GameRelationsEditorProps) {
  const [families, setFamilies] = useState<GameFamily[]>([])
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(game.family_id || null)
  const [relations, setRelations] = useState<RelationWithGame[]>([])
  const [inverseRelations, setInverseRelations] = useState<InverseRelationWithGame[]>([])
  const [loading, setLoading] = useState(true)
  const { saving, execute } = useAsyncAction()
  const [newRelationType, setNewRelationType] = useState<RelationType>('expansion_of')

  // Use singleton browser client
  const supabase = createClient()

  // Load families and relations
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      try {
        // Load all families
        const { data: familiesData } = await supabase
          .from('game_families')
          .select('*')
          .order('name')

        if (isMounted) setFamilies(familiesData || [])

        // Load relations where this game is the source
        const { data: relationsData } = await supabase
          .from('game_relations')
          .select(`
            *,
            target_game:games!game_relations_target_game_id_fkey (*)
          `)
          .eq('source_game_id', game.id)

        if (isMounted) setRelations((relationsData as unknown as RelationWithGame[]) || [])

        // Load inverse relations where this game is the target
        const { data: inverseData } = await supabase
          .from('game_relations')
          .select(`
            *,
            source_game:games!game_relations_source_game_id_fkey (*)
          `)
          .eq('target_game_id', game.id)

        if (isMounted) setInverseRelations((inverseData as unknown as InverseRelationWithGame[]) || [])
      } catch (error) {
        console.error('Error loading relations data:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [game.id, supabase])

  // Handle family change
  const handleFamilyChange = useCallback(
    async (familyId: string) => {
      const newFamilyId = familyId === 'none' ? null : familyId

      await execute(async () => {
        const response = await fetch('/api/admin/games', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: game.id,
            data: { family_id: newFamilyId },
          }),
        })

        if (response.ok) {
          setSelectedFamilyId(newFamilyId)
          onFamilyChange?.(newFamilyId)
        }
      })
    },
    [game.id, onFamilyChange, execute]
  )

  // Add a new relation
  const handleAddRelation = useCallback(
    async (targetGame: Game) => {
      await execute(async () => {
        const response = await fetch('/api/admin/game-relations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceGameId: game.id,
            targetGameId: targetGame.id,
            relationType: newRelationType,
          }),
        })

        if (response.ok) {
          const { relation } = await response.json()
          setRelations((prev) => [
            ...prev,
            { ...relation, target_game: targetGame },
          ])
        } else {
          const { error } = await response.json()
          throw new Error(error || 'Failed to add relation')
        }
      })
    },
    [game.id, newRelationType, execute]
  )

  // Remove a relation
  const handleRemoveRelation = useCallback(async (relationId: string) => {
    await execute(async () => {
      const response = await fetch('/api/admin/game-relations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationId }),
      })

      if (response.ok) {
        setRelations((prev) => prev.filter((r) => r.id !== relationId))
      }
    })
  }, [execute])

  // Get excluded game IDs (current game + already related games)
  const excludedGameIds = [
    game.id,
    ...relations.map((r) => r.target_game_id),
    ...inverseRelations.map((r) => r.source_game_id),
  ]

  // Get the current family
  const currentFamily = families.find((f) => f.id === selectedFamilyId)

  // Get inverse label
  const getInverseLabel = (relationType: RelationType): string => {
    switch (relationType) {
      case 'expansion_of':
        return 'Has expansion'
      case 'base_game_of':
        return 'Expansion of'
      case 'sequel_to':
        return 'Prequel to'
      case 'prequel_to':
        return 'Sequel to'
      case 'reimplementation_of':
        return 'Reimplemented as'
      case 'spin_off_of':
        return 'Has spin-off'
      case 'standalone_in_series':
        return 'Related to'
      default:
        return relationType
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Family Assignment */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Users2 className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Game Family</CardTitle>
              <CardDescription>
                Assign this game to a family of related games (e.g., Catan series)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Family</Label>
              <Select
                value={selectedFamilyId || 'none'}
                onValueChange={handleFamilyChange}
                disabled={saving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No family</SelectItem>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {currentFamily && (
              <Link href={`/families/${currentFamily.slug}`} target="_blank">
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {currentFamily && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">
                This game is part of the{' '}
                <span className="font-medium text-foreground">{currentFamily.name}</span>{' '}
                family.
                {currentFamily.description && (
                  <span className="block mt-1">{currentFamily.description}</span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Relations */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Link2 className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Game Relations</CardTitle>
              <CardDescription>
                Define explicit relationships with other games (expansions, sequels, etc.)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new relation */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label>Relation Type</Label>
              <Select
                value={newRelationType}
                onValueChange={(v) => setNewRelationType(v as RelationType)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {RELATION_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <GamePicker
              onSelect={handleAddRelation}
              excludeGameIds={excludedGameIds}
              trigger={
                <>
                  <Plus className="h-4 w-4" />
                  Add Relation
                </>
              }
              disabled={saving}
            />
          </div>

          {/* Current relations - outgoing */}
          {relations.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                This game&apos;s relations
              </Label>
              <div className="space-y-2">
                {relations.map((relation) => (
                  <div
                    key={relation.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <Badge variant="secondary" className="shrink-0">
                      {RELATION_TYPE_LABELS[relation.relation_type as RelationType]}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Link
                      href={`/admin/games/${relation.target_game.id}`}
                      className="font-medium hover:text-primary transition-colors flex-1 truncate"
                    >
                      {relation.target_game.name}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRelation(relation.id)}
                      disabled={saving}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inverse relations - incoming */}
          {inverseRelations.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Games related to this one
              </Label>
              <div className="space-y-2">
                {inverseRelations.map((relation) => (
                  <div
                    key={relation.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <Link
                      href={`/admin/games/${relation.source_game.id}`}
                      className="font-medium hover:text-primary transition-colors truncate"
                    >
                      {relation.source_game.name}
                    </Link>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Badge variant="outline" className="shrink-0">
                      {getInverseLabel(relation.relation_type as RelationType)}
                    </Badge>
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      this game
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {relations.length === 0 && inverseRelations.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No relations defined. Use the button above to add relationships to other games.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
