import {
  ACTIVE_PROMOTION_SELECT,
  filterPromotionsForCountry,
  formatPromotionContext,
  getPromotionCombinationMode,
  getPromotionOptions,
  type PromotionRecord,
} from "./promotion-context.ts";

export const CUSTOMER_MOTOR_SELECT = [
  "id",
  "model",
  "model_display",
  "model_number",
  "model_key",
  "family",
  "motor_type",
  "horsepower",
  "shaft",
  "shaft_code",
  "control_type",
  "msrp",
  "sale_price",
  "dealer_price",
  "base_price",
  "manual_overrides",
  "availability",
  "in_stock",
  "stock_quantity",
  "updated_at",
].join(", ");

export const ACTIVE_FINANCING_SELECT =
  "id, name, rate, term_months, promo_text, promo_end_date, min_amount, is_active, is_promo, display_order";

export interface CustomerMotorRecord {
  id?: string | null;
  model?: string | null;
  model_display?: string | null;
  model_number?: string | null;
  model_key?: string | null;
  family?: string | null;
  motor_type?: string | null;
  horsepower?: number | string | null;
  shaft?: string | null;
  shaft_code?: string | null;
  control_type?: string | null;
  msrp?: number | string | null;
  sale_price?: number | string | null;
  dealer_price?: number | string | null;
  base_price?: number | string | null;
  manual_overrides?: unknown;
  availability?: string | null;
  in_stock?: boolean | null;
  stock_quantity?: number | string | null;
  updated_at?: string | null;
}

export interface FinancingRecord {
  id?: string | null;
  name?: string | null;
  rate?: number | string | null;
  term_months?: number | string | null;
  promo_text?: string | null;
  promo_end_date?: string | null;
  min_amount?: number | string | null;
  is_active?: boolean | null;
  is_promo?: boolean | null;
  display_order?: number | null;
}

interface BusinessHours {
  note?: string | null;
  monSat?: string | null;
  sun?: string | null;
}

export interface PublishedBusinessProfile {
  name?: string | null;
  site?: string | null;
  url?: string | null;
  description?: string | null;
  services?: string[] | null;
  founded?: number | null;
  mercuryDealerSince?: number | null;
  currency?: string | null;
  lastUpdated?: string | null;
  contact?: {
    phone?: string | null;
    phoneDisplay?: string | null;
    email?: string | null;
    hours?: BusinessHours | null;
  } | null;
  geography?: {
    primaryServiceArea?: string | null;
    headquarters?: {
      street?: string | null;
      city?: string | null;
      region?: string | null;
      postalCode?: string | null;
      country?: string | null;
    } | null;
  } | null;
  productExclusions?: Record<string, {
    policy?: string | null;
    reason?: string | null;
  }> | null;
  voice?: {
    tone?: string | null;
    preferredPhrasing?: string[] | null;
  } | null;
}

export interface CustomerKnowledge {
  business: PublishedBusinessProfile;
  businessPublished: boolean;
  motors: CustomerMotorRecord[];
  promotions: PromotionRecord[];
  financing: FinancingRecord[];
}

// Supabase's fluent query builder is structurally different between Deno and
// the browser package, so this narrow adapter intentionally accepts either.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { from: (table: string) => any };

const SITE_URL = "https://www.mercuryrepower.ca";
const BRAND_PROFILE_URL = `${SITE_URL}/.well-known/brand.json`;
const BUSINESS_CACHE_MS = 5 * 60 * 1000;

const FALLBACK_BUSINESS_PROFILE: PublishedBusinessProfile = {
  name: "Harris Boat Works",
  site: "mercuryrepower.ca",
  url: SITE_URL,
  description: "Mercury Marine Premier Dealer and repower centre on Rice Lake in Gores Landing, Ontario.",
  services: [
    "Mercury outboard sales",
    "Mercury repower",
    "Mercury factory service and repairs",
    "Marine parts and accessories",
  ],
  founded: 1947,
  mercuryDealerSince: 1965,
  currency: "CAD",
  contact: {
    phone: "+1-905-342-2153",
    phoneDisplay: "(905) 342-2153",
    email: "info@harrisboatworks.ca",
    hours: {
      note: "In-season (April 1 - November 30). Marina closed for winter December 1 - April 1.",
      monSat: "08:00-17:00",
      sun: "09:00-16:00",
    },
  },
  geography: {
    primaryServiceArea: "Ontario, Canada",
    headquarters: {
      street: "5369 Harris Boat Works Rd",
      city: "Gores Landing",
      region: "ON",
      postalCode: "K0K 2E0",
      country: "CA",
    },
  },
  productExclusions: {
    verado: {
      policy: "special_order_only",
      reason: "Mercury Verado is available by special order only and is not part of default listed inventory.",
    },
    delivery: {
      policy: "pickup_only",
      reason: "Motor purchases are pickup only at Gores Landing by the buyer in person with valid government photo ID. We do not ship or deliver motors.",
    },
  },
};

let businessCache: {
  profile: PublishedBusinessProfile;
  published: boolean;
  expiresAt: number;
} | null = null;

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatMoney(value: unknown): string | null {
  const amount = asNumber(value);
  return amount !== null && amount > 0
    ? new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(amount)
    : null;
}

function formatDate(value: unknown): string | null {
  const date = asString(value);
  if (!date) return null;
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function displayMotorName(motor: CustomerMotorRecord): string {
  return motor.model_display || motor.model || `${motor.horsepower || "Unknown"} HP Mercury`;
}

function isVerado(motor: CustomerMotorRecord): boolean {
  return `${motor.family || ""} ${motor.model_display || ""} ${motor.model || ""}`
    .toLowerCase()
    .includes("verado");
}

export function isCustomerVisibleMotor(motor: CustomerMotorRecord): boolean {
  const hp = asNumber(motor.horsepower);
  const name = `${motor.model || ""} ${motor.model_display || ""}`.toLowerCase();
  return motor.availability !== "Exclude" &&
    !name.includes("jet") &&
    hp !== null && hp > 0 && hp <= 600;
}

export function isDefaultQuotedMotor(motor: CustomerMotorRecord): boolean {
  return isCustomerVisibleMotor(motor) && !isVerado(motor);
}

export function resolveCustomerSellingPrice(
  motor: CustomerMotorRecord,
  now = new Date(),
): number | null {
  const overrides = asRecord(motor.manual_overrides);
  const expiry = asString(overrides.sale_price_expires_at) || asString(overrides.sale_price_expires);
  const manualSaleExpired = expiry ? new Date(expiry).getTime() < now.getTime() : false;
  const msrp = asNumber(motor.msrp);
  const overrideBase = asNumber(overrides.base_price);
  const fallbackBase = overrideBase || msrp || asNumber(motor.base_price);
  const dealer = asNumber(motor.dealer_price);
  const dealerDiscount = dealer && fallbackBase && dealer < fallbackBase ? dealer : null;
  const candidates = [
    manualSaleExpired ? null : asNumber(overrides.sale_price),
    asNumber(motor.sale_price),
    dealerDiscount,
    fallbackBase,
  ];
  return candidates.find((value) => value !== null && value > 0) ?? null;
}

export function formatMotorInventoryContext(motors: CustomerMotorRecord[]): string {
  const visible = motors.filter(isDefaultQuotedMotor);
  const grouped = new Map<number, CustomerMotorRecord[]>();
  for (const motor of visible) {
    const hp = asNumber(motor.horsepower);
    if (hp === null) continue;
    grouped.set(hp, [...(grouped.get(hp) || []), motor]);
  }

  const lines = [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hp, rows]) => {
      const prices = rows
        .map((motor) => resolveCustomerSellingPrice(motor))
        .filter((price): price is number => price !== null)
        .sort((a, b) => a - b);
      const inStock = rows.filter((motor) => motor.in_stock && (asNumber(motor.stock_quantity) || 0) > 0).length;
      const price = prices.length === 0
        ? "contact for pricing"
        : prices[0] === prices[prices.length - 1]
        ? `${formatMoney(prices[0])}`
        : `${formatMoney(prices[0])}-${formatMoney(prices[prices.length - 1])}`;
      return `- ${hp} HP: ${rows.length} model(s), ${price}, ${inStock} in stock, ${rows.length - inStock} available to order`;
    });

  return `## LIVE MOTOR CATALOGUE (motor_models; same rows as the quote builder)
${visible.length} default quoted models. In-stock and available-to-order models are both valid customer options.
${lines.join("\n")}
- Verado: special-order only; do not quote it as default inventory. Route Verado requests to the published phone/email.
- Exact prices and stock must come from the current motor row and the canonical selling-price resolver, never model memory.`;
}

function parseHorsepower(question: string): number | null {
  const patterns = [
    /\b(\d+(?:\.\d+)?)\s*(?:hp|horsepower)\b/i,
    /\b(?:price|cost|stock|available|availability|have|order)\b[^\d]{0,24}(\d+(?:\.\d+)?)(?:\b|\s)/i,
  ];
  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) {
      const hp = Number(match[1]);
      if (Number.isFinite(hp) && hp >= 2 && hp <= 600) return hp;
    }
  }
  return null;
}

export function isMotorPriceOrAvailabilityQuestion(question: string): boolean {
  const asksLiveFact = /\b(price|cost|how much|in stock|stock|available|availability|order|carry|have any|show me)\b/i.test(question);
  const identifiesMotor = parseHorsepower(question) !== null ||
    /\b(fourstroke|pro\s*xs|seapro|prokicker|verado|outboard|motor)\b/i.test(question);
  return asksLiveFact && identifiesMotor;
}

export function buildMotorCustomerAnswer(
  motors: CustomerMotorRecord[],
  question: string,
): string | null {
  const hp = parseHorsepower(question);
  if (hp === null) return null;

  if (/\bverado\b/i.test(question)) {
    return "Mercury Verado is available by special order only and is not part of our default online inventory. Call (905) 342-2153 or email info@harrisboatworks.ca for a current Verado configuration and price.";
  }

  const matches = motors
    .filter(isDefaultQuotedMotor)
    .filter((motor) => asNumber(motor.horsepower) === hp)
    .sort((a, b) => {
      const aStock = a.in_stock && (asNumber(a.stock_quantity) || 0) > 0 ? 1 : 0;
      const bStock = b.in_stock && (asNumber(b.stock_quantity) || 0) > 0 ? 1 : 0;
      if (aStock !== bStock) return bStock - aStock;
      return (resolveCustomerSellingPrice(a) || Number.MAX_SAFE_INTEGER) -
        (resolveCustomerSellingPrice(b) || Number.MAX_SAFE_INTEGER);
    });

  if (!matches.length) {
    return `I don't see a ${hp} HP model in the current online catalogue. Check [live pricing](/pricing-reference) or call (905) 342-2153 and we can confirm special-order options.`;
  }

  const lines = matches.slice(0, 8).map((motor) => {
    const inStock = motor.in_stock && (asNumber(motor.stock_quantity) || 0) > 0;
    const price = formatMoney(resolveCustomerSellingPrice(motor)) || "Contact for pricing";
    return `- **${displayMotorName(motor)}** — ${price} CAD before HST — ${inStock ? "In stock" : "Available to order"}`;
  });
  const extra = matches.length > lines.length ? `\n- Plus ${matches.length - lines.length} more current ${hp} HP configuration(s).` : "";
  return `Current ${hp} HP options:\n\n${lines.join("\n")}${extra}\n\n[Open live pricing](/pricing-reference) or [build an itemized quote](/quote/motor-selection).`;
}

export async function fetchCustomerMotors(supabase: SupabaseLike): Promise<CustomerMotorRecord[]> {
  const { data, error } = await supabase
    .from("motor_models")
    .select(CUSTOMER_MOTOR_SELECT)
    .order("horsepower", { ascending: true })
    .limit(500);
  if (error) throw new Error(`motor_models query failed: ${error.message || error}`);
  return (data || []).filter(isCustomerVisibleMotor);
}

export async function fetchActivePromotions(supabase: SupabaseLike): Promise<PromotionRecord[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("promotions")
    .select(ACTIVE_PROMOTION_SELECT)
    .eq("is_active", true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("priority", { ascending: false })
    .limit(10);
  if (error) throw new Error(`promotions query failed: ${error.message || error}`);
  return filterPromotionsForCountry(data || [], "CA");
}

export async function fetchActiveFinancing(supabase: SupabaseLike): Promise<FinancingRecord[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("financing_options")
    .select(ACTIVE_FINANCING_SELECT)
    .eq("is_active", true)
    .or(`promo_end_date.is.null,promo_end_date.gte.${today}`)
    .order("display_order", { ascending: true })
    .order("rate", { ascending: true })
    .limit(10);
  if (error) throw new Error(`financing_options query failed: ${error.message || error}`);
  return data || [];
}

function extractPromotionFinancing(promotions: PromotionRecord[]) {
  const offers: Array<{
    promotionName: string;
    rate: number;
    months: number;
    endDate: string | null;
    mode: string;
  }> = [];
  for (const promotion of promotions) {
    for (const option of getPromotionOptions(promotion)) {
      if (option.id !== "special_financing" || !Array.isArray(option.rates)) continue;
      for (const rawRate of option.rates) {
        const rateRecord = asRecord(rawRate);
        const rate = asNumber(rateRecord.rate);
        const months = asNumber(rateRecord.months);
        if (rate === null || months === null) continue;
        offers.push({
          promotionName: promotion.name || "Current Mercury promotion",
          rate,
          months,
          endDate: promotion.end_date || null,
          mode: getPromotionCombinationMode(promotion),
        });
      }
    }
  }
  return offers;
}

export function formatFinancingContext(
  financing: FinancingRecord[],
  promotions: PromotionRecord[],
): string {
  const factoryOffers = extractPromotionFinancing(promotions);
  const lines = ["## LIVE FINANCING (database authority)"];
  if (factoryOffers.length) {
    for (const offer of factoryOffers) {
      lines.push(`- ${offer.promotionName}: ${offer.rate}% APR for ${offer.months} months OAC${offer.endDate ? ` through ${formatDate(offer.endDate)}` : ""}; offer structure is ${offer.mode}.`);
    }
  } else {
    lines.push("- No active factory-promotion financing is loaded.");
  }
  for (const option of financing) {
    const rate = asNumber(option.rate);
    const months = asNumber(option.term_months);
    const minimum = formatMoney(option.min_amount);
    lines.push(`- ${option.name || "Financing option"}: ${rate !== null ? `${rate}% APR` : "rate confirmed in quote"}${months ? ` for a default ${months}-month term` : ""} OAC${minimum ? `; minimum financed ${minimum} CAD` : ""}${option.promo_end_date ? `; through ${formatDate(option.promo_end_date)}` : ""}.`);
  }
  lines.push("- The quote builder is the authority for exact monthly payment, amount financed, fees, selected APR, and selected term.");
  return lines.join("\n");
}

export function isFinancingQuestion(question: string): boolean {
  return /\b(financ(?:e|ing)?|loan|credit|apr|interest rate|monthly payment|payment plan|down payment|dealerplan|td auto)\b/i.test(question);
}

export function buildFinancingCustomerAnswer(
  financing: FinancingRecord[],
  promotions: PromotionRecord[],
): string {
  const lines: string[] = [];
  const factoryOffers = extractPromotionFinancing(promotions);
  for (const offer of factoryOffers) {
    const relationship = offer.mode === "layered"
      ? "It layers with the eligible factory rebate"
      : offer.mode === "choose_one"
      ? "It is one of the promotion choices"
      : "It is subject to the promotion terms";
    lines.push(`**${offer.promotionName}: ${offer.rate}% APR for ${offer.months} months OAC**${offer.endDate ? ` through ${formatDate(offer.endDate)}` : ""}. ${relationship}.`);
  }
  for (const option of financing) {
    const rate = asNumber(option.rate);
    const months = asNumber(option.term_months);
    const minimum = formatMoney(option.min_amount);
    lines.push(`**${option.name || "Standard financing"}: ${rate !== null ? `${rate}% APR` : "current quoted rate"}${months ? ` with a default ${months}-month term` : ""} OAC**${minimum ? ` on eligible purchases of at least ${minimum} CAD` : ""}${option.promo_end_date ? ` through ${formatDate(option.promo_end_date)}` : ""}.`);
  }
  if (!lines.length) {
    return "I don't see an active financing option loaded right now. Please use the financing application or call (905) 342-2153 for the current rate.";
  }
  lines.push("Use the [quote builder](/quote/motor-selection) for the exact amount financed and payment, or continue to the [financing application](/financing/apply). Rates are on approved credit and subject to the listed terms.");
  return lines.join("\n\n");
}

function addressLine(profile: PublishedBusinessProfile): string {
  const hq = profile.geography?.headquarters;
  return [hq?.street, hq?.city, hq?.region, hq?.postalCode].filter(Boolean).join(", ");
}

function formatHours(profile: PublishedBusinessProfile): string {
  const hours = profile.contact?.hours;
  const parts = [
    hours?.monSat ? `Monday-Saturday ${hours.monSat}` : null,
    hours?.sun ? `Sunday ${hours.sun}` : null,
    hours?.note || null,
  ].filter(Boolean);
  return parts.join("; ");
}

export function formatBusinessContext(profile: PublishedBusinessProfile): string {
  const exclusions = Object.entries(profile.productExclusions || {})
    .map(([key, value]) => `- ${key}: ${value.policy || "policy"} — ${value.reason || "See the published site policy."}`)
    .join("\n");
  return `## PUBLISHED BUSINESS PROFILE (live ${BRAND_PROFILE_URL})
- Business: ${profile.name || "Harris Boat Works"}; founded ${profile.founded || 1947}; Mercury dealer since ${profile.mercuryDealerSince || 1965}
- Address: ${addressLine(profile)}
- Service area: ${profile.geography?.primaryServiceArea || "Ontario, Canada"}
- Phone: ${profile.contact?.phoneDisplay || profile.contact?.phone || "(905) 342-2153"}
- Email: ${profile.contact?.email || "info@harrisboatworks.ca"}
- Hours: ${formatHours(profile)}
- Currency: ${profile.currency || "CAD"}
- Services: ${(profile.services || []).join("; ")}
- Published policy boundaries:
${exclusions || "- See the current website for policy boundaries."}
- Profile last updated: ${profile.lastUpdated || "fallback profile"}`;
}

export function isBusinessInfoQuestion(question: string): boolean {
  return /\b(hours?|open|closed|location|located|address|directions?|phone|telephone|call|email|contact|text line|ship|shipping|deliver|delivery|pickup|pick up|courier|services? offered|what do you do)\b/i.test(question);
}

export function buildBusinessCustomerAnswer(
  profile: PublishedBusinessProfile,
  question: string,
): string {
  const contact = profile.contact;
  const address = addressLine(profile);
  if (/\b(hours?|open|closed|when)\b/i.test(question)) {
    return `Our published hours are **${formatHours(profile)}**. Because seasonal or holiday exceptions can change, the current contact page is the final check before a long drive.`;
  }
  if (/\b(ship|shipping|deliver|delivery|pickup|pick up|courier)\b/i.test(question)) {
    return profile.productExclusions?.delivery?.reason ||
      `Motor purchases are pickup only at ${address}; we do not ship or deliver motors.`;
  }
  if (/\b(location|located|address|directions?)\b/i.test(question)) {
    return `We're at **${address}**, on Rice Lake in Gores Landing. [Open directions](https://www.google.com/maps/dir/?api=1&destination=5369+Harris+Boat+Works+Rd+Gores+Landing+ON+K0K+2E0).`;
  }
  if (/\b(phone|telephone|call|email|contact|text line)\b/i.test(question)) {
    return `Call **${contact?.phoneDisplay || contact?.phone || "(905) 342-2153"}** or email **${contact?.email || "info@harrisboatworks.ca"}**. The [contact page](/contact) has the current hours and map.`;
  }
  return `${profile.name || "Harris Boat Works"} provides ${(profile.services || []).join(", ")}. See the current site or call ${contact?.phoneDisplay || "(905) 342-2153"} for anything not listed.`;
}

export async function fetchPublishedBusinessProfile(
  fetcher: typeof fetch = fetch,
): Promise<{ profile: PublishedBusinessProfile; published: boolean }> {
  if (businessCache && businessCache.expiresAt > Date.now()) {
    return { profile: businessCache.profile, published: businessCache.published };
  }
  try {
    const response = await fetcher(`${BRAND_PROFILE_URL}?kb=${Date.now()}`, {
      headers: { "User-Agent": "HBW-Customer-Knowledge/1.0" },
    });
    if (!response.ok) throw new Error(`brand profile returned ${response.status}`);
    const profile = await response.json() as PublishedBusinessProfile;
    if (!profile?.contact?.phone || !profile?.geography?.headquarters?.city) {
      throw new Error("brand profile is incomplete");
    }
    businessCache = { profile, published: true, expiresAt: Date.now() + BUSINESS_CACHE_MS };
    return { profile, published: true };
  } catch (error) {
    console.error("Published business profile unavailable; using verified fallback", error);
    businessCache = {
      profile: FALLBACK_BUSINESS_PROFILE,
      published: false,
      expiresAt: Date.now() + 60_000,
    };
    return { profile: FALLBACK_BUSINESS_PROFILE, published: false };
  }
}

export async function loadCustomerKnowledge(
  supabase: SupabaseLike,
): Promise<CustomerKnowledge> {
  const [business, motors, promotions, financing] = await Promise.all([
    fetchPublishedBusinessProfile(),
    fetchCustomerMotors(supabase),
    fetchActivePromotions(supabase),
    fetchActiveFinancing(supabase),
  ]);
  return {
    business: business.profile,
    businessPublished: business.published,
    motors,
    promotions,
    financing,
  };
}

function stableMotorFact(motor: CustomerMotorRecord) {
  return {
    id: motor.id || null,
    model: displayMotorName(motor),
    horsepower: asNumber(motor.horsepower),
    price: resolveCustomerSellingPrice(motor),
    inStock: Boolean(motor.in_stock && (asNumber(motor.stock_quantity) || 0) > 0),
    quantity: asNumber(motor.stock_quantity) || 0,
    availability: motor.availability || null,
    updatedAt: motor.updated_at || null,
  };
}

async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function buildCustomerKnowledgeSnapshot(
  knowledge: CustomerKnowledge,
) {
  const motorFacts = knowledge.motors
    .filter(isDefaultQuotedMotor)
    .map(stableMotorFact)
    .sort((a, b) => `${a.horsepower}:${a.model}:${a.id}`.localeCompare(`${b.horsepower}:${b.model}:${b.id}`));
  const canonicalFacts = {
    business: {
      lastUpdated: knowledge.business.lastUpdated || null,
      phone: knowledge.business.contact?.phone || null,
      email: knowledge.business.contact?.email || null,
      address: addressLine(knowledge.business),
      hours: knowledge.business.contact?.hours || null,
      productExclusions: knowledge.business.productExclusions || null,
    },
    promotions: knowledge.promotions,
    financing: knowledge.financing,
    motors: motorFacts,
  };
  const sourceDigest = await digest(canonicalFacts);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceVersion: sourceDigest.slice(0, 20),
    business: {
      published: knowledge.businessPublished,
      lastUpdated: knowledge.business.lastUpdated || null,
      phone: knowledge.business.contact?.phone || null,
      address: addressLine(knowledge.business),
      hours: knowledge.business.contact?.hours || null,
    },
    motors: {
      count: motorFacts.length,
      inStockCount: motorFacts.filter((motor) => motor.inStock).length,
      newestUpdate: motorFacts.map((motor) => motor.updatedAt).filter(Boolean).sort().at(-1) || null,
      digest: await digest(motorFacts),
    },
    promotions: {
      count: knowledge.promotions.length,
      digest: await digest(knowledge.promotions),
      context: formatPromotionContext(knowledge.promotions),
    },
    financing: {
      count: knowledge.financing.length,
      digest: await digest(knowledge.financing),
      context: formatFinancingContext(knowledge.financing, knowledge.promotions),
    },
  };
}

export function formatCustomerKnowledgePrompt(
  knowledge: CustomerKnowledge,
  includeMotorSummary = true,
): string {
  return `## LIVE CUSTOMER KNOWLEDGE AUTHORITY
The facts below were loaded for this request/session. They override older examples, model memory, and any stale knowledge-base document. For exact prices, stock, financing, promotions, hours, contact details, services, and policies, use only these facts or a live tool result.

${formatBusinessContext(knowledge.business)}

${formatFinancingContext(knowledge.financing, knowledge.promotions)}

${formatPromotionContext(knowledge.promotions)}
${includeMotorSummary ? `\n${formatMotorInventoryContext(knowledge.motors)}` : ""}`;
}
