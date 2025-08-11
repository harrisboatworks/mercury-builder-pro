// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Browser-safe client (uses anon key + respects RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
