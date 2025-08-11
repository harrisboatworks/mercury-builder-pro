// api/heartbeat.js  (Vercel Serverless Function for non-Next apps)
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
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
