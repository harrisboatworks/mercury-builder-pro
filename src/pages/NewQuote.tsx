import { useState } from 'react';
import { createQuote, QuoteOption } from '../lib/quotesApi';

export default function NewQuote() {
  const [form, setForm] = useState({
    customer_name: '',
    salesperson: 'Jay Harris',
    boat_model: '',
    motor_model: '',
    motor_hp: 0,
    base_price: 0,
    discount: 0,
    tax_rate: 13,
    notes: ''
  });
  const [options, setOptions] = useState<QuoteOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, val: any) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function addOption() {
    setOptions((o) => [...o, { name: '', price: 0 }]);
  }

  function updateOption(i: number, key: keyof QuoteOption, val: any) {
    setOptions((o) => o.map((row, idx) => idx === i ? { ...row, [key]: key === 'price' ? Number(val) : val } : row));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null); setResult(null);
    try {
      const payload = { ...form, base_price: Number(form.base_price), discount: Number(form.discount), motor_hp: Number(form.motor_hp), tax_rate: Number(form.tax_rate), options };
      const res = await createQuote(payload);
      setResult(res.created);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>New Quote</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
        <input placeholder="Customer name" value={form.customer_name} onChange={e=>update('customer_name', e.target.value)} />
        <input placeholder="Salesperson" value={form.salesperson} onChange={e=>update('salesperson', e.target.value)} />
        <input placeholder="Boat model" value={form.boat_model} onChange={e=>update('boat_model', e.target.value)} />
        <input placeholder="Motor model" value={form.motor_model} onChange={e=>update('motor_model', e.target.value)} />
        <input placeholder="Motor HP" type="number" value={form.motor_hp} onChange={e=>update('motor_hp', e.target.value)} />
        <input placeholder="Base price" type="number" value={form.base_price} onChange={e=>update('base_price', e.target.value)} />
        <input placeholder="Discount" type="number" value={form.discount} onChange={e=>update('discount', e.target.value)} />
        <input placeholder="Tax rate (%)" type="number" value={form.tax_rate} onChange={e=>update('tax_rate', e.target.value)} />
        <textarea placeholder="Notes" value={form.notes} onChange={e=>update('notes', e.target.value)} />

        <div>
          <strong>Options</strong> <button type="button" onClick={addOption}>+ add</button>
          {options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input style={{ flex: 1 }} placeholder="Name" value={opt.name} onChange={e=>updateOption(i,'name',e.target.value)} />
              <input style={{ width: 130 }} placeholder="Price" type="number" value={opt.price} onChange={e=>updateOption(i,'price',e.target.value)} />
            </div>
          ))}
        </div>

        <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Quote'}</button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {result && (
        <>
          <h3 style={{ marginTop: 16 }}>Created</h3>
          <pre style={{ background:'#111', color:'#0f0', padding:12, borderRadius:8 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
