import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { UserSearch, Compass } from 'lucide-react'
import {
  UserSearchBar,
  SuggestedUsersSection,
  FriendsOfFriendsSection,
  RecentlyActiveSection,
} from '@/components/discover'

export const metadata: Metadata = {
  title: 'Discover | Boardmello',
  description: 'Find and connect with fellow board game enthusiasts.',
}

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Compass className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Discover</h1>
          <p className="text-muted-foreground">
            Find and connect with fellow board game enthusiasts
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-10">
        <UserSearchBar currentUserId={user?.id} />
      </div>

      {/* Suggestion Sections */}
      <div className="space-y-10">
        {/* People You May Know (mutual games) */}
        {user && (
          <SuggestedUsersSection userId={user.id} />
        )}

        {/* Friends of Friends */}
        {user && (
          <FriendsOfFriendsSection userId={user.id} />
        )}

        {/* Recently Active */}
        <RecentlyActiveSection currentUserId={user?.id} />
      </div>

      {/* Not logged in CTA */}
      {!user && (
        <div className="mt-10 p-6 rounded-xl border border-border/50 bg-card/30 text-center">
          <UserSearch className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-lg font-semibold mb-2">
            Sign in to discover friends
          </h2>
          <p className="text-muted-foreground mb-4">
            Get personalized suggestions based on your game collection and connect with other collectors.
          </p>
          <a
            href="/login?redirect=/discover"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Sign In
          </a>
        </div>
      )}
    </div>
  )
}
