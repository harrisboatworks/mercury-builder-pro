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
    console.log('Getting Dropbox configuration...');
    
    // Get the Dropbox app key from environment variables (Supabase secrets)
    const dropboxAppKey = Deno.env.get('DROPBOX_APP_KEY');
    
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

    console.log('Successfully retrieved Dropbox app key');

    // Return the app key
    return new Response(
      JSON.stringify({ 
        appKey: dropboxAppKey,
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