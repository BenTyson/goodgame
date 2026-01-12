'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Pencil, Settings2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { RELATION_CONFIG } from './types'
import type { Game, GameRelation, RelationType } from '@/types/database'

interface ManageRelationsTableProps {
  relations: GameRelation[]
  games: Game[]
  onEdit: (relation: GameRelation) => void
  onDelete: (relationId: string) => void
  deletingId: string | null
}

export function ManageRelationsTable({
  relations,
  games,
  onEdit,
  onDelete,
  deletingId,
}: ManageRelationsTableProps) {
  const [showTable, setShowTable] = useState(false)

  if (relations.length === 0) {
    return null
  }

  // Create a map of game IDs to games for quick lookup
  const gamesMap = new Map(games.map(g => [g.id, g]))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Manage Relations ({relations.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTable(!showTable)}
            className="h-7 px-2 text-xs"
          >
            {showTable ? 'Hide' : 'Show'}
          </Button>
        </div>
      </CardHeader>
      {showTable && (
        <CardContent className="pt-0">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">Game</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">Relation</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">Target</th>
                  <th className="w-20 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {relations.map((relation) => {
                  const sourceGame = gamesMap.get(relation.source_game_id)
                  const targetGame = gamesMap.get(relation.target_game_id)
                  const config = RELATION_CONFIG[relation.relation_type as RelationType]

                  if (!sourceGame || !targetGame) return null

                  return (
                    <tr key={relation.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/games/${sourceGame.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {sourceGame.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn("text-xs font-medium", config?.color)}>
                          {config?.label || relation.relation_type}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/games/${targetGame.id}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {targetGame.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(relation)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(relation.id)}
                            disabled={deletingId === relation.id}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {deletingId === relation.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
