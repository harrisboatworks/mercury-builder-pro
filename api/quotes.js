// api/quotes.js  — Vercel serverless function
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function requireAuth(req) {
  try {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Use POST' });
  }

  const user = await requireAuth(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // Parse JSON body (works whether req.body is object or string)
  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch (e) {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  }

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

  const num = (v) => Number.isFinite(+v) ? +v : 0;
  const safeOptions = Array.isArray(options) ? options : [];
  const optionsTotal = safeOptions.reduce((s, o) => s + num(o?.price), 0);

  const subtotal   = Math.max(0, num(base_price) + optionsTotal - num(discount));
  const tax_amount = +(subtotal * (num(tax_rate) / 100)).toFixed(2);
  const total      = +(subtotal + tax_amount).toFixed(2);

  try {
    const { data, error } = await supabaseAdmin
      .from('quotes')
      .insert([{
        status: 'draft',
        customer_name, customer_email, customer_phone, salesperson,
        boat_model, motor_model, motor_hp,
        base_price: num(base_price),
        discount: num(discount),
        options: safeOptions,
        subtotal, tax_rate: num(tax_rate), tax_amount, total,
        notes
      }])
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ ok: true, created: data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
