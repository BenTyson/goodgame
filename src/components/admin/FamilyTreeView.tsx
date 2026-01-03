'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Crown,
  Package,
  ArrowRight,
  RefreshCw,
  GitFork,
  Layers,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  Link2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Game, GameRelation, RelationType } from '@/types/database'

interface TreeNode {
  game: Game
  relationType?: RelationType
  children: TreeNode[]
}

interface FamilyTreeViewProps {
  games: Game[]
  relations: GameRelation[]
  baseGameId: string | null
  onRelationCreated?: () => void
}

// Relation types available for manual assignment
const ASSIGNABLE_RELATION_TYPES: { value: RelationType; label: string }[] = [
  { value: 'expansion_of', label: 'Expansion of' },
  { value: 'sequel_to', label: 'Sequel to' },
  { value: 'reimplementation_of', label: 'Reimplementation of' },
  { value: 'spin_off_of', label: 'Spin-off of' },
  { value: 'standalone_in_series', label: 'Standalone in series with' },
]

// Relation type config for visual styling
const RELATION_CONFIG: Record<RelationType, {
  label: string
  shortLabel: string
  icon: typeof Package
  color: string
  bgColor: string
}> = {
  expansion_of: {
    label: 'Expansion',
    shortLabel: 'Exp',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  base_game_of: {
    label: 'Base Game',
    shortLabel: 'Base',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  sequel_to: {
    label: 'Sequel',
    shortLabel: 'Seq',
    icon: ArrowRight,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  prequel_to: {
    label: 'Prequel',
    shortLabel: 'Preq',
    icon: ArrowRight,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  reimplementation_of: {
    label: 'Reimplementation',
    shortLabel: 'Reimp',
    icon: RefreshCw,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  spin_off_of: {
    label: 'Spin-off',
    shortLabel: 'Spin',
    icon: GitFork,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  standalone_in_series: {
    label: 'Standalone',
    shortLabel: 'Stand',
    icon: Layers,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
}

// Build tree structure from flat relations
function buildFamilyTree(
  games: Game[],
  relations: GameRelation[],
  baseGameId: string | null
): { tree: TreeNode | null; orphans: Game[] } {
  if (games.length === 0) {
    return { tree: null, orphans: [] }
  }

  const gamesMap = new Map(games.map(g => [g.id, g]))

  // Find base game: use provided baseGameId or oldest game
  let rootGame: Game | undefined
  if (baseGameId && gamesMap.has(baseGameId)) {
    rootGame = gamesMap.get(baseGameId)
  } else {
    // Find oldest game (by year, then by shortest name as proxy for "base" name)
    rootGame = [...games].sort((a, b) => {
      if (a.year_published && b.year_published) {
        if (a.year_published !== b.year_published) return a.year_published - b.year_published
      } else if (a.year_published) {
        return -1
      } else if (b.year_published) {
        return 1
      }
      return a.name.length - b.name.length
    })[0]
  }

  if (!rootGame) {
    return { tree: null, orphans: games }
  }

  // Build adjacency list: parent -> children
  // "expansion_of", "sequel_to", etc. mean: source is X of target
  // So if Game A is "expansion_of" Game B, then B is parent and A is child
  const childrenMap = new Map<string, { game: Game; relationType: RelationType }[]>()

  for (const relation of relations) {
    const sourceGame = gamesMap.get(relation.source_game_id)
    const targetGame = gamesMap.get(relation.target_game_id)

    if (!sourceGame || !targetGame) continue

    // Source is "X of" target, so target is parent, source is child
    const parentId = relation.target_game_id
    const children = childrenMap.get(parentId) || []
    children.push({
      game: sourceGame,
      relationType: relation.relation_type as RelationType,
    })
    childrenMap.set(parentId, children)
  }

  // Build tree recursively from root
  const visited = new Set<string>()

  function buildNode(game: Game, relationType?: RelationType): TreeNode {
    visited.add(game.id)

    const childNodes: TreeNode[] = []
    const children = childrenMap.get(game.id) || []

    // Sort children: expansions first, then by year
    const sortedChildren = [...children].sort((a, b) => {
      // Expansions come first
      if (a.relationType === 'expansion_of' && b.relationType !== 'expansion_of') return -1
      if (b.relationType === 'expansion_of' && a.relationType !== 'expansion_of') return 1
      // Then by year
      if (a.game.year_published && b.game.year_published) {
        return a.game.year_published - b.game.year_published
      }
      return 0
    })

    for (const child of sortedChildren) {
      if (!visited.has(child.game.id)) {
        childNodes.push(buildNode(child.game, child.relationType))
      }
    }

    return {
      game,
      relationType,
      children: childNodes,
    }
  }

  const tree = buildNode(rootGame)

  // Find orphans (games not in tree)
  const orphans = games.filter(g => !visited.has(g.id))

  return { tree, orphans }
}

// Tree Node Component
function TreeNodeComponent({
  node,
  isRoot = false,
  isLast = true,
  depth = 0,
  defaultExpanded = true,
}: {
  node: TreeNode
  isRoot?: boolean
  isLast?: boolean
  depth?: number
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const hasChildren = node.children.length > 0
  const config = node.relationType ? RELATION_CONFIG[node.relationType] : null
  const Icon = config?.icon || Crown
  const thumbnail = node.game.thumbnail_url ||
    (node.game.bgg_raw_data as { thumbnail?: string } | null)?.thumbnail

  return (
    <div className="relative">
      {/* Tree lines */}
      {!isRoot && depth > 0 && (
        <>
          {/* Vertical line from parent */}
          <div
            className={cn(
              "absolute left-[19px] border-l-2 border-muted-foreground/30",
              isLast ? "top-0 h-[26px]" : "top-0 bottom-0"
            )}
            style={{ marginLeft: `${(depth - 1) * 40}px` }}
          />
          {/* Horizontal connector */}
          <div
            className="absolute top-[26px] w-4 border-t-2 border-muted-foreground/30"
            style={{ left: `${(depth - 1) * 40 + 19}px` }}
          />
        </>
      )}

      {/* Node content */}
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-muted/50 group",
          isRoot && "bg-primary/5 border border-primary/20"
        )}
        style={{ paddingLeft: `${depth * 40 + 8}px` }}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0 h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="shrink-0 w-5" />
        )}

        {/* Icon */}
        <div className={cn(
          "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
          isRoot ? "bg-amber-100 dark:bg-amber-900/30" : config?.bgColor || "bg-muted"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            isRoot ? "text-amber-600" : config?.color || "text-muted-foreground"
          )} />
        </div>

        {/* Thumbnail */}
        <div className="shrink-0 h-10 w-10 rounded overflow-hidden bg-muted">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={node.game.name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Game info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/admin/games/${node.game.id}`}
            className="font-medium hover:text-primary transition-colors truncate block"
          >
            {node.game.name}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {node.game.year_published && (
              <span>{node.game.year_published}</span>
            )}
            {node.game.bgg_id && (
              <span>BGG #{node.game.bgg_id}</span>
            )}
          </div>
        </div>

        {/* Child count badge (when collapsed) */}
        {hasChildren && !isExpanded && (
          <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
            {node.children.length} more
          </Badge>
        )}

        {/* Relation badge */}
        {!isRoot && config && (
          <Badge
            variant="outline"
            className={cn("shrink-0 text-xs", config.color)}
          >
            {config.shortLabel}
          </Badge>
        )}
        {isRoot && (
          <Badge className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300">
            Base
          </Badge>
        )}

        {/* Actions */}
        {node.game.is_published && (
          <Link
            href={`/games/${node.game.slug}`}
            target="_blank"
            className="shrink-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Vertical line through children */}
          {node.children.length > 1 && (
            <div
              className="absolute border-l-2 border-muted-foreground/30"
              style={{
                left: `${depth * 40 + 19}px`,
                top: 0,
                bottom: '26px',
              }}
            />
          )}
          {node.children.map((child, index) => (
            <TreeNodeComponent
              key={child.game.id}
              node={child}
              isLast={index === node.children.length - 1}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FamilyTreeView({ games, relations, baseGameId, onRelationCreated }: FamilyTreeViewProps) {
  const [treeKey, setTreeKey] = useState(0) // Used to force re-render for expand/collapse all
  const [defaultExpanded, setDefaultExpanded] = useState(true)

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkingGame, setLinkingGame] = useState<Game | null>(null)
  const [selectedRelationType, setSelectedRelationType] = useState<RelationType>('sequel_to')
  const [selectedTargetId, setSelectedTargetId] = useState<string>('')
  const [isLinking, setIsLinking] = useState(false)

  const { tree, orphans } = useMemo(
    () => buildFamilyTree(games, relations, baseGameId),
    [games, relations, baseGameId]
  )

  // Count total nodes in tree for stats
  const countNodes = (node: TreeNode): number => {
    return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0)
  }
  const treeNodeCount = tree ? countNodes(tree) : 0

  const handleExpandAll = () => {
    setDefaultExpanded(true)
    setTreeKey(prev => prev + 1)
  }

  const handleCollapseAll = () => {
    setDefaultExpanded(false)
    setTreeKey(prev => prev + 1)
  }

  const openLinkDialog = (game: Game) => {
    setLinkingGame(game)
    setSelectedRelationType('sequel_to')
    setSelectedTargetId('')
    setLinkDialogOpen(true)
  }

  const handleCreateRelation = async () => {
    if (!linkingGame || !selectedTargetId || !selectedRelationType) return

    setIsLinking(true)
    try {
      const response = await fetch('/api/admin/game-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceGameId: linkingGame.id,
          targetGameId: selectedTargetId,
          relationType: selectedRelationType,
        }),
      })

      if (response.ok) {
        setLinkDialogOpen(false)
        setLinkingGame(null)
        onRelationCreated?.()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create relation')
      }
    } catch (error) {
      alert('Failed to create relation')
    } finally {
      setIsLinking(false)
    }
  }

  // Get potential target games (all games except the one being linked)
  const potentialTargets = games.filter(g => g.id !== linkingGame?.id)

  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No games in this family yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tree visualization */}
      {tree && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Family Tree
                <span className="text-sm font-normal text-muted-foreground">
                  ({treeNodeCount} {treeNodeCount === 1 ? 'game' : 'games'})
                </span>
              </CardTitle>
              {treeNodeCount > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExpandAll}
                    className="h-7 px-2 text-xs"
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCollapseAll}
                    className="h-7 px-2 text-xs"
                  >
                    Collapse All
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <TreeNodeComponent
              key={treeKey}
              node={tree}
              isRoot
              defaultExpanded={defaultExpanded}
            />
          </CardContent>
        </Card>
      )}

      {/* Orphan games (in family but no relations) */}
      {orphans.length > 0 && (
        <Card className="border-dashed border-amber-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Unlinked Games ({orphans.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              These games are in the family but have no defined relations. Click &quot;Link&quot; to connect them.
            </p>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {orphans.map(game => {
              const thumbnail = game.thumbnail_url ||
                (game.bgg_raw_data as { thumbnail?: string } | null)?.thumbnail

              return (
                <div
                  key={game.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
                >
                  <div className="shrink-0 h-8 w-8 rounded overflow-hidden bg-muted">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={game.name}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-3 w-3 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/admin/games/${game.id}`}
                    className="font-medium text-sm hover:text-primary transition-colors flex-1 truncate"
                  >
                    {game.name}
                  </Link>
                  {game.year_published && (
                    <span className="text-xs text-muted-foreground">
                      {game.year_published}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openLinkDialog(game)}
                    className="shrink-0 h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    Link
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 px-1">
        <span className="text-xs text-muted-foreground">Legend:</span>
        {Object.entries(RELATION_CONFIG).map(([type, config]) => {
          if (type === 'base_game_of') return null // Skip base_game_of in legend
          const Icon = config.icon
          return (
            <div key={type} className="flex items-center gap-1 text-xs">
              <Icon className={cn("h-3 w-3", config.color)} />
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          )
        })}
      </div>

      {/* Link Game Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Game to Family Tree</DialogTitle>
            <DialogDescription>
              Define how &quot;{linkingGame?.name}&quot; relates to another game in this family.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>This game is a...</Label>
              <Select
                value={selectedRelationType}
                onValueChange={(v) => setSelectedRelationType(v as RelationType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_RELATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Game</Label>
              <Select
                value={selectedTargetId}
                onValueChange={setSelectedTargetId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a game..." />
                </SelectTrigger>
                <SelectContent>
                  {potentialTargets.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name} {game.year_published ? `(${game.year_published})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {linkingGame && selectedTargetId && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <span className="font-medium">{linkingGame.name}</span>
                <span className="text-muted-foreground mx-2">→</span>
                <span className="text-muted-foreground">
                  {ASSIGNABLE_RELATION_TYPES.find(t => t.value === selectedRelationType)?.label}
                </span>
                <span className="text-muted-foreground mx-2">→</span>
                <span className="font-medium">
                  {potentialTargets.find(g => g.id === selectedTargetId)?.name}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRelation}
              disabled={!selectedTargetId || isLinking}
            >
              {isLinking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Relation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
