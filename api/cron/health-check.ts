// api/cron/health-check.ts - Separate health monitoring cron job
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

    console.log('Starting health monitoring...');

    // Lightweight health check with timeout protection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Health check timeout')), 45000)
    );

    const healthPromise = supabase.functions.invoke('motor-health-monitor', {
      body: { 
        checkBrokenImages: true,
        fixIssues: false, // Don't auto-fix during health check to save time
        generateReport: true,
        timeout: 40000
      },
    });

    const { data: healthData, error: healthError } = await Promise.race([
      healthPromise,
      timeoutPromise
    ]) as any;

    const executionTime = Date.now() - startTime;

    // Health monitoring is informational, so allow warnings
    const result = {
      health: healthData || { error: healthError?.message, partialSuccess: true },
      executionTime,
      timestamp: new Date().toISOString(),
      operation: 'health-monitoring'
    };

    if (healthError) {
      console.log('Health monitoring had issues:', healthError.message);
    } else {
      console.log(`Health monitoring completed successfully in ${executionTime}ms`);
    }

    return res.status(200).json({ 
      ok: true, 
      result,
      warning: healthError ? 'Health check completed with warnings' : null
    });

  } catch (e) {
    const executionTime = Date.now() - startTime;
    console.error('Health monitoring error:', e);
    
    return res.status(200).json({ 
      ok: false, 
      error: (e as Error)?.message || 'Health monitoring failed',
      executionTime,
      partialSuccess: true
    });
  }
}