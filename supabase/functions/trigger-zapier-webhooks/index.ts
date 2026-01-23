import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const leadDataSchema = z.object({
  id: z.string().uuid().optional(),
  customer_name: z.string().max(100).optional(),
  customer_email: z.string().email().max(255).optional(),
  customer_phone: z.string().max(20).optional(),
  lead_score: z.number().min(0).max(100).optional(),
  final_price: z.number().min(0).max(2000000).optional(),
  motor_model_id: z.string().uuid().optional().nullable(),
  created_at: z.string().optional(),
  lead_source: z.string().max(50).optional(),
}).optional();

const quoteDataSchema = z.object({
  id: z.string().uuid().optional(),
  quote_number: z.number().or(z.string()).optional(),
  customer_name: z.string().max(100).optional(),
  customer_email: z.string().email().max(255).optional(),
  total_price: z.number().min(0).max(2000000).optional(),
  motor_model: z.string().max(200).optional(),
  pdf_url: z.string().url().max(2000).optional(),
  created_at: z.string().optional(),
}).optional();

const webhookRequestSchema = z.object({
  webhook_type: z.enum(['hot_lead', 'quote_delivery', 'follow_up_reminder', 'manual_trigger']),
  lead_data: leadDataSchema,
  quote_data: quoteDataSchema,
  test_mode: z.boolean().optional().default(false),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawData = await req.json();
    
    // Validate input data
    const validationResult = webhookRequestSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid input data',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { webhook_type, lead_data, quote_data, test_mode } = validationResult.data;
    
    console.log('Triggering webhooks for type:', webhook_type, { test_mode });

    // Get active webhooks for the specified type
    const { data: webhooks, error: webhookError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('webhook_type', webhook_type)
      .eq('is_active', true);

    if (webhookError) {
      throw new Error(`Failed to fetch webhooks: ${webhookError.message}`);
    }

    if (!webhooks || webhooks.length === 0) {
      console.log(`No active webhooks found for type: ${webhook_type}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No active webhooks configured for type: ${webhook_type}`,
          webhooks_triggered: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare payload based on webhook type
    const payload: Record<string, unknown> = {
      type: webhook_type,
      timestamp: new Date().toISOString(),
      test_mode,
    };

    // Add specific data based on webhook type
    switch (webhook_type) {
      case 'hot_lead':
        if (!lead_data) {
          throw new Error('lead_data is required for hot_lead webhooks');
        }
        payload.data = {
          lead_id: lead_data.id,
          customer_name: lead_data.customer_name,
          customer_email: lead_data.customer_email,
          customer_phone: lead_data.customer_phone,
          lead_score: lead_data.lead_score,
          final_price: lead_data.final_price,
          motor_model_id: lead_data.motor_model_id,
          created_at: lead_data.created_at,
          lead_source: lead_data.lead_source,
          urgency: 'HIGH',
          action_required: 'Immediate follow-up recommended',
        };
        break;

      case 'quote_delivery':
        if (!quote_data) {
          throw new Error('quote_data is required for quote_delivery webhooks');
        }
        payload.data = {
          quote_id: quote_data.id,
          quote_number: quote_data.quote_number,
          customer_name: quote_data.customer_name,
          customer_email: quote_data.customer_email,
          total_price: quote_data.total_price,
          motor_model: quote_data.motor_model,
          pdf_url: quote_data.pdf_url,
          created_at: quote_data.created_at,
          follow_up_sequence: 'quote_delivered',
        };
        break;

      case 'follow_up_reminder':
        payload.data = lead_data || quote_data || { message: 'Follow-up reminder' };
        break;

      case 'manual_trigger':
        payload.data = lead_data || quote_data || { 
          test: true, 
          message: 'Manual webhook trigger from admin panel' 
        };
        break;

      default:
        payload.data = lead_data || quote_data || {};
    }

    console.log('Prepared payload:', JSON.stringify(payload, null, 2));

    // Trigger all webhooks for this type
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          console.log(`Triggering webhook: ${webhook.name} (${webhook.webhook_url})`);
          
          const response = await fetch(webhook.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          // Log the activity (success)
          await supabase
            .from('webhook_activity_logs')
            .insert({
              webhook_config_id: webhook.id,
              trigger_type: webhook_type,
              payload: payload.data,
              status: response.ok ? 'success' : 'failed',
              response_details: { 
                status: response.status, 
                statusText: response.statusText 
              },
              error_message: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
              triggered_at: new Date().toISOString(),
            });

          return {
            webhook_id: webhook.id,
            webhook_name: webhook.name,
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
          };
        } catch (error) {
          console.error(`Webhook ${webhook.name} failed:`, error);
          
          // Log the activity (failed)
          await supabase
            .from('webhook_activity_logs')
            .insert({
              webhook_config_id: webhook.id,
              trigger_type: webhook_type,
              payload: payload.data,
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              triggered_at: new Date().toISOString(),
            });

          return {
            webhook_id: webhook.id,
            webhook_name: webhook.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as { success: boolean }).success).length;
    const failureCount = results.length - successCount;

    console.log(`Webhook trigger results: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        webhooks_triggered: webhooks.length,
        successful_triggers: successCount,
        failed_triggers: failureCount,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: String(r.reason) }),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in trigger-zapier-webhooks function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
