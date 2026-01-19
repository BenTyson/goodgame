import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Users, CalendarDays, Compass } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserUpcomingTables, getUserPastTables, getFriendsUpcomingTables } from '@/lib/supabase/table-queries'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableCard } from '@/components/tables'
import { FriendsTablesSection } from './FriendsTablesSection'

export const metadata: Metadata = {
  title: 'My Tables | Boardmello',
  description: 'Manage your game tables and RSVPs.',
}

export default async function TablesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/tables')
  }

  const [upcomingTables, pastTables, friendsTables] = await Promise.all([
    getUserUpcomingTables(user.id),
    getUserPastTables(user.id, 20, 0),
    getFriendsUpcomingTables(user.id, 5),
  ])

  const hasNoTables = upcomingTables.length === 0 && pastTables.length === 0

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">My Tables</h1>
            <p className="text-muted-foreground">
              Game nights you&apos;re hosting or attending
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/tables/discover">
              <Compass className="h-4 w-4 mr-2" />
              Discover
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tables/new">
              <Plus className="h-4 w-4 mr-2" />
              Host a Table
            </Link>
          </Button>
        </div>
      </div>

      {hasNoTables ? (
        /* Empty state */
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <CalendarDays className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No tables yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Tables are game meetups you organize with friends. Create your first table to
            start planning your next game night!
          </p>
          <Button asChild size="lg">
            <Link href="/tables/new">
              <Plus className="h-4 w-4 mr-2" />
              Host Your First Table
            </Link>
          </Button>
        </div>
      ) : (
        /* Tables list */
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming" className="gap-2">
              Upcoming
              {upcomingTables.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {upcomingTables.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingTables.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No upcoming tables</p>
                <p className="text-sm mt-2">
                  <Link href="/tables/new" className="text-primary hover:underline">
                    Host a table
                  </Link>
                  {' '}or wait for invites from friends.
                </p>
              </div>
            ) : (
              upcomingTables.map((table) => (
                <TableCard
                  key={table.tableId}
                  table={table}
                  currentUserId={user.id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastTables.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No past tables</p>
              </div>
            ) : (
              pastTables.map((table) => (
                <TableCard
                  key={table.tableId}
                  table={table}
                  currentUserId={user.id}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Friends' Tables Section */}
      {friendsTables.length > 0 && (
        <FriendsTablesSection tables={friendsTables} currentUserId={user.id} />
      )}
    </div>
  )
}
