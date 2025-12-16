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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      charging_sessions: {
        Row: {
          charger_type: string | null
          cost_usd: number | null
          created_at: string
          duration_minutes: number | null
          end_battery_level: number | null
          ended_at: string | null
          energy_added_kwh: number | null
          id: string
          journey_id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          max_charge_rate_kw: number | null
          start_battery_level: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          charger_type?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_minutes?: number | null
          end_battery_level?: number | null
          ended_at?: string | null
          energy_added_kwh?: number | null
          id?: string
          journey_id: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          max_charge_rate_kw?: number | null
          start_battery_level?: number | null
          started_at: string
          user_id: string
        }
        Update: {
          charger_type?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_minutes?: number | null
          end_battery_level?: number | null
          ended_at?: string | null
          energy_added_kwh?: number | null
          id?: string
          journey_id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          max_charge_rate_kw?: number | null
          start_battery_level?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charging_sessions_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      drive_data: {
        Row: {
          battery_level: number | null
          battery_range: number | null
          created_at: string
          elevation_ft: number | null
          energy_used_kwh: number | null
          heading: number | null
          id: string
          inside_temp_f: number | null
          is_charging: boolean | null
          journey_id: string
          latitude: number
          longitude: number
          odometer: number | null
          outside_temp_f: number | null
          power_kw: number | null
          recorded_at: string
          speed_mph: number | null
          user_id: string
        }
        Insert: {
          battery_level?: number | null
          battery_range?: number | null
          created_at?: string
          elevation_ft?: number | null
          energy_used_kwh?: number | null
          heading?: number | null
          id?: string
          inside_temp_f?: number | null
          is_charging?: boolean | null
          journey_id: string
          latitude: number
          longitude: number
          odometer?: number | null
          outside_temp_f?: number | null
          power_kw?: number | null
          recorded_at: string
          speed_mph?: number | null
          user_id: string
        }
        Update: {
          battery_level?: number | null
          battery_range?: number | null
          created_at?: string
          elevation_ft?: number | null
          energy_used_kwh?: number | null
          heading?: number | null
          id?: string
          inside_temp_f?: number | null
          is_charging?: boolean | null
          journey_id?: string
          latitude?: number
          longitude?: number
          odometer?: number | null
          outside_temp_f?: number | null
          power_kw?: number | null
          recorded_at?: string
          speed_mph?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drive_data_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string | null
          created_at: string
          entry_date: string
          id: string
          is_highlight: boolean | null
          journey_id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          mood: string | null
          people_met: string[] | null
          photo_urls: string[] | null
          state_code: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          entry_date: string
          id?: string
          is_highlight?: boolean | null
          journey_id: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          mood?: string | null
          people_met?: string[] | null
          photo_urls?: string[] | null
          state_code?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          is_highlight?: boolean | null
          journey_id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          mood?: string | null
          people_met?: string[] | null
          photo_urls?: string[] | null
          state_code?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_media: {
        Row: {
          caption: string | null
          created_at: string
          file_path: string
          file_size_bytes: number | null
          file_url: string
          height: number | null
          id: string
          is_favorite: boolean | null
          journey_id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          people_tagged: string[] | null
          state_code: string | null
          tags: string[] | null
          taken_at: string | null
          thumbnail_url: string | null
          type: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_path: string
          file_size_bytes?: number | null
          file_url: string
          height?: number | null
          id?: string
          is_favorite?: boolean | null
          journey_id: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          people_tagged?: string[] | null
          state_code?: string | null
          tags?: string[] | null
          taken_at?: string | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_path?: string
          file_size_bytes?: number | null
          file_url?: string
          height?: number | null
          id?: string
          is_favorite?: boolean | null
          journey_id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          people_tagged?: string[] | null
          state_code?: string | null
          tags?: string[] | null
          taken_at?: string | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_media_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_public: boolean | null
          name: string
          start_date: string
          states_count: number | null
          total_kwh: number | null
          total_miles: number | null
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          start_date: string
          states_count?: number | null
          total_kwh?: number | null
          total_miles?: number | null
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          start_date?: string
          states_count?: number | null
          total_kwh?: number | null
          total_miles?: number | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journeys_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      states_visited: {
        Row: {
          created_at: string
          first_entered_at: string | null
          id: string
          is_gps_verified: boolean | null
          journey_id: string
          notes: string | null
          state_code: string
          state_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_entered_at?: string | null
          id?: string
          is_gps_verified?: boolean | null
          journey_id: string
          notes?: string | null
          state_code: string
          state_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_entered_at?: string | null
          id?: string
          is_gps_verified?: boolean | null
          journey_id?: string
          notes?: string | null
          state_code?: string
          state_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "states_visited_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          id: string
          model: string | null
          nickname: string
          tessie_vehicle_id: string | null
          updated_at: string
          user_id: string
          vin: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          model?: string | null
          nickname: string
          tessie_vehicle_id?: string | null
          updated_at?: string
          user_id: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          model?: string | null
          nickname?: string
          tessie_vehicle_id?: string | null
          updated_at?: string
          user_id?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "premium"
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
    Enums: {
      app_role: ["admin", "user", "premium"],
    },
  },
} as const
