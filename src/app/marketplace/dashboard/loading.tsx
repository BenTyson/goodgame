import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex md:flex-col md:w-16 lg:w-60 bg-muted/50 border-r flex-shrink-0">
        {/* Header */}
        <div className="px-4 py-4 border-b">
          <Skeleton className="h-6 w-32 lg:block hidden" />
          <Skeleton className="h-6 w-6 lg:hidden" />
        </div>

        {/* Stats */}
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-20 mb-3 hidden lg:block" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-4 flex-1 hidden lg:block" />
              <Skeleton className="h-4 w-6 hidden lg:block" />
            </div>
          ))}
        </div>

        <div className="border-t mx-3" />

        {/* Navigation */}
        <div className="p-3 space-y-1 flex-1">
          <Skeleton className="h-4 w-20 mb-3 hidden lg:block" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t p-3 space-y-3">
          <Skeleton className="h-24 w-full rounded-lg hidden lg:block" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 bg-background border-b px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-40" />
        </div>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
          {/* Stripe Banner Skeleton */}
          <Skeleton className="h-24 w-full mb-6 rounded-lg" />

          {/* Action Required Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden mb-4">
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Content Grid Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
