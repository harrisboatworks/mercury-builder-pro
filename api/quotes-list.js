// api/quotes-list.js
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    const limit = Math.min(Number(req.query?.limit) || 20, 100);
    const { data, error } = await supabaseAdmin
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.status(200).json({ ok: true, quotes: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
