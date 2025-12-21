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
      games: {
        Row: {
          amazon_asin: string | null
          bgg_id: number | null
          box_image_url: string | null
          created_at: string | null
          description: string | null
          designers: string[] | null
          fts: unknown
          has_reference: boolean | null
          has_rules: boolean | null
          has_score_sheet: boolean | null
          has_setup_guide: boolean | null
          hero_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_age: number | null
          name: string
          play_time_max: number | null
          play_time_min: number | null
          player_count_best: number[] | null
          player_count_max: number
          player_count_min: number
          publisher: string | null
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
          box_image_url?: string | null
          created_at?: string | null
          description?: string | null
          designers?: string[] | null
          fts?: unknown
          has_reference?: boolean | null
          has_rules?: boolean | null
          has_score_sheet?: boolean | null
          has_setup_guide?: boolean | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_age?: number | null
          name: string
          play_time_max?: number | null
          play_time_min?: number | null
          player_count_best?: number[] | null
          player_count_max?: number
          player_count_min?: number
          publisher?: string | null
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
          box_image_url?: string | null
          created_at?: string | null
          description?: string | null
          designers?: string[] | null
          fts?: unknown
          has_reference?: boolean | null
          has_rules?: boolean | null
          has_score_sheet?: boolean | null
          has_setup_guide?: boolean | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_age?: number | null
          name?: string
          play_time_max?: number | null
          play_time_min?: number | null
          player_count_best?: number[] | null
          player_count_max?: number
          player_count_min?: number
          publisher?: string | null
          slug?: string
          tagline?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          weight?: number | null
          year_published?: number | null
        }
        Relationships: []
      }
      mechanics: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
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
          box_image_url: string | null
          created_at: string | null
          description: string | null
          designers: string[] | null
          fts: unknown
          has_reference: boolean | null
          has_rules: boolean | null
          has_score_sheet: boolean | null
          has_setup_guide: boolean | null
          hero_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_age: number | null
          name: string
          play_time_max: number | null
          play_time_min: number | null
          player_count_best: number[] | null
          player_count_max: number
          player_count_min: number
          publisher: string | null
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
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
