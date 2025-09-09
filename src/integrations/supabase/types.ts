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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      customer_quotes: {
        Row: {
          base_price: number
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          deposit_amount: number
          discount_amount: number | null
          final_price: number
          id: string
          loan_amount: number
          monthly_payment: number
          motor_model_id: string | null
          penalty_applied: boolean
          penalty_factor: number | null
          penalty_reason: string | null
          promotion_id: string | null
          term_months: number
          total_cost: number
          tradein_value_final: number | null
          tradein_value_pre_penalty: number | null
          user_id: string
        }
        Insert: {
          base_price: number
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          deposit_amount: number
          discount_amount?: number | null
          final_price: number
          id?: string
          loan_amount: number
          monthly_payment: number
          motor_model_id?: string | null
          penalty_applied?: boolean
          penalty_factor?: number | null
          penalty_reason?: string | null
          promotion_id?: string | null
          term_months: number
          total_cost: number
          tradein_value_final?: number | null
          tradein_value_pre_penalty?: number | null
          user_id: string
        }
        Update: {
          base_price?: number
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          deposit_amount?: number
          discount_amount?: number | null
          final_price?: number
          id?: string
          loan_amount?: number
          monthly_payment?: number
          motor_model_id?: string | null
          penalty_applied?: boolean
          penalty_factor?: number | null
          penalty_reason?: string | null
          promotion_id?: string | null
          term_months?: number
          total_cost?: number
          tradein_value_final?: number | null
          tradein_value_pre_penalty?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_quotes_motor_model_id_fkey"
            columns: ["motor_model_id"]
            isOneToOne: false
            referencedRelation: "motor_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_quotes_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_xp: {
        Row: {
          created_at: string
          id: string
          rewards_claimed: Json
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rewards_claimed?: Json
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rewards_claimed?: Json
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_settings: {
        Row: {
          created_at: string | null
          deposit_percentage: number
          id: string
          interest_rate: number
          max_term_months: number
        }
        Insert: {
          created_at?: string | null
          deposit_percentage?: number
          id?: string
          interest_rate?: number
          max_term_months?: number
        }
        Update: {
          created_at?: string | null
          deposit_percentage?: number
          id?: string
          interest_rate?: number
          max_term_months?: number
        }
        Relationships: []
      }
      financing_options: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_alt_text: string | null
          image_url: string | null
          is_active: boolean
          is_promo: boolean
          min_amount: number
          name: string
          promo_end_date: string | null
          promo_text: string | null
          rate: number
          term_months: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          is_active?: boolean
          is_promo?: boolean
          min_amount?: number
          name: string
          promo_end_date?: string | null
          promo_text?: string | null
          rate: number
          term_months: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          is_active?: boolean
          is_promo?: boolean
          min_amount?: number
          name?: string
          promo_end_date?: string | null
          promo_text?: string | null
          rate?: number
          term_months?: number
          updated_at?: string
        }
        Relationships: []
      }
      heartbeat: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      inventory_updates: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          is_scheduled: boolean | null
          motors_updated: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          is_scheduled?: boolean | null
          motors_updated?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          is_scheduled?: boolean | null
          motors_updated?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      motor_models: {
        Row: {
          availability: string | null
          base_price: number
          created_at: string | null
          description: string | null
          detail_url: string | null
          engine_type: string | null
          features: Json | null
          horsepower: number
          id: string
          image_url: string | null
          last_scraped: string | null
          make: string
          model: string
          motor_type: string
          sale_price: number | null
          specifications: Json | null
          stock_number: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          availability?: string | null
          base_price: number
          created_at?: string | null
          description?: string | null
          detail_url?: string | null
          engine_type?: string | null
          features?: Json | null
          horsepower: number
          id?: string
          image_url?: string | null
          last_scraped?: string | null
          make?: string
          model: string
          motor_type: string
          sale_price?: number | null
          specifications?: Json | null
          stock_number?: string | null
          updated_at?: string | null
          year?: number
        }
        Update: {
          availability?: string | null
          base_price?: number
          created_at?: string | null
          description?: string | null
          detail_url?: string | null
          engine_type?: string | null
          features?: Json | null
          horsepower?: number
          id?: string
          image_url?: string | null
          last_scraped?: string | null
          make?: string
          model?: string
          motor_type?: string
          sale_price?: number | null
          specifications?: Json | null
          stock_number?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          notification_in_app_enabled: boolean | null
          notification_sms_enabled: boolean | null
          phone: string | null
          preferred_channel: string | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          notification_in_app_enabled?: boolean | null
          notification_sms_enabled?: boolean | null
          phone?: string | null
          preferred_channel?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          notification_in_app_enabled?: boolean | null
          notification_sms_enabled?: boolean | null
          phone?: string | null
          preferred_channel?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          bonus_description: string | null
          bonus_short_badge: string | null
          bonus_title: string | null
          created_at: string | null
          details: Json
          discount_fixed_amount: number
          discount_percentage: number
          end_date: string | null
          highlight: boolean
          id: string
          image_alt_text: string | null
          image_url: string | null
          is_active: boolean
          kind: string
          name: string
          priority: number
          stackable: boolean
          start_date: string | null
          terms_url: string | null
          warranty_extra_years: number | null
        }
        Insert: {
          bonus_description?: string | null
          bonus_short_badge?: string | null
          bonus_title?: string | null
          created_at?: string | null
          details?: Json
          discount_fixed_amount?: number
          discount_percentage?: number
          end_date?: string | null
          highlight?: boolean
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          is_active?: boolean
          kind?: string
          name: string
          priority?: number
          stackable?: boolean
          start_date?: string | null
          terms_url?: string | null
          warranty_extra_years?: number | null
        }
        Update: {
          bonus_description?: string | null
          bonus_short_badge?: string | null
          bonus_title?: string | null
          created_at?: string | null
          details?: Json
          discount_fixed_amount?: number
          discount_percentage?: number
          end_date?: string | null
          highlight?: boolean
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          is_active?: boolean
          kind?: string
          name?: string
          priority?: number
          stackable?: boolean
          start_date?: string | null
          terms_url?: string | null
          warranty_extra_years?: number | null
        }
        Relationships: []
      }
      promotions_rules: {
        Row: {
          created_at: string
          discount_fixed_amount: number
          discount_percentage: number
          horsepower_max: number | null
          horsepower_min: number | null
          id: string
          model: string | null
          motor_type: string | null
          promotion_id: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_fixed_amount?: number
          discount_percentage?: number
          horsepower_max?: number | null
          horsepower_min?: number | null
          id?: string
          model?: string | null
          motor_type?: string | null
          promotion_id: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_fixed_amount?: number
          discount_percentage?: number
          horsepower_max?: number | null
          horsepower_min?: number | null
          id?: string
          model?: string | null
          motor_type?: string | null
          promotion_id?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_rules_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          motor_model: string | null
          motor_price: number | null
          pdf_url: string | null
          quote_data: Json | null
          reward_claimed: string | null
          total_price: number | null
          user_id: string | null
          xp_earned: number
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          motor_model?: string | null
          motor_price?: number | null
          pdf_url?: string | null
          quote_data?: Json | null
          reward_claimed?: string | null
          total_price?: number | null
          user_id?: string | null
          xp_earned?: number
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          motor_model?: string | null
          motor_price?: number | null
          pdf_url?: string | null
          quote_data?: Json | null
          reward_claimed?: string | null
          total_price?: number | null
          user_id?: string | null
          xp_earned?: number
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          message: string
          notification_id: string | null
          status: string | null
          to_phone: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          message: string
          notification_id?: string | null
          status?: string | null
          to_phone: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          message?: string
          notification_id?: string | null
          status?: string | null
          to_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      warranty_pricing: {
        Row: {
          created_at: string
          hp_max: number
          hp_min: number
          id: string
          updated_at: string
          year_1_price: number
          year_2_price: number
          year_3_price: number
          year_4_price: number
          year_5_price: number
        }
        Insert: {
          created_at?: string
          hp_max: number
          hp_min: number
          id?: string
          updated_at?: string
          year_1_price: number
          year_2_price: number
          year_3_price: number
          year_4_price: number
          year_5_price: number
        }
        Update: {
          created_at?: string
          hp_max?: number
          hp_min?: number
          id?: string
          updated_at?: string
          year_1_price?: number
          year_2_price?: number
          year_3_price?: number
          year_4_price?: number
          year_5_price?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      audit_orphaned_customer_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          record_count: number
          table_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_user_data_access: {
        Args: { _record_id: string; _table_name: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
