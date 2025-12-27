import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ExternalLink,
  Pencil,
  Search,
  Building2,
  Plus,
  ImageIcon,
  ImageOff,
  Gamepad2,
} from 'lucide-react'
import { getInitials, getInitialsColor } from '@/components/publishers/utils'

async function getPublishers(filter?: string, search?: string) {
  const supabase = await createClient()

  // Get publishers with game counts via junction table
  const { data: publishers } = await supabase
    .from('publishers')
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      website,
      created_at
    `)
    .order('name', { ascending: true })

  if (!publishers) return []

  // Get game counts for each publisher
  const { data: gameCounts } = await supabase
    .from('game_publishers')
    .select('publisher_id')

  const countMap = new Map<string, number>()
  gameCounts?.forEach(gp => {
    const current = countMap.get(gp.publisher_id) || 0
    countMap.set(gp.publisher_id, current + 1)
  })

  let result = publishers.map(p => ({
    ...p,
    game_count: countMap.get(p.id) || 0
  }))

  // Apply filters
  if (filter === 'has-logo') {
    result = result.filter(p => p.logo_url)
  } else if (filter === 'no-logo') {
    result = result.filter(p => !p.logo_url)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(searchLower))
  }

  return result
}

export default async function AdminPublishersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>
}) {
  const { filter, q } = await searchParams
  const publishers = await getPublishers(filter, q)

  const filters = [
    { label: 'All', value: undefined, icon: Building2 },
    { label: 'Has Logo', value: 'has-logo', icon: ImageIcon, color: 'text-green-500' },
    { label: 'No Logo', value: 'no-logo', icon: ImageOff, color: 'text-yellow-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Publishers</h1>
          <p className="text-muted-foreground mt-1">
            Manage publisher profiles, logos, and information
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-bold">{publishers.length}</div>
            <div className="text-sm text-muted-foreground">publishers</div>
          </div>
          <Link href="/admin/publishers/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Publisher
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => {
            const isActive = filter === f.value || (!filter && !f.value)
            return (
              <Link
                key={f.label}
                href={f.value ? `/admin/publishers?filter=${f.value}${q ? `&q=${q}` : ''}` : `/admin/publishers${q ? `?q=${q}` : ''}`}
              >
                <Button
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                >
                  {f.icon && <f.icon className={`h-3.5 w-3.5 ${!isActive && f.color ? f.color : ''}`} />}
                  {f.label}
                </Button>
              </Link>
            )
          })}
        </div>
        <form className="flex-1 max-w-sm" action="/admin/publishers" method="get">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search publishers..."
              defaultValue={q}
              className="pl-9"
            />
          </div>
        </form>
      </div>

      {/* Publishers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {publishers.map((publisher) => {
          const initials = getInitials(publisher.name)
          const colorClass = getInitialsColor(publisher.name)

          return (
            <Card key={publisher.id} className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 group">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Logo or Initials */}
                  <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden">
                    {publisher.logo_url ? (
                      <Image
                        src={publisher.logo_url}
                        alt={publisher.name}
                        fill
                        className="object-contain"
                        sizes="64px"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center ${colorClass} text-white font-bold text-xl`}>
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/admin/publishers/${publisher.id}`}>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                          {publisher.name}
                        </h3>
                      </Link>
                      <Badge variant="secondary" className="shrink-0">
                        <Gamepad2 className="h-3 w-3 mr-1" />
                        {publisher.game_count}
                      </Badge>
                    </div>

                    {publisher.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {publisher.description}
                      </p>
                    )}

                    {/* Website */}
                    {publisher.website && (
                      <a
                        href={publisher.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mt-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Website
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <Link href={`/publishers/${publisher.slug}`} target="_blank">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/admin/publishers/${publisher.id}`} className="ml-auto">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {publishers.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No publishers found</h3>
            <p className="text-muted-foreground mt-1">
              {q ? `No publishers matching "${q}"` : 'Try adjusting your filters or add a new publisher'}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {(filter || q) && (
                <Link href="/admin/publishers">
                  <Button variant="outline">Clear filters</Button>
                </Link>
              )}
              <Link href="/admin/publishers/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Publisher
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
