import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileContent } from './ProfileContent'
import type { UserProfile, SocialLinks } from '@/types/database'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, username, bio')
    .eq('username', username.toLowerCase())
    .single()

  if (!profile) {
    return {
      title: 'User Not Found',
    }
  }

  const displayName = profile.display_name || profile.username
  const description = profile.bio
    ? `${profile.bio.slice(0, 150)}${profile.bio.length > 150 ? '...' : ''}`
    : `Check out ${displayName}'s board game collection on Board Nomads.`

  return {
    title: `${displayName} (@${profile.username})`,
    description,
    openGraph: {
      title: `${displayName} (@${profile.username}) | Board Nomads`,
      description,
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Get the current user (to check if they're viewing their own profile)
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Fetch the profile by username
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single()

  if (error || !profile) {
    notFound()
  }

  // Check if profile is private (unless viewing own profile)
  const isOwnProfile = currentUser?.id === profile.id
  if (profile.profile_visibility === 'private' && !isOwnProfile) {
    notFound()
  }

  // Determine if shelf should be shown
  const showShelf = profile.shelf_visibility === 'public' || isOwnProfile

  // Fetch shelf data if it should be shown
  let shelfData = null
  let shelfStats = null

  if (showShelf) {
    const { data: games } = await supabase
      .from('user_games')
      .select(`
        *,
        game:games(id, name, slug, box_image_url)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(12)

    shelfData = games

    // Get shelf stats
    const { data: allGames } = await supabase
      .from('user_games')
      .select('status')
      .eq('user_id', profile.id)

    if (allGames) {
      shelfStats = {
        total: allGames.length,
        owned: allGames.filter(g => g.status === 'owned').length,
        want_to_buy: allGames.filter(g => g.status === 'want_to_buy').length,
        want_to_play: allGames.filter(g => g.status === 'want_to_play').length,
        wishlist: allGames.filter(g => g.status === 'wishlist').length,
        previously_owned: allGames.filter(g => g.status === 'previously_owned').length,
      }
    }
  }

  // Parse social links
  const socialLinks = (profile.social_links || {}) as SocialLinks

  return (
    <ProfileContent
      profile={profile}
      socialLinks={socialLinks}
      shelfData={shelfData}
      shelfStats={shelfStats}
      showShelf={showShelf}
      isOwnProfile={isOwnProfile}
    />
  )
}
