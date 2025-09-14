// Simple test endpoint to verify API routing works
export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  try {
    console.log('Test endpoint called, method:', req.method);
    
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    return res.status(200).json({ 
      ok: true, 
      message: 'Test endpoint working',
      method: req.method,
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('Test endpoint error:', e);
    return res.status(500).json({ 
      ok: false, 
      error: (e as Error)?.message || 'Test endpoint failed' 
    });
  }
}