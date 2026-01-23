import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    console.log('Getting Dropbox configuration...');
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'config';
    
    // Get Dropbox credentials from environment
    const dropboxAppKey = Deno.env.get('DROPBOX_APP_KEY');
    const dropboxAppSecret = Deno.env.get('DROPBOX_APP_SECRET');
    const dropboxAccessToken = Deno.env.get('DROPBOX_ACCESS_TOKEN');
    
    if (!dropboxAppKey) {
      console.error('DROPBOX_APP_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Dropbox app key not configured',
          appKey: null 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Successfully retrieved Dropbox configuration');

    if (action === 'oauth-url') {
      // Generate OAuth authorization URL
      if (!dropboxAppSecret) {
        return new Response(
          JSON.stringify({ 
            error: 'Dropbox app secret not configured for OAuth',
            appKey: dropboxAppKey,
            hasOAuth: false
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const state = crypto.randomUUID();
      const redirectUri = `${url.origin}/admin/motor-images`;
      
      const oauthUrl = `https://www.dropbox.com/oauth2/authorize?` +
        `client_id=${dropboxAppKey}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`;

      return new Response(
        JSON.stringify({ 
          oauthUrl,
          state,
          redirectUri,
          hasOAuth: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return basic configuration
    return new Response(
      JSON.stringify({ 
        appKey: dropboxAppKey,
        hasOAuth: !!dropboxAppSecret,
        hasAccessToken: !!dropboxAccessToken,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error getting Dropbox config:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get Dropbox configuration',
        details: error.message,
        appKey: null 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});