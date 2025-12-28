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
      games: {
        Row: {
          amazon_asin: string | null
          bgg_id: number | null
          bgg_last_synced: string | null
          bgg_raw_data: Json | null
          box_image_url: string | null
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
      user_games: {
        Row: {
          acquired_date: string | null
          created_at: string | null
          game_id: string
          id: string
          notes: string | null
          rating: number | null
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
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
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
          display_name?: string | null
          id: string
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
          display_name?: string | null
          id?: string
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
      search_games: {
        Args: { search_query: string }
        Returns: {
          amazon_asin: string | null
          bgg_id: number | null
          bgg_last_synced: string | null
          bgg_raw_data: Json | null
          box_image_url: string | null
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
      slugify: { Args: { text_input: string }; Returns: string }
    }
    Enums: {
      shelf_status:
        | "owned"
        | "want_to_buy"
        | "want_to_play"
        | "previously_owned"
        | "wishlist"
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
      shelf_status: [
        "owned",
        "want_to_buy",
        "want_to_play",
        "previously_owned",
        "wishlist",
      ],
    },
  },
} as const
