import {
  getMotorReservationDeposit,
  isVerifiedExpressMotorReservation,
  type DepositAmount,
} from "./deposit-policy.ts";
import {
  applyMotorPresentationOverrides,
  detectFamily,
  motorSlug,
} from "./motor-slug.ts";

export const PUBLIC_SITE_URL = "https://www.mercuryrepower.ca";

// PostgreSQL `neq` does not match NULL. Public catalog coverage includes
// NULL availability and excludes only the explicit Exclude status.
export const PUBLIC_CATALOG_AVAILABILITY_OR =
  "availability.is.null,availability.neq.Exclude";

export const PUBLIC_VERADO_POLICY = {
  policy: "special_order_only" as const,
  proactive_quote: false,
  message:
    "Mercury Verado is special-order only and is not part of the default public catalog. Contact Harris Boat Works for a Verado configuration. This public estimate does not quote Verado.",
};

export type PublicMotorRow = {
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
  hero_image_url?: string | null;
  image_url?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function asPositiveFinitePrice(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

export function toPublicImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim(), `${PUBLIC_SITE_URL}/`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isVeradoMotor(motor: Pick<PublicMotorRow, "family" | "model" | "model_display">): boolean {
  return `${motor.family || ""} ${motor.model_display || ""} ${motor.model || ""}`
    .toLowerCase()
    .includes("verado");
}

export function isPublicAvailabilityEligible(
  motor: Pick<PublicMotorRow, "availability">,
): boolean {
  return motor.availability == null || motor.availability !== "Exclude";
}

export function isPublicCatalogMotor(motor: PublicMotorRow): boolean {
  return isPublicAvailabilityEligible(motor) && !isVeradoMotor(motor);
}

export function publicStockQuantity(motor: Pick<PublicMotorRow, "stock_quantity">): number | null {
  if (motor.stock_quantity == null || motor.stock_quantity === "") return null;
  const quantity = Number(motor.stock_quantity);
  if (!Number.isFinite(quantity)) return 0;
  return Math.max(0, quantity);
}

export function isPublicMotorInStock(motor: Pick<PublicMotorRow, "availability" | "in_stock" | "stock_quantity">): boolean {
  const quantity = publicStockQuantity(motor);
  if (quantity == null) {
    return !!motor.in_stock ||
      (motor.availability || "").trim().toLowerCase() === "in stock";
  }
  return quantity > 0;
}

/**
 * Authoritative public-agent selling price. Same precedence as the public
 * motors JSON feed: override sale, override base, sale, dealer, MSRP, base.
 * Do not invent a second hierarchy for MCP, UCP, markdown, or public quote.
 */
export function resolvePublicSellingPrice(motor: PublicMotorRow, now = new Date()): number | null {
  const overrides = asRecord(motor.manual_overrides);
  const expiry = typeof overrides.sale_price_expires === "string" ? Date.parse(overrides.sale_price_expires) : NaN;
  const manualSaleExpired = Number.isFinite(expiry) && expiry < now.getTime();
  const candidates = [
    manualSaleExpired ? null : overrides.sale_price,
    overrides.base_price,
    motor.sale_price,
    motor.dealer_price,
    motor.msrp,
    motor.base_price,
  ];
  for (const candidate of candidates) {
    const price = asPositiveFinitePrice(candidate);
    if (price !== null) return price;
  }
  return null;
}

export function toFinitePositiveCents(cad: unknown): number | null {
  const amount = asPositiveFinitePrice(cad);
  if (amount === null) return null;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function multiplySafeCents(cents: number, quantity: number): number | null {
  if (!Number.isSafeInteger(cents) || cents <= 0) return null;
  if (!Number.isSafeInteger(quantity) || quantity < 1) return null;
  const product = cents * quantity;
  return Number.isSafeInteger(product) && product > 0 ? product : null;
}

export function addSafeCents(...amounts: number[]): number | null {
  let total = 0;
  for (const amount of amounts) {
    if (!Number.isSafeInteger(amount) || amount < 0) return null;
    total += amount;
    if (!Number.isSafeInteger(total)) return null;
  }
  return total;
}

export function resolvePublicQuoteDeposit(motor: {
  id?: unknown;
  model_number?: unknown;
  horsepower?: unknown;
}): DepositAmount {
  const horsepower = Number(motor.horsepower);
  return getMotorReservationDeposit(
    Number.isFinite(horsepower) ? horsepower : 0,
    isVerifiedExpressMotorReservation({
      motorId: motor.id,
      modelNumber: motor.model_number,
    }),
  );
}

export function presentPublicCatalogMotor(sourceMotor: PublicMotorRow) {
  const row = applyMotorPresentationOverrides(sourceMotor);
  if (!isPublicCatalogMotor(row)) return null;
  const slug = motorSlug({ ...row, horsepower: asPositiveFinitePrice(row.horsepower) ?? 0 });
  const inStock = isPublicMotorInStock(row);
  const sellingPrice = resolvePublicSellingPrice(row);
  return {
    row,
    id: row.id || null,
    slug,
    modelDisplay: row.model_display || row.model || null,
    modelNumber: row.model_number || null,
    family: detectFamily(row.model_display || row.model, row.motor_type, row.family),
    horsepower: asPositiveFinitePrice(row.horsepower) ?? 0,
    shaftLength: row.shaft_code || row.shaft || null,
    controlType: row.control_type || null,
    sellingPrice,
    msrp: asPositiveFinitePrice(row.msrp),
    currency: "CAD" as const,
    inStock,
    stockQuantity: publicStockQuantity(row),
    availability: row.availability || (inStock ? "In Stock" : "Special Order"),
    imageUrl: toPublicImageUrl(row.hero_image_url || row.image_url),
    url: slug ? `${PUBLIC_SITE_URL}/motors/${slug}` : null,
    quoteUrl: row.id ? `${PUBLIC_SITE_URL}/quote/motor-selection?motor=${row.id}` : null,
  };
}

export function filterPublicCatalogMotors<T extends PublicMotorRow>(
  motors: T[],
  options: { inStockOnly?: boolean } = {},
) {
  return motors
    .map((motor) => presentPublicCatalogMotor(motor))
    .filter((motor): motor is NonNullable<ReturnType<typeof presentPublicCatalogMotor>> => {
      if (!motor) return false;
      return options.inStockOnly ? motor.inStock : true;
    });
}

export function findPresentedPublicMotor(
  motors: PublicMotorRow[],
  identity: { id?: string | null; slug?: string | null },
) {
  const wantedId = identity.id ? String(identity.id) : "";
  const wantedSlug = identity.slug ? String(identity.slug).toLowerCase() : "";
  for (const motor of motors) {
    const presented = presentPublicCatalogMotor(motor);
    if (!presented) continue;
    if (wantedId && presented.id === wantedId) return presented;
    if (wantedSlug && presented.slug === wantedSlug) return presented;
  }
  return null;
}

export function parseOptionalBooleanFlag(value: unknown): boolean {
  return value === true || value === "true" || value === "1";
}
