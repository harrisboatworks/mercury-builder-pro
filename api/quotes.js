// api/quotes.js  — Vercel serverless function
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Use POST' });
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
