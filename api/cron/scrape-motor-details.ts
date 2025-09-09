// api/cron/scrape-motor-details.ts
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 300, // 5 minutes for scraping multiple motors
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

    console.log('Starting weekly motor details pre-scraping...');

    // Get motors that need scraping (either never scraped or older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: motorsToScrape, error: fetchError } = await supabase
      .from('motor_models')
      .select('id, model, detail_url, last_scraped')
      .or(`last_scraped.is.null,last_scraped.lt.${sevenDaysAgo.toISOString()}`)
      .not('detail_url', 'is', null)
      .limit(50); // Process in batches to avoid timeouts

    if (fetchError) {
      console.error('Failed to fetch motors:', fetchError);
      return res.status(500).json({ ok: false, error: fetchError.message });
    }

    if (!motorsToScrape?.length) {
      return res.status(200).json({ 
        ok: true, 
        message: 'No motors need scraping', 
        processed: 0 
      });
    }

    console.log(`Found ${motorsToScrape.length} motors to scrape`);

    let processed = 0;
    let successful = 0;
    let failed = 0;

    // Process motors in smaller batches to avoid overwhelming the API
    for (const motor of motorsToScrape.slice(0, 20)) { // Limit to 20 per run
      try {
        console.log(`Scraping motor ${motor.id}: ${motor.model}`);
        
        const { data, error } = await supabase.functions.invoke('scrape-motor-details', {
          body: { motor_id: motor.id },
        });

        if (error) {
          console.error(`Failed to scrape motor ${motor.id}:`, error);
          failed++;
        } else {
          console.log(`Successfully scraped motor ${motor.id}`);
          
          // Update last_scraped timestamp
          await supabase
            .from('motor_models')
            .update({ last_scraped: new Date().toISOString() })
            .eq('id', motor.id);
          
          successful++;
        }

        processed++;

        // Small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing motor ${motor.id}:`, error);
        failed++;
        processed++;
      }
    }

    const result = {
      ok: true,
      message: 'Motor details pre-scraping completed',
      totalFound: motorsToScrape.length,
      processed,
      successful,
      failed,
      nextBatch: motorsToScrape.length > 20 ? motorsToScrape.length - 20 : 0
    };

    console.log('Pre-scraping results:', result);
    return res.status(200).json(result);

  } catch (e) {
    console.error('scrape-motor-details cron error:', e);
    return res.status(500).json({ 
      ok: false, 
      error: (e as Error)?.message || 'Unexpected error' 
    });
  }
}