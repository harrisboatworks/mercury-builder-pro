import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "npm:zod@3.22.4";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SDP exchange validation schema
const sdpExchangeSchema = z.object({
  sdpOffer: z.string().min(1).max(50000), // SDP offers can be large
  ephemeralKey: z.string().min(1).max(500),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const allowed = await checkRateLimit(req, {
    action: 'realtime_sdp_exchange',
    maxAttempts: 20,
    windowMinutes: 10,
  });
  if (!allowed) return rateLimitedResponse(corsHeaders, 60);

  try {
    const rawBody = await req.json();
    
    const validationResult = sdpExchangeSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error('[realtime-sdp-exchange] Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid request data', details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { sdpOffer, ephemeralKey } = validationResult.data;

    console.log('Proxying SDP exchange to OpenAI...');

    // Proxy the SDP exchange to OpenAI.
    // GA endpoint (migrated 2026-09-04). The old beta URL
    // (/v1/realtime?model=...) now hard-fails with
    // "The Realtime Beta API is no longer supported. Please use
    // /v1/realtime/calls for the GA API." The model no longer travels in the
    // query string - it is baked into the ephemeral secret minted by
    // realtime-session, so the offer only needs the bearer token.
    const response = await fetch(
      "https://api.openai.com/v1/realtime/calls",
      {
        method: "POST",
        body: sdpOffer,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI SDP exchange failed:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sdpAnswer = await response.text();
    console.log('SDP exchange successful, returning answer');

    return new Response(sdpAnswer, {
      headers: { ...corsHeaders, 'Content-Type': 'application/sdp' },
    });

  } catch (error) {
    console.error('SDP exchange error:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
