import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function MarketplaceLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Skeleton */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-muted/50 border-r flex-shrink-0 h-screen sticky top-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Filters */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {/* Filter Header */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>

          {/* Filter Sections */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
              {i < 2 && (
                <div className="px-2 space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Quick Links */}
          <div className="border-t pt-4">
            <Skeleton className="h-3 w-20 px-3 mb-3" />
            <div className="space-y-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-3">
          <Skeleton className="h-10 w-full" />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-28" />
        </div>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
          {/* Search Bar */}
          <div className="mb-4">
            <Skeleton className="h-10 w-full max-w-xl" />
          </div>

          {/* Results Bar */}
          <div className="mb-4 flex items-center justify-between border-b pb-4">
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-32 hidden sm:block" />
            </div>
          </div>

          {/* Mobile Filters */}
          <div className="lg:hidden mb-4">
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Listing Grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
