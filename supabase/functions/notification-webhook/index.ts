import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.53.1';
import {
  handleNotificationWebhook,
  notificationWebhookCorsHeaders,
} from '../_shared/notification-webhook-handler.ts';
import { applyTwilioStatusToSmsLog } from '../_shared/twilio-status-store.ts';

serve(async (request) => {
  try {
    return await handleNotificationWebhook(request, {
      authToken: Deno.env.get('TWILIO_AUTH_TOKEN'),
      configuredWebhookUrl: Deno.env.get('TWILIO_WEBHOOK_URL'),
      // This closure is invoked only after URL, body, and signature validation.
      applyStatus: async (event) => {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );
        return await applyTwilioStatusToSmsLog(supabase, event);
      },
    });
  } catch (error) {
    console.error(
      '[notification-webhook] Failed to persist Twilio status',
      error instanceof Error ? error.name : 'unknown',
    );
    return new Response(JSON.stringify({ error: 'Failed to update SMS status' }), {
      status: 500,
      headers: {
        ...notificationWebhookCorsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
