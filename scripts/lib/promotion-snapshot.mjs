import { escHtml } from './youtube-embed-html.mjs';

export function promotionDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function selectSnapshotPromotion(rows, now = new Date()) {
  if (!Array.isArray(rows)) throw new Error('Promotion response must be an array');
  const today = promotionDay(now);
  const active = rows.filter(row => {
    if (!row || typeof row !== 'object' || typeof row.name !== 'string' || typeof row.is_active !== 'boolean') throw new Error('Malformed promotion record');
    for (const key of ['start_date', 'end_date']) {
      if (row[key] != null && (typeof row[key] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row[key]) || new Date(row[key]).toISOString().slice(0, 10) !== row[key])) throw new Error('Malformed promotion date');
    }
    // Match Promotions.tsx: null date bounds are not selected by lte/gte.
    return row.is_active && row.start_date && row.end_date && row.start_date <= today && row.end_date >= today;
  }).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return active.find(row => (row.promo_options?.options?.length ?? 0) > 0) || active[0] || null;
}

export async function loadSnapshotPromotion({ baseUrl, publicKey, fetcher, now = new Date() }) {
  const url = new URL('/rest/v1/promotions', baseUrl);
  url.searchParams.set('select', 'name,is_active,start_date,end_date,priority,bonus_description,details,promo_options');
  url.searchParams.set('is_active', 'eq.true');
  url.searchParams.set('start_date', `lte.${promotionDay(now)}`);
  url.searchParams.set('end_date', `gte.${promotionDay(now)}`);
  url.searchParams.set('order', 'priority.desc');
  const response = await fetcher(url, { headers: { apikey: publicKey, Authorization: `Bearer ${publicKey}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Public promotion snapshot HTTP ${response.status}`);
  return selectSnapshotPromotion(await response.json(), now);
}

export function renderSnapshotPromotion(promotion) {
  if (!promotion) return '<section><h2>Check current Mercury offers</h2><p>Mercury rebates and financing programs change. Build a quote or contact Harris Boat Works for the current written offer and eligibility terms.</p><p><a href="/quote/motor-selection">Build a Mercury quote</a></p></section>';
  const text = value => {
    if (value == null) return '';
    if (typeof value !== 'string') throw new Error('Malformed promotion text');
    return escHtml(value);
  };
  const paragraph = value => value == null ? '' : `<p>${text(value)}</p>`;
  const list = value => {
    if (value == null) return '';
    if (!Array.isArray(value)) throw new Error('Malformed promotion list');
    return `<ul>${value.map(item => `<li>${text(item)}</li>`).join('')}</ul>`;
  };
  const d = promotion.details ?? {};
  if (typeof d !== 'object' || Array.isArray(d)) throw new Error('Malformed promotion details');
  return '<section>' + `<h2>${text(promotion.name)}</h2>` +
    paragraph(`${promotion.start_date} – ${promotion.end_date}`) +
    paragraph(promotion.bonus_description) + paragraph(d.artwork_clarification) +
    paragraph(d.coverage_summary) + paragraph(d.financing_qualification) +
    '<h3>Eligibility and full offer conditions</h3>' +
    list(d.eligibility?.products) + paragraph(d.eligibility?.use) + paragraph(d.eligibility?.stock_requirement) +
    list(d.requirements) + paragraph(d.legal) +
    (d.eligibility?.exclusions?.length ? '<h4>Excluded</h4>' + list(d.eligibility.exclusions) : '') +
    '<p><a href="/quote/motor-selection">Build Your Repower Quote</a></p></section>';
}
