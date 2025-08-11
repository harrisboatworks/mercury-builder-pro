// api/quotes-seed.js
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
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
