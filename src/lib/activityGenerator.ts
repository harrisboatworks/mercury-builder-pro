// src/lib/activityGenerator.ts
import { templates, firstNames, ontarioCities, motorModels, timePhrases } from "@/lib/activityMessages";
import { regionalReferences } from "@/lib/canadian-messages";

// Deterministic PRNG utilities (xmur3 + mulberry32)
function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: readonly T[], seed: string): T[] {
  const res = arr.slice();
  const seedFn = xmur3(seed);
  const rng = mulberry32(seedFn());
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function todayKey(date = new Date()): string {
  // Use local date so returning visitors see a fresh sequence each local day
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function generateActivityMessages(count = 60, date = new Date()): string[] {
  const key = todayKey(date);
  const seedFn = xmur3(`activity-${key}`);
  const rng = mulberry32(seedFn());

  const lakes = regionalReferences.ontario.lakes as readonly string[];
  const uniq = new Set<string>();
  const out: string[] = [];

  // Pre-shuffle base arrays for variety per day
  const names = seededShuffle(firstNames, key);
  const cities = seededShuffle(ontarioCities, key + "-c");
  const models = seededShuffle(motorModels, key + "-m");
  const tmpl = seededShuffle(templates, key + "-t");

  let i = 0;
  let guard = 0;
  while (out.length < count && guard < count * 20) {
    const t = tmpl[i % tmpl.length];
    const s = t
      .replace("{name}", pick(names, rng))
      .replace("{city}", pick(cities, rng))
      .replace("{lake}", pick(lakes, rng))
      .replace("{model}", pick(models, rng))
      .replace("{count}", String(2 + Math.floor(rng() * 18)))
      .replace("{time}", pick(timePhrases, rng));

    if (!uniq.has(s)) {
      uniq.add(s);
      out.push(s);
    }

    i++;
    guard++;
  }

  return out;
}

export function getDailyKey(date = new Date()) {
  return todayKey(date);
}

export function generateSocialProofMessage(date = new Date()): string {
  const key = todayKey(date);
  const seedFn = xmur3(`social-proof-${key}`);
  const rng = mulberry32(seedFn());
  
  // Generate a realistic-looking number (200-450 range)
  const baseCount = 200 + Math.floor(rng() * 250);
  
  // Variations of the social proof message
  const messages = [
    `Join ${baseCount}+ boaters who got quotes this month`,
    `${baseCount}+ Ontario boaters trust us`,
    `${baseCount} quotes sent this month`,
    `Trusted by ${baseCount}+ local boaters`,
    `Join ${baseCount}+ customers this month`,
  ];
  
  return messages[Math.floor(rng() * messages.length)];
}

// Time phrases for testimonial dates
const testimonialTimePhrases = [
  "1 week ago",
  "2 weeks ago",
  "3 weeks ago",
  "1 month ago",
  "5 weeks ago",
  "6 weeks ago",
  "2 months ago",
  "3 months ago",
];

export interface DailyTestimonial {
  quote: string;
  name: string;
  location: string;
  rating: number;
  dateLabel: string;
}

export function generateDailyTestimonials(
  testimonials: Array<{ quote: string; name: string; location: string }>,
  count = 5,
  date = new Date()
): DailyTestimonial[] {
  const key = todayKey(date);
  const shuffled = seededShuffle(testimonials, `testimonials-${key}`);
  const seedFn = xmur3(`testimonial-dates-${key}`);
  const rng = mulberry32(seedFn());

  return shuffled.slice(0, count).map((t) => ({
    ...t,
    rating: 5,
    dateLabel: pick(testimonialTimePhrases, rng),
  }));
}

export function generateReviewCount(date = new Date()): number {
  const key = todayKey(date);
  const seedFn = xmur3(`review-count-${key}`);
  const rng = mulberry32(seedFn());
  // Generate count between 150-220
  return 150 + Math.floor(rng() * 70);
}
