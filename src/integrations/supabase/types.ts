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
      api_providers: {
        Row: {
          auth_type: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          setup_url: string | null
          supported_makes: string[]
        }
        Insert: {
          auth_type?: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          setup_url?: string | null
          supported_makes?: string[]
        }
        Update: {
          auth_type?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          setup_url?: string | null
          supported_makes?: string[]
        }
        Relationships: []
      }
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
      flagship_waypoints: {
        Row: {
          arrived_at: string
          battery_on_arrival: number | null
          created_at: string
          departed_at: string | null
          description: string | null
          dwell_minutes: number | null
          id: string
          is_highlight: boolean | null
          latitude: number
          location: string
          longitude: number
          name: string
          odometer_miles: number | null
          people_met: string[] | null
          state_code: string | null
          updated_at: string
          waypoint_number: number
          waypoint_type: string
        }
        Insert: {
          arrived_at: string
          battery_on_arrival?: number | null
          created_at?: string
          departed_at?: string | null
          description?: string | null
          dwell_minutes?: number | null
          id?: string
          is_highlight?: boolean | null
          latitude: number
          location: string
          longitude: number
          name: string
          odometer_miles?: number | null
          people_met?: string[] | null
          state_code?: string | null
          updated_at?: string
          waypoint_number: number
          waypoint_type?: string
        }
        Update: {
          arrived_at?: string
          battery_on_arrival?: number | null
          created_at?: string
          departed_at?: string | null
          description?: string | null
          dwell_minutes?: number | null
          id?: string
          is_highlight?: boolean | null
          latitude?: number
          location?: string
          longitude?: number
          name?: string
          odometer_miles?: number | null
          people_met?: string[] | null
          state_code?: string | null
          updated_at?: string
          waypoint_number?: number
          waypoint_type?: string
        }
        Relationships: []
      }
      incident_log: {
        Row: {
          action_taken: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          incident_type: string
          notification_channels: string[] | null
          notification_sent: boolean | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          incident_type: string
          notification_channels?: string[] | null
          notification_sent?: boolean | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          user_id: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          incident_type?: string
          notification_channels?: string[] | null
          notification_sent?: boolean | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: []
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
      journey_followers: {
        Row: {
          approved: boolean | null
          created_at: string
          follower_user_id: string
          id: string
          journey_id: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          follower_user_id: string
          id?: string
          journey_id: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          follower_user_id?: string
          id?: string
          journey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_followers_journey_id_fkey"
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
          location_privacy:
            | Database["public"]["Enums"]["location_privacy_level"]
            | null
          longitude: number | null
          people_tagged: string[] | null
          state_code: string | null
          tags: string[] | null
          taken_at: string | null
          thumbnail_url: string | null
          type: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["media_visibility"] | null
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
          location_privacy?:
            | Database["public"]["Enums"]["location_privacy_level"]
            | null
          longitude?: number | null
          people_tagged?: string[] | null
          state_code?: string | null
          tags?: string[] | null
          taken_at?: string | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["media_visibility"] | null
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
          location_privacy?:
            | Database["public"]["Enums"]["location_privacy_level"]
            | null
          longitude?: number | null
          people_tagged?: string[] | null
          state_code?: string | null
          tags?: string[] | null
          taken_at?: string | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["media_visibility"] | null
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
          archive_expires_at: string | null
          archived_at: string | null
          cloudflare_d1_id: string | null
          cloudflare_d1_name: string | null
          cover_image_url: string | null
          created_at: string
          data_storage_type: string | null
          description: string | null
          end_date: string | null
          export_generated_at: string | null
          export_url: string | null
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
          archive_expires_at?: string | null
          archived_at?: string | null
          cloudflare_d1_id?: string | null
          cloudflare_d1_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          data_storage_type?: string | null
          description?: string | null
          end_date?: string | null
          export_generated_at?: string | null
          export_url?: string | null
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
          archive_expires_at?: string | null
          archived_at?: string | null
          cloudflare_d1_id?: string | null
          cloudflare_d1_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          data_storage_type?: string | null
          description?: string | null
          end_date?: string | null
          export_generated_at?: string | null
          export_url?: string | null
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
      notification_preferences: {
        Row: {
          created_at: string
          email_digest_frequency: string | null
          email_enabled: boolean | null
          id: string
          notify_charging_stop: boolean | null
          notify_new_waypoint: boolean | null
          notify_photos: boolean | null
          notify_state_crossing: boolean | null
          phone_number: string | null
          push_enabled: boolean | null
          sms_consent_given: boolean | null
          sms_consent_ip: string | null
          sms_consent_timestamp: string | null
          sms_enabled: boolean | null
          sms_opt_out_timestamp: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_charging_stop?: boolean | null
          notify_new_waypoint?: boolean | null
          notify_photos?: boolean | null
          notify_state_crossing?: boolean | null
          phone_number?: string | null
          push_enabled?: boolean | null
          sms_consent_given?: boolean | null
          sms_consent_ip?: string | null
          sms_consent_timestamp?: string | null
          sms_enabled?: boolean | null
          sms_opt_out_timestamp?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_charging_stop?: boolean | null
          notify_new_waypoint?: boolean | null
          notify_photos?: boolean | null
          notify_state_crossing?: boolean | null
          phone_number?: string | null
          push_enabled?: boolean | null
          sms_consent_given?: boolean | null
          sms_consent_ip?: string | null
          sms_consent_timestamp?: string | null
          sms_enabled?: boolean | null
          sms_opt_out_timestamp?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          body: string
          channels: Database["public"]["Enums"]["notification_channel"][] | null
          created_at: string
          id: string
          journey_id: string | null
          notification_type: string
          recipient_user_id: string
          sent: boolean | null
          sent_at: string | null
          title: string
        }
        Insert: {
          body: string
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          created_at?: string
          id?: string
          journey_id?: string | null
          notification_type: string
          recipient_user_id: string
          sent?: boolean | null
          sent_at?: string | null
          title: string
        }
        Update: {
          body?: string
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          created_at?: string
          id?: string
          journey_id?: string | null
          notification_type?: string
          recipient_user_id?: string
          sent?: boolean | null
          sent_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          country_code: string | null
          created_at: string
          id: string
          journey_id: string | null
          page_path: string
          referrer: string | null
          user_agent: string | null
          viewed_at: string
          visitor_id: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          id?: string
          journey_id?: string | null
          page_path: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
          visitor_id?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          id?: string
          journey_id?: string | null
          page_path?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          anonymize_username: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          default_location_privacy:
            | Database["public"]["Enums"]["location_privacy_level"]
            | null
          default_media_visibility:
            | Database["public"]["Enums"]["media_visibility"]
            | null
          display_name: string | null
          email: string | null
          full_name: string | null
          has_viewed_flagship: boolean | null
          id: string
          last_active_at: string | null
          locked_at: string | null
          locked_by: string | null
          locked_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string | null
          anonymize_username?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          default_location_privacy?:
            | Database["public"]["Enums"]["location_privacy_level"]
            | null
          default_media_visibility?:
            | Database["public"]["Enums"]["media_visibility"]
            | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          has_viewed_flagship?: boolean | null
          id?: string
          last_active_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locked_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string | null
          anonymize_username?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          default_location_privacy?:
            | Database["public"]["Enums"]["location_privacy_level"]
            | null
          default_media_visibility?:
            | Database["public"]["Enums"]["media_visibility"]
            | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          has_viewed_flagship?: boolean | null
          id?: string
          last_active_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locked_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sms_consent_log: {
        Row: {
          action: string
          consent_given: boolean
          consent_timestamp: string
          created_at: string
          id: string
          ip_address: string | null
          phone_number: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          consent_given: boolean
          consent_timestamp?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          phone_number: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          consent_given?: boolean
          consent_timestamp?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          phone_number?: string
          user_agent?: string | null
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
      tessie_drives: {
        Row: {
          average_inside_temp: number | null
          average_outside_temp: number | null
          average_speed: number | null
          created_at: string
          ended_at: string
          ending_battery: number | null
          ending_latitude: number
          ending_location: string | null
          ending_longitude: number
          ending_odometer: number | null
          energy_used: number | null
          id: string
          max_speed: number | null
          odometer_distance: number | null
          started_at: string
          starting_battery: number | null
          starting_latitude: number
          starting_location: string | null
          starting_longitude: number
          starting_odometer: number | null
          synced_at: string
          tessie_drive_id: number
          vin: string
        }
        Insert: {
          average_inside_temp?: number | null
          average_outside_temp?: number | null
          average_speed?: number | null
          created_at?: string
          ended_at: string
          ending_battery?: number | null
          ending_latitude: number
          ending_location?: string | null
          ending_longitude: number
          ending_odometer?: number | null
          energy_used?: number | null
          id?: string
          max_speed?: number | null
          odometer_distance?: number | null
          started_at: string
          starting_battery?: number | null
          starting_latitude: number
          starting_location?: string | null
          starting_longitude: number
          starting_odometer?: number | null
          synced_at?: string
          tessie_drive_id: number
          vin: string
        }
        Update: {
          average_inside_temp?: number | null
          average_outside_temp?: number | null
          average_speed?: number | null
          created_at?: string
          ended_at?: string
          ending_battery?: number | null
          ending_latitude?: number
          ending_location?: string | null
          ending_longitude?: number
          ending_odometer?: number | null
          energy_used?: number | null
          id?: string
          max_speed?: number | null
          odometer_distance?: number | null
          started_at?: string
          starting_battery?: number | null
          starting_latitude?: number
          starting_location?: string | null
          starting_longitude?: number
          starting_odometer?: number | null
          synced_at?: string
          tessie_drive_id?: number
          vin?: string
        }
        Relationships: []
      }
      user_api_credentials: {
        Row: {
          created_at: string
          encrypted_token: string
          error_message: string | null
          id: string
          is_valid: boolean | null
          last_verified_at: string | null
          provider_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_token: string
          error_message?: string | null
          id?: string
          is_valid?: boolean | null
          last_verified_at?: string | null
          provider_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_token?: string
          error_message?: string | null
          id?: string
          is_valid?: boolean | null
          last_verified_at?: string | null
          provider_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_api_credentials_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "api_providers"
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
      vehicle_makes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          api_credential_id: string | null
          api_provider_id: string | null
          color: string | null
          created_at: string
          id: string
          make: string | null
          model: string | null
          nickname: string
          tessie_vehicle_id: string | null
          updated_at: string
          user_id: string
          vin: string | null
          year: number | null
        }
        Insert: {
          api_credential_id?: string | null
          api_provider_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          make?: string | null
          model?: string | null
          nickname: string
          tessie_vehicle_id?: string | null
          updated_at?: string
          user_id: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          api_credential_id?: string | null
          api_provider_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          make?: string | null
          model?: string | null
          nickname?: string
          tessie_vehicle_id?: string | null
          updated_at?: string
          user_id?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_api_credential_id_fkey"
            columns: ["api_credential_id"]
            isOneToOne: false
            referencedRelation: "user_api_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_api_provider_id_fkey"
            columns: ["api_provider_id"]
            isOneToOne: false
            referencedRelation: "api_providers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_credential_validity: {
        Args: { p_credential_id: string }
        Returns: {
          created_at: string
          error_message: string
          id: string
          is_valid: boolean
          last_verified_at: string
          provider_id: string
          updated_at: string
        }[]
      }
      get_flagship_view_count: {
        Args: never
        Returns: {
          total_views: number
          unique_visitors: number
        }[]
      }
      get_page_view_stats: {
        Args: { p_journey_id?: string; p_page_path?: string }
        Returns: {
          journey_id: string
          page_path: string
          total_views: number
          unique_visitors: number
        }[]
      }
      get_user_api_credential_status: {
        Args: { credential_id: string }
        Returns: {
          created_at: string
          error_message: string
          id: string
          is_valid: boolean
          last_verified_at: string
          provider_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "premium"
      location_privacy_level: "exact" | "city" | "region" | "state"
      media_visibility: "public" | "followers" | "private"
      notification_channel: "email" | "sms" | "push"
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
      location_privacy_level: ["exact", "city", "region", "state"],
      media_visibility: ["public", "followers", "private"],
      notification_channel: ["email", "sms", "push"],
    },
  },
} as const
