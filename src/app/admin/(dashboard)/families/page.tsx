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
  for (const rel of relations || []) {
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

  // Build family stats
  const familyStats: FamilyWithStats[] = families.map(f => {
    const games = (f.games as unknown as {
      id: string
      name: string
      has_unimported_relations: boolean
      thumbnail_url: string | null
      bgg_raw_data: { reference_images?: { thumbnail?: string } } | null
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

    // Find base game thumbnail - prefer explicit base_game_id, else oldest game by year
    let baseGameThumbnail: string | null = null
    if (f.base_game_id) {
      const baseGame = games.find(g => g.id === f.base_game_id)
      if (baseGame) {
        baseGameThumbnail = baseGame.thumbnail_url || baseGame.bgg_raw_data?.reference_images?.thumbnail || null
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
      baseGameThumbnail = baseGame.thumbnail_url || baseGame.bgg_raw_data?.reference_images?.thumbnail || null
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
    }
  })

  // Filter by relation type if specified
  if (relationFilter && relationFilter !== 'all') {
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

  // Get total relation counts for filter badges
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

  const filters = [
    { key: 'all', label: 'All', count: families.length },
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
          return (
            <Link key={f.key} href={buildUrl(f.key)}>
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
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
