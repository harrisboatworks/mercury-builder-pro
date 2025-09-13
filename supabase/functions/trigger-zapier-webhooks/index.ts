import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { webhook_type, lead_data, quote_data, test_mode = false } = await req.json();
    
    console.log('Triggering webhooks for type:', webhook_type, { test_mode });

    if (!webhook_type) {
      throw new Error('webhook_type is required');
    }

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
    let payload: any = {
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

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failureCount = results.length - successCount;

    console.log(`Webhook trigger results: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        webhooks_triggered: webhooks.length,
        successful_triggers: successCount,
        failed_triggers: failureCount,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
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