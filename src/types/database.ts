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
  endGame: string
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
  designers_list?: Designer[]
  publishers_list?: Publisher[]
  artists_list?: Artist[]
  affiliate_links?: AffiliateLink[]
  images?: GameImage[]
  score_sheet_config?: ScoreSheetConfig & {
    fields?: ScoreSheetField[]
  }
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

// Extended user types
export type UserGameWithGame = UserGame & {
  game: Game
}

export type UserProfileWithGames = UserProfile & {
  games?: UserGameWithGame[]
}
