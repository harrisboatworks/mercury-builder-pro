// api/quotes-seed.js
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
  const user = await requireAuth(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  try {
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

    const insert = {
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
      notes: 'Seed quote from /api/quotes-seed'
    };

    const { data, error } = await supabaseAdmin
      .from('quotes')
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ ok: true, created: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
