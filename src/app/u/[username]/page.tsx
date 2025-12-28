import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileContent } from './ProfileContent'
import { getFollowStats, checkIsFollowing, getMutualGames } from '@/lib/supabase/user-queries'
import { getUserReviews, getUserReviewCount } from '@/lib/supabase/review-queries'
import type { UserProfile, SocialLinks, FollowStats } from '@/types/database'

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

  // Fetch top games (visible if profile is public or own profile)
  let topGames = null
  if (profile.profile_visibility === 'public' || isOwnProfile) {
    const { data: topGamesData } = await supabase
      .from('user_top_games')
      .select(`
        id,
        position,
        game:games(id, name, slug, box_image_url, thumbnail_url)
      `)
      .eq('user_id', profile.id)
      .order('position', { ascending: true })

    topGames = topGamesData
  }

  // Fetch follow stats
  let followStats: FollowStats | null = null
  let isFollowingUser = false

  if (profile.profile_visibility === 'public' || isOwnProfile) {
    followStats = await getFollowStats(profile.id)

    // Check if current user is following this profile
    if (currentUser && !isOwnProfile) {
      isFollowingUser = await checkIsFollowing(currentUser.id, profile.id)
    }
  }

  // Fetch shelf data if it should be shown
  let shelfData = null
  let shelfStats = null
  let profileStats = null

  if (showShelf) {
    // Fetch games with player count info for stats
    const { data: games } = await supabase
      .from('user_games')
      .select(`
        *,
        game:games(id, name, slug, box_image_url, player_count_min, player_count_max)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    // Get games for display (limited to 12)
    shelfData = games?.slice(0, 12) || null

    // Calculate shelf stats
    if (games && games.length > 0) {
      shelfStats = {
        total: games.length,
        owned: games.filter(g => g.status === 'owned').length,
        want_to_buy: games.filter(g => g.status === 'want_to_buy').length,
        want_to_play: games.filter(g => g.status === 'want_to_play').length,
        wishlist: games.filter(g => g.status === 'wishlist').length,
        previously_owned: games.filter(g => g.status === 'previously_owned').length,
      }

      // Calculate enhanced profile stats
      const ratedGames = games.filter(g => g.rating !== null)
      const totalRated = ratedGames.length
      const averageRating = totalRated > 0
        ? ratedGames.reduce((sum, g) => sum + (g.rating || 0), 0) / totalRated
        : null

      // Player count breakdown
      const playerRanges = [
        { range: 'Solo', min: 1, max: 1 },
        { range: '2 Players', min: 2, max: 2 },
        { range: '3-4 Players', min: 3, max: 4 },
        { range: '5+ Players', min: 5, max: 99 },
      ]
      const playerCountBreakdown = playerRanges.map(({ range, min, max }) => ({
        range,
        count: games.filter(g => {
          const gameMin = g.game?.player_count_min || 0
          const gameMax = g.game?.player_count_max || 0
          // Game supports this range if it overlaps
          return gameMin <= max && gameMax >= min
        }).length,
      })).filter(p => p.count > 0)

      profileStats = {
        totalGames: games.length,
        totalRated,
        averageRating,
        categoryBreakdown: [] as { name: string; count: number }[], // TODO: Add category stats later
        playerCountBreakdown,
      }
    }
  }

  // Parse social links
  const socialLinks = (profile.social_links || {}) as SocialLinks

  // Fetch user reviews (for profile reviews section)
  const userReviews = await getUserReviews(profile.id, 10)
  const reviewCount = await getUserReviewCount(profile.id)

  // Fetch mutual games (only if viewing another user's profile and logged in)
  let mutualGames = null
  if (currentUser && !isOwnProfile && showShelf) {
    mutualGames = await getMutualGames(currentUser.id, profile.id, 12)
  }

  return (
    <ProfileContent
      profile={profile}
      socialLinks={socialLinks}
      topGames={topGames}
      shelfData={shelfData}
      shelfStats={shelfStats}
      profileStats={profileStats}
      showShelf={showShelf}
      isOwnProfile={isOwnProfile}
      followStats={followStats}
      isFollowingUser={isFollowingUser}
      userReviews={userReviews}
      reviewCount={reviewCount}
      mutualGames={mutualGames}
    />
  )
}
