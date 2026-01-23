// Utilities to derive a concise motor variant subtitle for cards
// Rules:
// - Only surface whitelisted tokens in this priority order (max 3 total):
//   1) Feature words
//   2) Shaft/rotation codes
//   3) Control/trim codes
//   4) Start/shaft/trim bundles
// - Drop words already present in the title (year/brand/model)
// - Format: words in Title Case, codes in UPPERCASE, joined with " · "

export const FEATURE_WORDS = [
  'Command Thrust',
  'ProKicker',
  'Big Tiller',
  'Jet',
  'SeaPro',
  'Verado',
  'Pro XS',
] as const;

export const SHAFT_ROTATION_CODES = [
  'XL',
  'XXL',
  'CXL',
] as const;

export const CONTROL_TRIM_CODES = [
  'DTS',
  'CT',
] as const;

export const START_SHAFT_TRIM_BUNDLES = [
  'MH',
  'MLH', 
  'EH',
  'ELH',
  'ELHPT',
  'ELPT',
  'EXLPT',
] as const;

const PRIORITY_LIST: string[][] = [
  [...FEATURE_WORDS],
  [...START_SHAFT_TRIM_BUNDLES],
  [...SHAFT_ROTATION_CODES],
  [...CONTROL_TRIM_CODES],
];

export const BRAND_REGEX = /\bmercury(?:\s+marine)?\b|mercury®|^merc\.\b|^mercury\s*/gi;

const normalize = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;

const tokenPresent = (haystackNorm: string, token: string) => {
  const t = ` ${token.toLowerCase()} `;
  return haystackNorm.includes(t);
};

const toTitleCaseWord = (s: string) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

// Build the final display title: `${year} ${cleanModel}` with deduped leading years and brand tokens removed
// Format matches harrisboatworks.ca: "2025 FourStroke 25HP EFI ELHPT" (no Mercury prefix)
export function formatMotorTitle(year: number, model: string): string {
  let s = model ?? '';
  const yr = String(year).trim();
  
  // Strip ALL leading year tokens (this year or any 20xx), including punctuation between repeats
  const reYear = new RegExp(`^\\s*(?:${yr}|20\\d{2})(?:\\s|[-:–—·.:])*\\s*`, 'i');
  while (reYear.test(s)) {
    s = s.replace(reYear, '');
  }
  
  // Brand dedupe - remove "Mercury" but keep product lines (Verado/Pro XS/SeaPro/FourStroke)
  s = s.replace(BRAND_REGEX, ' ');
  
  // Clean up spacing and ensure model codes (EH, ELHPT, XL, etc.) are preserved
  const cleanModel = s.replace(/\s+/g, ' ').trim();
  
  // Return harrisboatworks.ca format: Year + clean model (no Mercury prefix)
  return `${yr} ${cleanModel}`.replace(/\s+/g, ' ').trim();
}

export function formatVariantSubtitle(raw: string, title: string): string {
  if (!raw) return '';

  // Remove any standalone year tokens anywhere in the raw string (this year or any 20xx)
  // Try to infer year from the title if present
  const inferredYearMatch = title.match(/\b(20\d{2})\b/);
  const yearPattern = inferredYearMatch ? `(?:${inferredYearMatch[1]}|20\\d{2})` : '(?:20\\d{2})';
  let cleanedRaw = raw.replace(new RegExp(`\\b${yearPattern}\\b`, 'gi'), ' ');
  // Remove brand tokens (but keep product lines like Verado/Pro XS/SeaPro)
  cleanedRaw = cleanedRaw.replace(BRAND_REGEX, ' ');

  const normalizedRaw = normalize(cleanedRaw);
  const normalizedTitle = normalize(title);

  const picked: string[] = [];
  const seen = new Set<string>();

  for (const group of PRIORITY_LIST) {
    for (const token of group) {
      // Skip if token already appears in the title (avoid duplicates like Verado)
      if (tokenPresent(normalizedTitle, token)) continue;
      // Pick if present in raw
      if (tokenPresent(normalizedRaw, token)) {
        const key = token.toUpperCase();
        if (!seen.has(key)) {
          seen.add(key);
          picked.push(token);
          if (picked.length >= 3) break; // limit to 3 overall
        }
      }
    }
    if (picked.length >= 3) break;
  }

  if (picked.length === 0) return '';

  // Format tokens for display
  const formatted = picked.map((t) => {
    // Heuristic: if token is letters-only and <= 5 chars, treat as code -> uppercase
    const isCode = /^[a-zA-Z]{2,5}$/.test(t.replace(/\s+/g, ''));

    // Preserve exact casing for known feature words (e.g. ProKicker, Pro XS)
    if ((FEATURE_WORDS as readonly string[]).includes(t)) return t;

    return isCode ? t.toUpperCase() : toTitleCaseWord(t);
  });

  return formatted.join(' · ');
}
