import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserFollowers, getFollowStats } from '@/lib/supabase/user-queries'
import { FollowersList } from '@/components/profile/FollowersList'
import { Button } from '@/components/ui/button'

interface FollowersPageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: FollowersPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `People following @${username} | Boardmello`,
  }
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Fetch the profile
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, profile_visibility')
    .eq('username', username.toLowerCase())
    .single()

  if (error || !profile) {
    notFound()
  }

  // Check visibility
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const isOwnProfile = currentUser?.id === profile.id

  if (profile.profile_visibility === 'private' && !isOwnProfile) {
    notFound()
  }

  // Fetch followers
  const followers = await getUserFollowers(profile.id)
  const stats = await getFollowStats(profile.id)

  const displayName = profile.display_name || profile.username

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/u/${username}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to profile
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        {stats.followerCount.toLocaleString()} {stats.followerCount === 1 ? 'Follower' : 'Followers'}
      </h1>

      <FollowersList
        items={followers}
        type="followers"
        emptyMessage={`${displayName} doesn't have any followers yet.`}
      />
    </div>
  )
}
