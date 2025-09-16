import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🚀 Setting up cron job for Mercury inventory sync');

    // Enable required extensions
    console.log('📦 Enabling required extensions...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Enable pg_cron and pg_net extensions
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        CREATE EXTENSION IF NOT EXISTS pg_net;
        
        -- Schedule daily sync at 5:00 AM EST
        SELECT cron.schedule(
          'mercury-inventory-sync',
          '0 5 * * *',  -- 5:00 AM daily
          $$
          SELECT net.http_post(
            url := '${supabaseUrl}/functions/v1/sync-mercury-inventory',
            headers := jsonb_build_object(
              'Authorization', 'Bearer ${supabaseKey}',
              'Content-Type', 'application/json'
            )
          );
          $$
        );
      `
    });

    console.log('✅ Cron job scheduled successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Mercury inventory sync scheduled for daily 5:00 AM',
      cron_schedule: '0 5 * * *',
      function_url: `${supabaseUrl}/functions/v1/sync-mercury-inventory`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Cron setup failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});