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
      admin_sources: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      agent_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          motor_hp: number | null
          motor_id: string | null
          motor_model: string | null
          page_path: string | null
          quote_value: number | null
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          motor_hp?: number | null
          motor_id?: string | null
          motor_model?: string | null
          page_path?: string | null
          quote_value?: number | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          motor_hp?: number | null
          motor_id?: string | null
          motor_model?: string | null
          page_path?: string | null
          quote_value?: number | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          subscribed_at: string
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_at?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_at?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          channel: string
          context: Json | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          is_active: boolean
          last_message_at: string
          session_id: string | null
          source_site: string
          updated_at: string
          user_id: string | null
          voice_summary: string | null
        }
        Insert: {
          channel?: string
          context?: Json | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_active?: boolean
          last_message_at?: string
          session_id?: string | null
          source_site?: string
          updated_at?: string
          user_id?: string | null
          voice_summary?: string | null
        }
        Update: {
          channel?: string
          context?: Json | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_active?: boolean
          last_message_at?: string
          session_id?: string | null
          source_site?: string
          updated_at?: string
          user_id?: string | null
          voice_summary?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          reaction: string | null
          reaction_at: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reaction?: string | null
          reaction_at?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reaction?: string | null
          reaction_at?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          inquiry_type: string
          message: string
          name: string
          phone: string | null
          preferred_contact_method: string
          responded_at: string | null
          status: string
          updated_at: string
          urgency_level: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          inquiry_type?: string
          message: string
          name: string
          phone?: string | null
          preferred_contact_method?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
          urgency_level?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: string
          message?: string
          name?: string
          phone?: string | null
          preferred_contact_method?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
          urgency_level?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cron_job_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_name: string
          motors_found: number | null
          motors_updated: number | null
          result: Json | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_name: string
          motors_found?: number | null
          motors_updated?: number | null
          result?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_name?: string
          motors_found?: number | null
          motors_updated?: number | null
          result?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      customer_memory: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          category: string
          confidence: string
          created_at: string | null
          created_by: string | null
          customer_id: string
          customer_name: string | null
          id: string
          last_used_at: string | null
          notes: string
          raw_note: string
          search_vector: unknown
          sensitivity: string
          source: string
          source_channel: string | null
          summary: string
          updated_at: string | null
          use_in_customer_messages: boolean
          use_in_staff_brief: boolean
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          category?: string
          confidence?: string
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          customer_name?: string | null
          id?: string
          last_used_at?: string | null
          notes?: string
          raw_note: string
          search_vector?: unknown
          sensitivity?: string
          source?: string
          source_channel?: string | null
          summary: string
          updated_at?: string | null
          use_in_customer_messages?: boolean
          use_in_staff_brief?: boolean
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          category?: string
          confidence?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          customer_name?: string | null
          id?: string
          last_used_at?: string | null
          notes?: string
          raw_note?: string
          search_vector?: unknown
          sensitivity?: string
          source?: string
          source_channel?: string | null
          summary?: string
          updated_at?: string | null
          use_in_customer_messages?: boolean
          use_in_staff_brief?: boolean
        }
        Relationships: []
      }
      customer_quotes: {
        Row: {
          admin_discount: number | null
          admin_notes: string | null
          anonymous_session_id: string | null
          base_price: number
          contact_attempts: number | null
          created_at: string | null
          created_by_admin: string | null
          customer_email: string
          customer_name: string
          customer_notes: string | null
          customer_phone: string | null
          deposit_amount: number
          discount_amount: number | null
          final_price: number
          follow_up_date: string | null
          id: string
          is_admin_quote: boolean | null
          last_contact_attempt: string | null
          last_modified_at: string | null
          last_modified_by: string | null
          lead_score: number | null
          lead_source: string | null
          lead_status: string | null
          loan_amount: number
          monthly_payment: number
          motor_model_id: string | null
          notes: string | null
          penalty_applied: boolean
          penalty_factor: number | null
          penalty_reason: string | null
          promotion_id: string | null
          quote_data: Json | null
          share_token: string | null
          term_months: number
          total_cost: number
          tradein_value_final: number | null
          tradein_value_pre_penalty: number | null
          user_id: string | null
        }
        Insert: {
          admin_discount?: number | null
          admin_notes?: string | null
          anonymous_session_id?: string | null
          base_price: number
          contact_attempts?: number | null
          created_at?: string | null
          created_by_admin?: string | null
          customer_email: string
          customer_name: string
          customer_notes?: string | null
          customer_phone?: string | null
          deposit_amount: number
          discount_amount?: number | null
          final_price: number
          follow_up_date?: string | null
          id?: string
          is_admin_quote?: boolean | null
          last_contact_attempt?: string | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          loan_amount: number
          monthly_payment: number
          motor_model_id?: string | null
          notes?: string | null
          penalty_applied?: boolean
          penalty_factor?: number | null
          penalty_reason?: string | null
          promotion_id?: string | null
          quote_data?: Json | null
          share_token?: string | null
          term_months: number
          total_cost: number
          tradein_value_final?: number | null
          tradein_value_pre_penalty?: number | null
          user_id?: string | null
        }
        Update: {
          admin_discount?: number | null
          admin_notes?: string | null
          anonymous_session_id?: string | null
          base_price?: number
          contact_attempts?: number | null
          created_at?: string | null
          created_by_admin?: string | null
          customer_email?: string
          customer_name?: string
          customer_notes?: string | null
          customer_phone?: string | null
          deposit_amount?: number
          discount_amount?: number | null
          final_price?: number
          follow_up_date?: string | null
          id?: string
          is_admin_quote?: boolean | null
          last_contact_attempt?: string | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          loan_amount?: number
          monthly_payment?: number
          motor_model_id?: string | null
          notes?: string | null
          penalty_applied?: boolean
          penalty_factor?: number | null
          penalty_reason?: string | null
          promotion_id?: string | null
          quote_data?: Json | null
          share_token?: string | null
          term_months?: number
          total_cost?: number
          tradein_value_final?: number | null
          tradein_value_pre_penalty?: number | null
          user_id?: string | null
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
      data_retention_policies: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          last_cleanup_at: string | null
          retention_days: number
          table_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_cleanup_at?: string | null
          retention_days: number
          table_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_cleanup_at?: string | null
          retention_days?: number
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      dropbox_sync_config: {
        Row: {
          auto_categorize: boolean | null
          created_at: string
          error_message: string | null
          files_synced: number | null
          folder_path: string
          id: string
          last_sync_at: string | null
          motor_assignment_rule: string | null
          sync_enabled: boolean | null
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          auto_categorize?: boolean | null
          created_at?: string
          error_message?: string | null
          files_synced?: number | null
          folder_path: string
          id?: string
          last_sync_at?: string | null
          motor_assignment_rule?: string | null
          sync_enabled?: boolean | null
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          auto_categorize?: boolean | null
          created_at?: string
          error_message?: string | null
          files_synced?: number | null
          folder_path?: string
          id?: string
          last_sync_at?: string | null
          motor_assignment_rule?: string | null
          sync_enabled?: boolean | null
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      elevenlabs_sync_state: {
        Row: {
          agent_id: string
          created_at: string | null
          document_id: string | null
          document_name: string | null
          error_message: string | null
          id: string
          in_stock_count: number | null
          last_synced_at: string | null
          motor_count: number | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          document_id?: string | null
          document_name?: string | null
          error_message?: string | null
          id?: string
          in_stock_count?: number | null
          last_synced_at?: string | null
          motor_count?: number | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          document_id?: string | null
          document_name?: string | null
          error_message?: string | null
          id?: string
          in_stock_count?: number | null
          last_synced_at?: string | null
          motor_count?: number | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_sequence_queue: {
        Row: {
          created_at: string
          current_step: number
          customer_name: string | null
          email: string
          email_clicks: number | null
          email_opens: number | null
          emails_sent: number
          id: string
          last_clicked_at: string | null
          last_opened_at: string | null
          last_sent_at: string | null
          lead_id: string | null
          metadata: Json | null
          next_send_at: string | null
          sequence_type: string
          status: string
          tracking_events: Json | null
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          customer_name?: string | null
          email: string
          email_clicks?: number | null
          email_opens?: number | null
          emails_sent?: number
          id?: string
          last_clicked_at?: string | null
          last_opened_at?: string | null
          last_sent_at?: string | null
          lead_id?: string | null
          metadata?: Json | null
          next_send_at?: string | null
          sequence_type?: string
          status?: string
          tracking_events?: Json | null
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_step?: number
          customer_name?: string | null
          email?: string
          email_clicks?: number | null
          email_opens?: number | null
          emails_sent?: number
          id?: string
          last_clicked_at?: string | null
          last_opened_at?: string | null
          last_sent_at?: string | null
          lead_id?: string | null
          metadata?: Json | null
          next_send_at?: string | null
          sequence_type?: string
          status?: string
          tracking_events?: Json | null
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "customer_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          type?: string
          updated_at?: string
          variables?: Json | null
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
      financing_application_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financing_application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "financing_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_applications: {
        Row: {
          applicant_data: Json
          applicant_sin_encrypted: string | null
          co_applicant_data: Json | null
          co_applicant_sin_encrypted: string | null
          completed_steps: number[]
          created_at: string
          current_step: number
          deleted_at: string | null
          employment_data: Json
          financial_data: Json
          id: string
          lead_source: string | null
          notes: string | null
          notes_history: Json | null
          processed_at: string | null
          processed_by: string | null
          purchase_data: Json
          quote_id: string | null
          references_data: Json
          resume_expires_at: string | null
          resume_token: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["financing_application_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          applicant_data?: Json
          applicant_sin_encrypted?: string | null
          co_applicant_data?: Json | null
          co_applicant_sin_encrypted?: string | null
          completed_steps?: number[]
          created_at?: string
          current_step?: number
          deleted_at?: string | null
          employment_data?: Json
          financial_data?: Json
          id?: string
          lead_source?: string | null
          notes?: string | null
          notes_history?: Json | null
          processed_at?: string | null
          processed_by?: string | null
          purchase_data?: Json
          quote_id?: string | null
          references_data?: Json
          resume_expires_at?: string | null
          resume_token?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["financing_application_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          applicant_data?: Json
          applicant_sin_encrypted?: string | null
          co_applicant_data?: Json | null
          co_applicant_sin_encrypted?: string | null
          completed_steps?: number[]
          created_at?: string
          current_step?: number
          deleted_at?: string | null
          employment_data?: Json
          financial_data?: Json
          id?: string
          lead_source?: string | null
          notes?: string | null
          notes_history?: Json | null
          processed_at?: string | null
          processed_by?: string | null
          purchase_data?: Json
          quote_id?: string | null
          references_data?: Json
          resume_expires_at?: string | null
          resume_token?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["financing_application_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financing_applications_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "customer_quotes"
            referencedColumns: ["id"]
          },
        ]
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
      google_places_cache: {
        Row: {
          cached_at: string
          created_at: string
          data: Json
          expires_at: string
          hit_count: number | null
          id: string
          place_query: string
        }
        Insert: {
          cached_at?: string
          created_at?: string
          data: Json
          expires_at?: string
          hit_count?: number | null
          id?: string
          place_query: string
        }
        Update: {
          cached_at?: string
          created_at?: string
          data?: Json
          expires_at?: string
          hit_count?: number | null
          id?: string
          place_query?: string
        }
        Relationships: []
      }
      google_sheets_config: {
        Row: {
          auto_sync_enabled: boolean
          created_at: string
          id: string
          last_sync: string | null
          sheet_gid: string | null
          sheet_url: string
          sync_frequency: string
          updated_at: string
        }
        Insert: {
          auto_sync_enabled?: boolean
          created_at?: string
          id?: string
          last_sync?: string | null
          sheet_gid?: string | null
          sheet_url: string
          sync_frequency?: string
          updated_at?: string
        }
        Update: {
          auto_sync_enabled?: boolean
          created_at?: string
          id?: string
          last_sync?: string | null
          sheet_gid?: string | null
          sheet_url?: string
          sync_frequency?: string
          updated_at?: string
        }
        Relationships: []
      }
      hbw_bot_brief_receipts: {
        Row: {
          brief_type: string
          channel_id: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json
          row_counts: Json
          slack_ts: string | null
          status: string
          text_length: number | null
        }
        Insert: {
          brief_type?: string
          channel_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          row_counts?: Json
          slack_ts?: string | null
          status?: string
          text_length?: number | null
        }
        Update: {
          brief_type?: string
          channel_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          row_counts?: Json
          slack_ts?: string | null
          status?: string
          text_length?: number | null
        }
        Relationships: []
      }
      hbw_bot_events: {
        Row: {
          channel_id: string | null
          command: string | null
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          intent_type: string | null
          message_ts: string | null
          metadata: Json
          rpc: string | null
          severity: string
          slack_event_id: string | null
          status: string
        }
        Insert: {
          channel_id?: string | null
          command?: string | null
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          intent_type?: string | null
          message_ts?: string | null
          metadata?: Json
          rpc?: string | null
          severity?: string
          slack_event_id?: string | null
          status?: string
        }
        Update: {
          channel_id?: string | null
          command?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          intent_type?: string | null
          message_ts?: string | null
          metadata?: Json
          rpc?: string | null
          severity?: string
          slack_event_id?: string | null
          status?: string
        }
        Relationships: []
      }
      hbw_knowledge: {
        Row: {
          active: boolean | null
          category: string
          content: string
          created_at: string | null
          id: string
          search_vector: unknown
          source: string | null
          tags: string[] | null
          topic: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          content: string
          created_at?: string | null
          id?: string
          search_vector?: unknown
          source?: string | null
          tags?: string[] | null
          topic: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          search_vector?: unknown
          source?: string | null
          tags?: string[] | null
          topic?: string
          updated_at?: string | null
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
          data_source_errors: Json | null
          error_message: string | null
          id: string
          is_scheduled: boolean | null
          motors_updated: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          data_source_errors?: Json | null
          error_message?: string | null
          id?: string
          is_scheduled?: boolean | null
          motors_updated?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          data_source_errors?: Json | null
          error_message?: string | null
          id?: string
          is_scheduled?: boolean | null
          motors_updated?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      kb_suggestions: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          kb_entry_id: string | null
          reasoning: string | null
          reviewed_at: string | null
          source: string
          status: string
          suggestion_type: string
          topic: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          kb_entry_id?: string | null
          reasoning?: string | null
          reviewed_at?: string | null
          source?: string
          status?: string
          suggestion_type: string
          topic: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          kb_entry_id?: string | null
          reasoning?: string | null
          reviewed_at?: string | null
          source?: string
          status?: string
          suggestion_type?: string
          topic?: string
        }
        Relationships: []
      }
      mercury_parts_cache: {
        Row: {
          cad_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          last_updated: string
          lookup_count: number | null
          name: string | null
          part_number: string
          source_url: string | null
        }
        Insert: {
          cad_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          last_updated?: string
          lookup_count?: number | null
          name?: string | null
          part_number: string
          source_url?: string | null
        }
        Update: {
          cad_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          last_updated?: string
          lookup_count?: number | null
          name?: string | null
          part_number?: string
          source_url?: string | null
        }
        Relationships: []
      }
      motor_custom_sources: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          last_scraped: string | null
          motor_id: string
          priority: number
          scrape_config: Json | null
          source_name: string
          source_type: string
          source_url: string
          success_rate: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_scraped?: string | null
          motor_id: string
          priority?: number
          scrape_config?: Json | null
          source_name: string
          source_type: string
          source_url: string
          success_rate?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_scraped?: string | null
          motor_id?: string
          priority?: number
          scrape_config?: Json | null
          source_name?: string
          source_type?: string
          source_url?: string
          success_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      motor_data_sources: {
        Row: {
          base_url: string
          created_at: string
          id: string
          is_active: boolean
          last_scraped: string | null
          name: string
          priority: number
          scrape_config: Json | null
          success_rate: number | null
          updated_at: string
        }
        Insert: {
          base_url: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped?: string | null
          name: string
          priority?: number
          scrape_config?: Json | null
          success_rate?: number | null
          updated_at?: string
        }
        Update: {
          base_url?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped?: string | null
          name?: string
          priority?: number
          scrape_config?: Json | null
          success_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      motor_enrichment_log: {
        Row: {
          action: string
          conflicts: Json | null
          created_at: string
          data_added: Json | null
          error_message: string | null
          id: string
          motor_id: string
          source_name: string
          success: boolean
          user_id: string | null
        }
        Insert: {
          action: string
          conflicts?: Json | null
          created_at?: string
          data_added?: Json | null
          error_message?: string | null
          id?: string
          motor_id: string
          source_name: string
          success?: boolean
          user_id?: string | null
        }
        Update: {
          action?: string
          conflicts?: Json | null
          created_at?: string
          data_added?: Json | null
          error_message?: string | null
          id?: string
          motor_id?: string
          source_name?: string
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      motor_match_mappings: {
        Row: {
          confidence_score: number
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          motor_model_id: string | null
          notes: string | null
          scraped_pattern: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          motor_model_id?: string | null
          notes?: string | null
          scraped_pattern: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          motor_model_id?: string | null
          notes?: string | null
          scraped_pattern?: string
        }
        Relationships: [
          {
            foreignKeyName: "motor_match_mappings_motor_model_id_fkey"
            columns: ["motor_model_id"]
            isOneToOne: false
            referencedRelation: "motor_models"
            referencedColumns: ["id"]
          },
        ]
      }
      motor_media: {
        Row: {
          alt_text: string | null
          assignment_rules: Json | null
          assignment_type: string
          chooser_imported: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          dropbox_path: string | null
          dropbox_sync_status: string | null
          file_size: number | null
          id: string
          is_active: boolean
          media_category: string
          media_type: string
          media_url: string
          metadata: Json | null
          mime_type: string | null
          motor_id: string | null
          original_filename: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          assignment_rules?: Json | null
          assignment_type?: string
          chooser_imported?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          dropbox_path?: string | null
          dropbox_sync_status?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean
          media_category?: string
          media_type: string
          media_url: string
          metadata?: Json | null
          mime_type?: string | null
          motor_id?: string | null
          original_filename?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          assignment_rules?: Json | null
          assignment_type?: string
          chooser_imported?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          dropbox_path?: string | null
          dropbox_sync_status?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean
          media_category?: string
          media_type?: string
          media_url?: string
          metadata?: Json | null
          mime_type?: string | null
          motor_id?: string | null
          original_filename?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "motor_media_motor_id_fkey"
            columns: ["motor_id"]
            isOneToOne: false
            referencedRelation: "motor_models"
            referencedColumns: ["id"]
          },
        ]
      }
      motor_media_assignment_rules: {
        Row: {
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          media_assignments: Json
          priority: number
          rule_name: string
          updated_at: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          media_assignments?: Json
          priority?: number
          rule_name: string
          updated_at?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          media_assignments?: Json
          priority?: number
          rule_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      motor_models: {
        Row: {
          accessories_included: Json | null
          accessory_notes: Json
          availability: string | null
          base_price: number | null
          catalog_snapshot_url: string | null
          catalog_source_url: string | null
          control: string | null
          control_type: string | null
          created_at: string | null
          data_quality_score: number | null
          data_sources: Json | null
          dealer_price: number | null
          dealer_price_live: number | null
          description: string | null
          detail_url: string | null
          display_name: string | null
          engine_type: string | null
          family: string | null
          features: Json | null
          fuel_type: string | null
          has_command_thrust: boolean | null
          has_power_trim: boolean | null
          hero_image_url: string | null
          hero_media_id: string | null
          horsepower: number | null
          id: string
          image_url: string | null
          images: Json | null
          in_stock: boolean | null
          inventory_source: string | null
          is_brochure: boolean | null
          last_enriched: string | null
          last_scraped: string | null
          last_stock_check: string | null
          make: string
          manual_overrides: Json | null
          media_last_updated: string | null
          media_summary: Json | null
          mercury_model_no: string | null
          model: string
          model_code: string | null
          model_display: string | null
          model_key: string | null
          model_number: string | null
          motor_type: string
          msrp: number | null
          msrp_calc_source: string | null
          msrp_source: string | null
          price_source: string | null
          rigging_code: string | null
          sale_price: number | null
          shaft: string | null
          shaft_code: string | null
          shaft_inches: number | null
          source_doc_urls: string[] | null
          source_priority: string[] | null
          spec_json: Json | null
          spec_sheet_file_id: string | null
          specifications: Json | null
          start_type: string | null
          stock_number: string | null
          stock_quantity: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          accessories_included?: Json | null
          accessory_notes?: Json
          availability?: string | null
          base_price?: number | null
          catalog_snapshot_url?: string | null
          catalog_source_url?: string | null
          control?: string | null
          control_type?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          data_sources?: Json | null
          dealer_price?: number | null
          dealer_price_live?: number | null
          description?: string | null
          detail_url?: string | null
          display_name?: string | null
          engine_type?: string | null
          family?: string | null
          features?: Json | null
          fuel_type?: string | null
          has_command_thrust?: boolean | null
          has_power_trim?: boolean | null
          hero_image_url?: string | null
          hero_media_id?: string | null
          horsepower?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          in_stock?: boolean | null
          inventory_source?: string | null
          is_brochure?: boolean | null
          last_enriched?: string | null
          last_scraped?: string | null
          last_stock_check?: string | null
          make?: string
          manual_overrides?: Json | null
          media_last_updated?: string | null
          media_summary?: Json | null
          mercury_model_no?: string | null
          model: string
          model_code?: string | null
          model_display?: string | null
          model_key?: string | null
          model_number?: string | null
          motor_type: string
          msrp?: number | null
          msrp_calc_source?: string | null
          msrp_source?: string | null
          price_source?: string | null
          rigging_code?: string | null
          sale_price?: number | null
          shaft?: string | null
          shaft_code?: string | null
          shaft_inches?: number | null
          source_doc_urls?: string[] | null
          source_priority?: string[] | null
          spec_json?: Json | null
          spec_sheet_file_id?: string | null
          specifications?: Json | null
          start_type?: string | null
          stock_number?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          year?: number
        }
        Update: {
          accessories_included?: Json | null
          accessory_notes?: Json
          availability?: string | null
          base_price?: number | null
          catalog_snapshot_url?: string | null
          catalog_source_url?: string | null
          control?: string | null
          control_type?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          data_sources?: Json | null
          dealer_price?: number | null
          dealer_price_live?: number | null
          description?: string | null
          detail_url?: string | null
          display_name?: string | null
          engine_type?: string | null
          family?: string | null
          features?: Json | null
          fuel_type?: string | null
          has_command_thrust?: boolean | null
          has_power_trim?: boolean | null
          hero_image_url?: string | null
          hero_media_id?: string | null
          horsepower?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          in_stock?: boolean | null
          inventory_source?: string | null
          is_brochure?: boolean | null
          last_enriched?: string | null
          last_scraped?: string | null
          last_stock_check?: string | null
          make?: string
          manual_overrides?: Json | null
          media_last_updated?: string | null
          media_summary?: Json | null
          mercury_model_no?: string | null
          model?: string
          model_code?: string | null
          model_display?: string | null
          model_key?: string | null
          model_number?: string | null
          motor_type?: string
          msrp?: number | null
          msrp_calc_source?: string | null
          msrp_source?: string | null
          price_source?: string | null
          rigging_code?: string | null
          sale_price?: number | null
          shaft?: string | null
          shaft_code?: string | null
          shaft_inches?: number | null
          source_doc_urls?: string[] | null
          source_priority?: string[] | null
          spec_json?: Json | null
          spec_sheet_file_id?: string | null
          specifications?: Json | null
          start_type?: string | null
          stock_number?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "motor_models_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "motor_media"
            referencedColumns: ["id"]
          },
        ]
      }
      motor_option_assignments: {
        Row: {
          assignment_type: string
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_included: boolean | null
          motor_id: string
          notes: string | null
          option_id: string
          price_override: number | null
          updated_at: string | null
        }
        Insert: {
          assignment_type?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_included?: boolean | null
          motor_id: string
          notes?: string | null
          option_id: string
          price_override?: number | null
          updated_at?: string | null
        }
        Update: {
          assignment_type?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_included?: boolean | null
          motor_id?: string
          notes?: string | null
          option_id?: string
          price_override?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "motor_option_assignments_motor_id_fkey"
            columns: ["motor_id"]
            isOneToOne: false
            referencedRelation: "motor_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motor_option_assignments_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "motor_options"
            referencedColumns: ["id"]
          },
        ]
      }
      motor_option_rules: {
        Row: {
          assignment_type: string
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          option_id: string
          price_override: number | null
          priority: number | null
          rule_name: string
          updated_at: string | null
        }
        Insert: {
          assignment_type?: string
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          option_id: string
          price_override?: number | null
          priority?: number | null
          rule_name: string
          updated_at?: string | null
        }
        Update: {
          assignment_type?: string
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          option_id?: string
          price_override?: number | null
          priority?: number | null
          rule_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "motor_option_rules_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "motor_options"
            referencedColumns: ["id"]
          },
        ]
      }
      motor_options: {
        Row: {
          base_price: number
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_taxable: boolean | null
          msrp: number | null
          name: string
          part_number: string | null
          short_description: string | null
          specifications: Json | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_taxable?: boolean | null
          msrp?: number | null
          name: string
          part_number?: string | null
          short_description?: string | null
          specifications?: Json | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_taxable?: boolean | null
          msrp?: number | null
          name?: string
          part_number?: string | null
          short_description?: string | null
          specifications?: Json | null
          updated_at?: string | null
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
      nudge_experiments: {
        Row: {
          accepted_at: string | null
          auto_dismissed_at: string | null
          created_at: string | null
          device_type: string | null
          dismissed_at: string | null
          id: string
          impression_at: string | null
          message_text: string
          page_path: string
          scroll_depth_percent: number | null
          session_id: string
          time_on_page_seconds: number | null
          trigger_type: string
          user_id: string | null
          variant_id: string
        }
        Insert: {
          accepted_at?: string | null
          auto_dismissed_at?: string | null
          created_at?: string | null
          device_type?: string | null
          dismissed_at?: string | null
          id?: string
          impression_at?: string | null
          message_text: string
          page_path: string
          scroll_depth_percent?: number | null
          session_id: string
          time_on_page_seconds?: number | null
          trigger_type: string
          user_id?: string | null
          variant_id: string
        }
        Update: {
          accepted_at?: string | null
          auto_dismissed_at?: string | null
          created_at?: string | null
          device_type?: string | null
          dismissed_at?: string | null
          id?: string
          impression_at?: string | null
          message_text?: string
          page_path?: string
          scroll_depth_percent?: number | null
          session_id?: string
          time_on_page_seconds?: number | null
          trigger_type?: string
          user_id?: string | null
          variant_id?: string
        }
        Relationships: []
      }
      nudge_variant_stats: {
        Row: {
          accepts: number | null
          auto_dismissals: number | null
          confidence_level: number | null
          dismissals: number | null
          graduated_at: string | null
          id: string
          impressions: number | null
          is_winner: boolean | null
          page_path: string
          trigger_type: string
          updated_at: string | null
          variant_id: string
        }
        Insert: {
          accepts?: number | null
          auto_dismissals?: number | null
          confidence_level?: number | null
          dismissals?: number | null
          graduated_at?: string | null
          id?: string
          impressions?: number | null
          is_winner?: boolean | null
          page_path: string
          trigger_type: string
          updated_at?: string | null
          variant_id: string
        }
        Update: {
          accepts?: number | null
          auto_dismissals?: number | null
          confidence_level?: number | null
          dismissals?: number | null
          graduated_at?: string | null
          id?: string
          impressions?: number | null
          is_winner?: boolean | null
          page_path?: string
          trigger_type?: string
          updated_at?: string | null
          variant_id?: string
        }
        Relationships: []
      }
      openclaw_slack_fallback_jobs: {
        Row: {
          attempts: number
          available_at: string
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          max_attempts: number
          payload: Json
          priority: number
          response_text: string | null
          slack_event_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          max_attempts?: number
          payload: Json
          priority?: number
          response_text?: string | null
          slack_event_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          available_at?: string
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          max_attempts?: number
          payload?: Json
          priority?: number
          response_text?: string | null
          slack_event_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      openclaw_worker_heartbeats: {
        Row: {
          last_seen_at: string
          metadata: Json
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          last_seen_at?: string
          metadata?: Json
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          last_seen_at?: string
          metadata?: Json
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          checkout_url: string | null
          created_at: string | null
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_type: string
          status: string
          updated_at: string | null
          zaprite_order_id: string | null
        }
        Insert: {
          amount_cents?: number
          checkout_url?: string | null
          created_at?: string | null
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_type?: string
          status?: string
          updated_at?: string | null
          zaprite_order_id?: string | null
        }
        Update: {
          amount_cents?: number
          checkout_url?: string | null
          created_at?: string | null
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_type?: string
          status?: string
          updated_at?: string | null
          zaprite_order_id?: string | null
        }
        Relationships: []
      }
      pending_motor_matches: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          potential_matches: Json
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          scraped_motor_data: Json
          selected_match_id: string | null
          sync_run_id: string | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          potential_matches?: Json
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scraped_motor_data?: Json
          selected_match_id?: string | null
          sync_run_id?: string | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          potential_matches?: Json
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scraped_motor_data?: Json
          selected_match_id?: string | null
          sync_run_id?: string | null
          updated_at?: string
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
      promo_reminder_subscriptions: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          is_active: boolean | null
          last_notified_promo_id: string | null
          motor_details: Json | null
          motor_model_id: string | null
          notified_at: string | null
          preferred_channel: string
          quote_config: Json | null
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_active?: boolean | null
          last_notified_promo_id?: string | null
          motor_details?: Json | null
          motor_model_id?: string | null
          notified_at?: string | null
          preferred_channel?: string
          quote_config?: Json | null
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_active?: boolean | null
          last_notified_promo_id?: string | null
          motor_details?: Json | null
          motor_model_id?: string | null
          notified_at?: string | null
          preferred_channel?: string
          quote_config?: Json | null
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_reminder_subscriptions_last_notified_promo_id_fkey"
            columns: ["last_notified_promo_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_reminder_subscriptions_motor_model_id_fkey"
            columns: ["motor_model_id"]
            isOneToOne: false
            referencedRelation: "motor_models"
            referencedColumns: ["id"]
          },
        ]
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
          promo_options: Json | null
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
          promo_options?: Json | null
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
          promo_options?: Json | null
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
      quote_activity_events: {
        Row: {
          created_at: string
          device_type: string | null
          event_data: Json | null
          event_type: string
          id: string
          motor_hp: number | null
          motor_model: string | null
          page_path: string | null
          page_title: string | null
          quote_value: number | null
          referrer: string | null
          screen_width: number | null
          session_id: string
          time_on_page_seconds: number | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          motor_hp?: number | null
          motor_model?: string | null
          page_path?: string | null
          page_title?: string | null
          quote_value?: number | null
          referrer?: string | null
          screen_width?: number | null
          session_id: string
          time_on_page_seconds?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          motor_hp?: number | null
          motor_model?: string | null
          page_path?: string | null
          page_title?: string | null
          quote_value?: number | null
          referrer?: string | null
          screen_width?: number | null
          session_id?: string
          time_on_page_seconds?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      quote_change_log: {
        Row: {
          change_type: string
          changed_by: string
          changes: Json
          created_at: string
          id: string
          notes: string | null
          quote_id: string
        }
        Insert: {
          change_type: string
          changed_by: string
          changes?: Json
          created_at?: string
          id?: string
          notes?: string | null
          quote_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string
          changes?: Json
          created_at?: string
          id?: string
          notes?: string | null
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_change_log_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "customer_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_contact_log: {
        Row: {
          contact_type: string
          contacted_by: string | null
          created_at: string
          customer_email: string
          id: string
          notes: string | null
          quote_id: string
        }
        Insert: {
          contact_type?: string
          contacted_by?: string | null
          created_at?: string
          customer_email: string
          id?: string
          notes?: string | null
          quote_id: string
        }
        Update: {
          contact_type?: string
          contacted_by?: string | null
          created_at?: string
          customer_email?: string
          id?: string
          notes?: string | null
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_contact_log_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "customer_quotes"
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
          quote_number: number
          reward_claimed: string | null
          total_price: number | null
          user_id: string
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
          quote_number?: number
          reward_claimed?: string | null
          total_price?: number | null
          user_id: string
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
          quote_number?: number
          reward_claimed?: string | null
          total_price?: number | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      review_monitor_state: {
        Row: {
          gbp_account_name: string | null
          gbp_location_name: string | null
          gbp_oauth_state: string | null
          gbp_refresh_token: string | null
          id: number
          last_review_time: string | null
          updated_at: string | null
        }
        Insert: {
          gbp_account_name?: string | null
          gbp_location_name?: string | null
          gbp_oauth_state?: string | null
          gbp_refresh_token?: string | null
          id?: number
          last_review_time?: string | null
          updated_at?: string | null
        }
        Update: {
          gbp_account_name?: string | null
          gbp_location_name?: string | null
          gbp_oauth_state?: string | null
          gbp_refresh_token?: string | null
          id?: number
          last_review_time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_comparisons: {
        Row: {
          created_at: string | null
          id: string
          motor_ids: string[]
          name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          motor_ids: string[]
          name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          motor_ids?: string[]
          name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_quotes: {
        Row: {
          access_count: number | null
          converted_to_quote_id: string | null
          created_at: string | null
          deposit_amount: number | null
          deposit_paid_at: string | null
          deposit_pdf_path: string | null
          deposit_status: string | null
          email: string
          expires_at: string
          id: string
          is_completed: boolean | null
          is_soft_lead: boolean | null
          last_accessed: string | null
          quote_pdf_path: string | null
          quote_state: Json
          reference_number: string | null
          resume_token: string
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_count?: number | null
          converted_to_quote_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          deposit_pdf_path?: string | null
          deposit_status?: string | null
          email: string
          expires_at?: string
          id?: string
          is_completed?: boolean | null
          is_soft_lead?: boolean | null
          last_accessed?: string | null
          quote_pdf_path?: string | null
          quote_state: Json
          reference_number?: string | null
          resume_token: string
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_count?: number | null
          converted_to_quote_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          deposit_pdf_path?: string | null
          deposit_status?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_completed?: boolean | null
          is_soft_lead?: boolean | null
          last_accessed?: string | null
          quote_pdf_path?: string | null
          quote_state?: Json
          reference_number?: string | null
          resume_token?: string
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_quotes_converted_to_quote_id_fkey"
            columns: ["converted_to_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_docs: {
        Row: {
          content: string
          created_at: string
          notes: string | null
          slug: string
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          notes?: string | null
          slug: string
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          content?: string
          created_at?: string
          notes?: string | null
          slug?: string
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          boat_description: string | null
          created_at: string | null
          customer_id: number | null
          customer_name: string | null
          customer_phone: string
          id: string
          issue_description: string
          notes: string | null
          preferred_date: string | null
          request_type: string
          status: string
        }
        Insert: {
          boat_description?: string | null
          created_at?: string | null
          customer_id?: number | null
          customer_name?: string | null
          customer_phone: string
          id?: string
          issue_description: string
          notes?: string | null
          preferred_date?: string | null
          request_type: string
          status?: string
        }
        Update: {
          boat_description?: string | null
          created_at?: string | null
          customer_id?: number | null
          customer_name?: string | null
          customer_phone?: string
          id?: string
          issue_description?: string
          notes?: string | null
          preferred_date?: string | null
          request_type?: string
          status?: string
        }
        Relationships: []
      }
      share_analytics: {
        Row: {
          article_slug: string
          created_at: string | null
          id: string
          platform: string
          referrer: string | null
          share_location: string
          user_agent: string | null
        }
        Insert: {
          article_slug: string
          created_at?: string | null
          id?: string
          platform: string
          referrer?: string | null
          share_location: string
          user_agent?: string | null
        }
        Update: {
          article_slug?: string
          created_at?: string | null
          id?: string
          platform?: string
          referrer?: string | null
          share_location?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      sin_audit_log: {
        Row: {
          action: string
          application_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          application_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          application_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sms_conversation_archive: {
        Row: {
          archived_at: string | null
          customer_id: number | null
          customer_name: string | null
          from_phone: string
          id: string
          message_count: number | null
          messages: Json
        }
        Insert: {
          archived_at?: string | null
          customer_id?: number | null
          customer_name?: string | null
          from_phone: string
          id?: string
          message_count?: number | null
          messages?: Json
        }
        Update: {
          archived_at?: string | null
          customer_id?: number | null
          customer_name?: string | null
          from_phone?: string
          id?: string
          message_count?: number | null
          messages?: Json
        }
        Relationships: []
      }
      sms_conversations: {
        Row: {
          assigned_staff: string | null
          created_at: string | null
          customer_id: number | null
          customer_name: string | null
          from_phone: string
          id: string
          last_message_at: string | null
          messages: Json | null
          mode: string
        }
        Insert: {
          assigned_staff?: string | null
          created_at?: string | null
          customer_id?: number | null
          customer_name?: string | null
          from_phone: string
          id?: string
          last_message_at?: string | null
          messages?: Json | null
          mode?: string
        }
        Update: {
          assigned_staff?: string | null
          created_at?: string | null
          customer_id?: number | null
          customer_name?: string | null
          from_phone?: string
          id?: string
          last_message_at?: string | null
          messages?: Json | null
          mode?: string
        }
        Relationships: []
      }
      sms_escalations: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string
          id: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          staff_notified_at: string | null
          status: string
          summary: string
          urgency: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone: string
          id?: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          staff_notified_at?: string | null
          status?: string
          summary: string
          urgency?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string
          id?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          staff_notified_at?: string | null
          status?: string
          summary?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_escalations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "sms_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      sms_review_log: {
        Row: {
          created_at: string | null
          escalations: number | null
          id: string
          period_end: string
          period_start: string
          raw_analysis: string | null
          suggestions_generated: number | null
          summary: string | null
          total_conversations: number | null
          total_messages: number | null
          web_searches: number | null
        }
        Insert: {
          created_at?: string | null
          escalations?: number | null
          id?: string
          period_end: string
          period_start: string
          raw_analysis?: string | null
          suggestions_generated?: number | null
          summary?: string | null
          total_conversations?: number | null
          total_messages?: number | null
          web_searches?: number | null
        }
        Update: {
          created_at?: string | null
          escalations?: number | null
          id?: string
          period_end?: string
          period_start?: string
          raw_analysis?: string | null
          suggestions_generated?: number | null
          summary?: string | null
          total_conversations?: number | null
          total_messages?: number | null
          web_searches?: number | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          details: Json | null
          error_message: string | null
          id: string
          motors_in_stock: number | null
          motors_processed: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          motors_in_stock?: number | null
          motors_processed?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          motors_in_stock?: number | null
          motors_processed?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      tiktok_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_valuation_brackets: {
        Row: {
          brand: string
          created_at: string
          excellent: number
          fair: number
          good: number
          horsepower: number
          id: string
          poor: number
          updated_at: string
          year_range: string
        }
        Insert: {
          brand: string
          created_at?: string
          excellent: number
          fair: number
          good: number
          horsepower: number
          id?: string
          poor: number
          updated_at?: string
          year_range: string
        }
        Update: {
          brand?: string
          created_at?: string
          excellent?: number
          fair?: number
          good?: number
          horsepower?: number
          id?: string
          poor?: number
          updated_at?: string
          year_range?: string
        }
        Relationships: []
      }
      trade_valuation_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      unit_site_content: {
        Row: {
          created_at: string | null
          custom_specs: Json | null
          description: string | null
          featured: boolean
          id: string
          major_unit_header_id: number
          photos: Json | null
          site_visible: boolean
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_specs?: Json | null
          description?: string | null
          featured?: boolean
          id?: string
          major_unit_header_id: number
          photos?: Json | null
          site_visible?: boolean
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_specs?: Json | null
          description?: string | null
          featured?: boolean
          id?: string
          major_unit_header_id?: number
          photos?: Json | null
          site_visible?: boolean
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
          ip_address: unknown
          is_active: boolean
          last_activity: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_callbacks: {
        Row: {
          callback_status: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string
          id: string
          motor_context: Json | null
          motor_interest: string | null
          notes: string | null
          preferred_time: string | null
          scheduled_for: string | null
        }
        Insert: {
          callback_status?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone: string
          id?: string
          motor_context?: Json | null
          motor_interest?: string | null
          notes?: string | null
          preferred_time?: string | null
          scheduled_for?: string | null
        }
        Update: {
          callback_status?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string
          id?: string
          motor_context?: Json | null
          motor_interest?: string | null
          notes?: string | null
          preferred_time?: string | null
          scheduled_for?: string | null
        }
        Relationships: []
      }
      voice_reminders: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string
          id: string
          remind_at: string
          reminder_content: Json | null
          reminder_type: string | null
          sent: boolean | null
          sent_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone: string
          id?: string
          remind_at: string
          reminder_content?: Json | null
          reminder_type?: string | null
          sent?: boolean | null
          sent_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string
          id?: string
          remind_at?: string
          reminder_content?: Json | null
          reminder_type?: string | null
          sent?: boolean | null
          sent_at?: string | null
        }
        Relationships: []
      }
      voice_sessions: {
        Row: {
          context: Json | null
          conversation_id: string | null
          created_at: string
          duration_seconds: number | null
          end_reason: string | null
          ended_at: string | null
          id: string
          messages_exchanged: number | null
          motor_context: Json | null
          session_id: string
          started_at: string
          summary: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          messages_exchanged?: number | null
          motor_context?: Json | null
          session_id: string
          started_at?: string
          summary?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          messages_exchanged?: number | null
          motor_context?: Json | null
          session_id?: string
          started_at?: string
          summary?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      webhook_activity_logs: {
        Row: {
          error_message: string | null
          id: string
          payload: Json
          response_details: Json | null
          status: string
          trigger_type: string
          triggered_at: string
          webhook_config_id: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          payload?: Json
          response_details?: Json | null
          status: string
          trigger_type: string
          triggered_at?: string
          webhook_config_id?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          payload?: Json
          response_details?: Json | null
          status?: string
          trigger_type?: string
          triggered_at?: string
          webhook_config_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_activity_logs_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "webhook_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configurations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          test_payload: Json | null
          updated_at: string
          webhook_type: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          test_payload?: Json | null
          updated_at?: string
          webhook_type: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          test_payload?: Json | null
          updated_at?: string
          webhook_type?: string
          webhook_url?: string
        }
        Relationships: []
      }
      weekly_intelligence_reports: {
        Row: {
          created_at: string | null
          generated_at: string | null
          id: string
          report_data: Json
          week_of: string
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          report_data: Json
          week_of: string
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          report_data?: Json
          week_of?: string
        }
        Relationships: []
      }
    }
    Views: {
      counter_sales: {
        Row: {
          cashier_name: string | null
          category: string | null
          common_invoice_id: number | null
          cost: number | null
          cust_id: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          each_price: number | null
          ext_price: number | null
          invoice_collect_amt: number | null
          invoice_date: string | null
          invoice_discount: number | null
          invoice_handling_amt: number | null
          invoice_id: number | null
          invoice_line_no: number | null
          invoice_no: number | null
          invoice_number: number | null
          invoice_subtotal: number | null
          invoice_tax: number | null
          is_resale: number | null
          is_special_order: number | null
          layaway_number: string | null
          line_discount: number | null
          line_total: number | null
          major_unit_id: number | null
          part_desc: string | null
          part_description: string | null
          part_no: string | null
          part_number: string | null
          po_number: string | null
          price: number | null
          qty: number | null
          repair_order_id: number | null
          sale_type_description: string | null
          salesman_id: string | null
          salesman_name: string | null
          source: string | null
          special_order_number: string | null
          std_price: number | null
          synced_at: string | null
          warranty: number | null
          weborder_number: string | null
          weborder_partnumber: string | null
        }
        Relationships: []
      }
      customer_lifecycle: {
        Row: {
          cell_phone: string | null
          city: string | null
          customer_id: number | null
          customer_name: string | null
          customer_type: string | null
          email: string | null
          first_deal_date: string | null
          first_name: string | null
          first_service_date: string | null
          last_activity_date: string | null
          last_deal_date: string | null
          last_name: string | null
          last_parts_purchase: string | null
          last_service_date: string | null
          lifetime_deal_revenue: number | null
          lifetime_parts_revenue: number | null
          lifetime_service_revenue: number | null
          lifetime_total_revenue: number | null
          loyalty_customer: boolean | null
          phone: string | null
          province: string | null
          total_deals: number | null
          total_parts_lines: number | null
          total_ros: number | null
        }
        Relationships: []
      }
      customer_summary: {
        Row: {
          cell_phone: string | null
          city: string | null
          company_name: string | null
          customer_id: number | null
          customer_name: string | null
          customer_type: string | null
          email: string | null
          first_name: string | null
          first_service_date: string | null
          home_phone: string | null
          last_name: string | null
          last_service_date: string | null
          lifetime_revenue: number | null
          loyalty_customer: boolean | null
          phone: string | null
          province: string | null
          total_repair_orders: number | null
          total_ros: number | null
          total_spend: number | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          amt_financed: number | null
          balance_to_finance: number | null
          be_margin: number | null
          cobuyer_cust_id: string | null
          cobuyer_name: string | null
          common_invoice_id: number | null
          contract_date: string | null
          create_date: string | null
          cust_id: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          deal_description: string | null
          deal_no: string | null
          dealid: string | null
          delivery_date: string | null
          deposit: number | null
          extra_lines_count: number | null
          fe_margin: number | null
          fin_invoice_id: number | null
          finance_date: string | null
          last_modified_date: string | null
          lienholder: string | null
          originating_date: string | null
          payment: number | null
          rate: number | null
          raw_extra_lines: Json | null
          raw_trades: Json | null
          raw_units: Json | null
          sales_tax_total: number | null
          salesman_id: number | null
          salesman_name: string | null
          salesmanager: string | null
          source: string | null
          source_type: string | null
          stage_name: string | null
          synced_at: string | null
          term: number | null
          total_cash_price: number | null
          total_of_payments: number | null
          trades_count: number | null
          units_count: number | null
          vehicle_tax_total: number | null
        }
        Relationships: []
      }
      deals_units: {
        Row: {
          contract_date: string | null
          cost: number | null
          cust_id: string | null
          customer_name: string | null
          deal_no: string | null
          deal_unit_id: number | null
          dealid: string | null
          delivery_date: string | null
          gross_margin: number | null
          major_unit_header_id: number | null
          make: string | null
          model: string | null
          model_year: string | null
          raw: Json | null
          sale_price: number | null
          salesman_name: string | null
          stock_number: string | null
          synced_at: string | null
          trade_allowance: number | null
          vin: string | null
        }
        Relationships: []
      }
      email_analytics_summary: {
        Row: {
          active: number | null
          click_rate: number | null
          completed: number | null
          engaged_leads: number | null
          open_rate: number | null
          paused: number | null
          sequence_type: string | null
          total_clicks: number | null
          total_emails_sent: number | null
          total_opens: number | null
          total_sequences: number | null
          unsubscribed: number | null
        }
        Relationships: []
      }
      invoice_lines: {
        Row: {
          cashier_name: string | null
          category: string | null
          common_invoice_id: number | null
          cost: number | null
          cust_id: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          each_price: number | null
          ext_price: number | null
          invoice_collect_amt: number | null
          invoice_date: string | null
          invoice_discount: number | null
          invoice_handling_amt: number | null
          invoice_id: number | null
          invoice_line_no: number | null
          invoice_no: number | null
          invoice_number: number | null
          invoice_subtotal: number | null
          invoice_tax: number | null
          is_resale: number | null
          is_special_order: number | null
          layaway_number: string | null
          line_discount: number | null
          line_total: number | null
          major_unit_id: number | null
          part_desc: string | null
          part_description: string | null
          part_no: string | null
          part_number: string | null
          po_number: string | null
          price: number | null
          qty: number | null
          repair_order_id: number | null
          sale_type_description: string | null
          salesman_id: string | null
          salesman_name: string | null
          source: string | null
          special_order_number: string | null
          std_price: number | null
          synced_at: string | null
          warranty: number | null
          weborder_number: string | null
          weborder_partnumber: string | null
        }
        Relationships: []
      }
      mercury_motor_inventory: {
        Row: {
          availability_status: string | null
          available_for_sale: boolean | null
          comments: string | null
          condition: string | null
          date_received: string | null
          dealer_price: number | null
          hp: number | null
          last_update_date: string | null
          model: string | null
          model_year: number | null
          msrp: number | null
          new_used: string | null
          stock_number: string | null
          synced_at: string | null
          unit_status: string | null
          vin: string | null
        }
        Insert: {
          availability_status?: never
          available_for_sale?: never
          comments?: string | null
          condition?: string | null
          date_received?: string | null
          dealer_price?: number | null
          hp?: number | null
          last_update_date?: string | null
          model?: string | null
          model_year?: number | null
          msrp?: number | null
          new_used?: string | null
          stock_number?: string | null
          synced_at?: string | null
          unit_status?: string | null
          vin?: string | null
        }
        Update: {
          availability_status?: never
          available_for_sale?: never
          comments?: string | null
          condition?: string | null
          date_received?: string | null
          dealer_price?: number | null
          hp?: number | null
          last_update_date?: string | null
          model?: string | null
          model_year?: number | null
          msrp?: number | null
          new_used?: string | null
          stock_number?: string | null
          synced_at?: string | null
          unit_status?: string | null
          vin?: string | null
        }
        Relationships: []
      }
      open_service_board: {
        Row: {
          category: string | null
          cust_id: number | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          date_in: string | null
          last_modified_date: string | null
          promised_date: string | null
          raw_units: Json | null
          ro_header_id: number | null
          ro_no: string | null
          ro_status: number | null
          service_writer_name: string | null
          status: string | null
          synced_at: string | null
          total_owed: number | null
          unit_make: string | null
          unit_model: string | null
          unit_stock_number: string | null
          unit_vin: string | null
          unit_year: string | null
          units_count: number | null
        }
        Relationships: []
      }
      parts_inventory: {
        Row: {
          active_price: number | null
          available: number | null
          bin1: string | null
          bin2: string | null
          category: string | null
          cost: number | null
          date_gathered: string | null
          description: string | null
          last_count_date: string | null
          last_received_date: string | null
          last_sold_date: string | null
          last_update_date: string | null
          movement_code: string | null
          on_hand: number | null
          on_order: number | null
          part_number: string | null
          retail_price: number | null
          superseded_to: string | null
          supplier_code: string | null
          supplier_name: string | null
          synced_at: string | null
          upc: string | null
        }
        Insert: {
          active_price?: number | null
          available?: number | null
          bin1?: string | null
          bin2?: string | null
          category?: string | null
          cost?: number | null
          date_gathered?: string | null
          description?: string | null
          last_count_date?: string | null
          last_received_date?: string | null
          last_sold_date?: string | null
          last_update_date?: string | null
          movement_code?: string | null
          on_hand?: number | null
          on_order?: number | null
          part_number?: string | null
          retail_price?: number | null
          superseded_to?: string | null
          supplier_code?: string | null
          supplier_name?: string | null
          synced_at?: string | null
          upc?: string | null
        }
        Update: {
          active_price?: number | null
          available?: number | null
          bin1?: string | null
          bin2?: string | null
          category?: string | null
          cost?: number | null
          date_gathered?: string | null
          description?: string | null
          last_count_date?: string | null
          last_received_date?: string | null
          last_sold_date?: string | null
          last_update_date?: string | null
          movement_code?: string | null
          on_hand?: number | null
          on_order?: number | null
          part_number?: string | null
          retail_price?: number | null
          superseded_to?: string | null
          supplier_code?: string | null
          supplier_name?: string | null
          synced_at?: string | null
          upc?: string | null
        }
        Relationships: []
      }
      parts_invoices: {
        Row: {
          cashier_name: string | null
          category: string | null
          common_invoice_id: number | null
          cost: number | null
          cust_id: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          each_price: number | null
          ext_price: number | null
          invoice_collect_amt: number | null
          invoice_date: string | null
          invoice_discount: number | null
          invoice_handling_amt: number | null
          invoice_id: number | null
          invoice_line_no: number | null
          invoice_no: number | null
          invoice_number: number | null
          invoice_subtotal: number | null
          invoice_tax: number | null
          is_resale: number | null
          is_special_order: number | null
          layaway_number: string | null
          line_discount: number | null
          line_total: number | null
          major_unit_id: number | null
          part_desc: string | null
          part_description: string | null
          part_no: string | null
          part_number: string | null
          po_number: string | null
          price: number | null
          qty: number | null
          repair_order_id: number | null
          sale_type_description: string | null
          salesman_id: string | null
          salesman_name: string | null
          source: string | null
          special_order_number: string | null
          std_price: number | null
          synced_at: string | null
          warranty: number | null
          weborder_number: string | null
          weborder_partnumber: string | null
        }
        Relationships: []
      }
      service_history: {
        Row: {
          action_taken: string | null
          close_date: string | null
          customer_approval: string | null
          customer_id: number | null
          customer_name: string | null
          date_completed: string | null
          date_completed_parsed: string | null
          date_in: string | null
          date_sent: string | null
          description: string | null
          job_description: string | null
          job_name: string | null
          job_title: string | null
          labor_hours: number | null
          labor_total: number | null
          open_date: string | null
          recommendations: string | null
          resolution: string | null
          ro_header_id: number | null
          ro_number: string | null
          ro_total: number | null
          service_category: string | null
          service_writer: string | null
          technician: string | null
          technician_name: string | null
          technician_notes: string | null
          technotes: string | null
          total_labor: number | null
          total_parts: number | null
          unit: string | null
          unit_description: string | null
          vin: string | null
          warranty_job: boolean | null
        }
        Relationships: []
      }
      service_parts: {
        Row: {
          customer_id: number | null
          customer_name: string | null
          date_completed: string | null
          ext_price: number | null
          job_description: string | null
          job_name: string | null
          job_title: string | null
          part_description: string | null
          part_number: string | null
          price: number | null
          qty: number | null
          ro_header_id: number | null
          ro_job_id: number | null
          ro_number: string | null
          service_writer: string | null
          source_code: string | null
          unit: string | null
          unit_description: string | null
          vin: string | null
        }
        Relationships: []
      }
      unit_inventory: {
        Row: {
          beam: number | null
          class: string | null
          color: string | null
          comments: string | null
          condition: string | null
          customer_id: number | null
          date_gathered: string | null
          date_received: string | null
          dsrp: number | null
          engine_make: string | null
          engine_model: string | null
          engine_serial: string | null
          exterior_color: string | null
          floor_layout: string | null
          fuel_type: string | null
          hours: number | null
          hp: number | null
          hull_construction: string | null
          interior_color: string | null
          invoice_amt: number | null
          last_update_date: string | null
          length: number | null
          major_unit_header_id: number | null
          make: string | null
          model: string | null
          model_year: number | null
          msrp: number | null
          new_used: string | null
          odometer: string | null
          serial_number: string | null
          stock_number: string | null
          synced_at: string | null
          unit_id: number | null
          unit_status: string | null
          unit_type: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          beam?: number | null
          class?: string | null
          color?: string | null
          comments?: string | null
          condition?: string | null
          customer_id?: never
          date_gathered?: string | null
          date_received?: string | null
          dsrp?: number | null
          engine_make?: never
          engine_model?: never
          engine_serial?: never
          exterior_color?: string | null
          floor_layout?: string | null
          fuel_type?: string | null
          hours?: number | null
          hp?: number | null
          hull_construction?: string | null
          interior_color?: string | null
          invoice_amt?: number | null
          last_update_date?: string | null
          length?: number | null
          major_unit_header_id?: number | null
          make?: string | null
          model?: string | null
          model_year?: number | null
          msrp?: number | null
          new_used?: string | null
          odometer?: string | null
          serial_number?: string | null
          stock_number?: string | null
          synced_at?: string | null
          unit_id?: number | null
          unit_status?: string | null
          unit_type?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          beam?: number | null
          class?: string | null
          color?: string | null
          comments?: string | null
          condition?: string | null
          customer_id?: never
          date_gathered?: string | null
          date_received?: string | null
          dsrp?: number | null
          engine_make?: never
          engine_model?: never
          engine_serial?: never
          exterior_color?: string | null
          floor_layout?: string | null
          fuel_type?: string | null
          hours?: number | null
          hp?: number | null
          hull_construction?: string | null
          interior_color?: string | null
          invoice_amt?: number | null
          last_update_date?: string | null
          length?: number | null
          major_unit_header_id?: number | null
          make?: string | null
          model?: string | null
          model_year?: number | null
          msrp?: number | null
          new_used?: string | null
          odometer?: string | null
          serial_number?: string | null
          stock_number?: string | null
          synced_at?: string | null
          unit_id?: number | null
          unit_status?: string | null
          unit_type?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_customer_memory: {
        Args: {
          p_category: string
          p_created_by?: string
          p_customer_id: string
          p_customer_name: string
          p_gateway_secret: string
          p_raw_note: string
          p_sensitivity?: string
          p_source?: string
          p_source_channel?: string
          p_summary: string
        }
        Returns: {
          category: string
          created_at: string
          customer_id: string
          customer_name: string
          id: string
          sensitivity: string
          summary: string
          use_in_customer_messages: boolean
          use_in_staff_brief: boolean
        }[]
      }
      archive_customer_memory: {
        Args: {
          p_actor?: string
          p_gateway_secret: string
          p_memory_id: string
        }
        Returns: {
          archived_at: string
          id: string
        }[]
      }
      audit_orphaned_customer_data: {
        Args: never
        Returns: {
          record_count: number
          table_name: string
        }[]
      }
      bulk_upsert_deals: { Args: { payload: Json }; Returns: number }
      bulk_upsert_open_ros: { Args: { payload: Json }; Returns: number }
      bulk_upsert_parts_invoices: { Args: { payload: Json }; Returns: number }
      check_rate_limit: {
        Args: {
          _action: string
          _identifier: string
          _max_attempts?: number
          _window_minutes?: number
        }
        Returns: boolean
      }
      claim_openclaw_slack_fallback_jobs: {
        Args: {
          p_limit?: number
          p_stale_after_seconds?: number
          p_worker_id: string
          p_worker_secret: string
        }
        Returns: {
          attempts: number
          claimed_at: string
          id: string
          payload: Json
          slack_event_id: string
        }[]
      }
      cleanup_expired_sessions: { Args: never; Returns: number }
      cleanup_motor_duplicates_by_display: {
        Args: never
        Returns: {
          cleanup_details: Json
          total_duplicates_removed: number
        }[]
      }
      cleanup_old_data: {
        Args: never
        Returns: {
          records_deleted: number
          table_name: string
        }[]
      }
      cleanup_openclaw_slack_fallback_jobs: {
        Args: {
          p_failed_days?: number
          p_succeeded_days?: number
          p_worker_secret: string
        }
        Returns: {
          deleted_failed_or_dead: number
          deleted_succeeded: number
        }[]
      }
      complete_openclaw_slack_fallback_job: {
        Args: {
          p_id: string
          p_response_text?: string
          p_worker_secret: string
        }
        Returns: undefined
      }
      customer_brief: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          address1: string
          address2: string
          cell_phone: string
          city: string
          company_name: string
          customer_id: number
          customer_name: string
          customer_type: string
          email: string
          first_service_date: string
          home_phone: string
          known_units: Json
          last_service_date: string
          lifetime_revenue: number
          major_units: Json
          match_rank: number
          open_recommendations: Json
          open_ro_count: number
          open_ros: Json
          phone: string
          province: string
          recent_service: Json
          total_repair_orders: number
          total_ros: number
          total_spend: number
          work_phone: string
        }[]
      }
      customer_issue_history: {
        Args: {
          p_customer_query: string
          p_issue_query: string
          p_limit?: number
        }
        Returns: {
          action_taken: string
          customer_id: number
          customer_name: string
          date_completed: string
          job_description: string
          job_name: string
          match_rank: number
          recommendations: string
          resolution: string
          ro_number: string
          ro_total: number
          technician: string
          unit: string
          vin: string
        }[]
      }
      customer_lookup: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          cell_phone: string
          city: string
          company_name: string
          customer_id: number
          customer_name: string
          customer_type: string
          email: string
          first_service_date: string
          home_phone: string
          last_service_date: string
          lifetime_revenue: number
          loyalty_customer: boolean
          match_rank: number
          phone: string
          province: string
          total_repair_orders: number
          total_ros: number
          total_spend: number
        }[]
      }
      customer_memory_lookup: {
        Args: { p_customer_query: string; p_limit?: number }
        Returns: {
          category: string
          confidence: string
          created_at: string
          created_by: string
          customer_id: string
          customer_name: string
          id: string
          last_used_at: string
          match_rank: number
          sensitivity: string
          summary: string
          use_in_customer_messages: boolean
          use_in_staff_brief: boolean
        }[]
      }
      customer_product_history: {
        Args: {
          p_customer_query: string
          p_end_date?: string
          p_limit?: number
          p_product_query?: string
          p_start_date?: string
        }
        Returns: {
          activity_date: string
          customer_name: string
          document_label: string
          document_no: string
          ext_price: number
          job_name: string
          part_description: string
          part_number: string
          qty: number
          source: string
          staff_name: string
          unit: string
        }[]
      }
      customer_service_history: {
        Args: {
          p_customer_query: string
          p_end_date: string
          p_limit?: number
          p_start_date: string
        }
        Returns: {
          customer_id: number
          customer_name: string
          date_completed: string
          job_name: string
          labor_hours: number
          labor_total: number
          match_rank: number
          recommendations: string
          resolution: string
          ro_number: string
          ro_total: number
          technician: string
          unit: string
          vin: string
        }[]
      }
      customer_service_parts_used: {
        Args: {
          p_customer_query: string
          p_end_date?: string
          p_limit?: number
          p_start_date?: string
          p_unit_query?: string
        }
        Returns: {
          customer_id: number
          customer_name: string
          date_completed: string
          ext_price: number
          job_name: string
          match_rank: number
          part_description: string
          part_number: string
          price: number
          qty: number
          ro_number: string
          technician: string
          unit: string
          vin: string
        }[]
      }
      customer_service_red_flags: {
        Args: {
          p_customer_query: string
          p_end_date?: string
          p_limit?: number
          p_start_date?: string
          p_unit_query?: string
        }
        Returns: {
          action_taken: string
          customer_id: number
          customer_name: string
          date_completed: string
          job_description: string
          job_name: string
          labor_hours: number
          match_rank: number
          recommendations: string
          resolution: string
          ro_number: string
          ro_total: number
          signal_rank: number
          signal_type: string
          technician: string
          unit: string
          vin: string
        }[]
      }
      customer_service_work_summary: {
        Args: {
          p_customer_query: string
          p_end_date?: string
          p_limit?: number
          p_start_date?: string
          p_unit_query?: string
        }
        Returns: {
          action_taken: string
          customer_id: number
          customer_name: string
          date_completed: string
          job_description: string
          job_name: string
          labor_hours: number
          labor_total: number
          match_rank: number
          recommendations: string
          resolution: string
          ro_number: string
          ro_total: number
          technician: string
          unit: string
          vin: string
        }[]
      }
      decrypt_sin: { Args: { sin_encrypted: string }; Returns: string }
      encrypt_sin: { Args: { sin_plaintext: string }; Returns: string }
      enqueue_openclaw_slack_fallback_job: {
        Args: {
          p_available_at?: string
          p_gateway_secret: string
          p_payload: Json
          p_priority?: number
          p_slack_event_id: string
        }
        Returns: {
          duplicate: boolean
          id: string
          status: string
        }[]
      }
      fail_openclaw_slack_fallback_job: {
        Args: {
          p_error: string
          p_id: string
          p_retry_after_seconds?: number
          p_worker_secret: string
        }
        Returns: {
          attempts: number
          available_at: string
          id: string
          status: string
        }[]
      }
      fix_auto_generated_model_numbers_comprehensive: {
        Args: never
        Returns: {
          details: Json
          updated_count: number
        }[]
      }
      fix_auto_generated_model_numbers_safe: {
        Args: never
        Returns: {
          details: Json
          updated_count: number
        }[]
      }
      format_horsepower: { Args: { hp: number }; Returns: string }
      format_motor_display_name: {
        Args: { model_name: string }
        Returns: string
      }
      generate_session_id: { Args: never; Returns: string }
      get_all_knowledge: {
        Args: never
        Returns: {
          category: string
          content: string
          topic: string
        }[]
      }
      get_cron_job_status: {
        Args: never
        Returns: {
          active: boolean
          jobname: string
          last_run: string
          schedule: string
        }[]
      }
      get_duplicate_brochure_keys: {
        Args: never
        Returns: {
          count: number
          model_key: string
        }[]
      }
      get_motor_operating_specs: {
        Args: { hp: number; motor_type?: string; specifications?: Json }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hbw_bot_admin_status: {
        Args: never
        Returns: {
          dead_jobs: number
          errors_1h: number
          errors_24h: number
          failed_jobs: number
          generated_at: string
          last_brief_at: string
          last_brief_channel_id: string
          last_brief_slack_ts: string
          last_brief_status: string
          last_error_at: string
          last_event_at: string
          last_worker_seen_at: string
          pending_jobs: number
          processing_jobs: number
          stale_pending_jobs: number
          stale_processing_jobs: number
          worker_status: string
        }[]
      }
      hbw_bot_recent_errors: {
        Args: { p_limit?: number }
        Returns: {
          command: string
          created_at: string
          error_message: string
          event_type: string
          intent_type: string
          rpc: string
          severity: string
          status: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      last_service_summary: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          action_taken: string
          customer_id: number
          customer_name: string
          date_completed: string
          job_description: string
          job_name: string
          labor_hours: number
          match_rank: number
          parts: Json
          recommendations: string
          resolution: string
          ro_number: string
          ro_total: number
          technician: string
          unit: string
          vin: string
        }[]
      }
      log_security_event: {
        Args: {
          _action: string
          _ip_address?: unknown
          _record_id?: string
          _table_name: string
          _user_agent?: string
          _user_id: string
        }
        Returns: undefined
      }
      normalize_phone: { Args: { p: string }; Returns: string }
      open_ro_brief: {
        Args: { p_limit?: number; p_mode?: string }
        Returns: {
          category: string
          customer_name: string
          date_in: string
          days_open: number
          priority_rank: number
          promised_date: string
          ro_header_id: number
          ro_no: string
          status: string
          synced_at: string
          technicians: string
          total_owed: number
          unit_make: string
          unit_model: string
          unit_stock_number: string
          unit_vin: string
          unit_year: string
          units_count: number
        }[]
      }
      open_ro_detail: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          category: string
          customer_name: string
          date_in: string
          days_open: number
          match_rank: number
          promised_date: string
          ro_header_id: number
          ro_no: string
          status: string
          synced_at: string
          technicians: string
          total_owed: number
          unit_make: string
          unit_model: string
          unit_stock_number: string
          unit_vin: string
          unit_year: string
          units_count: number
        }[]
      }
      open_ro_lookup: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          category: string
          customer_name: string
          date_in: string
          match_rank: number
          promised_date: string
          ro_header_id: number
          ro_no: string
          service_writer_name: string
          status: string
          synced_at: string
          total_owed: number
          unit_make: string
          unit_model: string
          unit_stock_number: string
          unit_vin: string
          unit_year: string
          units_count: number
        }[]
      }
      openclaw_queue_health: {
        Args: { p_stale_after_minutes?: number }
        Returns: {
          dead_jobs: number
          failed_jobs: number
          last_worker_seen_at: string
          oldest_pending_at: string
          pending_jobs: number
          processing_jobs: number
          stale_pending_jobs: number
          stale_processing_jobs: number
          worker_status: string
        }[]
      }
      part_lookup: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          active_price: number
          available: number
          bin1: string
          bin2: string
          category: string
          cost: number
          description: string
          last_received_date: string
          last_sold_date: string
          match_rank: number
          movement_code: string
          on_hand: number
          on_order: number
          part_number: string
          retail_price: number
          superseded_to: string
          supplier_code: string
          supplier_name: string
          synced_at: string
          upc: string
        }[]
      }
      part_lookup_context: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          active_price: number
          available: number
          bin1: string
          bin2: string
          category: string
          cost: number
          counter_qty_12m: number
          description: string
          invoice_qty_12m: number
          last_counter_sale_date: string
          last_received_date: string
          last_service_sale_date: string
          last_sold_date: string
          match_rank: number
          movement_code: string
          on_hand: number
          on_order: number
          part_number: string
          recent_sales: Json
          retail_price: number
          service_qty_12m: number
          superseded_to: string
          supplier_code: string
          supplier_name: string
          synced_at: string
          upc: string
        }[]
      }
      part_sales_summary: {
        Args: {
          p_end_date?: string
          p_part_number: string
          p_start_date?: string
        }
        Returns: {
          counter_qty: number
          counter_sales: number
          current_available: number
          current_on_hand: number
          description: string
          end_date: string
          generated_at: string
          invoice_lines: Json
          invoice_qty: number
          invoice_sales: number
          last_sold_date: string
          matched_part_number: string
          query_part: string
          retail_price: number
          service_lines: Json
          service_qty: number
          service_sales: number
          start_date: string
          total_qty: number
        }[]
      }
      record_hbw_bot_brief_receipt: {
        Args: {
          p_brief_type?: string
          p_channel_id?: string
          p_error_message?: string
          p_gateway_secret: string
          p_metadata?: Json
          p_row_counts?: Json
          p_slack_ts?: string
          p_status?: string
          p_text_length?: number
        }
        Returns: string
      }
      record_hbw_bot_event: {
        Args: {
          p_channel_id?: string
          p_command?: string
          p_error_message?: string
          p_event_type: string
          p_gateway_secret: string
          p_intent_type?: string
          p_message_ts?: string
          p_metadata?: Json
          p_rpc?: string
          p_severity?: string
          p_slack_event_id?: string
          p_status?: string
        }
        Returns: string
      }
      record_openclaw_worker_heartbeat: {
        Args: {
          p_metadata?: Json
          p_status?: string
          p_worker_id: string
          p_worker_secret: string
        }
        Returns: undefined
      }
      search_knowledge: {
        Args: { match_count?: number; query_text: string }
        Returns: {
          category: string
          content: string
          topic: string
        }[]
      }
      service_recommendation_followups: {
        Args: { p_limit?: number; p_months_back?: number; p_query?: string }
        Returns: {
          cell_phone: string
          city: string
          customer_id: number
          customer_name: string
          email: string
          home_phone: string
          latest_recommendation_at: string
          lifetime_revenue: number
          open_ro_count: number
          phone: string
          priority_rank: number
          province: string
          recommendation_count: number
          recommendations: Json
          total_ros: number
        }[]
      }
      service_recommendations_due: {
        Args: { p_limit?: number; p_months_back?: number; p_query?: string }
        Returns: {
          customer_id: number
          customer_name: string
          date_completed: string
          job_name: string
          recommendations: string
          ro_number: string
          ro_total: number
          service_writer: string
          technician: string
          unit: string
          vin: string
        }[]
      }
      service_ro_detail: {
        Args: { p_limit?: number; p_ro_number: string }
        Returns: {
          action_taken: string
          customer_id: number
          customer_name: string
          date_completed: string
          job_description: string
          job_name: string
          labor_hours: number
          labor_total: number
          match_rank: number
          parts: Json
          recommendations: string
          resolution: string
          ro_number: string
          ro_total: number
          technician: string
          unit: string
          vin: string
        }[]
      }
      test_single_motor_insert: {
        Args: {
          p_dealer_price: number
          p_model_display: string
          p_model_number: string
        }
        Returns: string
      }
      unit_inventory_lookup: {
        Args: { p_limit?: number; p_query?: string }
        Returns: {
          availability_status: string
          available_for_sale: boolean
          comments: string
          hp: number
          make: string
          match_rank: number
          model: string
          model_year: number
          new_used: string
          price: number
          source: string
          stock_number: string
          synced_at: string
          unit_status: string
          vin: string
        }[]
      }
      update_brochure_models_bulk: { Args: { p_rows: Json }; Returns: number }
      update_brochure_models_bulk_v2: {
        Args: { p_rows: Json }
        Returns: number
      }
      validate_customer_data_ownership: {
        Args: { record_user_id: string; table_name: string }
        Returns: boolean
      }
      validate_customer_quote_access: {
        Args: { quote_id: string }
        Returns: boolean
      }
      validate_mercury_model_number: {
        Args: { model_number: string }
        Returns: boolean
      }
      validate_user_data_access: {
        Args: { _record_id: string; _table_name: string }
        Returns: boolean
      }
      verify_openclaw_worker_secret: {
        Args: { p_worker_secret: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      financing_application_status:
        | "draft"
        | "pending"
        | "approved"
        | "declined"
        | "more_info_needed"
        | "withdrawn"
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
      financing_application_status: [
        "draft",
        "pending",
        "approved",
        "declined",
        "more_info_needed",
        "withdrawn",
      ],
    },
  },
} as const
