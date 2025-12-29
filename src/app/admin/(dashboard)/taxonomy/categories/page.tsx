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
  FolderTree,
  Pencil,
  Gamepad2,
  Star,
} from 'lucide-react'
import type { Category } from '@/types/database'

interface CategoryWithCount extends Category {
  game_count: number
}

async function getCategories(search?: string): Promise<CategoryWithCount[]> {
  const supabase = createAdminClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order')

  if (!categories) return []

  // Get game counts for each category
  const { data: gameCounts } = await supabase
    .from('game_categories')
    .select('category_id')

  const countMap = new Map<string, number>()
  gameCounts?.forEach(gc => {
    const current = countMap.get(gc.category_id) || 0
    countMap.set(gc.category_id, current + 1)
  })

  let result = categories.map(c => ({
    ...c,
    game_count: countMap.get(c.id) || 0
  }))

  if (search) {
    const searchLower = search.toLowerCase()
    result = result.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.slug.toLowerCase().includes(searchLower)
    )
  }

  return result
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const categories = await getCategories(q)

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
              <FolderTree className="h-7 w-7 text-blue-500" />
              Categories
            </h1>
            <p className="text-muted-foreground mt-1">
              High-level game classifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-bold">{categories.length}</div>
            <div className="text-sm text-muted-foreground">categories</div>
          </div>
          <Link href="/admin/taxonomy/categories/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <form className="max-w-sm" action="/admin/taxonomy/categories" method="get">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search categories..."
            defaultValue={q}
            className="pl-9"
          />
        </div>
      </form>

      {/* Categories List */}
      <div className="grid gap-3">
        {categories.map((category) => (
          <Card key={category.id} className="transition-all hover:shadow-md hover:border-primary/50 group">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon placeholder */}
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <FolderTree className="h-5 w-5 text-blue-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/taxonomy/categories/${category.id}`}>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                    </Link>
                    {category.is_primary && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    <span className="font-mono">/categories/{category.slug}</span>
                    {category.description && (
                      <>
                        <span className="hidden sm:inline">-</span>
                        <span className="hidden sm:inline truncate">{category.description}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Game count */}
                <Badge variant="outline" className="gap-1.5 shrink-0">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  {category.game_count}
                </Badge>

                {/* Edit button */}
                <Link href={`/admin/taxonomy/categories/${category.id}`}>
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
      {categories.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <FolderTree className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No categories found</h3>
            <p className="text-muted-foreground mt-1">
              {q ? `No categories matching "${q}"` : 'Add your first category to get started'}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {q && (
                <Link href="/admin/taxonomy/categories">
                  <Button variant="outline">Clear search</Button>
                </Link>
              )}
              <Link href="/admin/taxonomy/categories/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
