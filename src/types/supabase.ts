Initialising login role...
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      affiliate_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          game_id: string | null
          id: string
          is_primary: boolean | null
          label: string | null
          provider: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          game_id?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          provider: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          game_id?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          provider?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          bgg_id: number | null
          bio: string | null
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          bgg_id?: number | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          bgg_id?: number | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      award_categories: {
        Row: {
          award_id: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          award_id?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          award_id?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "award_categories_award_id_fkey"
            columns: ["award_id"]
            isOneToOne: false
            referencedRelation: "awards"
            referencedColumns: ["id"]
          },
        ]
      }
      awards: {
        Row: {
          country: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          established_year: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          organization: string | null
          short_name: string | null
          slug: string
          website_url: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          established_year?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          organization?: string | null
          short_name?: string | null
          slug: string
          website_url?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          established_year?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          organization?: string | null
          short_name?: string | null
          slug?: string
          website_url?: string | null
        }
        Relationships: []
      }
      bgg_tag_aliases: {
        Row: {
          bgg_id: number
          bgg_name: string
          bgg_type: string
          created_at: string | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          bgg_id: number
          bgg_name: string
          bgg_type: string
          created_at?: string | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          bgg_id?: number
          bgg_name?: string
          bgg_type?: string
          created_at?: string | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_primary: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_primary?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_primary?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      collection_games: {
        Row: {
          collection_id: string
          display_order: number | null
          game_id: string
          note: string | null
        }
        Insert: {
          collection_id: string
          display_order?: number | null
          game_id: string
          note?: string | null
        }
        Update: {
          collection_id?: string
          display_order?: number | null
          game_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_games_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          hero_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          short_description: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          short_description?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          short_description?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      complexity_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
          weight_max: number
          weight_min: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
          weight_max: number
          weight_min: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
          weight_max?: number
          weight_min?: number
        }
        Relationships: []
      }
      content_generation_log: {
        Row: {
          content_type: string
          cost_usd: number | null
          created_at: string | null
          error_message: string | null
          game_id: string | null
          generated_content: Json | null
          generation_time_ms: number | null
          id: string
          model_used: string | null
          prompt_version: string | null
          status: string
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          content_type: string
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          game_id?: string | null
          generated_content?: Json | null
          generation_time_ms?: number | null
          id?: string
          model_used?: string | null
          prompt_version?: string | null
          status: string
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          content_type?: string
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          game_id?: string | null
          generated_content?: Json | null
          generation_time_ms?: number | null
          id?: string
          model_used?: string | null
          prompt_version?: string | null
          status?: string
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_generation_log_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      designers: {
        Row: {
          bgg_id: number | null
          bio: string | null
          created_at: string | null
          id: string
          name: string
          photo_url: string | null
          slug: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          bgg_id?: number | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name: string
          photo_url?: string | null
          slug: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          bgg_id?: number | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          slug?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          allowed_user_ids: string[] | null
          created_at: string | null
          flag_key: string
          id: string
          is_enabled: boolean | null
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          allowed_user_ids?: string[] | null
          created_at?: string | null
          flag_key: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          allowed_user_ids?: string[] | null
          created_at?: string | null
          flag_key?: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      game_artists: {
        Row: {
          artist_id: string
          display_order: number | null
          game_id: string
        }
        Insert: {
          artist_id: string
          display_order?: number | null
          game_id: string
        }
        Update: {
          artist_id?: string
          display_order?: number | null
          game_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_artists_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_awards: {
        Row: {
          award_id: string | null
          category_id: string | null
          created_at: string | null
          game_id: string | null
          id: string
          notes: string | null
          result: string | null
          year: number
        }
        Insert: {
          award_id?: string | null
          category_id?: string | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          notes?: string | null
          result?: string | null
          year: number
        }
        Update: {
          award_id?: string | null
          category_id?: string | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          notes?: string | null
          result?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_awards_award_id_fkey"
            columns: ["award_id"]
            isOneToOne: false
            referencedRelation: "awards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_awards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "award_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_awards_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_categories: {
        Row: {
          category_id: string
          game_id: string
          is_primary: boolean | null
        }
        Insert: {
          category_id: string
          game_id: string
          is_primary?: boolean | null
        }
        Update: {
          category_id?: string
          game_id?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "game_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_categories_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_designers: {
        Row: {
          designer_id: string
          display_order: number | null
          game_id: string
          is_primary: boolean | null
        }
        Insert: {
          designer_id: string
          display_order?: number | null
          game_id: string
          is_primary?: boolean | null
        }
        Update: {
          designer_id?: string
          display_order?: number | null
          game_id?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "game_designers_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_designers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_families: {
        Row: {
          bgg_family_id: number | null
          created_at: string | null
          description: string | null
          hero_image_url: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          bgg_family_id?: number | null
          created_at?: string | null
          description?: string | null
          hero_image_url?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          bgg_family_id?: number | null
          created_at?: string | null
          description?: string | null
          hero_image_url?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      game_images: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          display_order: number
          file_size: number | null
          game_id: string
          height: number | null
          id: string
          image_type: string
          is_primary: boolean | null
          storage_path: string | null
          updated_at: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number
          file_size?: number | null
          game_id: string
          height?: number | null
          id?: string
          image_type?: string
          is_primary?: boolean | null
          storage_path?: string | null
          updated_at?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number
          file_size?: number | null
          game_id?: string
          height?: number | null
          id?: string
          image_type?: string
          is_primary?: boolean | null
          storage_path?: string | null
          updated_at?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_images_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "game_mechanics_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_mechanics_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      game_player_experiences: {
        Row: {
          game_id: string
          is_primary: boolean | null
          player_experience_id: string
        }
        Insert: {
          game_id: string
          is_primary?: boolean | null
          player_experience_id: string
        }
        Update: {
          game_id?: string
          is_primary?: boolean | null
          player_experience_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_player_experiences_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_experiences_player_experience_id_fkey"
            columns: ["player_experience_id"]
            isOneToOne: false
            referencedRelation: "player_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      game_publishers: {
        Row: {
          display_order: number | null
          game_id: string
          is_primary: boolean | null
          publisher_id: string
        }
        Insert: {
          display_order?: number | null
          game_id: string
          is_primary?: boolean | null
          publisher_id: string
        }
        Update: {
          display_order?: number | null
          game_id?: string
          is_primary?: boolean | null
          publisher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_publishers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_publishers_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
        ]
      }
      game_relations: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          notes: string | null
          relation_type: string
          source_game_id: string
          target_game_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          notes?: string | null
          relation_type: string
          source_game_id: string
          target_game_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          notes?: string | null
          relation_type?: string
          source_game_id?: string
          target_game_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_relations_source_game_id_fkey"
            columns: ["source_game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_relations_target_game_id_fkey"
            columns: ["target_game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_themes: {
        Row: {
          game_id: string
          is_primary: boolean | null
          theme_id: string
        }
        Insert: {
          game_id: string
          is_primary?: boolean | null
          theme_id: string
        }
        Update: {
          game_id?: string
          is_primary?: boolean | null
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_themes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_themes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          amazon_asin: string | null
          bgg_id: number | null
          bgg_last_synced: string | null
          bgg_raw_data: Json | null
          box_image_url: string | null
          complexity_tier_id: string | null
          content_generated_at: string | null
          content_notes: string | null
          content_reviewed_at: string | null
          content_reviewed_by: string | null
          content_status: string | null
          content_version: number | null
          created_at: string | null
          description: string | null
          designers: string[] | null
          family_id: string | null
          fts: unknown
          has_reference: boolean | null
          has_rules: boolean | null
          has_score_sheet: boolean | null
          has_setup_guide: boolean | null
          hero_image_url: string | null
          id: string
          is_featured: boolean | null
          is_hidden_gem: boolean | null
          is_new_release: boolean | null
          is_published: boolean | null
          is_staff_pick: boolean | null
          is_top_rated: boolean | null
          is_trending: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_age: number | null
          name: string
          play_time_max: number | null
          play_time_min: number | null
          player_count_best: number[] | null
          player_count_max: number
          player_count_min: number
          priority: number | null
          publisher: string | null
          reference_content: Json | null
          rules_content: Json | null
          setup_content: Json | null
          slug: string
          tagline: string | null
          thumbnail_url: string | null
          updated_at: string | null
          weight: number | null
          year_published: number | null
        }
        Insert: {
          amazon_asin?: string | null
          bgg_id?: number | null
          bgg_last_synced?: string | null
          bgg_raw_data?: Json | null
          box_image_url?: string | null
          complexity_tier_id?: string | null
          content_generated_at?: string | null
          content_notes?: string | null
          content_reviewed_at?: string | null
          content_reviewed_by?: string | null
          content_status?: string | null
          content_version?: number | null
          created_at?: string | null
          description?: string | null
          designers?: string[] | null
          family_id?: string | null
          fts?: unknown
          has_reference?: boolean | null
          has_rules?: boolean | null
          has_score_sheet?: boolean | null
          has_setup_guide?: boolean | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_hidden_gem?: boolean | null
          is_new_release?: boolean | null
          is_published?: boolean | null
          is_staff_pick?: boolean | null
          is_top_rated?: boolean | null
          is_trending?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_age?: number | null
          name: string
          play_time_max?: number | null
          play_time_min?: number | null
          player_count_best?: number[] | null
          player_count_max?: number
          player_count_min?: number
          priority?: number | null
          publisher?: string | null
          reference_content?: Json | null
          rules_content?: Json | null
          setup_content?: Json | null
          slug: string
          tagline?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          weight?: number | null
          year_published?: number | null
        }
        Update: {
          amazon_asin?: string | null
          bgg_id?: number | null
          bgg_last_synced?: string | null
          bgg_raw_data?: Json | null
          box_image_url?: string | null
          complexity_tier_id?: string | null
          content_generated_at?: string | null
          content_notes?: string | null
          content_reviewed_at?: string | null
          content_reviewed_by?: string | null
          content_status?: string | null
          content_version?: number | null
          created_at?: string | null
          description?: string | null
          designers?: string[] | null
          family_id?: string | null
          fts?: unknown
          has_reference?: boolean | null
          has_rules?: boolean | null
          has_score_sheet?: boolean | null
          has_setup_guide?: boolean | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_hidden_gem?: boolean | null
          is_new_release?: boolean | null
          is_published?: boolean | null
          is_staff_pick?: boolean | null
          is_top_rated?: boolean | null
          is_trending?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_age?: number | null
          name?: string
          play_time_max?: number | null
          play_time_min?: number | null
          player_count_best?: number[] | null
          player_count_max?: number
          player_count_min?: number
          priority?: number | null
          publisher?: string | null
          reference_content?: Json | null
          rules_content?: Json | null
          setup_content?: Json | null
          slug?: string
          tagline?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          weight?: number | null
          year_published?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_complexity_tier_id_fkey"
            columns: ["complexity_tier_id"]
            isOneToOne: false
            referencedRelation: "complexity_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "game_families"
            referencedColumns: ["id"]
          },
        ]
      }
      import_queue: {
        Row: {
          attempts: number | null
          bgg_id: number
          bgg_rank: number | null
          bgg_rating: number | null
          created_at: string | null
          error_message: string | null
          id: string
          imported_game_id: string | null
          last_attempt_at: string | null
          name: string | null
          priority: number | null
          source: string
          source_detail: string | null
          status: string | null
          updated_at: string | null
          year_published: number | null
        }
        Insert: {
          attempts?: number | null
          bgg_id: number
          bgg_rank?: number | null
          bgg_rating?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          imported_game_id?: string | null
          last_attempt_at?: string | null
          name?: string | null
          priority?: number | null
          source: string
          source_detail?: string | null
          status?: string | null
          updated_at?: string | null
          year_published?: number | null
        }
        Update: {
          attempts?: number | null
          bgg_id?: number
          bgg_rank?: number | null
          bgg_rating?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          imported_game_id?: string | null
          last_attempt_at?: string | null
          name?: string | null
          priority?: number | null
          source?: string
          source_detail?: string | null
          status?: string | null
          updated_at?: string | null
          year_published?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_queue_imported_game_id_fkey"
            columns: ["imported_game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_order: number
          file_size: number | null
          height: number | null
          id: string
          is_primary: boolean | null
          listing_id: string
          mime_type: string | null
          storage_path: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number
          file_size?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean | null
          listing_id: string
          mime_type?: string | null
          storage_path?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number
          file_size?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean | null
          listing_id?: string
          mime_type?: string | null
          storage_path?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_saves: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_saves_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_conversations: {
        Row: {
          buyer_archived: boolean | null
          buyer_id: string
          buyer_unread_count: number | null
          created_at: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          listing_id: string
          seller_archived: boolean | null
          seller_id: string
          seller_unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          buyer_archived?: boolean | null
          buyer_id: string
          buyer_unread_count?: number | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id: string
          seller_archived?: boolean | null
          seller_id: string
          seller_unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          buyer_archived?: boolean | null
          buyer_id?: string
          buyer_unread_count?: number | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: string
          seller_archived?: boolean | null
          seller_id?: string
          seller_unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          accepts_offers: boolean | null
          condition: Database["public"]["Enums"]["game_condition"] | null
          condition_notes: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          expires_at: string | null
          fts: unknown
          game_id: string
          id: string
          is_featured: boolean | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          location_city: string | null
          location_country: string | null
          location_lat: number | null
          location_lng: number | null
          location_postal: string | null
          location_state: string | null
          minimum_offer_cents: number | null
          price_cents: number | null
          published_at: string | null
          save_count: number | null
          seller_id: string
          shipping_cost_cents: number | null
          shipping_notes: string | null
          shipping_preference:
            | Database["public"]["Enums"]["shipping_preference"]
            | null
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string | null
          trade_game_ids: string[] | null
          trade_preferences: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          accepts_offers?: boolean | null
          condition?: Database["public"]["Enums"]["game_condition"] | null
          condition_notes?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          fts?: unknown
          game_id: string
          id?: string
          is_featured?: boolean | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_postal?: string | null
          location_state?: string | null
          minimum_offer_cents?: number | null
          price_cents?: number | null
          published_at?: string | null
          save_count?: number | null
          seller_id: string
          shipping_cost_cents?: number | null
          shipping_notes?: string | null
          shipping_preference?:
            | Database["public"]["Enums"]["shipping_preference"]
            | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string | null
          trade_game_ids?: string[] | null
          trade_preferences?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          accepts_offers?: boolean | null
          condition?: Database["public"]["Enums"]["game_condition"] | null
          condition_notes?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          fts?: unknown
          game_id?: string
          id?: string
          is_featured?: boolean | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_postal?: string | null
          location_state?: string | null
          minimum_offer_cents?: number | null
          price_cents?: number | null
          published_at?: string | null
          save_count?: number | null
          seller_id?: string
          shipping_cost_cents?: number | null
          shipping_notes?: string | null
          shipping_preference?:
            | Database["public"]["Enums"]["shipping_preference"]
            | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string | null
          trade_game_ids?: string[] | null
          trade_preferences?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          is_read: boolean | null
          is_system_message: boolean | null
          read_at: string | null
          sender_id: string
          system_message_type: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          is_system_message?: boolean | null
          read_at?: string | null
          sender_id: string
          system_message_type?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          is_system_message?: boolean | null
          read_at?: string | null
          sender_id?: string
          system_message_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "marketplace_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_offers: {
        Row: {
          amount_cents: number | null
          buyer_id: string
          conversation_id: string | null
          counter_count: number | null
          created_at: string | null
          currency: string | null
          expires_at: string
          id: string
          listing_id: string
          message: string | null
          offer_type: Database["public"]["Enums"]["offer_type"]
          parent_offer_id: string | null
          responded_at: string | null
          responded_by: string | null
          response_message: string | null
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          trade_game_ids: string[] | null
          trade_notes: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents?: number | null
          buyer_id: string
          conversation_id?: string | null
          counter_count?: number | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string
          id?: string
          listing_id: string
          message?: string | null
          offer_type?: Database["public"]["Enums"]["offer_type"]
          parent_offer_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          trade_game_ids?: string[] | null
          trade_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number | null
          buyer_id?: string
          conversation_id?: string | null
          counter_count?: number | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          offer_type?: Database["public"]["Enums"]["offer_type"]
          parent_offer_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          trade_game_ids?: string[] | null
          trade_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "marketplace_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_parent_offer_id_fkey"
            columns: ["parent_offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_transactions: {
        Row: {
          amount_cents: number
          buyer_id: string
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: string
          listing_id: string
          offer_id: string
          paid_at: string | null
          platform_fee_cents: number
          released_at: string | null
          seller_id: string
          seller_payout_cents: number
          shipped_at: string | null
          shipping_carrier:
            | Database["public"]["Enums"]["shipping_carrier"]
            | null
          shipping_cents: number | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_fee_cents: number
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          buyer_id: string
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: string
          listing_id: string
          offer_id: string
          paid_at?: string | null
          platform_fee_cents: number
          released_at?: string | null
          seller_id: string
          seller_payout_cents: number
          shipped_at?: string | null
          shipping_carrier?:
            | Database["public"]["Enums"]["shipping_carrier"]
            | null
          shipping_cents?: number | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_fee_cents: number
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          buyer_id?: string
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: string
          listing_id?: string
          offer_id?: string
          paid_at?: string | null
          platform_fee_cents?: number
          released_at?: string | null
          seller_id?: string
          seller_payout_cents?: number
          shipped_at?: string | null
          shipping_carrier?:
            | Database["public"]["Enums"]["shipping_carrier"]
            | null
          shipping_cents?: number | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_fee_cents?: number
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_transactions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "marketplace_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanics: {
        Row: {
          bgg_id: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          bgg_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          bgg_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      player_experiences: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      publishers: {
        Row: {
          bgg_id: number | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          bgg_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          bgg_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      score_sheet_configs: {
        Row: {
          color_scheme: string | null
          created_at: string | null
          custom_styles: Json | null
          game_id: string | null
          id: string
          layout_type: string
          orientation: string | null
          player_max: number
          player_min: number
          show_game_logo: boolean | null
          show_total_row: boolean | null
          updated_at: string | null
        }
        Insert: {
          color_scheme?: string | null
          created_at?: string | null
          custom_styles?: Json | null
          game_id?: string | null
          id?: string
          layout_type?: string
          orientation?: string | null
          player_max?: number
          player_min?: number
          show_game_logo?: boolean | null
          show_total_row?: boolean | null
          updated_at?: string | null
        }
        Update: {
          color_scheme?: string | null
          created_at?: string | null
          custom_styles?: Json | null
          game_id?: string | null
          id?: string
          layout_type?: string
          orientation?: string | null
          player_max?: number
          player_min?: number
          show_game_logo?: boolean | null
          show_total_row?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_sheet_configs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      score_sheet_fields: {
        Row: {
          calculation_formula: string | null
          config_id: string | null
          created_at: string | null
          default_value: string | null
          description: string | null
          display_order: number
          field_type: string
          id: string
          is_required: boolean | null
          label: string | null
          max_value: number | null
          min_value: number | null
          name: string
          per_player: boolean | null
          placeholder: string | null
          section: string | null
          updated_at: string | null
        }
        Insert: {
          calculation_formula?: string | null
          config_id?: string | null
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          display_order?: number
          field_type?: string
          id?: string
          is_required?: boolean | null
          label?: string | null
          max_value?: number | null
          min_value?: number | null
          name: string
          per_player?: boolean | null
          placeholder?: string | null
          section?: string | null
          updated_at?: string | null
        }
        Update: {
          calculation_formula?: string | null
          config_id?: string | null
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          display_order?: number
          field_type?: string
          id?: string
          is_required?: boolean | null
          label?: string | null
          max_value?: number | null
          min_value?: number | null
          name?: string
          per_player?: boolean | null
          placeholder?: string | null
          section?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_sheet_fields_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "score_sheet_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          bgg_id: number | null
          bgg_name: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          bgg_id?: number | null
          bgg_name?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          bgg_id?: number | null
          bgg_name?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string | null
          game_id: string | null
          id: string
          metadata: Json | null
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_games: {
        Row: {
          acquired_date: string | null
          created_at: string | null
          game_id: string
          id: string
          notes: string | null
          rating: number | null
          review: string | null
          review_updated_at: string | null
          status: Database["public"]["Enums"]["shelf_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acquired_date?: string | null
          created_at?: string | null
          game_id: string
          id?: string
          notes?: string | null
          rating?: number | null
          review?: string | null
          review_updated_at?: string | null
          status?: Database["public"]["Enums"]["shelf_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acquired_date?: string | null
          created_at?: string | null
          game_id?: string
          id?: string
          notes?: string | null
          rating?: number | null
          review?: string | null
          review_updated_at?: string | null
          status?: Database["public"]["Enums"]["shelf_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_marketplace_settings: {
        Row: {
          buyer_rating: number | null
          created_at: string | null
          default_shipping_preference:
            | Database["public"]["Enums"]["shipping_preference"]
            | null
          id: string
          notification_preferences: Json | null
          pickup_location_city: string | null
          pickup_location_country: string | null
          pickup_location_lat: number | null
          pickup_location_lng: number | null
          pickup_location_postal: string | null
          pickup_location_state: string | null
          seller_rating: number | null
          ships_from_location: string | null
          ships_to_countries: string[] | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_charges_enabled: boolean | null
          stripe_onboarding_complete: boolean | null
          stripe_payouts_enabled: boolean | null
          total_purchases: number | null
          total_sales: number | null
          total_trades: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          buyer_rating?: number | null
          created_at?: string | null
          default_shipping_preference?:
            | Database["public"]["Enums"]["shipping_preference"]
            | null
          id?: string
          notification_preferences?: Json | null
          pickup_location_city?: string | null
          pickup_location_country?: string | null
          pickup_location_lat?: number | null
          pickup_location_lng?: number | null
          pickup_location_postal?: string | null
          pickup_location_state?: string | null
          seller_rating?: number | null
          ships_from_location?: string | null
          ships_to_countries?: string[] | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          total_purchases?: number | null
          total_sales?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          buyer_rating?: number | null
          created_at?: string | null
          default_shipping_preference?:
            | Database["public"]["Enums"]["shipping_preference"]
            | null
          id?: string
          notification_preferences?: Json | null
          pickup_location_city?: string | null
          pickup_location_country?: string | null
          pickup_location_lat?: number | null
          pickup_location_lng?: number | null
          pickup_location_postal?: string | null
          pickup_location_state?: string | null
          seller_rating?: number | null
          ships_from_location?: string | null
          ships_to_countries?: string[] | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          total_purchases?: number | null
          total_sales?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_marketplace_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          game_id: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          custom_avatar_url: string | null
          display_name: string | null
          header_image_url: string | null
          id: string
          last_active_at: string | null
          location: string | null
          profile_visibility: string | null
          role: string | null
          shelf_visibility: string | null
          social_links: Json | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_avatar_url?: string | null
          display_name?: string | null
          header_image_url?: string | null
          id: string
          last_active_at?: string | null
          location?: string | null
          profile_visibility?: string | null
          role?: string | null
          shelf_visibility?: string | null
          social_links?: Json | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_avatar_url?: string | null
          display_name?: string | null
          header_image_url?: string | null
          id?: string
          last_active_at?: string | null
          location?: string | null
          profile_visibility?: string | null
          role?: string | null
          shelf_visibility?: string | null
          social_links?: Json | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_top_games: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          position: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          position: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          position?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_top_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_top_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_offer: {
        Args: { p_message?: string; p_offer_id: string; p_user_id: string }
        Returns: {
          amount_cents: number | null
          buyer_id: string
          conversation_id: string | null
          counter_count: number | null
          created_at: string | null
          currency: string | null
          expires_at: string
          id: string
          listing_id: string
          message: string | null
          offer_type: Database["public"]["Enums"]["offer_type"]
          parent_offer_id: string | null
          responded_at: string | null
          responded_by: string | null
          response_message: string | null
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          trade_game_ids: string[] | null
          trade_notes: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      auto_release_funds: { Args: never; Returns: number }
      calculate_distance_miles: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      cancel_unpaid_transactions: { Args: never; Returns: number }
      confirm_delivery: {
        Args: { p_transaction_id: string; p_user_id: string }
        Returns: {
          amount_cents: number
          buyer_id: string
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: string
          listing_id: string
          offer_id: string
          paid_at: string | null
          platform_fee_cents: number
          released_at: string | null
          seller_id: string
          seller_payout_cents: number
          shipped_at: string | null
          shipping_carrier:
            | Database["public"]["Enums"]["shipping_carrier"]
            | null
          shipping_cents: number | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_fee_cents: number
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      counter_offer: {
        Args: {
          p_amount_cents?: number
          p_message?: string
          p_offer_id: string
          p_trade_game_ids?: string[]
          p_user_id: string
        }
        Returns: {
          amount_cents: number | null
          buyer_id: string
          conversation_id: string | null
          counter_count: number | null
          created_at: string | null
          currency: string | null
          expires_at: string
          id: string
          listing_id: string
          message: string | null
          offer_type: Database["public"]["Enums"]["offer_type"]
          parent_offer_id: string | null
          responded_at: string | null
          responded_by: string | null
          response_message: string | null
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          trade_game_ids: string[] | null
          trade_notes: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_transaction_from_offer: {
        Args: {
          p_amount_cents: number
          p_offer_id: string
          p_platform_fee_cents: number
          p_seller_payout_cents: number
          p_shipping_cents: number
          p_stripe_fee_cents: number
        }
        Returns: {
          amount_cents: number
          buyer_id: string
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: string
          listing_id: string
          offer_id: string
          paid_at: string | null
          platform_fee_cents: number
          released_at: string | null
          seller_id: string
          seller_payout_cents: number
          shipped_at: string | null
          shipping_carrier:
            | Database["public"]["Enums"]["shipping_carrier"]
            | null
          shipping_cents: number | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_fee_cents: number
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      decline_offer: {
        Args: { p_message?: string; p_offer_id: string; p_user_id: string }
        Returns: {
          amount_cents: number | null
          buyer_id: string
          conversation_id: string | null
          counter_count: number | null
          created_at: string | null
          currency: string | null
          expires_at: string
          id: string
          listing_id: string
          message: string | null
          offer_type: Database["public"]["Enums"]["offer_type"]
          parent_offer_id: string | null
          responded_at: string | null
          responded_by: string | null
          response_message: string | null
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          trade_game_ids: string[] | null
          trade_notes: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_stale_offers: { Args: never; Returns: number }
      get_complexity_tier_id: { Args: { game_weight: number }; Returns: string }
      get_listing_offer_counts: {
        Args: { p_listing_id: string }
        Returns: {
          highest_offer_cents: number
          pending_offers: number
          total_offers: number
        }[]
      }
      get_or_create_conversation: {
        Args: { p_buyer_id: string; p_listing_id: string }
        Returns: string
      }
      get_user_transaction_stats: {
        Args: { p_user_id: string }
        Returns: {
          as_buyer_active: number
          as_buyer_completed: number
          as_buyer_pending: number
          as_seller_active: number
          as_seller_completed: number
          as_seller_pending: number
          total_earned_cents: number
          total_spent_cents: number
        }[]
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      mark_transaction_paid: {
        Args: {
          p_charge_id?: string
          p_payment_intent_id: string
          p_transaction_id: string
        }
        Returns: {
          amount_cents: number
          buyer_id: string
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: string
          listing_id: string
          offer_id: string
          paid_at: string | null
          platform_fee_cents: number
          released_at: string | null
          seller_id: string
          seller_payout_cents: number
          shipped_at: string | null
          shipping_carrier:
            | Database["public"]["Enums"]["shipping_carrier"]
            | null
          shipping_cents: number | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_fee_cents: number
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      release_transaction_funds: {
        Args: { p_transaction_id: string; p_transfer_id?: string }
        Returns: {
          amount_cents: number
          buyer_id: string
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: string
          listing_id: string
          offer_id: string
          paid_at: string | null
          platform_fee_cents: number
          released_at: string | null
          seller_id: string
          seller_payout_cents: number
          shipped_at: string | null
          shipping_carrier:
            | Database["public"]["Enums"]["shipping_carrier"]
            | null
          shipping_cents: number | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_fee_cents: number
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_refund: {
        Args: { p_reason?: string; p_transaction_id: string; p_user_id: string }
        Returns: {
          amount_cents: number
          buyer_id: string
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: string
          listing_id: string
          offer_id: string
          paid_at: string | null
          platform_fee_cents: number
          released_at: string | null
          seller_id: string
          seller_payout_cents: number
          shipped_at: string | null
          shipping_carrier:
            | Database["public"]["Enums"]["shipping_carrier"]
            | null
          shipping_cents: number | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_fee_cents: number
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      search_games: {
        Args: { search_query: string }
        Returns: {
          amazon_asin: string | null
          bgg_id: number | null
          bgg_last_synced: string | null
          bgg_raw_data: Json | null
          box_image_url: string | null
          complexity_tier_id: string | null
          content_generated_at: string | null
          content_notes: string | null
          content_reviewed_at: string | null
          content_reviewed_by: string | null
          content_status: string | null
          content_version: number | null
          created_at: string | null
          description: string | null
          designers: string[] | null
          family_id: string | null
          fts: unknown
          has_reference: boolean | null
          has_rules: boolean | null
          has_score_sheet: boolean | null
          has_setup_guide: boolean | null
          hero_image_url: string | null
          id: string
          is_featured: boolean | null
          is_hidden_gem: boolean | null
          is_new_release: boolean | null
          is_published: boolean | null
          is_staff_pick: boolean | null
          is_top_rated: boolean | null
          is_trending: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_age: number | null
          name: string
          play_time_max: number | null
          play_time_min: number | null
          player_count_best: number[] | null
          player_count_max: number
          player_count_min: number
          priority: number | null
          publisher: string | null
          reference_content: Json | null
          rules_content: Json | null
          setup_content: Json | null
          slug: string
          tagline: string | null
          thumbnail_url: string | null
          updated_at: string | null
          weight: number | null
          year_published: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "games"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      ship_transaction: {
        Args: {
          p_carrier: Database["public"]["Enums"]["shipping_carrier"]
          p_tracking_number?: string
          p_transaction_id: string
          p_user_id: string
        }
        Returns: {
          amount_cents: number
          buyer_id: string
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: string
          listing_id: string
          offer_id: string
          paid_at: string | null
          platform_fee_cents: number
          released_at: string | null
          seller_id: string
          seller_payout_cents: number
          shipped_at: string | null
          shipping_carrier:
            | Database["public"]["Enums"]["shipping_carrier"]
            | null
          shipping_cents: number | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_fee_cents: number
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      slugify: { Args: { text_input: string }; Returns: string }
      withdraw_offer: {
        Args: { p_offer_id: string; p_user_id: string }
        Returns: {
          amount_cents: number | null
          buyer_id: string
          conversation_id: string | null
          counter_count: number | null
          created_at: string | null
          currency: string | null
          expires_at: string
          id: string
          listing_id: string
          message: string | null
          offer_type: Database["public"]["Enums"]["offer_type"]
          parent_offer_id: string | null
          responded_at: string | null
          responded_by: string | null
          response_message: string | null
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          trade_game_ids: string[] | null
          trade_notes: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      activity_type:
        | "follow"
        | "shelf_add"
        | "shelf_update"
        | "rating"
        | "top_games_update"
        | "review"
        | "listing_created"
        | "listing_sold"
        | "listing_traded"
      game_condition:
        | "new_sealed"
        | "like_new"
        | "very_good"
        | "good"
        | "acceptable"
      listing_status:
        | "draft"
        | "active"
        | "pending"
        | "sold"
        | "traded"
        | "expired"
        | "cancelled"
      listing_type: "sell" | "trade" | "want"
      notification_type:
        | "new_follower"
        | "rating"
        | "new_offer"
        | "offer_accepted"
        | "offer_declined"
        | "offer_countered"
        | "new_message"
        | "transaction_shipped"
        | "transaction_delivered"
        | "feedback_received"
        | "wishlist_match"
        | "offer_withdrawn"
        | "offer_expired"
      offer_status:
        | "pending"
        | "accepted"
        | "declined"
        | "countered"
        | "expired"
        | "withdrawn"
      offer_type: "buy" | "trade" | "buy_plus_trade"
      shelf_status:
        | "owned"
        | "want_to_buy"
        | "want_to_play"
        | "previously_owned"
        | "wishlist"
      shipping_carrier: "usps" | "ups" | "fedex" | "dhl" | "other"
      shipping_preference: "local_only" | "will_ship" | "ship_only"
      transaction_status:
        | "pending_payment"
        | "payment_processing"
        | "payment_held"
        | "shipped"
        | "delivered"
        | "completed"
        | "refund_requested"
        | "refunded"
        | "disputed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        "follow",
        "shelf_add",
        "shelf_update",
        "rating",
        "top_games_update",
        "review",
        "listing_created",
        "listing_sold",
        "listing_traded",
      ],
      game_condition: [
        "new_sealed",
        "like_new",
        "very_good",
        "good",
        "acceptable",
      ],
      listing_status: [
        "draft",
        "active",
        "pending",
        "sold",
        "traded",
        "expired",
        "cancelled",
      ],
      listing_type: ["sell", "trade", "want"],
      notification_type: [
        "new_follower",
        "rating",
        "new_offer",
        "offer_accepted",
        "offer_declined",
        "offer_countered",
        "new_message",
        "transaction_shipped",
        "transaction_delivered",
        "feedback_received",
        "wishlist_match",
        "offer_withdrawn",
        "offer_expired",
      ],
      offer_status: [
        "pending",
        "accepted",
        "declined",
        "countered",
        "expired",
        "withdrawn",
      ],
      offer_type: ["buy", "trade", "buy_plus_trade"],
      shelf_status: [
        "owned",
        "want_to_buy",
        "want_to_play",
        "previously_owned",
        "wishlist",
      ],
      shipping_carrier: ["usps", "ups", "fedex", "dhl", "other"],
      shipping_preference: ["local_only", "will_ship", "ship_only"],
      transaction_status: [
        "pending_payment",
        "payment_processing",
        "payment_held",
        "shipped",
        "delivered",
        "completed",
        "refund_requested",
        "refunded",
        "disputed",
        "cancelled",
      ],
    },
  },
} as const
