// api/cron/update-inventory.ts
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const isVercelCron = req.headers['x-vercel-cron'] === '1';
    const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
    const hasSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isVercelCron && !hasSecret) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return res.status(500).json({ ok: false, error: 'Missing Supabase env vars' });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data, error } = await supabase.functions.invoke('scrape-inventory', {
      body: { trigger: 'vercel-cron', at: new Date().toISOString() },
    });

    if (error) {
      console.error('scrape-inventory error:', error);
      return res.status(500).json({ ok: false, error: error.message || 'Invoke failed' });
    }

    return res.status(200).json({ ok: true, result: data });
  } catch (e) {
    console.error('update-inventory error:', e);
    return res.status(500).json({ ok: false, error: (e as Error)?.message || 'Unexpected error' });
  }
}
