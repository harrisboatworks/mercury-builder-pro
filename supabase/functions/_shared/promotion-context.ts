export const ACTIVE_PROMOTION_SELECT =
  'id, name, kind, stackable, discount_percentage, discount_fixed_amount, bonus_title, bonus_description, warranty_extra_years, start_date, end_date, details, promo_options, terms_url';

export type PromotionCombinationMode = 'layered' | 'choose_one' | 'standalone';

export interface PromotionRecord {
  id?: string | null;
  name?: string | null;
  kind?: string | null;
  stackable?: boolean | null;
  discount_percentage?: number | string | null;
  discount_fixed_amount?: number | string | null;
  bonus_title?: string | null;
  bonus_description?: string | null;
  warranty_extra_years?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  details?: unknown;
  promo_options?: unknown;
  terms_url?: string | null;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(asString).filter((item): item is string => Boolean(item));
  }
  const item = asString(value);
  return item ? [item] : [];
}

function formatMoney(value: unknown): string | null {
  const amount = asNumber(value);
  return amount !== null ? `$${amount.toLocaleString('en-CA')}` : null;
}

function formatDate(value: unknown): string | null {
  const date = asString(value);
  if (!date) return null;

  const parsed = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('en-CA', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

function formatHpRange(tier: JsonRecord): string | null {
  const min = asNumber(tier.hp_min);
  const max = asNumber(tier.hp_max);
  if (min === null || max === null) return null;
  return min === max ? `${min} HP` : `${min}-${max} HP`;
}

export function getPromotionOptions(promotion: PromotionRecord): JsonRecord[] {
  const promoOptions = asRecord(promotion.promo_options);
  return asArray(promoOptions?.options)
    .map(asRecord)
    .filter((option): option is JsonRecord => Boolean(option));
}

export function getPromotionCombinationMode(
  promotion: PromotionRecord,
): PromotionCombinationMode {
  const details = asRecord(promotion.details);
  const promoOptions = asRecord(promotion.promo_options);
  const candidates = [
    details?.combination_mode,
    promoOptions?.combination_mode,
    promoOptions?.type,
  ];

  for (const candidate of candidates) {
    if (candidate === 'layered' || candidate === 'choose_one') return candidate;
  }
  return 'standalone';
}

export function getPromotionRebateMatrix(promotion: PromotionRecord): JsonRecord[] {
  const rebateOption = getPromotionOptions(promotion)
    .find((option) => option.id === 'cash_rebate');
  return asArray(rebateOption?.matrix)
    .map(asRecord)
    .filter((tier): tier is JsonRecord => Boolean(tier));
}

function formatOption(option: JsonRecord, mode: PromotionCombinationMode): string[] {
  const id = asString(option.id);
  const title = asString(option.title) || 'Promotion benefit';
  const description = asString(option.description);
  const lines: string[] = [];

  if (id === 'cash_rebate') {
    const prefix = mode === 'layered' ? 'Automatic rebate' : 'Rebate option';
    lines.push(`- ${prefix}: ${title}${description ? ` - ${description}` : ''}`);
    return lines;
  }

  if (id === 'special_financing') {
    const prefix = mode === 'layered' ? 'Optional promotional financing' : 'Financing option';
    lines.push(`- ${prefix}: ${title}${description ? ` - ${description}` : ''}`);
    for (const rateValue of asArray(option.rates)) {
      const rate = asRecord(rateValue);
      if (!rate) continue;
      const apr = asNumber(rate.rate);
      const months = asNumber(rate.months);
      if (apr === null || months === null) continue;
      const minimum = formatMoney(rate.minAmount ?? rate.minimum_amount);
      lines.push(
        `  - ${apr}% APR for ${months} months (OAC; subject to terms and conditions)` +
        (minimum ? `; minimum financed ${minimum}` : ''),
      );
    }
    return lines;
  }

  lines.push(`- ${title}${description ? ` - ${description}` : ''}`);
  return lines;
}

function formatPromotion(promotion: PromotionRecord): string {
  const name = asString(promotion.name) || 'Current promotion';
  const details = asRecord(promotion.details) || {};
  const eligibility = asRecord(details.eligibility) || {};
  const options = getPromotionOptions(promotion);
  const matrix = getPromotionRebateMatrix(promotion);
  const mode = getPromotionCombinationMode(promotion);
  const lines: string[] = [`**${name}**`];

  const start = formatDate(promotion.start_date);
  const end = formatDate(promotion.end_date);
  if (start || end) {
    lines.push(`- Offer window: ${start || 'current'} through ${end || 'until further notice'}`);
  }

  if (mode === 'layered') {
    lines.push('- Offer structure: layered. The eligible rebate is automatic; promotional financing is optional and does not replace the rebate.');
  } else if (mode === 'choose_one') {
    lines.push('- Offer structure: choose one. The customer must select one listed benefit.');
  }

  const summary = asString(promotion.bonus_description) || asString(promotion.bonus_title);
  if (summary) lines.push(`- Summary: ${summary}`);

  if (matrix.length > 0) {
    lines.push('- Factory rebate by horsepower (this matrix is the sole rebate amount):');
    for (const tier of matrix) {
      const range = formatHpRange(tier);
      const rebate = formatMoney(tier.rebate);
      if (range && rebate) lines.push(`  - ${range}: ${rebate} CAD`);
    }
  } else {
    const percentage = asNumber(promotion.discount_percentage);
    const fixed = asNumber(promotion.discount_fixed_amount);
    if (percentage !== null && percentage > 0) lines.push(`- Discount: ${percentage}%`);
    if (fixed !== null && fixed > 0) lines.push(`- Discount: ${formatMoney(fixed)} CAD`);
  }

  const warrantyYears = asNumber(promotion.warranty_extra_years);
  if (warrantyYears !== null && warrantyYears > 0) {
    lines.push(`- Warranty benefit: ${warrantyYears} additional factory-backed year${warrantyYears === 1 ? '' : 's'}`);
  }

  for (const option of options) lines.push(...formatOption(option, mode));

  const products = asStringList(eligibility.products);
  const use = asString(eligibility.use);
  const stock = asString(eligibility.stock_requirement);
  if (products.length) lines.push(`- Eligible products: ${products.join('; ')}`);
  if (use) lines.push(`- Eligible use: ${use}`);
  if (stock) lines.push(`- Stock requirement: ${stock}`);
  if (eligibility.backorders_qualify === false) lines.push('- Backorders do not qualify.');

  const requirements = asStringList(details.requirements);
  if (requirements.length) {
    lines.push('- Requirements:');
    for (const requirement of requirements) lines.push(`  - ${requirement}`);
  }

  const registrationDeadline = formatDate(details.registration_deadline);
  if (registrationDeadline) {
    lines.push(`- Warranty registration deadline: ${registrationDeadline}`);
  }

  const rebateMethod = asString(details.consumer_rebate_method);
  if (rebateMethod) lines.push(`- Rebate delivery: ${rebateMethod}`);
  const financingQualification = asString(details.financing_qualification);
  if (financingQualification) lines.push(`- Financing qualification: ${financingQualification}`);

  const exclusions = [
    ...asStringList(eligibility.exclusions),
    ...asStringList(details.exclusions),
  ].filter((item, index, all) => all.indexOf(item) === index);
  if (exclusions.length) lines.push(`- Exclusions: ${exclusions.join('; ')}`);

  const legal = asString(details.legal);
  if (legal) lines.push(`- Legal: ${legal}`);
  if (promotion.terms_url) lines.push(`- Official terms: ${promotion.terms_url}`);

  return lines.join('\n');
}

export function formatPromotionContext(promotions: PromotionRecord[]): string {
  if (!promotions.length) {
    return '## CURRENT PROMOTIONS & SPECIAL OFFERS\nNo active promotion is loaded. Do not quote or name an expired offer.';
  }

  return [
    '## CURRENT PROMOTIONS & SPECIAL OFFERS',
    'This block is generated from the live promotions database. Use only these facts for current-offer answers.',
    'Promotion financing precedence: an APR and term listed inside an active promotion are canonical for that promotion. A separate standard financing offer does not cancel, replace, or make the promotion rate inactive.',
    'For a layered offer, state that the eligible rebate applies and the customer may also choose the listed promotional financing, subject to the offer eligibility, approved credit, and terms.',
    ...promotions.slice(0, 5).map(formatPromotion),
  ].join('\n\n');
}
