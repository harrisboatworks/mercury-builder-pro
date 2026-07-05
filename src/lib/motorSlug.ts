// Frontend mirror of supabase/functions/_shared/motor-slug.ts.
// Keep in sync — this is the canonical slug used by the /motors/{slug}
// route and by public-motors-api. Do NOT invent a different slug format
// for share links or SEO; changes must land in both files.

export function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function detectFamily(
  model: string | null | undefined,
  _motorType: string | null | undefined,
  family: string | null | undefined
): string {
  if (family) {
    const f = family.toLowerCase().replace(/\s+/g, '');
    if (f === 'proxs') return 'Pro XS';
    if (f === 'seapro') return 'SeaPro';
    if (f === 'verado') return 'Verado';
    if (f === 'racing') return 'Racing';
    if (f === 'fourstroke') return 'FourStroke';
    return family;
  }
  const m = (model || '').toLowerCase();
  if (m.includes('proxs') || m.includes('pro xs')) return 'Pro XS';
  if (m.includes('seapro') || m.includes('sea pro')) return 'SeaPro';
  if (m.includes('racing')) return 'Racing';
  if (m.includes('verado')) return 'Verado';
  return 'FourStroke';
}

export interface MotorSlugInput {
  model?: string | null;
  model_display?: string | null;
  family?: string | null;
  motor_type?: string | null;
  horsepower?: number | null;
  hp?: number | string | null;
}

// Canonical motor slug — must match public-motors-api output and the
// markdown twins under public/motors/*.md. Uses the raw DB family value
// (e.g. "ProXS") when present so the slug does not drift.
export function motorSlug(row: MotorSlugInput): string {
  const family = row.family || detectFamily(row.model_display || row.model, row.motor_type, null);
  const display = row.model_display || row.model || '';
  const hpRaw = row.horsepower ?? row.hp ?? '';
  const hp = typeof hpRaw === 'string' ? parseFloat(hpRaw) || hpRaw : hpRaw;
  return slugify(`${family}-${hp}hp-${display}`);
}


export const MOTOR_SITE_URL = 'https://www.mercuryrepower.ca';

export function motorShareUrl(row: MotorSlugInput): string {
  return `${MOTOR_SITE_URL}/motors/${motorSlug(row)}`;
}
