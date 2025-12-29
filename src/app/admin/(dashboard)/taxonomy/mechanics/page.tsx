import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  Search,
  Cog,
  Pencil,
  Gamepad2,
  Hash,
} from 'lucide-react'
import type { Mechanic } from '@/types/database'

interface MechanicWithCount extends Mechanic {
  game_count: number
}

async function getMechanics(search?: string): Promise<MechanicWithCount[]> {
  const supabase = createAdminClient()

  const { data: mechanics } = await supabase
    .from('mechanics')
    .select('*')
    .order('name')

  if (!mechanics) return []

  // Get game counts for each mechanic
  const { data: gameCounts } = await supabase
    .from('game_mechanics')
    .select('mechanic_id')

  const countMap = new Map<string, number>()
  gameCounts?.forEach(gm => {
    const current = countMap.get(gm.mechanic_id) || 0
    countMap.set(gm.mechanic_id, current + 1)
  })

  let result = mechanics.map(m => ({
    ...m,
    game_count: countMap.get(m.id) || 0
  }))

  if (search) {
    const searchLower = search.toLowerCase()
    result = result.filter(m =>
      m.name.toLowerCase().includes(searchLower) ||
      m.slug.toLowerCase().includes(searchLower)
    )
  }

  return result
}

export default async function AdminMechanicsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const mechanics = await getMechanics(q)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/taxonomy">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Cog className="h-7 w-7 text-green-500" />
              Mechanics
            </h1>
            <p className="text-muted-foreground mt-1">
              Gameplay mechanisms and systems
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-bold">{mechanics.length}</div>
            <div className="text-sm text-muted-foreground">mechanics</div>
          </div>
          <Link href="/admin/taxonomy/mechanics/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Mechanic
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <form className="max-w-sm" action="/admin/taxonomy/mechanics" method="get">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search mechanics..."
            defaultValue={q}
            className="pl-9"
          />
        </div>
      </form>

      {/* Mechanics List */}
      <div className="grid gap-3">
        {mechanics.map((mechanic) => (
          <Card key={mechanic.id} className="transition-all hover:shadow-md hover:border-primary/50 group">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon placeholder */}
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Cog className="h-5 w-5 text-green-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/taxonomy/mechanics/${mechanic.id}`}>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {mechanic.name}
                      </h3>
                    </Link>
                    {mechanic.bgg_id && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Hash className="h-3 w-3" />
                        BGG {mechanic.bgg_id}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    <span className="font-mono">{mechanic.slug}</span>
                    {mechanic.description && (
                      <>
                        <span className="hidden sm:inline">-</span>
                        <span className="hidden sm:inline truncate">{mechanic.description}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Game count */}
                <Badge variant="outline" className="gap-1.5 shrink-0">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  {mechanic.game_count}
                </Badge>

                {/* Edit button */}
                <Link href={`/admin/taxonomy/mechanics/${mechanic.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mechanics.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Cog className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No mechanics found</h3>
            <p className="text-muted-foreground mt-1">
              {q ? `No mechanics matching "${q}"` : 'Add your first mechanic to get started'}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {q && (
                <Link href="/admin/taxonomy/mechanics">
                  <Button variant="outline">Clear search</Button>
                </Link>
              )}
              <Link href="/admin/taxonomy/mechanics/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Mechanic
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
