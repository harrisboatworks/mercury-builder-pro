#!/usr/bin/env node
/**
 * Build-time fetch of live Google Places data (rating, review count, hours)
 * from the existing `google-places` Supabase edge function. The result is
 * cached to src/data/google-places-cache.json so the static prerender and
 * any runtime React component can emit consistent JSON-LD structured data
 * that matches what Google itself shows.
 *
 * Safe to fail: if the network call fails, we keep the previous cache so
 * builds never break and structured data never disappears.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '..', 'src', 'data', 'google-places-cache.json');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eutsoqdpjurknjsshxes.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Google's weekdayText format: "Monday: 8:00 AM – 5:00 PM" / "Closed" / "Open 24 hours"
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function to24h(h, m, period) {
  let hour = parseInt(h, 10);
  const mm = String(parseInt(m, 10)).padStart(2, '0');
  const p = period.toLowerCase().replace(/\./g, '');
  if (p === 'pm' && hour !== 12) hour += 12;
  if (p === 'am' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${mm}`;
}

function parseWeekdayText(weekdayText) {
  if (!Array.isArray(weekdayText)) return [];
  const out = [];
  weekdayText.forEach((line, idx) => {
    const day = DAY_NAMES[idx];
    if (!day) return;
    const lower = line.toLowerCase();
    if (lower.includes('closed')) return; // omit closed days
    if (lower.includes('24 hours') || lower.includes('open 24')) {
      out.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: day, opens: '00:00', closes: '23:59' });
      return;
    }
    const m = line.match(/(\d{1,2}):(\d{2})\s*([AaPp]\.?[Mm]\.?)\s*[–\-]\s*(\d{1,2}):(\d{2})\s*([AaPp]\.?[Mm]\.?)/);
    if (!m) return;
    out.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: day,
      opens: to24h(m[1], m[2], m[3]),
      closes: to24h(m[4], m[5], m[6]),
    });
  });
  return out;
}

function loadExisting() {
  try {
    if (existsSync(OUT_PATH)) return JSON.parse(readFileSync(OUT_PATH, 'utf8'));
  } catch {}
  return null;
}

function writeCache(obj) {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

async function main() {
  const fallback = {
    ratingValue: '4.6',
    reviewCount: '301',
    weekdayText: [],
    openingHoursSpecification: [],
    fetchedAt: null,
    source: 'fallback',
  };

  if (!ANON_KEY) {
    console.warn('[fetch-google-places] No VITE_SUPABASE_PUBLISHABLE_KEY; keeping existing cache.');
    if (!loadExisting()) writeCache(fallback);
    return;
  }

  try {
    const url = `${SUPABASE_URL}/functions/v1/google-places`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: '{}',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || data.error || !data.rating || !data.totalReviews) {
      throw new Error(`bad payload: ${JSON.stringify(data).slice(0, 200)}`);
    }
    const weekdayText = data.openingHours?.weekdayText || [];
    const cache = {
      ratingValue: String(data.rating),
      reviewCount: String(data.totalReviews),
      weekdayText,
      openingHoursSpecification: parseWeekdayText(weekdayText),
      fetchedAt: new Date().toISOString(),
      source: 'google-places-edge',
    };
    writeCache(cache);
    console.log(`[fetch-google-places] OK rating=${cache.ratingValue} reviews=${cache.reviewCount} hours=${cache.openingHoursSpecification.length} days`);
  } catch (err) {
    console.warn(`[fetch-google-places] Fetch failed (${err?.message || err}); keeping existing cache.`);
    if (!loadExisting()) writeCache(fallback);
  }
}

main();
