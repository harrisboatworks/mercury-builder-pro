// api/quotes-list.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Enhanced security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
};

// Rate limiting store (in-memory for demo - use Redis in production)
const rateLimitStore = new Map();

function checkRateLimit(userId, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(userId)) {
    rateLimitStore.set(userId, []);
  }
  
  const requests = rateLimitStore.get(userId).filter(time => time > windowStart);
  requests.push(now);
  rateLimitStore.set(userId, requests);
  
  return requests.length <= maxRequests;
}

async function requireAuth(req) {
  try {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
      global: { headers: { Authorization: `Bearer ${token}` } } 
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return { user, supabase };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const authResult = await requireAuth(req);
  if (!authResult) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const { user, supabase } = authResult;

  // Rate limiting
  if (!checkRateLimit(user.id)) {
    return res.status(429).json({ ok: false, error: 'Rate limit exceeded' });
  }

  try {
    const limit = Math.min(Number(req.query?.limit) || 20, 100);
    
    // Use user-context supabase client (respects RLS)
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // Log access for audit trail
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action: 'quotes_list_accessed',
        table_name: 'quotes',
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      });

    res.status(200).json({ ok: true, quotes: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
