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
  Wand2,
  Pencil,
  Gamepad2,
} from 'lucide-react'
import type { Theme } from '@/types/database'

interface ThemeWithCount extends Theme {
  game_count: number
}

async function getThemes(search?: string): Promise<ThemeWithCount[]> {
  const supabase = createAdminClient()

  const { data: themes } = await supabase
    .from('themes')
    .select('*')
    .order('display_order')

  if (!themes) return []

  // Get game counts for each theme
  const { data: gameCounts } = await supabase
    .from('game_themes')
    .select('theme_id')

  const countMap = new Map<string, number>()
  gameCounts?.forEach(gt => {
    const current = countMap.get(gt.theme_id) || 0
    countMap.set(gt.theme_id, current + 1)
  })

  let result = themes.map(t => ({
    ...t,
    game_count: countMap.get(t.id) || 0
  }))

  if (search) {
    const searchLower = search.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      t.slug.toLowerCase().includes(searchLower)
    )
  }

  return result
}

export default async function AdminThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const themes = await getThemes(q)

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
              <Wand2 className="h-7 w-7 text-purple-500" />
              Themes
            </h1>
            <p className="text-muted-foreground mt-1">
              Game settings, worlds, and flavors
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-bold">{themes.length}</div>
            <div className="text-sm text-muted-foreground">themes</div>
          </div>
          <Link href="/admin/taxonomy/themes/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Theme
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <form className="max-w-sm" action="/admin/taxonomy/themes" method="get">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search themes..."
            defaultValue={q}
            className="pl-9"
          />
        </div>
      </form>

      {/* Themes List */}
      <div className="grid gap-3">
        {themes.map((theme) => (
          <Card key={theme.id} className="transition-all hover:shadow-md hover:border-primary/50 group">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon placeholder */}
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Wand2 className="h-5 w-5 text-purple-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/taxonomy/themes/${theme.id}`}>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {theme.name}
                      </h3>
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    <span className="font-mono">/themes/{theme.slug}</span>
                    {theme.description && (
                      <>
                        <span className="hidden sm:inline">-</span>
                        <span className="hidden sm:inline truncate">{theme.description}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Game count */}
                <Badge variant="outline" className="gap-1.5 shrink-0">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  {theme.game_count}
                </Badge>

                {/* Edit button */}
                <Link href={`/admin/taxonomy/themes/${theme.id}`}>
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
      {themes.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Wand2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No themes found</h3>
            <p className="text-muted-foreground mt-1">
              {q ? `No themes matching "${q}"` : 'Add your first theme to get started'}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {q && (
                <Link href="/admin/taxonomy/themes">
                  <Button variant="outline">Clear search</Button>
                </Link>
              )}
              <Link href="/admin/taxonomy/themes/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Theme
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
