/**
 * Admin User Queries - Paginated user list and detail queries for admin panel
 */

import { createAdminClient } from './admin'

const ITEMS_PER_PAGE = 60

export type AdminUserFilter = 'all' | 'admin' | 'active' | 'inactive' | 'sellers'
export type AdminUserSort = 'last_active' | 'created' | 'games' | 'followers'

export interface AdminUser {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  custom_avatar_url: string | null
  role: string | null
  created_at: string | null
  last_active_at: string | null
  games_count: number
  followers_count: number
}

export interface AdminUserDetail extends AdminUser {
  bio: string | null
  location: string | null
  social_links: Record<string, string> | null
  profile_visibility: string | null
  shelf_visibility: string | null
  // Stats
  ratings_count: number
  reviews_count: number
  following_count: number
  // Shelf breakdown
  shelf_owned: number
  shelf_want_to_buy: number
  shelf_want_to_play: number
  shelf_wishlist: number
  shelf_previously_owned: number
  // Marketplace stats (if seller)
  is_seller: boolean
  seller_rating: number | null
  total_sales: number
  total_purchases: number
  stripe_onboarding_complete: boolean
}

export interface AdminUserCounts {
  total: number
  admin: number
  active: number
  inactive: number
  sellers: number
}

export interface GetAdminUsersOptions {
  filter?: AdminUserFilter
  search?: string
  sort?: AdminUserSort
  page?: number
}

export interface GetAdminUsersResult {
  users: AdminUser[]
  total: number
  page: number
  totalPages: number
}

/**
 * Get paginated list of users for admin panel
 */
export async function getAdminUsers(
  options: GetAdminUsersOptions = {}
): Promise<GetAdminUsersResult> {
  const { filter, search, sort = 'last_active', page = 1 } = options
  const supabase = createAdminClient()
  const offset = (page - 1) * ITEMS_PER_PAGE

  // First, get user IDs with counts
  // We need to do this in multiple queries due to Supabase limitations with aggregates

  // Get base user list with filters
  let userQuery = supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url, custom_avatar_url, role, created_at, last_active_at', { count: 'exact' })

  // Apply filters
  if (filter === 'admin') {
    userQuery = userQuery.eq('role', 'admin')
  } else if (filter === 'active') {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    userQuery = userQuery.gt('last_active_at', thirtyDaysAgo.toISOString())
  } else if (filter === 'inactive') {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    userQuery = userQuery.or(`last_active_at.is.null,last_active_at.lte.${thirtyDaysAgo.toISOString()}`)
  }

  // Search filter
  if (search) {
    userQuery = userQuery.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
  }

  // Apply sort
  if (sort === 'created') {
    userQuery = userQuery.order('created_at', { ascending: false })
  } else {
    // Default: last_active
    userQuery = userQuery.order('last_active_at', { ascending: false, nullsFirst: false })
  }

  // Apply pagination
  userQuery = userQuery.range(offset, offset + ITEMS_PER_PAGE - 1)

  const { data: users, count, error } = await userQuery

  if (error) {
    console.error('Error fetching admin users:', error)
    throw error
  }

  // Get games counts for these users
  const userIds = (users || []).map(u => u.id)

  // Get games count per user
  const { data: gameCounts } = await supabase
    .from('user_games')
    .select('user_id')
    .in('user_id', userIds)

  const gamesCountMap = new Map<string, number>()
  for (const row of gameCounts || []) {
    gamesCountMap.set(row.user_id, (gamesCountMap.get(row.user_id) || 0) + 1)
  }

  // Get followers count per user
  const { data: followerCounts } = await supabase
    .from('user_follows')
    .select('following_id')
    .in('following_id', userIds)

  const followersCountMap = new Map<string, number>()
  for (const row of followerCounts || []) {
    followersCountMap.set(row.following_id, (followersCountMap.get(row.following_id) || 0) + 1)
  }

  // Combine data
  const enrichedUsers: AdminUser[] = (users || []).map(user => ({
    ...user,
    games_count: gamesCountMap.get(user.id) || 0,
    followers_count: followersCountMap.get(user.id) || 0,
  }))

  // Sort by games or followers if needed (post-query sort)
  if (sort === 'games') {
    enrichedUsers.sort((a, b) => b.games_count - a.games_count)
  } else if (sort === 'followers') {
    enrichedUsers.sort((a, b) => b.followers_count - a.followers_count)
  }

  // For sellers filter, we need to query differently
  if (filter === 'sellers') {
    return getSellerUsers(options)
  }

  return {
    users: enrichedUsers,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
  }
}

/**
 * Get users who are sellers (have marketplace settings)
 */
async function getSellerUsers(options: GetAdminUsersOptions): Promise<GetAdminUsersResult> {
  const { search, sort = 'last_active', page = 1 } = options
  const supabase = createAdminClient()
  const offset = (page - 1) * ITEMS_PER_PAGE

  // Get seller user IDs from marketplace settings
  const { data: sellers, count: sellersCount } = await supabase
    .from('user_marketplace_settings')
    .select('user_id', { count: 'exact' })

  if (!sellers || sellers.length === 0) {
    return { users: [], total: 0, page, totalPages: 0 }
  }

  const sellerIds = sellers.map(s => s.user_id)

  // Get user profiles for sellers
  let userQuery = supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url, custom_avatar_url, role, created_at, last_active_at')
    .in('id', sellerIds)

  if (search) {
    userQuery = userQuery.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
  }

  // Apply sort
  if (sort === 'created') {
    userQuery = userQuery.order('created_at', { ascending: false })
  } else {
    userQuery = userQuery.order('last_active_at', { ascending: false, nullsFirst: false })
  }

  userQuery = userQuery.range(offset, offset + ITEMS_PER_PAGE - 1)

  const { data: users } = await userQuery

  // Get counts
  const userIds = (users || []).map(u => u.id)

  const { data: gameCounts } = await supabase
    .from('user_games')
    .select('user_id')
    .in('user_id', userIds)

  const gamesCountMap = new Map<string, number>()
  for (const row of gameCounts || []) {
    gamesCountMap.set(row.user_id, (gamesCountMap.get(row.user_id) || 0) + 1)
  }

  const { data: followerCounts } = await supabase
    .from('user_follows')
    .select('following_id')
    .in('following_id', userIds)

  const followersCountMap = new Map<string, number>()
  for (const row of followerCounts || []) {
    followersCountMap.set(row.following_id, (followersCountMap.get(row.following_id) || 0) + 1)
  }

  const enrichedUsers: AdminUser[] = (users || []).map(user => ({
    ...user,
    games_count: gamesCountMap.get(user.id) || 0,
    followers_count: followersCountMap.get(user.id) || 0,
  }))

  if (sort === 'games') {
    enrichedUsers.sort((a, b) => b.games_count - a.games_count)
  } else if (sort === 'followers') {
    enrichedUsers.sort((a, b) => b.followers_count - a.followers_count)
  }

  return {
    users: enrichedUsers,
    total: sellersCount || 0,
    page,
    totalPages: Math.ceil((sellersCount || 0) / ITEMS_PER_PAGE),
  }
}

/**
 * Get counts for each filter tab
 */
export async function getAdminUserCounts(): Promise<AdminUserCounts> {
  const supabase = createAdminClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { count: total },
    { count: admin },
    { count: active },
    { count: inactive },
    { count: sellers },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gt('last_active_at', thirtyDaysAgo.toISOString()),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).or(`last_active_at.is.null,last_active_at.lte.${thirtyDaysAgo.toISOString()}`),
    supabase.from('user_marketplace_settings').select('*', { count: 'exact', head: true }),
  ])

  return {
    total: total || 0,
    admin: admin || 0,
    active: active || 0,
    inactive: inactive || 0,
    sellers: sellers || 0,
  }
}

/**
 * Get detailed user information for the detail panel
 */
export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const supabase = createAdminClient()

  // Get base profile
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return null
  }

  // Get various counts in parallel
  const [
    { data: games },
    { data: followers },
    { data: following },
    { data: ratings },
    { data: reviews },
    { data: marketplaceSettings },
    { data: sales },
    { data: purchases },
  ] = await Promise.all([
    // Games with status breakdown
    supabase.from('user_games').select('status').eq('user_id', userId),
    // Followers count
    supabase.from('user_follows').select('id').eq('following_id', userId),
    // Following count
    supabase.from('user_follows').select('id').eq('follower_id', userId),
    // Ratings count (games with rating)
    supabase.from('user_games').select('id').eq('user_id', userId).not('rating', 'is', null),
    // Reviews count (games with review text)
    supabase.from('user_games').select('id').eq('user_id', userId).not('review', 'is', null),
    // Marketplace settings
    supabase.from('user_marketplace_settings').select('*').eq('user_id', userId).maybeSingle(),
    // Sales (completed transactions where user is seller)
    supabase.from('marketplace_transactions').select('id').eq('seller_id', userId).eq('status', 'completed'),
    // Purchases (completed transactions where user is buyer)
    supabase.from('marketplace_transactions').select('id').eq('buyer_id', userId).eq('status', 'completed'),
  ])

  // Calculate shelf breakdown
  const shelfCounts = {
    owned: 0,
    want_to_buy: 0,
    want_to_play: 0,
    wishlist: 0,
    previously_owned: 0,
  }

  for (const game of games || []) {
    const status = game.status as keyof typeof shelfCounts
    if (status in shelfCounts) {
      shelfCounts[status]++
    }
  }

  return {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    custom_avatar_url: profile.custom_avatar_url,
    role: profile.role,
    created_at: profile.created_at,
    last_active_at: profile.last_active_at,
    bio: profile.bio,
    location: profile.location,
    social_links: profile.social_links as Record<string, string> | null,
    profile_visibility: profile.profile_visibility,
    shelf_visibility: profile.shelf_visibility,
    games_count: games?.length || 0,
    followers_count: followers?.length || 0,
    following_count: following?.length || 0,
    ratings_count: ratings?.length || 0,
    reviews_count: reviews?.length || 0,
    shelf_owned: shelfCounts.owned,
    shelf_want_to_buy: shelfCounts.want_to_buy,
    shelf_want_to_play: shelfCounts.want_to_play,
    shelf_wishlist: shelfCounts.wishlist,
    shelf_previously_owned: shelfCounts.previously_owned,
    is_seller: !!marketplaceSettings,
    seller_rating: marketplaceSettings?.seller_rating ?? null,
    total_sales: sales?.length || 0,
    total_purchases: purchases?.length || 0,
    stripe_onboarding_complete: marketplaceSettings?.stripe_onboarding_complete ?? false,
  }
}

/**
 * Update user role (admin action)
 */
export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', userId)

  if (error) {
    throw error
  }
}
