import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple cron handler for stock sync
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[CRON] Starting scheduled stock sync...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    // Call the stock-inventory-sync Edge Function
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/stock-inventory-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preview: false })
    });

    const syncResult = await syncResponse.json();

    if (!syncResponse.ok) {
      throw new Error(`Sync failed: ${syncResult.error || 'Unknown error'}`);
    }

    console.log('[CRON] Stock sync completed successfully:', syncResult);

    return res.status(200).json({
      success: true,
      message: 'Stock sync completed successfully',
      result: syncResult
    });

  } catch (error) {
    console.error('[CRON] Stock sync failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Vercel configuration
export const config = {
  maxDuration: 300, // 5 minutes
};