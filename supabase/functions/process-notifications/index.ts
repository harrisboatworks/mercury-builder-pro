import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Optional input validation for any query parameters
const processOptionsSchema = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  dryRun: z.boolean().optional(),
}).optional();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate any optional input parameters
    const rawBody = await req.json().catch(() => ({}));
    const validationResult = processOptionsSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.log('[process-notifications] Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Processing queued notifications...')

    // Get unprocessed notifications (this could be used for retry logic)
    const { data: notifications, error } = await supabaseClient
      .from('notifications')
      .select(`
        *,
        profiles!inner(*)
      `)
      .eq('read', false)
      .lt('created_at', new Date(Date.now() - 5000).toISOString()) // Process notifications older than 5 seconds
      .limit(100)

    if (error) {
      console.error('Failed to fetch notifications:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications' }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log(`Found ${notifications?.length || 0} notifications to process`)

    let processed = 0
    let failed = 0

    // Process each notification
    for (const notification of notifications || []) {
      try {
        // Here you could implement retry logic for failed SMS sends
        // or other background processing tasks
        
        // For now, we'll just log the processing
        console.log(`Processing notification ${notification.id} for user ${notification.user_id}`)
        
        // Example: Mark old notifications as processed or cleanup
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        if (new Date(notification.created_at) < dayAgo) {
          // Could implement auto-read for old notifications
          // or other cleanup logic here
        }

        processed++
      } catch (processError) {
        console.error(`Failed to process notification ${notification.id}:`, processError)
        failed++
      }
    }

    // Cleanup old read notifications (optional)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const { error: cleanupError } = await supabaseClient
      .from('notifications')
      .delete()
      .eq('read', true)
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (cleanupError) {
      console.warn('Failed to cleanup old notifications:', cleanupError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        total: notifications?.length || 0
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error in process-notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})