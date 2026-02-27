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
      caregiver_notes: {
        Row: {
          caregiver_id: string
          created_at: string
          id: string
          managed_senior_id: string
          text: string
          updated_at: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string
          id?: string
          managed_senior_id: string
          text: string
          updated_at?: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string
          id?: string
          managed_senior_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_notes_managed_senior_id_fkey"
            columns: ["managed_senior_id"]
            isOneToOne: false
            referencedRelation: "managed_seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_check_ins: {
        Row: {
          check_date: string
          checked_in_at: string
          id: string
          senior_id: string
        }
        Insert: {
          check_date?: string
          checked_in_at?: string
          id?: string
          senior_id: string
        }
        Update: {
          check_date?: string
          checked_in_at?: string
          id?: string
          senior_id?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      favorite_sounds: {
        Row: {
          created_at: string
          id: string
          sound_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sound_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sound_id?: string
          user_id?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          senior_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          senior_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          senior_id?: string
        }
        Relationships: []
      }
      managed_senior_contacts: {
        Row: {
          created_at: string
          delay_minutes: number
          email: string | null
          id: string
          managed_senior_id: string
          name: string
          notify_via_email: boolean
          notify_via_sms: boolean
          phone: string | null
          relationship: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          delay_minutes?: number
          email?: string | null
          id?: string
          managed_senior_id: string
          name: string
          notify_via_email?: boolean
          notify_via_sms?: boolean
          phone?: string | null
          relationship?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          delay_minutes?: number
          email?: string | null
          id?: string
          managed_senior_id?: string
          name?: string
          notify_via_email?: boolean
          notify_via_sms?: boolean
          phone?: string | null
          relationship?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "managed_senior_contacts_managed_senior_id_fkey"
            columns: ["managed_senior_id"]
            isOneToOne: false
            referencedRelation: "managed_seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      managed_seniors: {
        Row: {
          caregiver_id: string
          claimed_by: string | null
          created_at: string
          custom_days: string[] | null
          date_of_birth: string | null
          escalation_911_enabled: boolean
          escalation_delay_minutes: number
          escalation_loop_enabled: boolean
          first_name: string
          frequency: string
          grace_period_minutes: number
          id: string
          last_name: string
          mood_check_enabled: boolean
          notes: string | null
          phone: string | null
          quiet_hours_enabled: boolean
          quiet_hours_from: string
          quiet_hours_until: string
          relationship: string | null
          reminder_hour: string
          reminder_minute: string
          reminder_period: string
          timezone: string
          updated_at: string
          vacation_from: string | null
          vacation_mode: boolean
          vacation_until: string | null
        }
        Insert: {
          caregiver_id: string
          claimed_by?: string | null
          created_at?: string
          custom_days?: string[] | null
          date_of_birth?: string | null
          escalation_911_enabled?: boolean
          escalation_delay_minutes?: number
          escalation_loop_enabled?: boolean
          first_name: string
          frequency?: string
          grace_period_minutes?: number
          id?: string
          last_name: string
          mood_check_enabled?: boolean
          notes?: string | null
          phone?: string | null
          quiet_hours_enabled?: boolean
          quiet_hours_from?: string
          quiet_hours_until?: string
          relationship?: string | null
          reminder_hour?: string
          reminder_minute?: string
          reminder_period?: string
          timezone?: string
          updated_at?: string
          vacation_from?: string | null
          vacation_mode?: boolean
          vacation_until?: string | null
        }
        Update: {
          caregiver_id?: string
          claimed_by?: string | null
          created_at?: string
          custom_days?: string[] | null
          date_of_birth?: string | null
          escalation_911_enabled?: boolean
          escalation_delay_minutes?: number
          escalation_loop_enabled?: boolean
          first_name?: string
          frequency?: string
          grace_period_minutes?: number
          id?: string
          last_name?: string
          mood_check_enabled?: boolean
          notes?: string | null
          phone?: string | null
          quiet_hours_enabled?: boolean
          quiet_hours_from?: string
          quiet_hours_until?: string
          relationship?: string | null
          reminder_hour?: string
          reminder_minute?: string
          reminder_period?: string
          timezone?: string
          updated_at?: string
          vacation_from?: string | null
          vacation_mode?: boolean
          vacation_until?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          caregiver_id: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
        }
        Insert: {
          auth: string
          caregiver_id: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
        }
        Update: {
          auth?: string
          caregiver_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          created_at: string
          grace_period_hours: number
          id: string
          notifications_enabled: boolean
          reminder_time: string
          senior_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grace_period_hours?: number
          id?: string
          notifications_enabled?: boolean
          reminder_time?: string
          senior_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grace_period_hours?: number
          id?: string
          notifications_enabled?: boolean
          reminder_time?: string
          senior_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      senior_connections: {
        Row: {
          caregiver_id: string
          created_at: string
          id: string
          senior_id: string
          status: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string
          id?: string
          senior_id: string
          status?: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string
          id?: string
          senior_id?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_messages: {
        Row: {
          audio_path: string
          created_at: string
          duration_seconds: number | null
          id: string
          senior_id: string
        }
        Insert: {
          audio_path: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          senior_id: string
        }
        Update: {
          audio_path?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          senior_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      connect_via_invite_code: {
        Args: { p_caregiver_id: string; p_code: string }
        Returns: Json
      }
      generate_invite_code: { Args: { p_senior_id: string }; Returns: string }
      get_missed_checkin_seniors: {
        Args: never
        Returns: {
          full_name: string
          senior_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "senior" | "caregiver"
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
      app_role: ["senior", "caregiver"],
    },
  },
} as const
