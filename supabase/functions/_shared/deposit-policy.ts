export const DEPOSIT_POLICY_SCHEMA = "deposit-policy/v1";
export const DEPOSIT_POLICY_QUOTE_STATE_KEY = "depositPolicySnapshot";
export const DEPOSIT_POLICY_QUOTE_DATA_KEY = "deposit_policy";

export const DEPOSIT_STOCK_CLASSIFICATIONS = [
  "in_stock",
  "out_of_stock",
  "special_order",
] as const;
export type DepositStockClassification = (typeof DEPOSIT_STOCK_CLASSIFICATIONS)[number];

export const DEPOSIT_POLICY_CODES = [
  "in_stock_refundable",
  "special_order_until_written_approval",
] as const;
export type DepositPolicyCode = (typeof DEPOSIT_POLICY_CODES)[number];

export const DEPOSIT_PURCHASE_PATHS = ["motor_only", "installed"] as const;
export type DepositPurchasePath = (typeof DEPOSIT_PURCHASE_PATHS)[number];

export type MotorStockSource = {
  id?: string | null;
  stock_quantity?: number | string | null;
  in_stock?: boolean | null;
  availability?: string | null;
};

export type DepositPolicySnapshot = {
  schema: typeof DEPOSIT_POLICY_SCHEMA;
  motorId: string;
  stockClassification: DepositStockClassification;
  policyCode: DepositPolicyCode;
  stockQuantity: number | null;
  inStock: boolean | null;
  availability: string | null;
  purchasePath: DepositPurchasePath;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DepositPolicyUnresolvedError extends Error {
  constructor(message = "Deposit policy cannot be resolved") {
    super(message);
    this.name = "DepositPolicyUnresolvedError";
  }
}

export const DEPOSIT_POLICY_PUBLIC_SUMMARY =
  "If the motor is in stock, the deposit is refundable. If the motor is out of stock or a special order, the deposit stays refundable until HBW confirms the exact motor, price, availability and ETA, and you approve the order in writing. Once HBW places the order after that written approval, the deposit becomes non-refundable and is credited to the final invoice.";

export const DEPOSIT_POLICY_IN_STOCK_TEXT =
  "This motor is in stock. Your deposit is refundable.";

export const DEPOSIT_POLICY_SPECIAL_ORDER_TEXT =
  "This motor is out of stock or a special order. Your deposit stays refundable until HBW confirms the exact motor, price, availability and ETA, and you approve the order in writing. Once HBW places the order after that written approval, the deposit becomes non-refundable and is credited to the final invoice.";

export const DEPOSIT_FULFILMENT_MOTOR_ONLY =
  "Pickup is at our Gores Landing shop. Please come in person and bring valid government-issued photo ID. HBW does not pick up or deliver customer boats.";

export const DEPOSIT_FULFILMENT_INSTALLED =
  "HBW will contact you to arrange your boat drop-off and installation. HBW does not pick up or deliver customer boats.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseMotorId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return UUID_PATTERN.test(trimmed) ? trimmed : null;
}

export function parseStockQuantity(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new DepositPolicyUnresolvedError("Motor stock quantity cannot be resolved");
  }
  return parsed;
}

export function normalizeAvailability(value: unknown): DepositStockClassification | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new DepositPolicyUnresolvedError("Motor availability cannot be resolved");
  }
  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, " ");
  if (!normalized) return null;
  if (normalized === "in stock" || normalized === "instock") return "in_stock";
  if (normalized === "out of stock" || normalized === "oos") return "out_of_stock";
  if (
    normalized === "special order"
    || normalized === "available to order"
    || normalized === "on order"
    || normalized === "to order"
  ) {
    return "special_order";
  }
  throw new DepositPolicyUnresolvedError("Motor availability cannot be resolved");
}

export function classifyMotorStock(row: MotorStockSource | null | undefined): DepositStockClassification {
  if (!row || typeof row !== "object") {
    throw new DepositPolicyUnresolvedError("Authoritative motor row is missing");
  }
  const quantity = parseStockQuantity(row.stock_quantity);
  if (quantity !== null) {
    return quantity > 0 ? "in_stock" : "out_of_stock";
  }
  if (row.in_stock === true) return "in_stock";
  if (row.in_stock === false) return "out_of_stock";
  const availability = normalizeAvailability(row.availability);
  if (availability) return availability;
  throw new DepositPolicyUnresolvedError("Motor stock status cannot be resolved");
}

export function policyCodeFromStock(classification: DepositStockClassification): DepositPolicyCode {
  return classification === "in_stock"
    ? "in_stock_refundable"
    : "special_order_until_written_approval";
}

export function customerPolicyText(code: DepositPolicyCode): string {
  return code === "in_stock_refundable"
    ? DEPOSIT_POLICY_IN_STOCK_TEXT
    : DEPOSIT_POLICY_SPECIAL_ORDER_TEXT;
}

export function stockStatusLabel(classification: DepositStockClassification): string {
  if (classification === "in_stock") return "In stock";
  if (classification === "out_of_stock") return "Out of stock";
  return "Special order";
}

export function purchasePathLabel(path: DepositPurchasePath): string {
  return path === "motor_only" ? "Motor only" : "Installed";
}

export function fulfilmentText(path: DepositPurchasePath): string {
  return path === "motor_only" ? DEPOSIT_FULFILMENT_MOTOR_ONLY : DEPOSIT_FULFILMENT_INSTALLED;
}

export function resolvePurchasePath(quoteState: unknown): DepositPurchasePath {
  const state = isRecord(quoteState) ? quoteState : {};
  const raw = typeof state.purchasePath === "string" ? state.purchasePath.trim().toLowerCase() : "";
  if (raw === "loose" || raw === "motor_only" || raw === "motor-only") return "motor_only";
  if (raw === "installed") return "installed";
  throw new DepositPolicyUnresolvedError("Purchase path cannot be resolved");
}

export function buildDepositPolicySnapshot(options: {
  motorId: string;
  motor: MotorStockSource;
  purchasePath: DepositPurchasePath;
}): DepositPolicySnapshot {
  const motorId = parseMotorId(options.motorId);
  if (!motorId) {
    throw new DepositPolicyUnresolvedError("Selected motor cannot be resolved");
  }
  const stockClassification = classifyMotorStock(options.motor);
  let stockQuantity: number | null = null;
  try {
    stockQuantity = parseStockQuantity(options.motor.stock_quantity);
  } catch {
    stockQuantity = null;
  }
  return {
    schema: DEPOSIT_POLICY_SCHEMA,
    motorId,
    stockClassification,
    policyCode: policyCodeFromStock(stockClassification),
    stockQuantity,
    inStock: typeof options.motor.in_stock === "boolean" ? options.motor.in_stock : null,
    availability: typeof options.motor.availability === "string" ? options.motor.availability : null,
    purchasePath: options.purchasePath,
  };
}

export function tryBuildDepositPolicySnapshot(options: {
  motorId?: string | null;
  motor?: MotorStockSource | null;
  purchasePath?: unknown;
}): DepositPolicySnapshot | null {
  try {
    return buildDepositPolicySnapshot({
      motorId: options.motorId || "",
      motor: options.motor || {},
      purchasePath: resolvePurchasePath({ purchasePath: options.purchasePath }),
    });
  } catch {
    return null;
  }
}

export function parseDepositPolicySnapshot(value: unknown): DepositPolicySnapshot | null {
  if (!isRecord(value)) return null;
  const motorId = parseMotorId(value.motorId);
  const stockClassification = DEPOSIT_STOCK_CLASSIFICATIONS.includes(value.stockClassification as DepositStockClassification)
    ? value.stockClassification as DepositStockClassification
    : null;
  const policyCode = DEPOSIT_POLICY_CODES.includes(value.policyCode as DepositPolicyCode)
    ? value.policyCode as DepositPolicyCode
    : null;
  const purchasePath = DEPOSIT_PURCHASE_PATHS.includes(value.purchasePath as DepositPurchasePath)
    ? value.purchasePath as DepositPurchasePath
    : null;
  if (
    value.schema !== DEPOSIT_POLICY_SCHEMA
    || !motorId
    || !stockClassification
    || !policyCode
    || !purchasePath
    || policyCodeFromStock(stockClassification) !== policyCode
  ) {
    return null;
  }
  return {
    schema: DEPOSIT_POLICY_SCHEMA,
    motorId,
    stockClassification,
    policyCode,
    stockQuantity: typeof value.stockQuantity === "number" && Number.isFinite(value.stockQuantity)
      ? value.stockQuantity
      : null,
    inStock: typeof value.inStock === "boolean" ? value.inStock : null,
    availability: typeof value.availability === "string" ? value.availability : null,
    purchasePath,
  };
}

export function readQuoteStatePolicySnapshot(quoteState: unknown): unknown {
  return isRecord(quoteState) ? quoteState[DEPOSIT_POLICY_QUOTE_STATE_KEY] : null;
}

export function readPersistedDepositPolicy(quoteData: unknown): DepositPolicySnapshot | null {
  return isRecord(quoteData) ? parseDepositPolicySnapshot(quoteData[DEPOSIT_POLICY_QUOTE_DATA_KEY]) : null;
}

export function depositPolicySnapshotsMatch(
  authoritative: DepositPolicySnapshot,
  recorded: DepositPolicySnapshot,
): boolean {
  return authoritative.schema === recorded.schema
    && authoritative.motorId === recorded.motorId
    && authoritative.stockClassification === recorded.stockClassification
    && authoritative.policyCode === recorded.policyCode
    && authoritative.purchasePath === recorded.purchasePath;
}

export function assertDepositPolicyReadyForCheckout(options: {
  savedMotorId: string | null | undefined;
  motorRow: MotorStockSource | null | undefined;
  quoteState: unknown;
}): DepositPolicySnapshot {
  const motorId = parseMotorId(options.savedMotorId);
  if (!motorId) {
    throw new DepositPolicyUnresolvedError("Selected motor cannot be resolved");
  }
  if (!options.motorRow) {
    throw new DepositPolicyUnresolvedError("Authoritative motor row is missing");
  }
  const rowId = parseMotorId(options.motorRow.id);
  if (rowId && rowId !== motorId) {
    throw new DepositPolicyUnresolvedError("Motor row does not match the saved quote");
  }
  const authoritative = buildDepositPolicySnapshot({
    motorId,
    motor: options.motorRow,
    purchasePath: resolvePurchasePath(options.quoteState),
  });
  const recorded = parseDepositPolicySnapshot(readQuoteStatePolicySnapshot(options.quoteState));
  if (!recorded) {
    throw new DepositPolicyUnresolvedError("Deposit policy snapshot is missing");
  }
  if (!depositPolicySnapshotsMatch(authoritative, recorded)) {
    throw new DepositPolicyUnresolvedError("Deposit policy snapshot is stale");
  }
  return authoritative;
}

function parseDealAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function authoritativeQuoteTotal(value: unknown): number | null {
  const parsed = parseDealAmount(value);
  if (parsed === null || parsed <= 0) return null;
  return parsed;
}

export function formatDealMoney(value: unknown): string {
  const parsed = authoritativeQuoteTotal(value);
  if (parsed === null) return "Not available";
  return `$${parsed} CAD`;
}

export function formatGrokQuoteMoney(value: unknown): string {
  return authoritativeQuoteTotal(value) === null ? "null" : formatDealMoney(value);
}

export const STANDARD_DEPOSIT_AMOUNTS = [200, 500, 1000] as const;
export const EXPRESS_RESERVATION_DEPOSIT_AMOUNT = 100;

export function parseExactDepositAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) && Number.isInteger(value) ? value : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || /e/i.test(trimmed) || !/^-?\d+(?:\.0+)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && Number.isInteger(parsed) ? parsed : null;
}

const PLAIN_DECIMAL_HP_RE = /^\d+(?:\.\d+)?$/;

export function parseAuthoritativeHorsepower(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    throw new Error("Invalid deposit amount for selected motor");
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0 || value > 1000) {
      throw new Error("Invalid deposit amount for selected motor");
    }
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (PLAIN_DECIMAL_HP_RE.test(trimmed)) {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= 1000) return parsed;
    }
  }
  throw new Error("Invalid deposit amount for selected motor");
}

export function recommendedStandardDeposit(horsepower: unknown): 200 | 500 | 1000 {
  const hp = parseAuthoritativeHorsepower(horsepower);
  if (hp <= 25) return 200;
  if (hp <= 115) return 500;
  return 1000;
}

export function isExpressReservationMotor(options: {
  quoteMotorId?: string | null;
  savedMotorId?: string | null;
  modelNumber?: string | null;
  motorRowPresent?: boolean;
  expressMotorId: string;
  expressModelNumber: string;
}): boolean {
  const quoteMotorId = typeof options.quoteMotorId === "string" ? options.quoteMotorId : "";
  const savedMotorId = typeof options.savedMotorId === "string" ? options.savedMotorId : "";
  const modelNumber = typeof options.modelNumber === "string" ? options.modelNumber : "";
  return options.motorRowPresent === true
    && quoteMotorId === options.expressMotorId
    && savedMotorId === options.expressMotorId
    && modelNumber === options.expressModelNumber;
}

export function assertAuthoritativeDepositTier(options: {
  requestedAmount: unknown;
  savedQuoteAmount: unknown;
  existingDepositAmount?: unknown;
  horsepower: unknown;
  expressMotor: {
    quoteMotorId?: string | null;
    savedMotorId?: string | null;
    modelNumber?: string | null;
    motorRowPresent: boolean;
    expressMotorId: string;
    expressModelNumber: string;
  };
  priceId: string | null;
  catalog: Record<string, string | null>;
  stagingPriceOverride?: boolean;
}): number {
  const requested = parseExactDepositAmount(options.requestedAmount);
  const saved = parseExactDepositAmount(options.savedQuoteAmount);
  if (requested == null || saved == null || requested !== saved) {
    throw new Error("Invalid saved quote for deposit");
  }
  if (
    requested !== EXPRESS_RESERVATION_DEPOSIT_AMOUNT
    && !(STANDARD_DEPOSIT_AMOUNTS as readonly number[]).includes(requested)
  ) {
    throw new Error("Invalid deposit amount for selected motor");
  }

  const recommended = recommendedStandardDeposit(parseAuthoritativeHorsepower(options.horsepower));
  const expressOk = isExpressReservationMotor(options.expressMotor);
  if (requested === EXPRESS_RESERVATION_DEPOSIT_AMOUNT) {
    if (!expressOk || recommended !== 200) {
      throw new Error("Invalid deposit amount for selected motor");
    }
  } else if (requested !== recommended) {
    throw new Error("Invalid deposit amount for selected motor");
  }

  if (options.existingDepositAmount !== undefined) {
    const existing = parseExactDepositAmount(options.existingDepositAmount);
    if (existing == null || existing !== requested) {
      throw new Error("Invalid deposit amount for selected motor");
    }
  }

  const amountKey = String(requested);
  if (requested === EXPRESS_RESERVATION_DEPOSIT_AMOUNT) {
    if (options.priceId != null) {
      throw new Error("Invalid deposit amount for selected motor");
    }
  } else if (options.stagingPriceOverride && requested === 500) {
    if (!options.priceId) {
      throw new Error("Invalid deposit amount for selected motor");
    }
  } else if (options.priceId !== (options.catalog[amountKey] ?? null)) {
    throw new Error("Invalid deposit amount for selected motor");
  }

  return requested;
}

export function remainingBalance(total: unknown, deposit: unknown): string {
  const totalAmount = authoritativeQuoteTotal(total);
  const depositAmount = parseDealAmount(deposit);
  if (totalAmount === null || depositAmount === null) return "Not available";
  const remaining = totalAmount - depositAmount;
  if (!Number.isFinite(remaining) || remaining < 0) return "Not available";
  return `$${remaining} CAD`;
}

export function grokRemainingBalance(total: unknown, deposit: unknown): string {
  const formatted = remainingBalance(total, deposit);
  return formatted === "Not available" ? "null" : formatted;
}

export function unavailableField(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "Not available";
}
