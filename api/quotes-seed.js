// api/quotes-seed.js
import { createClient } from '@supabase/supabase-js';
import { SecurityManager, SECURITY_HEADERS } from '../src/lib/securityMiddleware.ts';

const SUPABASE_URL = 'https://eutsoqdpjurknjsshxes.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const securityManager = new SecurityManager();

async function requireAuth(req) {
  const clientIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Enhanced rate limiting
  if (!(await SecurityManager.checkRateLimit(clientIp, 'auth_check'))) {
    throw new Error('Rate limit exceeded');
  }

  try {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    
    const token = auth.slice(7);
    
    // Enhanced token validation
    if (token.length < 10 || !/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)) {
      console.warn('Invalid token format detected');
      await SecurityManager.logSecurityEvent('unknown', 'invalid_token', 'quotes_seed', null, {
        ip: clientIp,
        userAgent
      });
      return null;
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
      global: { headers: { Authorization: `Bearer ${token}` } } 
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    
    // Track session activity with SecurityManager
    await SecurityManager.trackSessionActivity({
      userId: user.id,
      sessionId: token.substring(0, 16),
      ipAddress: clientIp,
      userAgent
    });
    
    return user;
  } catch (error) {
    await SecurityManager.logSecurityEvent('unknown', 'auth_failure', 'quotes_seed', null, {
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

    // Enhanced input validation and sanitization
    const insert = SecurityManager.sanitizeInput({
      status: 'draft',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '555-0100',
      salesperson: 'Jay Harris',
      boat_model: 'Legend 18',
      motor_model: 'Mercury 115 EFI',
      motor_hp: Math.max(0, Math.min(1000, 115)), // Validate HP range
      base_price: Math.max(0, base_price), // Ensure positive price
      discount: Math.max(0, discount), // Ensure positive discount
      options: Array.isArray(options) ? options.slice(0, 20) : [], // Limit options array
      subtotal: Math.max(0, subtotal), // Ensure positive subtotal
      tax_rate: Math.max(0, Math.min(100, tax_rate)), // Validate tax rate
      tax_amount: Math.max(0, tax_amount), // Ensure positive tax
      total: Math.max(0, total), // Ensure positive total
      notes: 'Seed quote from /api/quotes-seed',
      user_id: user.id
    });

    const { data, error } = await supabaseAdmin
      .from('quotes')
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    
    // Log successful quote creation with enhanced metadata
    await SecurityManager.logSecurityEvent(user.id, 'create', 'quotes', data.id, {
      action: 'seed_quote_created',
      total_amount: total,
      ip_address: req.headers['x-forwarded-for'],
      user_agent: req.headers['user-agent']
    });
    
    res.status(200).json({ ok: true, created: data });
  } catch (e) {
    // Enhanced error logging with more context
    const errorUser = typeof user !== 'undefined' ? user?.id : 'unknown';
    await SecurityManager.logSecurityEvent(errorUser, 'error', 'quotes_seed', null, {
      error: e.message,
      stack: e.stack?.substring(0, 500), // Limit stack trace length
      ip: req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    
    // Return generic error message to avoid information leakage
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = isProduction ? 'An error occurred while processing your request' : e.message;
    
    res.status(500).json({ ok: false, error: errorMessage });
  }
}
