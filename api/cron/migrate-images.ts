// api/cron/migrate-images.ts - Separate image migration cron job
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

    console.log('Starting image migration process...');

    // Optimized image migration with smaller batch size and timeout protection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Image migration timeout')), 45000)
    );

    const migrationPromise = supabase.functions.invoke('migrate-motor-images', {
      body: { 
        batchSize: 10, // Reduced batch size
        forceRedownload: false,
        autoRetry: true,
        qualityEnhancement: false, // Disable to save time
        timeout: 40000
      },
    });

    const { data: migrationData, error: migrationError } = await Promise.race([
      migrationPromise,
      timeoutPromise
    ]) as any;

    const executionTime = Date.now() - startTime;

    // Don't fail completely if migration has issues - it's not critical
    const result = {
      migration: migrationData || { error: migrationError?.message, partialSuccess: true },
      executionTime,
      timestamp: new Date().toISOString(),
      operation: 'image-migration'
    };

    if (migrationError) {
      console.log('Image migration had issues:', migrationError.message);
    } else {
      console.log(`Image migration completed successfully in ${executionTime}ms`);
    }

    return res.status(200).json({ 
      ok: true, 
      result,
      warning: migrationError ? 'Migration completed with warnings' : null
    });

  } catch (e) {
    const executionTime = Date.now() - startTime;
    console.error('Image migration error:', e);
    
    return res.status(200).json({ 
      ok: false, 
      error: (e as Error)?.message || 'Image migration failed',
      executionTime,
      partialSuccess: true // Allow partial success for non-critical operations
    });
  }
}