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
      customer_quotes: {
        Row: {
          anonymous_session_id: string | null
          base_price: number
          contact_attempts: number | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          deposit_amount: number
          discount_amount: number | null
          final_price: number
          id: string
          last_contact_attempt: string | null
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
          term_months: number
          total_cost: number
          tradein_value_final: number | null
          tradein_value_pre_penalty: number | null
          user_id: string
        }
        Insert: {
          anonymous_session_id?: string | null
          base_price: number
          contact_attempts?: number | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          deposit_amount: number
          discount_amount?: number | null
          final_price: number
          id?: string
          last_contact_attempt?: string | null
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
          term_months: number
          total_cost: number
          tradein_value_final?: number | null
          tradein_value_pre_penalty?: number | null
          user_id: string
        }
        Update: {
          anonymous_session_id?: string | null
          base_price?: number
          contact_attempts?: number | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          deposit_amount?: number
          discount_amount?: number | null
          final_price?: number
          id?: string
          last_contact_attempt?: string | null
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
      google_sheets_config: {
        Row: {
          auto_sync_enabled: boolean
          created_at: string
          id: string
          last_sync: string | null
          sheet_url: string
          sync_frequency: string
          updated_at: string
        }
        Insert: {
          auto_sync_enabled?: boolean
          created_at?: string
          id?: string
          last_sync?: string | null
          sheet_url: string
          sync_frequency?: string
          updated_at?: string
        }
        Update: {
          auto_sync_enabled?: boolean
          created_at?: string
          id?: string
          last_sync?: string | null
          sheet_url?: string
          sync_frequency?: string
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
      saved_quotes: {
        Row: {
          access_count: number | null
          converted_to_quote_id: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          is_completed: boolean | null
          last_accessed: string | null
          quote_state: Json
          resume_token: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_count?: number | null
          converted_to_quote_id?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          is_completed?: boolean | null
          last_accessed?: string | null
          quote_state: Json
          resume_token: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_count?: number | null
          converted_to_quote_id?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_completed?: boolean | null
          last_accessed?: string | null
          quote_state?: Json
          resume_token?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      audit_orphaned_customer_data: {
        Args: never
        Returns: {
          record_count: number
          table_name: string
        }[]
      }
      check_rate_limit: {
        Args: {
          _action: string
          _identifier: string
          _max_attempts?: number
          _window_minutes?: number
        }
        Returns: boolean
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
      decrypt_sin: { Args: { sin_encrypted: string }; Returns: string }
      encrypt_sin: { Args: { sin_plaintext: string }; Returns: string }
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
      test_single_motor_insert: {
        Args: {
          p_dealer_price: number
          p_model_display: string
          p_model_number: string
        }
        Returns: string
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
