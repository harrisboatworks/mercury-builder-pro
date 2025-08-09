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
  'ELH',
  'ELPT',
  'EXLPT',
] as const;

const PRIORITY_LIST: string[][] = [
  [...FEATURE_WORDS],
  [...SHAFT_ROTATION_CODES],
  [...CONTROL_TRIM_CODES],
  [...START_SHAFT_TRIM_BUNDLES],
];

const normalize = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;

const tokenPresent = (haystackNorm: string, token: string) => {
  const t = ` ${token.toLowerCase()} `;
  return haystackNorm.includes(t);
};

const toTitleCaseWord = (s: string) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

export function formatVariantSubtitle(raw: string, title: string): string {
  if (!raw) return '';
  const normalizedRaw = normalize(raw);
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
    return isCode ? t.toUpperCase() : toTitleCaseWord(t);
  });

  return formatted.join(' · ');
}
