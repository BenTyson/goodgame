/**
 * Table Queries
 * Database operations for the Tables (game meetup) feature
 */

import { createClient } from './client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  TableCard,
  TableWithDetails,
  ParticipantWithProfile,
  CreateTableInput,
  UpdateTableInput,
  RSVPStatus,
  NearbyTable,
  TableCommentWithAuthor,
  TableRecap,
  RecapInput,
} from '@/types/tables'

// Helper to call RPC functions that aren't in the generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRpc = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientAny = SupabaseClient<any, any, any>

/**
 * Get user's upcoming tables (tables they're participating in that haven't happened yet)
 */
export async function getUserUpcomingTables(
  userId: string,
  limit: number = 20
): Promise<TableCard[]> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('get_user_upcoming_tables', {
    p_user_id: userId,
    p_limit: limit,
  })

  if (error) {
    console.error('Error fetching upcoming tables:', error)
    return []
  }

  return (data || []).map((row: {
    table_id: string
    title: string | null
    scheduled_at: string
    location_name: string | null
    status: string
    privacy: string
    host_id: string
    host_username: string | null
    host_display_name: string | null
    host_avatar_url: string | null
    host_custom_avatar_url: string | null
    game_id: string
    game_name: string
    game_slug: string
    game_thumbnail_url: string | null
    user_rsvp_status: string
    participant_count: number
    attending_count: number
  }) => ({
    tableId: row.table_id,
    title: row.title,
    scheduledAt: row.scheduled_at,
    locationName: row.location_name,
    status: row.status,
    privacy: row.privacy,
    hostId: row.host_id,
    hostUsername: row.host_username,
    hostDisplayName: row.host_display_name,
    hostAvatarUrl: row.host_avatar_url,
    hostCustomAvatarUrl: row.host_custom_avatar_url,
    gameId: row.game_id,
    gameName: row.game_name,
    gameSlug: row.game_slug,
    gameThumbnailUrl: row.game_thumbnail_url,
    userRsvpStatus: row.user_rsvp_status,
    participantCount: Number(row.participant_count),
    attendingCount: Number(row.attending_count),
  })) as TableCard[]
}

/**
 * Get user's past tables
 */
export async function getUserPastTables(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<TableCard[]> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('get_user_past_tables', {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    console.error('Error fetching past tables:', error)
    return []
  }

  return (data || []).map((row: {
    table_id: string
    title: string | null
    scheduled_at: string
    location_name: string | null
    status: string
    privacy: string
    host_id: string
    host_username: string | null
    host_display_name: string | null
    host_avatar_url: string | null
    host_custom_avatar_url: string | null
    game_id: string
    game_name: string
    game_slug: string
    game_thumbnail_url: string | null
    user_rsvp_status: string
    participant_count: number
    attending_count: number
  }) => ({
    tableId: row.table_id,
    title: row.title,
    scheduledAt: row.scheduled_at,
    locationName: row.location_name,
    status: row.status,
    privacy: row.privacy,
    hostId: row.host_id,
    hostUsername: row.host_username,
    hostDisplayName: row.host_display_name,
    hostAvatarUrl: row.host_avatar_url,
    hostCustomAvatarUrl: row.host_custom_avatar_url,
    gameId: row.game_id,
    gameName: row.game_name,
    gameSlug: row.game_slug,
    gameThumbnailUrl: row.game_thumbnail_url,
    userRsvpStatus: row.user_rsvp_status,
    participantCount: Number(row.participant_count),
    attendingCount: Number(row.attending_count),
  })) as TableCard[]
}

/**
 * Get a single table with full details
 * @param tableId - The table ID
 * @param userId - Optional user ID for RSVP status
 * @param client - Optional Supabase client (use server client when calling from server components)
 */
export async function getTableWithDetails(
  tableId: string,
  userId?: string,
  client?: SupabaseClientAny
): Promise<TableWithDetails | null> {
  const supabase = client || createClient()

  // Base query without location coordinates (those may not exist yet if migration not applied)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { data: table, error } = await (supabase as any)
    .from('tables')
    .select(`
      id,
      title,
      description,
      scheduled_at,
      duration_minutes,
      location_name,
      location_address,
      max_players,
      privacy,
      status,
      created_at,
      host:user_profiles!tables_host_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      ),
      game:games!tables_game_id_fkey (
        id,
        name,
        slug,
        thumbnail_url,
        box_image_url,
        player_count_min,
        player_count_max
      )
    `)
    .eq('id', tableId)
    .single()

  if (error || !table) {
    console.error('Error fetching table:', error)
    return null
  }

  // Try to fetch location coordinates separately (may not exist yet)
  let locationLat: number | null = null
  let locationLng: number | null = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: locData } = await (supabase as any)
      .from('tables')
      .select('location_lat, location_lng')
      .eq('id', tableId)
      .single()
    if (locData) {
      locationLat = locData.location_lat ? parseFloat(locData.location_lat) : null
      locationLng = locData.location_lng ? parseFloat(locData.location_lng) : null
    }
  } catch {
    // Location columns may not exist yet - that's fine
  }

  // Get participant counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: participantCount } = await (supabase as any)
    .from('table_participants')
    .select('*', { count: 'exact', head: true })
    .eq('table_id', tableId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: attendingCount } = await (supabase as any)
    .from('table_participants')
    .select('*', { count: 'exact', head: true })
    .eq('table_id', tableId)
    .eq('rsvp_status', 'attending')

  // Get user's RSVP status if userId provided
  let userRsvpStatus: RSVPStatus | undefined
  if (userId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: participant } = await (supabase as any)
      .from('table_participants')
      .select('rsvp_status')
      .eq('table_id', tableId)
      .eq('user_id', userId)
      .single()

    if (participant) {
      userRsvpStatus = participant.rsvp_status as RSVPStatus
    }
  }

  const host = table.host as {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
  }

  const game = table.game as {
    id: string
    name: string
    slug: string
    thumbnail_url: string | null
    box_image_url: string | null
    player_count_min: number | null
    player_count_max: number | null
  }

  return {
    id: table.id,
    title: table.title,
    scheduledAt: table.scheduled_at,
    durationMinutes: table.duration_minutes,
    locationName: table.location_name,
    locationAddress: table.location_address,
    locationLat,
    locationLng,
    description: table.description,
    maxPlayers: table.max_players,
    privacy: table.privacy,
    status: table.status,
    createdAt: table.created_at,
    host: {
      id: host.id,
      username: host.username,
      displayName: host.display_name,
      avatarUrl: host.avatar_url,
      customAvatarUrl: host.custom_avatar_url,
    },
    game: {
      id: game.id,
      name: game.name,
      slug: game.slug,
      thumbnailUrl: game.thumbnail_url,
      boxImageUrl: game.box_image_url,
      playerCountMin: game.player_count_min,
      playerCountMax: game.player_count_max,
    },
    participantCount: participantCount || 0,
    attendingCount: attendingCount || 0,
    userRsvpStatus,
  }
}

/**
 * Get participants for a table
 * @param tableId - The table ID
 * @param client - Optional Supabase client (use server client when calling from server components)
 */
export async function getTableParticipants(
  tableId: string,
  client?: SupabaseClientAny
): Promise<ParticipantWithProfile[]> {
  const supabase = client || createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('table_participants')
    .select(`
      id,
      table_id,
      user_id,
      rsvp_status,
      rsvp_updated_at,
      invited_by,
      invited_at,
      is_host,
      created_at,
      user:user_profiles!table_participants_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      )
    `)
    .eq('table_id', tableId)
    .order('is_host', { ascending: false })
    .order('rsvp_status', { ascending: true })

  if (error) {
    console.error('Error fetching participants:', error)
    return []
  }

  return (data || []).map((row: {
    id: string
    table_id: string
    user_id: string
    rsvp_status: string
    rsvp_updated_at: string | null
    invited_by: string | null
    invited_at: string
    is_host: boolean
    created_at: string
    user: {
      id: string
      username: string | null
      display_name: string | null
      avatar_url: string | null
      custom_avatar_url: string | null
    }
  }) => {
    return {
      id: row.id,
      tableId: row.table_id,
      userId: row.user_id,
      rsvpStatus: row.rsvp_status as RSVPStatus,
      rsvpUpdatedAt: row.rsvp_updated_at,
      invitedBy: row.invited_by,
      invitedAt: row.invited_at,
      isHost: row.is_host,
      createdAt: row.created_at,
      attended: null, // Will be populated after migration is applied
      attendanceMarkedAt: null,
      user: {
        id: row.user.id,
        username: row.user.username,
        displayName: row.user.display_name,
        avatarUrl: row.user.avatar_url,
        customAvatarUrl: row.user.custom_avatar_url,
      },
    }
  })
}

/**
 * Create a new table
 */
export async function createTable(
  hostId: string,
  input: CreateTableInput
): Promise<{ id: string } | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tables')
    .insert({
      host_id: hostId,
      game_id: input.gameId,
      title: input.title || null,
      description: input.description || null,
      scheduled_at: input.scheduledAt,
      duration_minutes: input.durationMinutes || 180,
      location_name: input.locationName || null,
      location_address: input.locationAddress || null,
      location_lat: input.locationLat || null,
      location_lng: input.locationLng || null,
      max_players: input.maxPlayers || null,
      privacy: input.privacy || 'private',
      status: 'scheduled',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating table:', error)
    return null
  }

  return data
}

/**
 * Update a table
 */
export async function updateTable(
  tableId: string,
  input: UpdateTableInput
): Promise<boolean> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {}
  if (input.title !== undefined) updateData.title = input.title
  if (input.description !== undefined) updateData.description = input.description
  if (input.scheduledAt !== undefined) updateData.scheduled_at = input.scheduledAt
  if (input.durationMinutes !== undefined) updateData.duration_minutes = input.durationMinutes
  if (input.locationName !== undefined) updateData.location_name = input.locationName
  if (input.locationAddress !== undefined) updateData.location_address = input.locationAddress
  if (input.locationLat !== undefined) updateData.location_lat = input.locationLat
  if (input.locationLng !== undefined) updateData.location_lng = input.locationLng
  if (input.maxPlayers !== undefined) updateData.max_players = input.maxPlayers
  if (input.privacy !== undefined) updateData.privacy = input.privacy
  if (input.status !== undefined) {
    updateData.status = input.status
    if (input.status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (input.status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('tables')
    .update(updateData)
    .eq('id', tableId)

  if (error) {
    console.error('Error updating table:', error)
    return false
  }

  return true
}

/**
 * Delete a table
 */
export async function deleteTable(tableId: string): Promise<boolean> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('tables')
    .delete()
    .eq('id', tableId)

  if (error) {
    console.error('Error deleting table:', error)
    return false
  }

  return true
}

/**
 * Invite friends to a table
 */
export async function inviteFriendsToTable(
  tableId: string,
  userIds: string[],
  invitedBy: string
): Promise<{ success: number; failed: number }> {
  const supabase = createClient()

  let success = 0
  let failed = 0

  for (const userId of userIds) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('table_participants')
      .insert({
        table_id: tableId,
        user_id: userId,
        rsvp_status: 'invited',
        invited_by: invitedBy,
      })

    if (error) {
      console.error('Error inviting user:', error)
      failed++
    } else {
      success++
    }
  }

  return { success, failed }
}

/**
 * Update RSVP status for a participant
 */
export async function updateRSVP(
  tableId: string,
  userId: string,
  rsvpStatus: RSVPStatus
): Promise<boolean> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('table_participants')
    .update({
      rsvp_status: rsvpStatus,
      rsvp_updated_at: new Date().toISOString(),
    })
    .eq('table_id', tableId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating RSVP:', error)
    return false
  }

  return true
}

/**
 * Check if a user is a participant in a table
 */
export async function isTableParticipant(
  tableId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('table_participants')
    .select('id')
    .eq('table_id', tableId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking participant:', error)
  }

  return !!data
}

/**
 * Check if a user is the host of a table
 */
export async function isTableHost(
  tableId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tables')
    .select('id')
    .eq('id', tableId)
    .eq('host_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking host:', error)
  }

  return !!data
}

/**
 * Get count of user's upcoming tables
 */
export async function getUserUpcomingTablesCount(userId: string): Promise<number> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from('table_participants')
    .select('table_id, tables!inner(status, scheduled_at)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('rsvp_status', ['attending', 'maybe', 'invited'])
    .eq('tables.status', 'scheduled')
    .gte('tables.scheduled_at', new Date().toISOString())

  if (error) {
    console.error('Error getting upcoming tables count:', error)
    return 0
  }

  return count || 0
}

/**
 * Remove a participant from a table
 */
export async function removeParticipant(
  tableId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('table_participants')
    .delete()
    .eq('table_id', tableId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error removing participant:', error)
    return false
  }

  return true
}

/**
 * Get upcoming tables from friends (friends_only privacy tables where you're not already invited)
 * @param userId - Current user's ID
 * @param limit - Max results (default 10)
 */
export async function getFriendsUpcomingTables(
  userId: string,
  limit: number = 10
): Promise<TableCard[]> {
  const supabase = createClient()

  // Get friends' upcoming tables that user can see but isn't already a participant of
  const { data, error } = await (supabase.rpc as AnyRpc)('get_friends_upcoming_tables', {
    p_user_id: userId,
    p_limit: limit,
  })

  if (error) {
    // Silently fail - function may not exist yet (migration not applied)
    // This is non-critical, so we don't log errors to avoid noise
    return []
  }

  if (!data) return []

  return data.map((row: {
    table_id: string
    title: string | null
    scheduled_at: string
    location_name: string | null
    location_lat: string | null
    location_lng: string | null
    status: string
    privacy: string
    host_id: string
    host_username: string | null
    host_display_name: string | null
    host_avatar_url: string | null
    host_custom_avatar_url: string | null
    game_id: string
    game_name: string
    game_slug: string
    game_thumbnail_url: string | null
    participant_count: number
    attending_count: number
  }) => ({
    tableId: row.table_id,
    title: row.title,
    scheduledAt: row.scheduled_at,
    locationName: row.location_name,
    locationLat: row.location_lat ? parseFloat(row.location_lat) : null,
    locationLng: row.location_lng ? parseFloat(row.location_lng) : null,
    status: row.status,
    privacy: row.privacy,
    hostId: row.host_id,
    hostUsername: row.host_username,
    hostDisplayName: row.host_display_name,
    hostAvatarUrl: row.host_avatar_url,
    hostCustomAvatarUrl: row.host_custom_avatar_url,
    gameId: row.game_id,
    gameName: row.game_name,
    gameSlug: row.game_slug,
    gameThumbnailUrl: row.game_thumbnail_url,
    userRsvpStatus: 'invited' as const, // They haven't RSVP'd yet
    participantCount: Number(row.participant_count),
    attendingCount: Number(row.attending_count),
  })) as TableCard[]
}

/**
 * Get nearby tables for discovery
 * @param lat - User's latitude
 * @param lng - User's longitude
 * @param radiusMiles - Search radius in miles (default 25)
 * @param userId - Optional user ID for friends_only filtering
 * @param limit - Max results (default 50)
 */
export async function getNearbyTables(
  lat: number,
  lng: number,
  radiusMiles: number = 25,
  userId?: string,
  limit: number = 50
): Promise<NearbyTable[]> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('get_nearby_tables', {
    p_lat: lat,
    p_lng: lng,
    p_radius_miles: radiusMiles,
    p_user_id: userId || null,
    p_limit: limit,
  })

  if (error) {
    // Silently fail - function may not exist yet (migration not applied)
    // This is non-critical, the UI will show "no tables found"
    return []
  }

  return (data || []).map((row: {
    table_id: string
    title: string | null
    description: string | null
    scheduled_at: string
    duration_minutes: number
    location_name: string | null
    location_lat: string
    location_lng: string
    max_players: number | null
    status: string
    privacy: string
    distance_miles: string
    host_id: string
    host_username: string | null
    host_display_name: string | null
    host_avatar_url: string | null
    host_custom_avatar_url: string | null
    game_id: string
    game_name: string
    game_slug: string
    game_thumbnail_url: string | null
    participant_count: number
    attending_count: number
  }) => ({
    tableId: row.table_id,
    title: row.title,
    description: row.description,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    locationName: row.location_name,
    locationLat: parseFloat(row.location_lat),
    locationLng: parseFloat(row.location_lng),
    maxPlayers: row.max_players,
    status: row.status,
    privacy: row.privacy,
    distanceMiles: parseFloat(row.distance_miles),
    hostId: row.host_id,
    hostUsername: row.host_username,
    hostDisplayName: row.host_display_name,
    hostAvatarUrl: row.host_avatar_url,
    hostCustomAvatarUrl: row.host_custom_avatar_url,
    gameId: row.game_id,
    gameName: row.game_name,
    gameSlug: row.game_slug,
    gameThumbnailUrl: row.game_thumbnail_url,
    participantCount: Number(row.participant_count),
    attendingCount: Number(row.attending_count),
  })) as NearbyTable[]
}

// ===========================================
// COMMENTS
// ===========================================

/**
 * Get comments for a table
 * @param tableId - The table ID
 * @param client - Optional Supabase client
 */
export async function getTableComments(
  tableId: string,
  client?: SupabaseClientAny
): Promise<TableCommentWithAuthor[]> {
  const supabase = client || createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('table_comments')
    .select(`
      id,
      table_id,
      user_id,
      content,
      created_at,
      updated_at,
      parent_id,
      author:user_profiles!table_comments_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      )
    `)
    .eq('table_id', tableId)
    .order('created_at', { ascending: true })

  if (error) {
    // Silently fail if table_comments doesn't exist yet (migration not applied)
    return []
  }

  return (data || []).map((row: {
    id: string
    table_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
    parent_id: string | null
    author: {
      id: string
      username: string | null
      display_name: string | null
      avatar_url: string | null
      custom_avatar_url: string | null
    }
  }) => ({
    id: row.id,
    tableId: row.table_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentId: row.parent_id,
    author: {
      id: row.author.id,
      username: row.author.username,
      displayName: row.author.display_name,
      avatarUrl: row.author.avatar_url,
      customAvatarUrl: row.author.custom_avatar_url,
    },
  })) as TableCommentWithAuthor[]
}

/**
 * Create a comment on a table
 * @param tableId - The table ID
 * @param userId - The user ID
 * @param content - Comment content
 * @param parentId - Optional parent comment ID for replies
 */
export async function createTableComment(
  tableId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<TableCommentWithAuthor | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('table_comments')
    .insert({
      table_id: tableId,
      user_id: userId,
      content,
      parent_id: parentId || null,
    })
    .select(`
      id,
      table_id,
      user_id,
      content,
      created_at,
      updated_at,
      parent_id,
      author:user_profiles!table_comments_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    return null
  }

  return {
    id: data.id,
    tableId: data.table_id,
    userId: data.user_id,
    content: data.content,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    parentId: data.parent_id,
    author: {
      id: data.author.id,
      username: data.author.username,
      displayName: data.author.display_name,
      avatarUrl: data.author.avatar_url,
      customAvatarUrl: data.author.custom_avatar_url,
    },
  }
}

/**
 * Delete a comment
 * @param commentId - The comment ID
 */
export async function deleteTableComment(commentId: string): Promise<boolean> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('table_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    return false
  }

  return true
}

// ===========================================
// RECAP FUNCTIONS
// ===========================================

/**
 * Complete a table with recap
 * Marks the table as completed and creates/updates the recap
 */
export async function completeTableWithRecap(
  tableId: string,
  recap: RecapInput
): Promise<{ success: boolean; recapId?: string; attendeeCount?: number; error?: string }> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('complete_table_with_recap', {
    p_table_id: tableId,
    p_host_notes: recap.hostNotes || null,
    p_highlights: recap.highlights || null,
    p_experience_rating: recap.experienceRating || null,
    p_would_play_again: recap.wouldPlayAgain ?? true,
    p_attendee_ids: recap.attendeeIds,
  })

  if (error) {
    // Provide helpful message if function doesn't exist yet
    if (error.code === '42883') {
      return { success: false, error: 'Recap feature not yet available. Please apply database migrations.' }
    }
    console.error('Error completing table with recap:', error)
    return { success: false, error: error.message }
  }

  if (data?.error) {
    return { success: false, error: data.error }
  }

  return {
    success: true,
    recapId: data?.recap_id,
    attendeeCount: data?.attendee_count,
  }
}

/**
 * Get table recap
 */
export async function getTableRecap(
  tableId: string,
  supabase?: SupabaseClientAny
): Promise<TableRecap | null> {
  const client = supabase || createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (client as any)
    .from('table_recaps')
    .select('*')
    .eq('table_id', tableId)
    .single()

  if (error) {
    // Silently fail - table_recaps may not exist yet or record not found
    return null
  }

  return {
    id: data.id,
    tableId: data.table_id,
    hostNotes: data.host_notes,
    highlights: data.highlights,
    playCount: data.play_count,
    experienceRating: data.experience_rating,
    wouldPlayAgain: data.would_play_again,
    photos: data.photos || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Update table recap
 */
export async function updateTableRecap(
  tableId: string,
  updates: Partial<RecapInput>
): Promise<boolean> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {}
  if (updates.hostNotes !== undefined) updateData.host_notes = updates.hostNotes
  if (updates.highlights !== undefined) updateData.highlights = updates.highlights
  if (updates.experienceRating !== undefined) updateData.experience_rating = updates.experienceRating
  if (updates.wouldPlayAgain !== undefined) updateData.would_play_again = updates.wouldPlayAgain

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('table_recaps')
    .update(updateData)
    .eq('table_id', tableId)

  if (error) {
    console.error('Error updating table recap:', error)
    return false
  }

  return true
}

/**
 * Get participants with attendance status
 */
export async function getParticipantsWithAttendance(
  tableId: string,
  supabase?: SupabaseClientAny
): Promise<ParticipantWithProfile[]> {
  const client = supabase || createClient()

  const { data, error } = await client
    .from('table_participants')
    .select(`
      *,
      user:user_profiles!table_participants_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      )
    `)
    .eq('table_id', tableId)
    .order('is_host', { ascending: false })
    .order('rsvp_status', { ascending: true })

  if (error) {
    console.error('Error fetching participants with attendance:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => ({
    id: row.id,
    tableId: row.table_id,
    userId: row.user_id,
    rsvpStatus: row.rsvp_status,
    rsvpUpdatedAt: row.rsvp_updated_at,
    invitedBy: row.invited_by,
    invitedAt: row.invited_at,
    isHost: row.is_host,
    createdAt: row.created_at,
    attended: row.attended,
    attendanceMarkedAt: row.attendance_marked_at,
    user: {
      id: row.user.id,
      username: row.user.username,
      displayName: row.user.display_name,
      avatarUrl: row.user.avatar_url,
      customAvatarUrl: row.user.custom_avatar_url,
    },
  }))
}
