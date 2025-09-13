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

    // Step 1: Update inventory
    const { data: inventoryData, error: inventoryError } = await supabase.functions.invoke('scrape-inventory', {
      body: { trigger: 'vercel-cron', at: new Date().toISOString() },
    });

    if (inventoryError) {
      console.error('scrape-inventory error:', inventoryError);
      return res.status(500).json({ ok: false, error: inventoryError.message || 'Inventory scrape failed' });
    }

    // Step 2: Auto-migrate images to storage (high priority - prevents data loss)
    console.log('Triggering automatic image migration...');
    const { data: migrationData, error: migrationError } = await supabase.functions.invoke('migrate-motor-images', {
      body: { 
        batchSize: 20,
        forceRedownload: false,
        autoRetry: true,
        qualityEnhancement: true
      },
    });

    if (migrationError) {
      console.log('Image migration had issues:', migrationError.message);
    }

    // Step 3: Scrape motor details and collect multiple images
    console.log('Triggering enhanced motor scraping...');
    const { data: imageData, error: imageError } = await supabase.functions.invoke('scrape-motor-details-batch', {
      body: { 
        prioritize_missing_images: true,
        batch_size: 15,
        background: true,
        multi_image_collection: true
      },
    });

    if (imageError) {
      console.log('Motor detail scraping had issues:', imageError.message);
    }

    // Step 4: Run automated health checks and self-healing
    console.log('Running automated health checks...');
    const { data: healthData, error: healthError } = await supabase.functions.invoke('motor-health-monitor', {
      body: { 
        checkBrokenImages: true,
        fixIssues: true,
        generateReport: true
      },
    });

    if (healthError) {
      console.log('Health monitoring had issues:', healthError.message);
    }

    const result = {
      inventory: inventoryData,
      migration: migrationData || { error: migrationError?.message },
      images: imageData || { error: imageError?.message },
      health: healthData || { error: healthError?.message },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({ ok: true, result });
  } catch (e) {
    console.error('update-inventory error:', e);
    return res.status(500).json({ ok: false, error: (e as Error)?.message || 'Unexpected error' });
  }
}
