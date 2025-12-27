import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { sdpOffer, ephemeralKey } = await req.json();

    if (!sdpOffer || !ephemeralKey) {
      console.error('Missing required fields:', { hasSdpOffer: !!sdpOffer, hasKey: !!ephemeralKey });
      return new Response(
        JSON.stringify({ error: 'Missing sdpOffer or ephemeralKey' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Proxying SDP exchange to OpenAI...');

    // Proxy the SDP exchange to OpenAI
    // NOTE: using the known-working realtime model endpoint.
    const response = await fetch(
      "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
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
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
