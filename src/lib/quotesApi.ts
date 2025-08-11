// src/lib/quotesApi.ts
export type QuoteOption = { name: string; price: number };
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
