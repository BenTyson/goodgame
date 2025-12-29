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
  Users,
  Pencil,
  Gamepad2,
} from 'lucide-react'
import type { PlayerExperience } from '@/types/database'

interface PlayerExperienceWithCount extends PlayerExperience {
  game_count: number
}

async function getPlayerExperiences(search?: string): Promise<PlayerExperienceWithCount[]> {
  const supabase = createAdminClient()

  const { data: experiences } = await supabase
    .from('player_experiences')
    .select('*')
    .order('display_order')

  if (!experiences) return []

  // Get game counts for each experience
  const { data: gameCounts } = await supabase
    .from('game_player_experiences')
    .select('player_experience_id')

  const countMap = new Map<string, number>()
  gameCounts?.forEach(gpe => {
    const current = countMap.get(gpe.player_experience_id) || 0
    countMap.set(gpe.player_experience_id, current + 1)
  })

  let result = experiences.map(pe => ({
    ...pe,
    game_count: countMap.get(pe.id) || 0
  }))

  if (search) {
    const searchLower = search.toLowerCase()
    result = result.filter(pe =>
      pe.name.toLowerCase().includes(searchLower) ||
      pe.slug.toLowerCase().includes(searchLower)
    )
  }

  return result
}

export default async function AdminPlayerExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const experiences = await getPlayerExperiences(q)

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
              <Users className="h-7 w-7 text-orange-500" />
              Player Experiences
            </h1>
            <p className="text-muted-foreground mt-1">
              How players interact with the game
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-bold">{experiences.length}</div>
            <div className="text-sm text-muted-foreground">experiences</div>
          </div>
          <Link href="/admin/taxonomy/player-experiences/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Experience
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <form className="max-w-sm" action="/admin/taxonomy/player-experiences" method="get">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search experiences..."
            defaultValue={q}
            className="pl-9"
          />
        </div>
      </form>

      {/* Player Experiences List */}
      <div className="grid gap-3">
        {experiences.map((exp) => (
          <Card key={exp.id} className="transition-all hover:shadow-md hover:border-primary/50 group">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon placeholder */}
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-orange-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/taxonomy/player-experiences/${exp.id}`}>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {exp.name}
                      </h3>
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    <span className="font-mono">{exp.slug}</span>
                    {exp.description && (
                      <>
                        <span className="hidden sm:inline">-</span>
                        <span className="hidden sm:inline truncate">{exp.description}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Game count */}
                <Badge variant="outline" className="gap-1.5 shrink-0">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  {exp.game_count}
                </Badge>

                {/* Edit button */}
                <Link href={`/admin/taxonomy/player-experiences/${exp.id}`}>
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
      {experiences.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No experiences found</h3>
            <p className="text-muted-foreground mt-1">
              {q ? `No experiences matching "${q}"` : 'Add your first player experience to get started'}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {q && (
                <Link href="/admin/taxonomy/player-experiences">
                  <Button variant="outline">Clear search</Button>
                </Link>
              )}
              <Link href="/admin/taxonomy/player-experiences/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Experience
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
