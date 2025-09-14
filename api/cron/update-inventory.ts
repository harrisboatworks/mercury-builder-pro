// api/cron/update-inventory.ts - Optimized inventory-only update
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 50, // Reduced from 60 to allow buffer
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

    console.log('Starting inventory-only update...');

    // Single operation: Update inventory with timeout protection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Inventory update timeout')), 45000)
    );

    const inventoryPromise = supabase.functions.invoke('scrape-inventory-v2', {
      body: { 
        trigger: 'cron-inventory-only', 
        source: 'html', // FIXED: Add source parameter
        useXmlFeed: false, // FIXED: Add useXmlFeed parameter  
        at: new Date().toISOString(),
        timeout: 40000 // Internal timeout
      },
    });

    const { data: inventoryData, error: inventoryError } = await Promise.race([
      inventoryPromise,
      timeoutPromise
    ]) as any;

    const executionTime = Date.now() - startTime;
    
    if (inventoryError) {
      console.error('Inventory scrape error:', inventoryError);
      return res.status(200).json({ 
        ok: false, 
        error: inventoryError.message || 'Inventory scrape failed',
        executionTime,
        partialSuccess: false
      });
    }

    console.log(`Inventory update completed successfully in ${executionTime}ms`);
    
    return res.status(200).json({ 
      ok: true, 
      result: {
        inventory: inventoryData,
        executionTime,
        timestamp: new Date().toISOString(),
        operation: 'inventory-only'
      }
    });

  } catch (e) {
    const executionTime = Date.now() - startTime;
    console.error('Inventory update error:', e);
    
    return res.status(200).json({ 
      ok: false, 
      error: (e as Error)?.message || 'Unexpected error',
      executionTime,
      partialSuccess: false
    });
  }
}