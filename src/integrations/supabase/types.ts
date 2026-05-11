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
      alerts: {
        Row: {
          acknowledged_at: string | null
          alerted_at: string | null
          caregiver_id: string | null
          check_in_id: string
          contact_name: string | null
          contact_phone: string | null
          contact_type: string
          grace_period_minutes: number | null
          id: string
          priority: number | null
          senior_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alerted_at?: string | null
          caregiver_id?: string | null
          check_in_id: string
          contact_name?: string | null
          contact_phone?: string | null
          contact_type: string
          grace_period_minutes?: number | null
          id?: string
          priority?: number | null
          senior_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alerted_at?: string | null
          caregiver_id?: string | null
          check_in_id?: string
          contact_name?: string | null
          contact_phone?: string | null
          contact_type?: string
          grace_period_minutes?: number | null
          id?: string
          priority?: number | null
          senior_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_check_in_id_fkey"
            columns: ["check_in_id"]
            isOneToOne: false
            referencedRelation: "check_ins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_test: boolean | null
          mid_grace_reminded_at: string | null
          mood: string | null
          reply_text: string | null
          responded_at: string | null
          senior_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          is_test?: boolean | null
          mid_grace_reminded_at?: string | null
          mood?: string | null
          reply_text?: string | null
          responded_at?: string | null
          senior_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_test?: boolean | null
          mid_grace_reminded_at?: string | null
          mood?: string | null
          reply_text?: string | null
          responded_at?: string | null
          senior_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string | null
          delay_minutes: number
          email: string | null
          grace_period_minutes: number
          id: string
          name: string
          notified_at: string | null
          notify_via_email: boolean
          notify_via_sms: boolean
          opted_out: boolean | null
          opted_out_at: string | null
          phone: string
          priority: number
          relationship: string | null
          senior_id: string
          sort_order: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delay_minutes?: number
          email?: string | null
          grace_period_minutes?: number
          id?: string
          name: string
          notified_at?: string | null
          notify_via_email?: boolean
          notify_via_sms?: boolean
          opted_out?: boolean | null
          opted_out_at?: string | null
          phone: string
          priority: number
          relationship?: string | null
          senior_id: string
          sort_order?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delay_minutes?: number
          email?: string | null
          grace_period_minutes?: number
          id?: string
          name?: string
          notified_at?: string | null
          notify_via_email?: boolean
          notify_via_sms?: boolean
          opted_out?: boolean | null
          opted_out_at?: string | null
          phone?: string
          priority?: number
          relationship?: string | null
          senior_id?: string
          sort_order?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          caregiver_id: string
          created_at: string | null
          id: string
          senior_id: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string | null
          id?: string
          senior_id: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string | null
          id?: string
          senior_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          senior_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          senior_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          senior_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_data: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seniors: {
        Row: {
          avatar_url: string | null
          check_in_time: string
          created_at: string | null
          grace_period_minutes: number
          id: string
          inactivity_warned_at: string | null
          name: string
          name_changed_at: string | null
          order_number: string | null
          paused: boolean | null
          phone: string
          previous_name: string | null
          profile_id: string | null
          registration_code: string | null
          relationship: string | null
          sms_consent_confirmed_at: string | null
          sms_consent_requested_at: string | null
          sms_consent_status: string
          status: string | null
          timezone: string
        }
        Insert: {
          avatar_url?: string | null
          check_in_time?: string
          created_at?: string | null
          grace_period_minutes?: number
          id?: string
          inactivity_warned_at?: string | null
          name: string
          name_changed_at?: string | null
          order_number?: string | null
          paused?: boolean | null
          phone: string
          previous_name?: string | null
          profile_id?: string | null
          registration_code?: string | null
          relationship?: string | null
          sms_consent_confirmed_at?: string | null
          sms_consent_requested_at?: string | null
          sms_consent_status?: string
          status?: string | null
          timezone?: string
        }
        Update: {
          avatar_url?: string | null
          check_in_time?: string
          created_at?: string | null
          grace_period_minutes?: number
          id?: string
          inactivity_warned_at?: string | null
          name?: string
          name_changed_at?: string | null
          order_number?: string | null
          paused?: boolean | null
          phone?: string
          previous_name?: string | null
          profile_id?: string | null
          registration_code?: string | null
          relationship?: string | null
          sms_consent_confirmed_at?: string | null
          sms_consent_requested_at?: string | null
          sms_consent_status?: string
          status?: string | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "seniors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      udemy_chunks: {
        Row: {
          chunk_index: number | null
          chunk_text: string
          created_at: string | null
          embedding: string | null
          id: string
          job_id: string | null
          lecture_id: string | null
          metadata: Json | null
        }
        Insert: {
          chunk_index?: number | null
          chunk_text: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          job_id?: string | null
          lecture_id?: string | null
          metadata?: Json | null
        }
        Update: {
          chunk_index?: number | null
          chunk_text?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          job_id?: string | null
          lecture_id?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "udemy_chunks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "udemy_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      udemy_jobs: {
        Row: {
          course_slug: string | null
          created_at: string | null
          error_msg: string | null
          id: string
          lecture_id: string | null
          processed_at: string | null
          source_url: string
          status: string | null
          title: string | null
          udemy_course_id: number | null
          url_type: string
        }
        Insert: {
          course_slug?: string | null
          created_at?: string | null
          error_msg?: string | null
          id?: string
          lecture_id?: string | null
          processed_at?: string | null
          source_url: string
          status?: string | null
          title?: string | null
          udemy_course_id?: number | null
          url_type: string
        }
        Update: {
          course_slug?: string | null
          created_at?: string | null
          error_msg?: string | null
          id?: string
          lecture_id?: string | null
          processed_at?: string | null
          source_url?: string
          status?: string | null
          title?: string | null
          udemy_course_id?: number | null
          url_type?: string
        }
        Relationships: []
      }
      udemy_knowledge: {
        Row: {
          content: string
          created_at: string | null
          geo_rewritten: string | null
          geo_score: number | null
          id: string
          job_id: string | null
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          geo_rewritten?: string | null
          geo_score?: number | null
          id?: string
          job_id?: string | null
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          geo_rewritten?: string | null
          geo_score?: number | null
          id?: string
          job_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "udemy_knowledge_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "udemy_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      udemy_playbooks: {
        Row: {
          generated_at: string | null
          google_doc_url: string | null
          id: string
          job_id: string | null
          llms_txt: string | null
          playbook_json: Json | null
        }
        Insert: {
          generated_at?: string | null
          google_doc_url?: string | null
          id?: string
          job_id?: string | null
          llms_txt?: string | null
          playbook_json?: Json | null
        }
        Update: {
          generated_at?: string | null
          google_doc_url?: string | null
          id?: string
          job_id?: string | null
          llms_txt?: string | null
          playbook_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "udemy_playbooks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "udemy_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      va_trainer_ai_agent: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
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
      ensure_senior_record: { Args: never; Returns: undefined }
      generate_invite_code: { Args: { p_senior_id: string }; Returns: string }
      match_documents: {
        Args: { filter?: Json; match_count: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_udemy_chunks: {
        Args: {
          filter_job_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_text: string
          id: string
          job_id: string
          similarity: number
        }[]
      }
      match_va_trainer_ai_agent:
        | {
            Args: { match_count?: number; query_embedding: string }
            Returns: {
              content: string
              id: string
              similarity: number
            }[]
          }
        | {
            Args: {
              filter?: Json
              match_count?: number
              query_embedding: string
            }
            Returns: {
              content: string
              id: string
              metadata: Json
              similarity: number
            }[]
          }
        | {
            Args: {
              match_count: number
              match_threshold: number
              query_embedding: string
            }
            Returns: {
              content: string
              id: number
              metadata: Json
              similarity: number
            }[]
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
