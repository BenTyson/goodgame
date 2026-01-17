import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ShelfComparison } from '@/components/profile/ShelfComparison'
import { areFriends, getShelfComparison } from '@/lib/supabase/friend-queries'

interface ComparePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { username } = await params

  return {
    title: `Compare Shelves with @${username} | Boardmello`,
    description: `See how your game collection compares with @${username}'s shelf.`,
  }
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    redirect(`/login?redirect=/u/${username}/compare`)
  }

  // Get target user profile
  const { data: targetProfile, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url, custom_avatar_url, profile_visibility, shelf_visibility')
    .eq('username', username.toLowerCase())
    .single()

  if (error || !targetProfile) {
    notFound()
  }

  // Check if profile and shelf are public
  if (targetProfile.profile_visibility !== 'public' || targetProfile.shelf_visibility !== 'public') {
    notFound()
  }

  // Don't allow comparing with yourself
  if (currentUser.id === targetProfile.id) {
    redirect(`/u/${username}?tab=games`)
  }

  // Get current user's profile
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url, custom_avatar_url')
    .eq('id', currentUser.id)
    .single()

  if (!currentProfile) {
    notFound()
  }

  // Check if they are friends
  const isFriend = await areFriends(currentUser.id, targetProfile.id)

  // Get shelf comparison data
  const comparison = await getShelfComparison(currentUser.id, targetProfile.id)

  // Calculate stats
  const totalUser1 = comparison.both.length + comparison.onlyUser1.length
  const totalUser2 = comparison.both.length + comparison.onlyUser2.length
  const overlapPercentage = totalUser1 > 0
    ? Math.round((comparison.both.length / totalUser1) * 100)
    : 0

  return (
    <div className="container py-8 max-w-6xl">
      <ShelfComparison
        currentUser={{
          id: currentProfile.id,
          username: currentProfile.username,
          displayName: currentProfile.display_name,
          avatarUrl: currentProfile.custom_avatar_url || currentProfile.avatar_url,
        }}
        targetUser={{
          id: targetProfile.id,
          username: targetProfile.username,
          displayName: targetProfile.display_name,
          avatarUrl: targetProfile.custom_avatar_url || targetProfile.avatar_url,
        }}
        comparison={comparison}
        stats={{
          bothCount: comparison.both.length,
          onlyUser1Count: comparison.onlyUser1.length,
          onlyUser2Count: comparison.onlyUser2.length,
          overlapPercentage,
        }}
        isFriend={isFriend}
      />
    </div>
  )
}
