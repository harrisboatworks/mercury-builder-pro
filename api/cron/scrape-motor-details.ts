// api/cron/scrape-motor-details.ts
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 300, // 5 minutes for bulk scraping
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

    // Get all motors that need details updated (older than 7 days or no details)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: motorsToUpdate, error: fetchError } = await supabase
      .from('motor_models')
      .select('id, model, detail_url, updated_at, description')
      .or(`updated_at.lt.${sevenDaysAgo},description.is.null`)
      .not('detail_url', 'is', null)
      .limit(50); // Process 50 motors per run to avoid timeouts

    if (fetchError) {
      console.error('Failed to fetch motors:', fetchError);
      return res.status(500).json({ ok: false, error: fetchError.message });
    }

    if (!motorsToUpdate?.length) {
      return res.status(200).json({ 
        ok: true, 
        message: 'No motors need updating',
        motors_processed: 0 
      });
    }

    console.log(`Processing ${motorsToUpdate.length} motors for detail updates`);
    
    let processed = 0;
    let errors = 0;
    const results = [];

    // Process motors in batches to avoid overwhelming the scraping service
    for (const motor of motorsToUpdate) {
      try {
        console.log(`Scraping details for motor ${motor.id}: ${motor.model}`);
        
        const { data, error } = await supabase.functions.invoke('scrape-motor-details', {
          body: { 
            motor_id: motor.id,
            force_refresh: true
          },
        });

        if (error) {
          console.error(`Failed to scrape motor ${motor.id}:`, error);
          errors++;
          results.push({ motor_id: motor.id, model: motor.model, status: 'error', error: error.message });
        } else {
          processed++;
          results.push({ motor_id: motor.id, model: motor.model, status: 'success' });
        }

        // Add small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (e) {
        console.error(`Exception processing motor ${motor.id}:`, e);
        errors++;
        results.push({ motor_id: motor.id, model: motor.model, status: 'exception', error: (e as Error).message });
      }
    }

    return res.status(200).json({ 
      ok: true, 
      motors_processed: processed,
      errors: errors,
      total_attempted: motorsToUpdate.length,
      results: results.slice(0, 10) // Return first 10 results as sample
    });
    
  } catch (e) {
    console.error('Cron job error:', e);
    return res.status(500).json({ 
      ok: false, 
      error: (e as Error)?.message || 'Unexpected error' 
    });
  }
}