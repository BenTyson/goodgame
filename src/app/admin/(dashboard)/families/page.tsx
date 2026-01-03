import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Pencil,
  Search,
  Users2,
  Plus,
  ExternalLink,
  Layers,
  GitBranch,
  RefreshCw,
  Sparkles,
  ImageIcon,
  AlertCircle,
} from 'lucide-react'

// Relation type display config
const RELATION_CONFIG: Record<string, { label: string; pluralLabel: string; color: string }> = {
  expansion_of: { label: 'Expansion', pluralLabel: 'Expansions', color: 'text-blue-600' },
  sequel_to: { label: 'Sequel', pluralLabel: 'Sequels', color: 'text-green-600' },
  prequel_to: { label: 'Prequel', pluralLabel: 'Prequels', color: 'text-purple-600' },
  reimplementation_of: { label: 'Reimplementation', pluralLabel: 'Reimplementations', color: 'text-orange-600' },
  spin_off_of: { label: 'Spin-off', pluralLabel: 'Spin-offs', color: 'text-pink-600' },
  standalone_in_series: { label: 'Standalone', pluralLabel: 'Standalones', color: 'text-cyan-600' },
}

interface RelationCounts {
  expansion_of: number
  sequel_to: number
  prequel_to: number
  reimplementation_of: number
  spin_off_of: number
  standalone_in_series: number
}

interface FamilyWithStats {
  id: string
  name: string
  slug: string
  description: string | null
  game_count: number
  has_unimported_content: boolean
  relation_counts: RelationCounts
  base_game_thumbnail: string | null
  orphan_count: number // Games in family but not connected in the tree
}

async function getFamilies(search?: string, relationFilter?: string): Promise<FamilyWithStats[]> {
  const supabase = createAdminClient()

  // Get families with games
  let query = supabase
    .from('game_families')
    .select(`
      id,
      name,
      slug,
      description,
      base_game_id,
      games:games!games_family_id_fkey(id, name, has_unimported_relations, thumbnail_url, bgg_raw_data, year_published)
    `)
    .order('name', { ascending: true })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data: families } = await query

  if (!families || families.length === 0) return []

  // Get all game IDs across all families
  const allGameIds = families.flatMap(f =>
    ((f.games as unknown as { id: string }[]) || []).map(g => g.id)
  )

  // Get relation counts for games in these families
  const { data: relations } = await supabase
    .from('game_relations')
    .select('source_game_id, relation_type')
    .in('source_game_id', allGameIds)

  // Build a map of game_id -> relation counts
  const gameRelationCounts = new Map<string, RelationCounts>()
  // Also track which games are connected (either as source or target in a relation)
  const connectedGames = new Set<string>()

  for (const rel of relations || []) {
    connectedGames.add(rel.source_game_id)
    // We need target game IDs too - track them for later
    if (!gameRelationCounts.has(rel.source_game_id)) {
      gameRelationCounts.set(rel.source_game_id, {
        expansion_of: 0,
        sequel_to: 0,
        prequel_to: 0,
        reimplementation_of: 0,
        spin_off_of: 0,
        standalone_in_series: 0,
      })
    }
    const counts = gameRelationCounts.get(rel.source_game_id)!
    const relType = rel.relation_type as keyof RelationCounts
    if (relType in counts) {
      counts[relType]++
    }
  }

  // Get all relations (need target_game_id too for orphan calculation)
  const { data: allRelations } = await supabase
    .from('game_relations')
    .select('source_game_id, target_game_id, relation_type')
    .in('target_game_id', allGameIds)

  // Add targets to connected set
  for (const rel of allRelations || []) {
    if (allGameIds.includes(rel.source_game_id)) {
      connectedGames.add(rel.target_game_id)
    }
  }

  // Build a map of family_id -> set of connected game IDs
  // A game is connected if it appears as source or target in any intra-family relation
  const familyConnectedGames = new Map<string, Set<string>>()

  // Initialize with empty sets
  for (const f of families) {
    familyConnectedGames.set(f.id, new Set())
  }

  // Build map of game_id -> family_id for quick lookup
  const gameToFamily = new Map<string, string>()
  for (const f of families) {
    const games = (f.games as unknown as { id: string }[]) || []
    for (const g of games) {
      gameToFamily.set(g.id, f.id)
    }
  }

  // Mark games as connected if they appear in any intra-family relation
  for (const rel of relations || []) {
    const sourceFamilyId = gameToFamily.get(rel.source_game_id)
    const targetFamilyId = allRelations?.find(
      r => r.source_game_id === rel.source_game_id
    )
      ? gameToFamily.get(
          allRelations.find(r => r.source_game_id === rel.source_game_id)?.target_game_id || ''
        )
      : undefined

    // If source has a relation, check if target is in same family
    if (sourceFamilyId) {
      // Need to get target from the full relation
      const fullRel = allRelations?.find(
        r => r.source_game_id === rel.source_game_id
      )
      if (fullRel && gameToFamily.get(fullRel.target_game_id) === sourceFamilyId) {
        familyConnectedGames.get(sourceFamilyId)?.add(rel.source_game_id)
        familyConnectedGames.get(sourceFamilyId)?.add(fullRel.target_game_id)
      }
    }
  }

  // Also use allRelations to mark connected games (needed for complete picture)
  for (const rel of allRelations || []) {
    const sourceFamilyId = gameToFamily.get(rel.source_game_id)
    const targetFamilyId = gameToFamily.get(rel.target_game_id)

    // If both source and target are in the same family, both are connected
    if (sourceFamilyId && sourceFamilyId === targetFamilyId) {
      familyConnectedGames.get(sourceFamilyId)?.add(rel.source_game_id)
      familyConnectedGames.get(sourceFamilyId)?.add(rel.target_game_id)
    }
  }

  // Build family stats
  const familyStats: FamilyWithStats[] = families.map(f => {
    const games = (f.games as unknown as {
      id: string
      name: string
      has_unimported_relations: boolean
      thumbnail_url: string | null
      bgg_raw_data: { thumbnail?: string | null } | null
      year_published: number | null
    }[]) || []

    // Aggregate relation counts for all games in this family
    const relationCounts: RelationCounts = {
      expansion_of: 0,
      sequel_to: 0,
      prequel_to: 0,
      reimplementation_of: 0,
      spin_off_of: 0,
      standalone_in_series: 0,
    }

    for (const game of games) {
      const gameCounts = gameRelationCounts.get(game.id)
      if (gameCounts) {
        relationCounts.expansion_of += gameCounts.expansion_of
        relationCounts.sequel_to += gameCounts.sequel_to
        relationCounts.prequel_to += gameCounts.prequel_to
        relationCounts.reimplementation_of += gameCounts.reimplementation_of
        relationCounts.spin_off_of += gameCounts.spin_off_of
        relationCounts.standalone_in_series += gameCounts.standalone_in_series
      }
    }

    // Calculate orphan count
    // For single-game families, there are no orphans (the one game is the base)
    // For multi-game families, orphans are games not connected to any other game
    let orphanCount = 0
    if (games.length > 1) {
      const connectedSet = familyConnectedGames.get(f.id) || new Set()
      // Find the base game (oldest or explicit)
      const baseGameId = f.base_game_id || [...games].sort((a, b) => {
        if (a.year_published && b.year_published) {
          return a.year_published - b.year_published
        }
        return a.name.length - b.name.length
      })[0]?.id

      // An orphan is a game that:
      // 1. Is not the base game, AND
      // 2. Is not connected to any other game in the family
      for (const game of games) {
        if (game.id !== baseGameId && !connectedSet.has(game.id)) {
          orphanCount++
        }
      }
    }

    // Find base game thumbnail - prefer explicit base_game_id, else oldest game by year
    let baseGameThumbnail: string | null = null
    if (f.base_game_id) {
      const baseGame = games.find(g => g.id === f.base_game_id)
      if (baseGame) {
        baseGameThumbnail = baseGame.thumbnail_url || baseGame.bgg_raw_data?.thumbnail || null
      }
    }
    if (!baseGameThumbnail && games.length > 0) {
      // Find oldest game (by year, then by name length as proxy for "base" vs expansion)
      const sorted = [...games].sort((a, b) => {
        if (a.year_published && b.year_published) {
          if (a.year_published !== b.year_published) return a.year_published - b.year_published
        }
        return a.name.length - b.name.length
      })
      const baseGame = sorted[0]
      baseGameThumbnail = baseGame.thumbnail_url || baseGame.bgg_raw_data?.thumbnail || null
    }

    return {
      id: f.id,
      name: f.name,
      slug: f.slug,
      description: f.description,
      game_count: games.length,
      has_unimported_content: games.some(g => g.has_unimported_relations),
      relation_counts: relationCounts,
      base_game_thumbnail: baseGameThumbnail,
      orphan_count: orphanCount,
    }
  })

  // Filter by relation type or needs_review
  if (relationFilter && relationFilter !== 'all') {
    if (relationFilter === 'needs_review') {
      // Show families that have orphan games needing review
      return familyStats.filter(f => f.orphan_count > 0)
    }
    return familyStats.filter(f => {
      const key = relationFilter as keyof RelationCounts
      return f.relation_counts[key] > 0
    })
  }

  return familyStats
}

export default async function AdminFamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; relation?: string }>
}) {
  const { q, relation } = await searchParams
  const families = await getFamilies(q, relation)

  // Get total relation counts and orphan counts for filter badges
  const totalCounts = families.reduce(
    (acc, f) => ({
      expansion_of: acc.expansion_of + f.relation_counts.expansion_of,
      sequel_to: acc.sequel_to + f.relation_counts.sequel_to,
      prequel_to: acc.prequel_to + f.relation_counts.prequel_to,
      reimplementation_of: acc.reimplementation_of + f.relation_counts.reimplementation_of,
      spin_off_of: acc.spin_off_of + f.relation_counts.spin_off_of,
      standalone_in_series: acc.standalone_in_series + f.relation_counts.standalone_in_series,
    }),
    { expansion_of: 0, sequel_to: 0, prequel_to: 0, reimplementation_of: 0, spin_off_of: 0, standalone_in_series: 0 }
  )

  // Count families that need review (have orphan games)
  const familiesNeedingReview = families.filter(f => f.orphan_count > 0).length

  const filters = [
    { key: 'all', label: 'All', count: families.length },
    { key: 'needs_review', label: 'Needs Review', count: familiesNeedingReview, icon: AlertCircle, highlight: true },
    { key: 'expansion_of', label: 'Expansions', count: totalCounts.expansion_of, icon: Layers },
    { key: 'sequel_to', label: 'Sequels', count: totalCounts.sequel_to, icon: GitBranch },
    { key: 'reimplementation_of', label: 'Reimplementations', count: totalCounts.reimplementation_of, icon: RefreshCw },
    { key: 'spin_off_of', label: 'Spin-offs', count: totalCounts.spin_off_of, icon: Sparkles },
  ]

  const buildUrl = (newRelation?: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (newRelation && newRelation !== 'all') params.set('relation', newRelation)
    const qs = params.toString()
    return `/admin/families${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Game Families</h1>
          <p className="text-muted-foreground mt-1">
            Manage game series and family groupings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-3xl font-bold">{families.length}</div>
            <div className="text-sm text-muted-foreground">families</div>
          </div>
          <Link href="/admin/families/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Family
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const isActive = relation === f.key || (!relation && f.key === 'all')
          const Icon = f.icon
          const isHighlight = 'highlight' in f && f.highlight && f.count > 0
          return (
            <Link key={f.key} href={buildUrl(f.key)}>
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={`gap-1.5 ${isHighlight && !isActive ? 'border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700' : ''}`}
              >
                {Icon && <Icon className={`h-3.5 w-3.5 ${isHighlight && !isActive ? 'text-amber-500' : ''}`} />}
                {f.label}
                {f.count > 0 && (
                  <span className="ml-1 text-xs opacity-70">({f.count})</span>
                )}
              </Button>
            </Link>
          )
        })}
      </div>

      {/* Search */}
      <form className="max-w-sm" action="/admin/families" method="get">
        {relation && <input type="hidden" name="relation" value={relation} />}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search families..."
            defaultValue={q}
            className="pl-9"
          />
        </div>
      </form>

      {/* Families Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {families.map((family) => {
          // Get non-zero relation counts for display
          const relationEntries = Object.entries(family.relation_counts)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => ({
              type,
              count,
              config: RELATION_CONFIG[type],
            }))

          return (
            <Link key={family.id} href={`/admin/families/${family.id}`}>
              <Card padding="none" className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 group h-full">
                {/* Thumbnail */}
                <div className="relative aspect-[16/9] bg-muted">
                  {family.base_game_thumbnail ? (
                    <Image
                      src={family.base_game_thumbnail}
                      alt={family.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Badges overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {family.orphan_count > 0 && (
                      <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50/90 text-xs px-1.5 py-0.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {family.orphan_count} unlinked
                      </Badge>
                    )}
                    {family.has_unimported_content && (
                      <Badge variant="outline" className="text-orange-600 border-orange-400 bg-orange-50/90 text-xs px-1.5 py-0.5">
                        Incomplete
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {family.game_count} games
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-3">
                  {/* Family name */}
                  <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">
                    {family.name}
                  </h3>

                  {/* Relation counts - compact */}
                  {relationEntries.length > 0 ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      {relationEntries.map(({ type, count, config }) => (
                        <span key={type} className={`${config.color}`}>
                          {count} {count === 1 ? config.label : config.pluralLabel}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No relations defined</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Empty State */}
      {families.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Users2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No families found</h3>
            <p className="text-muted-foreground mt-1">
              {q ? `No families matching "${q}"` : 'Create a family to group related games together'}
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              {(q || relation) && (
                <Link href="/admin/families">
                  <Button variant="outline">
                    Clear filters
                  </Button>
                </Link>
              )}
              <Link href="/admin/families/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Family
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
