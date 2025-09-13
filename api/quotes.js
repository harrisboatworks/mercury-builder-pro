// api/quotes.js  — Vercel serverless function with enhanced security
import { createClient } from '@supabase/supabase-js';
import { SecurityManager, SECURITY_HEADERS } from '../src/lib/securityMiddleware.ts';

const SUPABASE_URL = "https://eutsoqdpjurknjsshxes.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU";

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

// Enhanced authentication with security logging
async function requireAuth(req) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  try {
    // Check rate limit before processing authentication
    const canProceed = await SecurityManager.checkRateLimit(clientIp, 'auth_attempt', 10, 15);
    if (!canProceed) {
      await SecurityManager.logSecurityEvent(
        'unknown',
        'auth_rate_limit_exceeded', 
        'quotes',
        undefined,
        { ip: clientIp, userAgent }
      );
      return null;
    }

    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      await SecurityManager.logSecurityEvent(
        'unknown',
        'missing_auth_header',
        'quotes',
        undefined,
        { ip: clientIp, userAgent }
      );
      return null;
    }
    
    const token = auth.slice(7);
    
    // Enhanced token validation
    if (token.length < 10 || !/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)) {
      await SecurityManager.logSecurityEvent(
        'unknown',
        'invalid_token_format',
        'quotes',
        undefined,
        { ip: clientIp, userAgent }
      );
      return null;
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
      global: { headers: { Authorization: `Bearer ${token}` } } 
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      await SecurityManager.logSecurityEvent(
        'unknown',
        'auth_validation_failed',
        'quotes',
        undefined,
        { error: error?.message, ip: clientIp, userAgent }
      );
      return null;
    }
    
    // Track successful authentication
    await SecurityManager.trackSessionActivity({
      userId: user.id,
      ipAddress: clientIp,
      userAgent
    });
    
    return { user, supabase };
  } catch (error) {
    await SecurityManager.logSecurityEvent(
      'unknown',
      'auth_error',
      'quotes',
      undefined,
      { error: error.message, ip: clientIp, userAgent }
    );
    return null;
  }
}

export default async function handler(req, res) {
  // Add enhanced security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const authResult = await requireAuth(req);
  if (!authResult) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const { user, supabase } = authResult;
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'];

  // Parse and validate JSON body
  let body = req.body;
  if (!body || typeof body === 'string') {
    try { 
      body = JSON.parse(body || '{}'); 
    } catch (e) {
      await SecurityManager.logSecurityEvent(
        user.id,
        'invalid_json_body',
        'quotes',
        undefined,
        { error: e.message, ip: clientIp, userAgent }
      );
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  }

  // Enhanced input sanitization using SecurityManager
  const sanitizedBody = SecurityManager.sanitizeInput(body);
  
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
    tax_rate = 13,
    notes = ''
  } = sanitizedBody || {};

  // Validate numerical inputs with bounds checking
  const num = (v, min = 0, max = 1000000) => {
    const parsed = Number.isFinite(+v) ? +v : 0;
    return Math.max(min, Math.min(max, parsed));
  };
  
  const safeOptions = Array.isArray(options) ? options.slice(0, 20) : []; // Limit options array
  const optionsTotal = safeOptions.reduce((s, o) => s + num(o?.price || 0, 0, 50000), 0);

  const validatedData = {
    motor_hp: num(motor_hp, 0, 1000),
    base_price: num(base_price, 0, 500000),
    discount: num(discount, 0, 100000),
    tax_rate: num(tax_rate, 0, 50)
  };

  const subtotal = Math.max(0, validatedData.base_price + optionsTotal - validatedData.discount);
  const tax_amount = +(subtotal * (validatedData.tax_rate / 100)).toFixed(2);
  const total = +(subtotal + tax_amount).toFixed(2);

  try {
    // Use user-context supabase client (respects RLS)
    const { data, error } = await supabase
      .from('quotes')
      .insert([{
        status: 'draft',
        customer_name,
        customer_email, 
        customer_phone,
        salesperson,
        boat_model,
        motor_model,
        motor_hp: validatedData.motor_hp,
        base_price: validatedData.base_price,
        discount: validatedData.discount,
        options: safeOptions,
        subtotal, 
        tax_rate: validatedData.tax_rate, 
        tax_amount, 
        total,
        notes,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;

    // Enhanced audit logging
    await SecurityManager.logSecurityEvent(
      user.id,
      'quote_created',
      'quotes',
      data.id,
      { 
        total_amount: total,
        ip: clientIp,
        userAgent,
        customer_email: customer_email
      }
    );

    return res.status(200).json({ ok: true, created: data });
  } catch (e) {
    console.error('Quote creation error:', e);
    
    // Log the error for security monitoring
    await SecurityManager.logSecurityEvent(
      user.id,
      'quote_creation_failed',
      'quotes',
      undefined,
      { 
        error: e.message,
        ip: clientIp,
        userAgent 
      }
    );
    
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
