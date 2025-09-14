// api/cron/status.ts - Monitoring endpoint for all cron jobs
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 30,
};

interface CronJobStatus {
  name: string;
  endpoint: string;
  lastRun?: string;
  status: 'success' | 'error' | 'unknown';
  executionTime?: number;
  error?: string;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return res.status(500).json({ ok: false, error: 'Missing Supabase env vars' });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get recent inventory update records
    const { data: trackingData } = await supabase
      .from('inventory_updates')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    const cronJobs: CronJobStatus[] = [
      {
        name: 'Inventory Update',
        endpoint: '/api/cron/update-inventory',
        status: 'unknown'
      },
      {
        name: 'Image Migration',
        endpoint: '/api/cron/migrate-images', 
        status: 'unknown'
      },
      {
        name: 'Detail Scraping',
        endpoint: '/api/cron/scrape-details',
        status: 'unknown'
      },
      {
        name: 'Health Check',
        endpoint: '/api/cron/health-check',
        status: 'unknown'
      }
    ];

    // Get latest motor data to check freshness
    const { data: motorData } = await supabase
      .from('motor_models')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const stats = {
      lastDataUpdate: motorData?.updated_at,
      recentTracking: trackingData?.slice(0, 5) || [],
      cronJobs,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({ 
      ok: true, 
      stats 
    });

  } catch (e) {
    console.error('Status check error:', e);
    return res.status(500).json({ 
      ok: false, 
      error: (e as Error)?.message || 'Status check failed' 
    });
  }
}