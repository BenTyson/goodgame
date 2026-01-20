/**
 * Table Row Mappers
 * Utilities for mapping database rows to application types
 * Eliminates duplicate mapping code across table-queries.ts
 */

import type {
  TableCard,
  NearbyTable,
  ParticipantWithProfile,
  TableCommentWithAuthor,
  RSVPStatus,
} from '@/types/tables'

// ===========================================
// ROW TYPES (from database/RPC functions)
// ===========================================

export interface TableCardRow {
  table_id: string
  title: string | null
  scheduled_at: string
  location_name: string | null
  location_lat?: string | null
  location_lng?: string | null
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
  user_rsvp_status?: string
  participant_count: number
  attending_count: number
}

export interface NearbyTableRow {
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
}

export interface ParticipantRow {
  id: string
  table_id: string
  user_id: string
  rsvp_status: string
  rsvp_updated_at: string | null
  invited_by: string | null
  invited_at: string
  is_host: boolean
  created_at: string
  attended?: boolean | null
  attendance_marked_at?: string | null
  user: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
  }
}

export interface CommentRow {
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
}

export interface UserProfileRow {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  custom_avatar_url: string | null
}

// ===========================================
// MAPPER FUNCTIONS
// ===========================================

/**
 * Map a table card row from RPC to TableCard type
 */
export function mapTableCardRow(row: TableCardRow): TableCard {
  return {
    tableId: row.table_id,
    title: row.title,
    scheduledAt: row.scheduled_at,
    locationName: row.location_name,
    locationLat: row.location_lat ? parseFloat(row.location_lat) : null,
    locationLng: row.location_lng ? parseFloat(row.location_lng) : null,
    status: row.status as TableCard['status'],
    privacy: row.privacy as TableCard['privacy'],
    hostId: row.host_id,
    hostUsername: row.host_username,
    hostDisplayName: row.host_display_name,
    hostAvatarUrl: row.host_avatar_url,
    hostCustomAvatarUrl: row.host_custom_avatar_url,
    gameId: row.game_id,
    gameName: row.game_name,
    gameSlug: row.game_slug,
    gameThumbnailUrl: row.game_thumbnail_url,
    userRsvpStatus: (row.user_rsvp_status || 'invited') as RSVPStatus,
    participantCount: Number(row.participant_count),
    attendingCount: Number(row.attending_count),
  }
}

/**
 * Map a nearby table row from RPC to NearbyTable type
 */
export function mapNearbyTableRow(row: NearbyTableRow): NearbyTable {
  return {
    tableId: row.table_id,
    title: row.title,
    description: row.description,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    locationName: row.location_name,
    locationLat: parseFloat(row.location_lat),
    locationLng: parseFloat(row.location_lng),
    maxPlayers: row.max_players,
    status: row.status as NearbyTable['status'],
    privacy: row.privacy as NearbyTable['privacy'],
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
  }
}

/**
 * Map a participant row to ParticipantWithProfile type
 */
export function mapParticipantRow(row: ParticipantRow): ParticipantWithProfile {
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
    attended: row.attended ?? null,
    attendanceMarkedAt: row.attendance_marked_at ?? null,
    user: mapUserProfileRow(row.user),
  }
}

/**
 * Map a comment row to TableCommentWithAuthor type
 */
export function mapCommentRow(row: CommentRow): TableCommentWithAuthor {
  return {
    id: row.id,
    tableId: row.table_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentId: row.parent_id,
    author: mapUserProfileRow(row.author),
  }
}

/**
 * Map a user profile row to embedded user object
 */
export function mapUserProfileRow(row: UserProfileRow) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    customAvatarUrl: row.custom_avatar_url,
  }
}
