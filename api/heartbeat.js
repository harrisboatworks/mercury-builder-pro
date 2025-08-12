// api/heartbeat.js  (Vercel Serverless Function for non-Next apps)
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function requireAuth(req) {
  try {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const user = await requireAuth(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  try {
    const { error } = await supabaseAdmin.from('heartbeat').insert({});
    if (error) throw error;

    const { data, error: readErr } = await supabaseAdmin
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
