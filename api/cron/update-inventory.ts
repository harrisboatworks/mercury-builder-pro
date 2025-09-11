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

    // First update inventory
    const { data: inventoryData, error: inventoryError } = await supabase.functions.invoke('scrape-inventory', {
      body: { trigger: 'vercel-cron', at: new Date().toISOString() },
    });

    if (inventoryError) {
      console.error('scrape-inventory error:', inventoryError);
      return res.status(500).json({ ok: false, error: inventoryError.message || 'Inventory scrape failed' });
    }

    // Then trigger image scraping for motors without images
    console.log('Triggering motor image scraping for new motors...');
    const { data: imageData, error: imageError } = await supabase.functions.invoke('scrape-motor-details', {
      body: { 
        trigger: 'auto-inventory-update',
        prioritize_missing_images: true,
        batch_size: 10
      },
    });

    if (imageError) {
      console.log('Motor image scraping had issues:', imageError.message);
      // Don't fail the whole job if image scraping fails
    }

    const result = {
      inventory: inventoryData,
      images: imageData || { error: imageError?.message }
    };

    return res.status(200).json({ ok: true, result });
  } catch (e) {
    console.error('update-inventory error:', e);
    return res.status(500).json({ ok: false, error: (e as Error)?.message || 'Unexpected error' });
  }
}
