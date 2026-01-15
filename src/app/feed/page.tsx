import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ActivityFeed } from '@/components/feed/ActivityFeed'

export const metadata: Metadata = {
  title: 'Activity Feed | Boardmello',
  description: 'See what the people you follow are up to.',
}

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/feed')
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Activity Feed</h1>
      <ActivityFeed
        userId={user.id}
        mode="personal"
        emptyMessage="Follow some users to see their activity here!"
      />
    </div>
  )
}
