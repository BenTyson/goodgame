/**
 * Tables Feature Types
 * Game meetup planning, invites, and RSVP system
 */

// ===========================================
// ENUMS (match database)
// ===========================================

export type TableStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type TablePrivacy = 'private' | 'friends_only' | 'public'
export type RSVPStatus = 'invited' | 'attending' | 'maybe' | 'declined'

// ===========================================
// BASE TYPES
// ===========================================

// Core table record
export interface GameTable {
  id: string
  hostId: string
  gameId: string
  title: string | null
  description: string | null
  scheduledAt: string
  durationMinutes: number
  locationName: string | null
  locationAddress: string | null
  maxPlayers: number | null
  privacy: TablePrivacy
  status: TableStatus
  createdAt: string
  updatedAt: string
  completedAt: string | null
  cancelledAt: string | null
}

// Table participant record
export interface TableParticipant {
  id: string
  tableId: string
  userId: string
  rsvpStatus: RSVPStatus
  rsvpUpdatedAt: string | null
  invitedBy: string | null
  invitedAt: string
  isHost: boolean
  createdAt: string
}

// ===========================================
// EXTENDED TYPES
// ===========================================

// Participant with user profile info
export interface ParticipantWithProfile extends TableParticipant {
  user: {
    id: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
    customAvatarUrl: string | null
  }
}

// Table with full details for display
export interface TableWithDetails {
  id: string
  title: string | null
  scheduledAt: string
  durationMinutes: number
  locationName: string | null
  locationAddress: string | null
  description: string | null
  maxPlayers: number | null
  privacy: TablePrivacy
  status: TableStatus
  createdAt: string

  // Host info
  host: {
    id: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
    customAvatarUrl: string | null
  }

  // Game info
  game: {
    id: string
    name: string
    slug: string
    thumbnailUrl: string | null
    boxImageUrl: string | null
    playerCountMin: number | null
    playerCountMax: number | null
  }

  // Participant counts
  participantCount: number
  attendingCount: number

  // Current user's RSVP (if applicable)
  userRsvpStatus?: RSVPStatus
}

// Table card for list views (from RPC function)
export interface TableCard {
  tableId: string
  title: string | null
  scheduledAt: string
  locationName: string | null
  status: TableStatus
  privacy: TablePrivacy
  hostId: string
  hostUsername: string | null
  hostDisplayName: string | null
  hostAvatarUrl: string | null
  hostCustomAvatarUrl: string | null
  gameId: string
  gameName: string
  gameSlug: string
  gameThumbnailUrl: string | null
  userRsvpStatus: RSVPStatus
  participantCount: number
  attendingCount: number
}

// ===========================================
// FORM/INPUT TYPES
// ===========================================

// Create table form data
export interface CreateTableInput {
  gameId: string
  title?: string
  description?: string
  scheduledAt: string
  durationMinutes?: number
  locationName?: string
  locationAddress?: string
  maxPlayers?: number
  privacy?: TablePrivacy
}

// Update table form data
export interface UpdateTableInput {
  title?: string
  description?: string
  scheduledAt?: string
  durationMinutes?: number
  locationName?: string
  locationAddress?: string
  maxPlayers?: number
  privacy?: TablePrivacy
  status?: TableStatus
}

// Invite friends input
export interface InviteFriendsInput {
  tableId: string
  userIds: string[]
}

// RSVP update input
export interface UpdateRSVPInput {
  tableId: string
  rsvpStatus: RSVPStatus
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

// Tables listing response
export interface TablesResponse {
  tables: TableCard[]
  hasMore: boolean
}

// Single table response
export interface TableResponse {
  table: TableWithDetails
  participants: ParticipantWithProfile[]
}

// ===========================================
// DISPLAY HELPERS
// ===========================================

// Status display config
export interface StatusConfig {
  label: string
  color: string
  bgColor: string
}

export const TABLE_STATUS_CONFIG: Record<TableStatus, StatusConfig> = {
  scheduled: { label: 'Scheduled', color: 'text-primary', bgColor: 'bg-primary/10' },
  in_progress: { label: 'In Progress', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  completed: { label: 'Completed', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
  cancelled: { label: 'Cancelled', color: 'text-red-500', bgColor: 'bg-red-500/10' },
}

// RSVP status display config
export const RSVP_STATUS_CONFIG: Record<RSVPStatus, StatusConfig> = {
  invited: { label: 'Invited', color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
  attending: { label: 'Attending', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  maybe: { label: 'Maybe', color: 'text-sky-600', bgColor: 'bg-sky-500/10' },
  declined: { label: 'Declined', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
}

// Privacy display config
export const TABLE_PRIVACY_CONFIG: Record<TablePrivacy, { label: string; description: string }> = {
  private: { label: 'Private', description: 'Only invited friends can see this table' },
  friends_only: { label: 'Friends Only', description: 'All your friends can see and request to join' },
  public: { label: 'Public', description: 'Anyone can discover and request to join this table' },
}

// ===========================================
// NOTIFICATION TYPES (extend existing)
// ===========================================

// Table notification metadata
export interface TableInviteMetadata {
  table_id: string
  table_title: string
  game_name: string
  scheduled_at: string
}

export interface TableRSVPMetadata {
  table_id: string
  table_title: string
  rsvp_status: RSVPStatus
  game_name: string
}

export interface TableCancelledMetadata {
  table_id: string
  table_title: string
  game_name: string
  scheduled_at: string
}
