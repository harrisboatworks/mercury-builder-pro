// api/quotes.js  — Vercel serverless function
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
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
};

// Input sanitization function
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>'"`;(){}]/g, '')
      .trim()
      .substring(0, 1000);
  }
  return input;
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

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Use POST' });
  }

  const authResult = await requireAuth(req);
  if (!authResult) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const { user, supabase } = authResult;

  // Parse JSON body (works whether req.body is object or string)
  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch (e) {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  }

  // Sanitize inputs to prevent injection attacks
  const {
    customer_name = '',
    customer_email = '',
    customer_phone = '',
    salesperson = '',
    boat_model = '',
    motor_model = '',
    motor_hp = 0,
    base_price = 0,
    discount = 0,
    options = [],
    tax_rate = 13,     // HST default
    notes = ''
  } = body || {};

  // Sanitize string inputs
  const sanitizedData = {
    customer_name: sanitizeInput(customer_name),
    customer_email: sanitizeInput(customer_email),
    customer_phone: sanitizeInput(customer_phone),
    salesperson: sanitizeInput(salesperson),
    boat_model: sanitizeInput(boat_model),
    motor_model: sanitizeInput(motor_model),
    notes: sanitizeInput(notes)
  };

  const num = (v) => Number.isFinite(+v) ? +v : 0;
  const safeOptions = Array.isArray(options) ? options : [];
  const optionsTotal = safeOptions.reduce((s, o) => s + num(o?.price), 0);

  const subtotal   = Math.max(0, num(base_price) + optionsTotal - num(discount));
  const tax_amount = +(subtotal * (num(tax_rate) / 100)).toFixed(2);
  const total      = +(subtotal + tax_amount).toFixed(2);

  try {
    // Use user-context supabase client (respects RLS) instead of admin client
    const { data, error } = await supabase
      .from('quotes')
      .insert([{
        status: 'draft',
        customer_name: sanitizedData.customer_name,
        customer_email: sanitizedData.customer_email, 
        customer_phone: sanitizedData.customer_phone,
        salesperson: sanitizedData.salesperson,
        boat_model: sanitizedData.boat_model,
        motor_model: sanitizedData.motor_model,
        motor_hp,
        base_price: num(base_price),
        discount: num(discount),
        options: safeOptions,
        subtotal, 
        tax_rate: num(tax_rate), 
        tax_amount, 
        total,
        notes: sanitizedData.notes,
        user_id: user.id // Associate quote with authenticated user for security
      }])
      .select()
      .single();

    if (error) throw error;

    // Log creation for audit trail
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action: 'quote_created',
        table_name: 'quotes',
        record_id: data.id,
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent']
      });

    return res.status(200).json({ ok: true, created: data });
  } catch (e) {
    console.error('Quote creation error:', e);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
