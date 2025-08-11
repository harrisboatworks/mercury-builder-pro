// src/lib/quotesApi.ts

// --- Types ---
export type QuoteOption = { name: string; price: number };

export type CreateQuoteInput = {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  salesperson?: string;
  boat_model?: string;
  motor_model?: string;
  motor_hp?: number;
  base_price?: number;
  discount?: number;
  options?: QuoteOption[];
  tax_rate?: number; // default 13
  notes?: string;
};

// --- Existing helpers ---
export async function seedQuote() {
  const res = await fetch('/api/quotes-seed');
  if (!res.ok) throw new Error(`Seed failed: ${res.status}`);
  return res.json();
}

export async function listQuotes(limit = 20) {
  const res = await fetch(`/api/quotes-list?limit=${limit}`);
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean; quotes: any[] }>;
}

// --- New: create a real quote (POST) ---
export async function createQuote(input: CreateQuoteInput) {
  const res = await fetch('/api/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Create failed: ${res.status}`);
  }
  return res.json() as Promise<{ ok: true; created: any }>;
}
