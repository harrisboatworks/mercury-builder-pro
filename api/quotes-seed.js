// api/quotes-seed.js
import { createClient } from '@supabase/supabase-js';
import { SecurityManager, SECURITY_HEADERS } from '../src/lib/securityMiddleware.ts';

const SUPABASE_URL = 'https://eutsoqdpjurknjsshxes.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU';

const securityManager = new SecurityManager();

async function requireAuth(req) {
  const clientIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Rate limiting
  if (!(await securityManager.checkRateLimit(clientIp, 'auth_check'))) {
    throw new Error('Rate limit exceeded');
  }

  try {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
      global: { headers: { Authorization: `Bearer ${token}` } } 
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    
    // Track session activity
    await securityManager.trackSessionActivity({
      userId: user.id,
      sessionId: token.substring(0, 16),
      ipAddress: clientIp,
      userAgent
    });
    
    return user;
  } catch (error) {
    await securityManager.logSecurityEvent('unknown', 'auth_failure', 'quotes_seed', null, {
      error: error.message,
      ip: clientIp,
      userAgent
    });
    return null;
  }
}

export default async function handler(req, res) {
  // Apply security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    const user = await requireAuth(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const options = [
      { name: 'Stainless Prop', price: 350 },
      { name: 'Rigging Kit',    price: 499 }
    ];

    const base_price = 12500;   // example motor/boat price
    const discount   = 300;     // sample discount
    const optionsTotal = options.reduce((s, o) => s + (Number(o.price) || 0), 0);
    const subtotal = Math.max(0, base_price + optionsTotal - discount);
    const tax_rate = 13; // HST default
    const tax_amount = +(subtotal * (tax_rate / 100)).toFixed(2);
    const total = +(subtotal + tax_amount).toFixed(2);

    const insert = securityManager.sanitizeInput({
      status: 'draft',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '555-0100',
      salesperson: 'Jay Harris',
      boat_model: 'Legend 18',
      motor_model: 'Mercury 115 EFI',
      motor_hp: 115,
      base_price, discount, options,
      subtotal, tax_rate, tax_amount, total,
      notes: 'Seed quote from /api/quotes-seed',
      user_id: user.id
    });

    const { data, error } = await supabaseAdmin
      .from('quotes')
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    
    // Log successful quote creation
    await securityManager.logSecurityEvent(user.id, 'create', 'quotes', data.id, {
      action: 'seed_quote_created'
    });
    
    res.status(200).json({ ok: true, created: data });
  } catch (e) {
    await securityManager.logSecurityEvent(user?.id || 'unknown', 'error', 'quotes_seed', null, {
      error: e.message
    });
    res.status(500).json({ ok: false, error: e.message });
  }
}
