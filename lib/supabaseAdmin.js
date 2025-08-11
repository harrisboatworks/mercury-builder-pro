// lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client using the service role key
// DO NOT import into any client/browser code!
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
