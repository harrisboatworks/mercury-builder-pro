export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // NOTE: Our Supabase client sends `x-session-id` for anonymous session tracking.
  // If this header isn't allowed, browsers will block Edge Function calls via CORS.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}