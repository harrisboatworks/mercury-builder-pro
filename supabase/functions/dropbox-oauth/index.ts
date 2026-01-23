import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Dropbox OAuth handler called');
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code not provided' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Get Dropbox app credentials from environment
    const appKey = Deno.env.get('DROPBOX_APP_KEY');
    const appSecret = Deno.env.get('DROPBOX_APP_SECRET');
    
    if (!appKey || !appSecret) {
      console.error('Missing Dropbox app credentials');
      return new Response(
        JSON.stringify({ error: 'Dropbox app not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${appKey}:${appSecret}`)}`
      },
      body: new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${url.origin}/admin/motor-images` // Adjust as needed
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Failed to exchange code for token:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to get access token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const tokenData = await tokenResponse.json();
    
    console.log('Successfully obtained Dropbox access token');

    // Return the access token (in production, you might want to store this securely)
    return new Response(
      JSON.stringify({ 
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        state: state
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in Dropbox OAuth handler:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'OAuth exchange failed',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});