export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // NOTE: Our Supabase client sends `x-session-id` for anonymous session tracking,
  // plus x-supabase-client-* headers. All must be allowed for CORS preflight to pass.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}