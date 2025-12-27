import Link from 'next/link'
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
  Gamepad2,
} from 'lucide-react'

async function getFamilies(search?: string) {
  const supabase = createAdminClient()

  let query = supabase
    .from('game_families')
    .select(`
      *,
      games:games(count)
    `)
    .order('name', { ascending: true })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data: families } = await query

  return families?.map(f => ({
    ...f,
    game_count: f.games?.[0]?.count || 0
  })) || []
}

export default async function AdminFamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const families = await getFamilies(q)

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

      {/* Search */}
      <form className="max-w-sm" action="/admin/families" method="get">
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {families.map((family) => (
          <Card key={family.id} className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 group">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Users2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/families/${family.id}`}>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {family.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    /{family.slug}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  <Gamepad2 className="h-3 w-3 mr-1" />
                  {family.game_count}
                </Badge>
              </div>

              {family.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {family.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                <Link
                  href={`/families/${family.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </Button>
                </Link>
                <Link href={`/admin/families/${family.id}`} className="ml-auto">
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
      {families.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Users2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No families found</h3>
            <p className="text-muted-foreground mt-1">
              {q ? `No families matching "${q}"` : 'Create a family to group related games together'}
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              {q && (
                <Link href="/admin/families">
                  <Button variant="outline">
                    Clear search
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
