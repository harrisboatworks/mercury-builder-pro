// api/heartbeat.js  (Vercel Serverless Function for non-Next apps)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
};

async function requireAuth(req) {
  try {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
      global: { headers: { Authorization: `Bearer ${token}` } } 
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return { user, supabase };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const authResult = await requireAuth(req);
  if (!authResult) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const { user, supabase } = authResult;

  try {
    // Use user-context supabase client (respects RLS)
    const { error } = await supabase.from('heartbeat').insert({ user_id: user.id });
    if (error) throw error;

    const { data, error: readErr } = await supabase
      .from('heartbeat')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (readErr) throw readErr;
    res.status(200).json({ ok: true, recent: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
