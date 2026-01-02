// Generated types from Supabase - re-exported with convenience types
// To regenerate: supabase gen types typescript --project-id jnaibnwxpweahpawxycf > src/types/supabase.ts

export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './supabase'
import type { Database } from './supabase'

// Convenience types for common table rows
export type Game = Database['public']['Tables']['games']['Row']
export type GameInsert = Database['public']['Tables']['games']['Insert']
export type GameUpdate = Database['public']['Tables']['games']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Mechanic = Database['public']['Tables']['mechanics']['Row']
export type MechanicInsert = Database['public']['Tables']['mechanics']['Insert']
export type MechanicUpdate = Database['public']['Tables']['mechanics']['Update']

// Theme types (for thematic/setting classification)
export type Theme = {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  display_order: number | null
  bgg_id: number | null
  bgg_name: string | null
  created_at: string | null
  updated_at: string | null
}
export type ThemeInsert = Omit<Theme, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type ThemeUpdate = Partial<ThemeInsert>

export type GameTheme = {
  game_id: string
  theme_id: string
  is_primary: boolean | null
}

// Player Experience types (for interaction style classification)
export type PlayerExperience = {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  display_order: number | null
  created_at: string | null
  updated_at: string | null
}
export type PlayerExperienceInsert = Omit<PlayerExperience, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type PlayerExperienceUpdate = Partial<PlayerExperienceInsert>

export type GamePlayerExperience = {
  game_id: string
  player_experience_id: string
  is_primary: boolean | null
}

// Complexity Tier types (for weight-based classification)
export type ComplexityTier = {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  weight_min: number
  weight_max: number
  display_order: number | null
  created_at: string | null
  updated_at: string | null
}
export type ComplexityTierInsert = Omit<ComplexityTier, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type ComplexityTierUpdate = Partial<ComplexityTierInsert>

// BGG Tag Alias types (for mapping BGG categories/mechanics to our taxonomy)
export type BGGTagAlias = {
  id: string
  bgg_id: number
  bgg_name: string
  bgg_type: 'category' | 'mechanic' | 'family'
  target_type: 'category' | 'mechanic' | 'theme' | 'player_experience'
  target_id: string
  created_at: string | null
}
export type BGGTagAliasInsert = Omit<BGGTagAlias, 'id' | 'created_at'> & { id?: string }
export type BGGTagAliasUpdate = Partial<BGGTagAliasInsert>

// Taxonomy Suggestion types (for AI-generated taxonomy recommendations)
export type TaxonomySuggestionType = 'theme' | 'player_experience' | 'new_theme' | 'new_experience'
export type TaxonomySuggestionStatus = 'pending' | 'accepted' | 'rejected'

// Use Supabase generated type directly
export type TaxonomySuggestion = Database['public']['Tables']['taxonomy_suggestions']['Row']
export type TaxonomySuggestionInsert = Database['public']['Tables']['taxonomy_suggestions']['Insert']
export type TaxonomySuggestionUpdate = Database['public']['Tables']['taxonomy_suggestions']['Update']

// AI taxonomy extraction result (from Claude API)
export interface TaxonomyExtractionResult {
  themes: {
    id: string
    confidence: number
    reasoning: string
    isPrimary: boolean
  }[]
  playerExperiences: {
    id: string
    confidence: number
    reasoning: string
  }[]
  newSuggestions: {
    type: 'theme' | 'player_experience'
    name: string
    description: string
    reasoning: string
  }[]
}

// Data Source types (for tracking game data provenance)
export type DataSource =
  | 'legacy_bgg'   // Original BGG imports (pre-strategy)
  | 'wikidata'     // Wikidata SPARQL import (CC0 licensed)
  | 'rulebook'     // Parsed from publisher rulebook PDFs
  | 'publisher'    // Direct from publisher partnership
  | 'community'    // User-contributed data
  | 'manual'       // Manually entered by admin
  | 'seed'         // Seed data import (factual data extraction)

// Field-level provenance tracking
export interface FieldSources {
  name?: DataSource
  year_published?: DataSource
  player_count_min?: DataSource
  player_count_max?: DataSource
  play_time_min?: DataSource
  play_time_max?: DataSource
  description?: DataSource
  weight?: DataSource | 'bncs' // Board Nomads Complexity Score
  designers?: DataSource
  publisher?: DataSource
  [key: string]: DataSource | 'bncs' | undefined
}

export type Collection = Database['public']['Tables']['collections']['Row']
export type CollectionInsert = Database['public']['Tables']['collections']['Insert']
export type CollectionUpdate = Database['public']['Tables']['collections']['Update']

export type ScoreSheetConfig = Database['public']['Tables']['score_sheet_configs']['Row']
export type ScoreSheetConfigInsert = Database['public']['Tables']['score_sheet_configs']['Insert']
export type ScoreSheetConfigUpdate = Database['public']['Tables']['score_sheet_configs']['Update']

export type ScoreSheetField = Database['public']['Tables']['score_sheet_fields']['Row']
export type ScoreSheetFieldInsert = Database['public']['Tables']['score_sheet_fields']['Insert']
export type ScoreSheetFieldUpdate = Database['public']['Tables']['score_sheet_fields']['Update']

export type AffiliateLink = Database['public']['Tables']['affiliate_links']['Row']
export type AffiliateLinkInsert = Database['public']['Tables']['affiliate_links']['Insert']
export type AffiliateLinkUpdate = Database['public']['Tables']['affiliate_links']['Update']

export type GameImage = Database['public']['Tables']['game_images']['Row']
export type GameImageInsert = Database['public']['Tables']['game_images']['Insert']
export type GameImageUpdate = Database['public']['Tables']['game_images']['Update']

export type Award = Database['public']['Tables']['awards']['Row']
export type AwardInsert = Database['public']['Tables']['awards']['Insert']
export type AwardUpdate = Database['public']['Tables']['awards']['Update']

export type AwardCategory = Database['public']['Tables']['award_categories']['Row']
export type AwardCategoryInsert = Database['public']['Tables']['award_categories']['Insert']
export type AwardCategoryUpdate = Database['public']['Tables']['award_categories']['Update']

export type GameAward = Database['public']['Tables']['game_awards']['Row']
export type GameAwardInsert = Database['public']['Tables']['game_awards']['Insert']
export type GameAwardUpdate = Database['public']['Tables']['game_awards']['Update']

export type GameFamily = Database['public']['Tables']['game_families']['Row']
export type GameFamilyInsert = Database['public']['Tables']['game_families']['Insert']
export type GameFamilyUpdate = Database['public']['Tables']['game_families']['Update']

export type GameRelation = Database['public']['Tables']['game_relations']['Row']
export type GameRelationInsert = Database['public']['Tables']['game_relations']['Insert']
export type GameRelationUpdate = Database['public']['Tables']['game_relations']['Update']

export type ImportQueue = Database['public']['Tables']['import_queue']['Row']
export type ImportQueueInsert = Database['public']['Tables']['import_queue']['Insert']
export type ImportQueueUpdate = Database['public']['Tables']['import_queue']['Update']

export type ContentGenerationLog = Database['public']['Tables']['content_generation_log']['Row']
export type ContentGenerationLogInsert = Database['public']['Tables']['content_generation_log']['Insert']
export type ContentGenerationLogUpdate = Database['public']['Tables']['content_generation_log']['Update']

export type Designer = Database['public']['Tables']['designers']['Row']
export type DesignerInsert = Database['public']['Tables']['designers']['Insert']
export type DesignerUpdate = Database['public']['Tables']['designers']['Update']

export type Publisher = Database['public']['Tables']['publishers']['Row']
export type PublisherInsert = Database['public']['Tables']['publishers']['Insert']
export type PublisherUpdate = Database['public']['Tables']['publishers']['Update']

export type Artist = Database['public']['Tables']['artists']['Row']
export type ArtistInsert = Database['public']['Tables']['artists']['Insert']
export type ArtistUpdate = Database['public']['Tables']['artists']['Update']

export type GameDesigner = Database['public']['Tables']['game_designers']['Row']
export type GameDesignerInsert = Database['public']['Tables']['game_designers']['Insert']
export type GameDesignerUpdate = Database['public']['Tables']['game_designers']['Update']

export type GamePublisher = Database['public']['Tables']['game_publishers']['Row']
export type GamePublisherInsert = Database['public']['Tables']['game_publishers']['Insert']
export type GamePublisherUpdate = Database['public']['Tables']['game_publishers']['Update']

export type GameArtist = Database['public']['Tables']['game_artists']['Row']
export type GameArtistInsert = Database['public']['Tables']['game_artists']['Insert']
export type GameArtistUpdate = Database['public']['Tables']['game_artists']['Update']

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type UserGame = Database['public']['Tables']['user_games']['Row']
export type UserGameInsert = Database['public']['Tables']['user_games']['Insert']
export type UserGameUpdate = Database['public']['Tables']['user_games']['Update']

// Content types for JSONB columns
export interface RulesContent {
  quickStart: string[]
  overview: string
  setup: string[]
  turnStructure: { title: string; description: string }[]
  scoring: { category: string; points: string }[]
  tips: string[]
}

export interface SetupContent {
  playerSetup: { title: string; description: string; tip?: string }[]
  boardSetup: { title: string; description: string; tip?: string }[]
  componentChecklist: { name: string; quantity: string }[]
  firstPlayerRule: string
  quickTips: string[]
}

export interface ReferenceContent {
  turnSummary: { phase: string; action: string }[]
  keyRules: { rule: string; detail: string }[]
  costs: { item: string; cost: string }[]
  quickReminders: string[]
  endGame: string | {
    triggers: string[]
    finalRound?: string
    winner: string
    tiebreakers?: string[]
  }
}

// Content status enum
export type ContentStatus = 'none' | 'importing' | 'draft' | 'review' | 'published'

// Import queue status enum
export type ImportStatus = 'pending' | 'importing' | 'imported' | 'failed' | 'skipped'

// Game relation types
export type RelationType =
  | 'expansion_of'
  | 'base_game_of'
  | 'sequel_to'
  | 'prequel_to'
  | 'reimplementation_of'
  | 'spin_off_of'
  | 'standalone_in_series'

// Game type without generated columns (useful for mock data)
export type GameRow = Omit<Game, 'fts'>

// Extended types with relations
export type GameWithRelations = Game & {
  categories?: Category[]
  mechanics?: Mechanic[]
  themes?: Theme[]
  player_experiences?: PlayerExperience[]
  complexity_tier?: ComplexityTier | null
  designers_list?: Designer[]
  publishers_list?: Publisher[]
  artists_list?: Artist[]
  affiliate_links?: AffiliateLink[]
  images?: GameImage[]
  score_sheet_config?: ScoreSheetConfig & {
    fields?: ScoreSheetField[]
  }
}

// Theme with game count for admin
export type ThemeWithGames = Theme & {
  games?: Game[]
  game_count?: number
}

// Entity types with game counts
export type DesignerWithGames = Designer & {
  games?: Game[]
  game_count?: number
}

export type PublisherWithGames = Publisher & {
  games?: Game[]
  game_count?: number
}

export type ArtistWithGames = Artist & {
  games?: Game[]
  game_count?: number
}

export type CategoryWithGames = Category & {
  games?: Game[]
}

export type CollectionWithGames = Collection & {
  games?: (Game & { note?: string })[]
}

// Shelf status enum
export type ShelfStatus = 'owned' | 'want_to_buy' | 'want_to_play' | 'previously_owned' | 'wishlist'

// Profile visibility enum
export type ProfileVisibility = 'public' | 'private'

// Social links structure for user profiles
export interface SocialLinks {
  bgg_username?: string      // BoardGameGeek username
  twitter_handle?: string    // Twitter/X handle (without @)
  instagram_handle?: string  // Instagram handle (without @)
  discord_username?: string  // Discord username
  website_url?: string       // Personal website URL
}

// Extended user types
export type UserGameWithGame = UserGame & {
  game: Game
}

export type UserProfileWithGames = UserProfile & {
  games?: UserGameWithGame[]
}

// ===========================================
// USER FOLLOWS (Social)
// ===========================================

export type UserFollow = Database['public']['Tables']['user_follows']['Row']
export type UserFollowInsert = Database['public']['Tables']['user_follows']['Insert']

// Extended types with user data
export type UserFollowWithFollower = UserFollow & {
  follower: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'custom_avatar_url'>
}

export type UserFollowWithFollowing = UserFollow & {
  following: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'custom_avatar_url'>
}

// Stats type for profile display
export interface FollowStats {
  followerCount: number
  followingCount: number
}

// ===========================================
// USER ACTIVITIES (Activity Feed)
// ===========================================

export type ActivityType = 'follow' | 'shelf_add' | 'shelf_update' | 'rating' | 'top_games_update' | 'review'

export type UserActivity = Database['public']['Tables']['user_activities']['Row']
export type UserActivityInsert = Database['public']['Tables']['user_activities']['Insert']

// Extended type with user/game relations for display
export interface ActivityWithDetails extends UserActivity {
  user: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'custom_avatar_url'>
  target_user?: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'custom_avatar_url'> | null
  game?: Pick<Game, 'id' | 'name' | 'slug' | 'box_image_url' | 'thumbnail_url'> | null
}

// Feed response type for pagination
export interface ActivityFeedResponse {
  activities: ActivityWithDetails[]
  hasMore: boolean
  nextCursor?: string
}

// ===========================================
// USER NOTIFICATIONS
// ===========================================

export type NotificationType = 'new_follower' | 'rating'

export type UserNotification = Database['public']['Tables']['user_notifications']['Row']
export type UserNotificationInsert = Database['public']['Tables']['user_notifications']['Insert']
export type UserNotificationUpdate = Database['public']['Tables']['user_notifications']['Update']

// Extended type with actor details for display
export interface NotificationWithDetails extends UserNotification {
  actor: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'custom_avatar_url'> | null
  game?: Pick<Game, 'id' | 'name' | 'slug' | 'box_image_url' | 'thumbnail_url'> | null
}

// Response type for pagination
export interface NotificationsResponse {
  notifications: NotificationWithDetails[]
  hasMore: boolean
  nextCursor?: string
}

// ===========================================
// GAME FAMILIES & RELATIONS
// ===========================================

// Extended relation types with game data
export type GameRelationWithTarget = GameRelation & {
  target_game: Game
}

export type GameRelationWithSource = GameRelation & {
  source_game: Game
}

export type GameFamilyWithGames = GameFamily & {
  games: Game[]
  game_count?: number
}

// Display labels for relation types
export const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  'expansion_of': 'Expansion of',
  'base_game_of': 'Base game for',
  'sequel_to': 'Sequel to',
  'prequel_to': 'Prequel to',
  'reimplementation_of': 'Reimplementation of',
  'spin_off_of': 'Spin-off of',
  'standalone_in_series': 'Standalone in series'
}

// User-friendly labels for display (e.g., "This game has expansions:")
export const RELATION_TYPE_GROUP_LABELS: Record<RelationType, string> = {
  'expansion_of': 'Expansions',
  'base_game_of': 'Base Game',
  'sequel_to': 'Sequels',
  'prequel_to': 'Prequels',
  'reimplementation_of': 'Reimplementations',
  'spin_off_of': 'Spin-offs',
  'standalone_in_series': 'Related Games'
}

// Inverse mapping for bidirectional display
// When viewing Game A, if B is "expansion_of" A, then A should show B as its "expansion"
export const INVERSE_RELATIONS: Record<RelationType, RelationType> = {
  'expansion_of': 'base_game_of',
  'base_game_of': 'expansion_of',
  'sequel_to': 'prequel_to',
  'prequel_to': 'sequel_to',
  'reimplementation_of': 'reimplementation_of', // symmetric
  'spin_off_of': 'spin_off_of', // no clear inverse
  'standalone_in_series': 'standalone_in_series' // symmetric
}
