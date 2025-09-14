// api/cron/scrape-details.ts - Separate motor detail scraping cron job
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 50,
};

export default async function handler(req, res) {
  const startTime = Date.now();
  
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

    console.log('Starting motor detail scraping...');

    // Optimized detail scraping with smaller batch and timeout protection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Detail scraping timeout')), 45000)
    );

    const detailPromise = supabase.functions.invoke('scrape-motor-details-batch', {
      body: { 
        prioritize_missing_images: true,
        batch_size: 8, // Reduced from 15
        background: true,
        multi_image_collection: false, // Simplified to save time
        timeout: 40000
      },
    });

    const { data: detailData, error: detailError } = await Promise.race([
      detailPromise,
      timeoutPromise
    ]) as any;

    const executionTime = Date.now() - startTime;

    // Allow partial success for detail scraping
    const result = {
      details: detailData || { error: detailError?.message, partialSuccess: true },
      executionTime,
      timestamp: new Date().toISOString(),
      operation: 'detail-scraping'
    };

    if (detailError) {
      console.log('Motor detail scraping had issues:', detailError.message);
    } else {
      console.log(`Detail scraping completed successfully in ${executionTime}ms`);
    }

    return res.status(200).json({ 
      ok: true, 
      result,
      warning: detailError ? 'Detail scraping completed with warnings' : null
    });

  } catch (e) {
    const executionTime = Date.now() - startTime;
    console.error('Detail scraping error:', e);
    
    return res.status(200).json({ 
      ok: false, 
      error: (e as Error)?.message || 'Detail scraping failed',
      executionTime,
      partialSuccess: true
    });
  }
}