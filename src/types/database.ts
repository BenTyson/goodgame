// This file will be replaced by generated types from Supabase
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          slug: string
          name: string
          tagline: string | null
          description: string | null
          player_count_min: number
          player_count_max: number
          player_count_best: number[] | null
          play_time_min: number | null
          play_time_max: number | null
          min_age: number | null
          weight: number | null
          year_published: number | null
          designers: string[] | null
          publisher: string | null
          bgg_id: number | null
          amazon_asin: string | null
          has_rules: boolean
          has_score_sheet: boolean
          has_setup_guide: boolean
          has_reference: boolean
          box_image_url: string | null
          hero_image_url: string | null
          thumbnail_url: string | null
          meta_title: string | null
          meta_description: string | null
          is_published: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          tagline?: string | null
          description?: string | null
          player_count_min?: number
          player_count_max?: number
          player_count_best?: number[] | null
          play_time_min?: number | null
          play_time_max?: number | null
          min_age?: number | null
          weight?: number | null
          year_published?: number | null
          designers?: string[] | null
          publisher?: string | null
          bgg_id?: number | null
          amazon_asin?: string | null
          has_rules?: boolean
          has_score_sheet?: boolean
          has_setup_guide?: boolean
          has_reference?: boolean
          box_image_url?: string | null
          hero_image_url?: string | null
          thumbnail_url?: string | null
          meta_title?: string | null
          meta_description?: string | null
          is_published?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          tagline?: string | null
          description?: string | null
          player_count_min?: number
          player_count_max?: number
          player_count_best?: number[] | null
          play_time_min?: number | null
          play_time_max?: number | null
          min_age?: number | null
          weight?: number | null
          year_published?: number | null
          designers?: string[] | null
          publisher?: string | null
          bgg_id?: number | null
          amazon_asin?: string | null
          has_rules?: boolean
          has_score_sheet?: boolean
          has_setup_guide?: boolean
          has_reference?: boolean
          box_image_url?: string | null
          hero_image_url?: string | null
          thumbnail_url?: string | null
          meta_title?: string | null
          meta_description?: string | null
          is_published?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          icon: string | null
          display_order: number
          is_primary: boolean
          meta_title: string | null
          meta_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          icon?: string | null
          display_order?: number
          is_primary?: boolean
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          icon?: string | null
          display_order?: number
          is_primary?: boolean
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mechanics: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          short_description: string | null
          hero_image_url: string | null
          display_order: number
          is_featured: boolean
          is_published: boolean
          meta_title: string | null
          meta_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          short_description?: string | null
          hero_image_url?: string | null
          display_order?: number
          is_featured?: boolean
          is_published?: boolean
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          short_description?: string | null
          hero_image_url?: string | null
          display_order?: number
          is_featured?: boolean
          is_published?: boolean
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      game_categories: {
        Row: {
          game_id: string
          category_id: string
          is_primary: boolean
        }
        Insert: {
          game_id: string
          category_id: string
          is_primary?: boolean
        }
        Update: {
          game_id?: string
          category_id?: string
          is_primary?: boolean
        }
      }
      game_mechanics: {
        Row: {
          game_id: string
          mechanic_id: string
        }
        Insert: {
          game_id: string
          mechanic_id: string
        }
        Update: {
          game_id?: string
          mechanic_id?: string
        }
      }
      collection_games: {
        Row: {
          collection_id: string
          game_id: string
          display_order: number
          note: string | null
        }
        Insert: {
          collection_id: string
          game_id: string
          display_order?: number
          note?: string | null
        }
        Update: {
          collection_id?: string
          game_id?: string
          display_order?: number
          note?: string | null
        }
      }
      score_sheet_configs: {
        Row: {
          id: string
          game_id: string
          layout_type: string
          player_min: number
          player_max: number
          orientation: string
          show_game_logo: boolean
          show_total_row: boolean
          color_scheme: string
          custom_styles: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          layout_type?: string
          player_min?: number
          player_max?: number
          orientation?: string
          show_game_logo?: boolean
          show_total_row?: boolean
          color_scheme?: string
          custom_styles?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          layout_type?: string
          player_min?: number
          player_max?: number
          orientation?: string
          show_game_logo?: boolean
          show_total_row?: boolean
          color_scheme?: string
          custom_styles?: Json
          created_at?: string
          updated_at?: string
        }
      }
      score_sheet_fields: {
        Row: {
          id: string
          config_id: string
          name: string
          field_type: string
          label: string | null
          description: string | null
          placeholder: string | null
          per_player: boolean
          is_required: boolean
          default_value: string | null
          calculation_formula: string | null
          min_value: number | null
          max_value: number | null
          display_order: number
          section: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          config_id: string
          name: string
          field_type?: string
          label?: string | null
          description?: string | null
          placeholder?: string | null
          per_player?: boolean
          is_required?: boolean
          default_value?: string | null
          calculation_formula?: string | null
          min_value?: number | null
          max_value?: number | null
          display_order?: number
          section?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          config_id?: string
          name?: string
          field_type?: string
          label?: string | null
          description?: string | null
          placeholder?: string | null
          per_player?: boolean
          is_required?: boolean
          default_value?: string | null
          calculation_formula?: string | null
          min_value?: number | null
          max_value?: number | null
          display_order?: number
          section?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      affiliate_links: {
        Row: {
          id: string
          game_id: string
          provider: string
          url: string
          label: string | null
          is_primary: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          provider: string
          url: string
          label?: string | null
          is_primary?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          provider?: string
          url?: string
          label?: string | null
          is_primary?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      game_images: {
        Row: {
          id: string
          game_id: string
          url: string
          alt_text: string | null
          caption: string | null
          image_type: 'cover' | 'hero' | 'gallery' | 'setup' | 'gameplay' | 'components'
          display_order: number
          storage_path: string | null
          width: number | null
          height: number | null
          file_size: number | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          url: string
          alt_text?: string | null
          caption?: string | null
          image_type?: 'cover' | 'hero' | 'gallery' | 'setup' | 'gameplay' | 'components'
          display_order?: number
          storage_path?: string | null
          width?: number | null
          height?: number | null
          file_size?: number | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          url?: string
          alt_text?: string | null
          caption?: string | null
          image_type?: 'cover' | 'hero' | 'gallery' | 'setup' | 'gameplay' | 'components'
          display_order?: number
          storage_path?: string | null
          width?: number | null
          height?: number | null
          file_size?: number | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_games: {
        Args: {
          search_query: string
        }
        Returns: Database['public']['Tables']['games']['Row'][]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Game = Database['public']['Tables']['games']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Mechanic = Database['public']['Tables']['mechanics']['Row']
export type Collection = Database['public']['Tables']['collections']['Row']
export type ScoreSheetConfig = Database['public']['Tables']['score_sheet_configs']['Row']
export type ScoreSheetField = Database['public']['Tables']['score_sheet_fields']['Row']
export type AffiliateLink = Database['public']['Tables']['affiliate_links']['Row']
export type GameImage = Database['public']['Tables']['game_images']['Row']

// Extended types with relations
export type GameWithRelations = Game & {
  categories?: Category[]
  mechanics?: Mechanic[]
  affiliate_links?: AffiliateLink[]
  images?: GameImage[]
  score_sheet_config?: ScoreSheetConfig & {
    fields?: ScoreSheetField[]
  }
}

export type CategoryWithGames = Category & {
  games?: Game[]
}

export type CollectionWithGames = Collection & {
  games?: (Game & { note?: string })[]
}
