import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Search,
  Users2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { getAdminUsers, getAdminUserCounts, type AdminUserFilter, type AdminUserSort } from '@/lib/supabase/admin-user-queries'
import { UserTable } from './components/UserTable'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string; page?: string; sort?: string }>
}) {
  const { filter, q, page: pageParam, sort } = await searchParams
  const page = pageParam ? parseInt(pageParam) : 1

  const [{ users, total, totalPages }, counts] = await Promise.all([
    getAdminUsers({
      filter: filter as AdminUserFilter | undefined,
      search: q,
      sort: sort as AdminUserSort | undefined,
      page,
    }),
    getAdminUserCounts(),
  ])

  const filters = [
    { label: 'All', value: undefined, count: counts.total },
    { label: 'Admin', value: 'admin', count: counts.admin },
    { label: 'Active', value: 'active', count: counts.active },
    { label: 'Inactive', value: 'inactive', count: counts.inactive },
    { label: 'Sellers', value: 'sellers', count: counts.sellers },
  ]

  // Build pagination URL helper
  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams()
    if (filter) params.set('filter', filter)
    if (q) params.set('q', q)
    if (sort) params.set('sort', sort)
    if (newPage > 1) params.set('page', newPage.toString())
    const qs = params.toString()
    return `/admin/users${qs ? `?${qs}` : ''}`
  }

  // Build filter URL helper
  const buildFilterUrl = (filterValue?: string) => {
    const params = new URLSearchParams()
    if (filterValue) params.set('filter', filterValue)
    if (q) params.set('q', q)
    if (sort) params.set('sort', sort)
    const qs = params.toString()
    return `/admin/users${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and activity
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{total}</div>
          <div className="text-sm text-muted-foreground">
            {filter ? `${filter} users` : 'total users'}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Segmented Filter Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 flex-wrap">
          {filters.map((f) => {
            const isActive = filter === f.value || (!filter && !f.value)
            return (
              <Link
                key={f.label}
                href={buildFilterUrl(f.value)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 text-sm px-3',
                    isActive && 'bg-background shadow-sm font-medium'
                  )}
                >
                  {f.label} ({f.count})
                </Button>
              </Link>
            )
          })}
        </div>
        <form className="flex-1 max-w-sm" action="/admin/users" method="get">
          {filter && <input type="hidden" name="filter" value={filter} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search users..."
              defaultValue={q}
              className="pl-9"
            />
          </div>
        </form>
      </div>

      {/* Users Table */}
      {users.length > 0 ? (
        <UserTable users={users} />
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Users2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No users found</h3>
            <p className="text-muted-foreground mt-1">
              {q ? `No users matching "${q}"` : 'Try adjusting your filters'}
            </p>
            {(filter || q) && (
              <Link href="/admin/users">
                <Button variant="outline" className="mt-4">
                  Clear filters
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 60 + 1}-{Math.min(page * 60, total)} of {total} users
          </p>
          <div className="flex items-center gap-2">
            <Link href={buildPageUrl(Math.max(1, page - 1))}>
              <Button variant="outline" size="sm" disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            </Link>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <Link key={pageNum} href={buildPageUrl(pageNum)}>
                    <Button
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  </Link>
                )
              })}
            </div>
            <Link href={buildPageUrl(Math.min(totalPages, page + 1))}>
              <Button variant="outline" size="sm" disabled={page >= totalPages}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
