type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isPrimitive = (value: unknown): value is string | number | boolean | null =>
  value === null || ["string", "number", "boolean"].includes(typeof value);

const copyPrimitives = (source: JsonRecord, keys: readonly string[]): JsonRecord => {
  const target: JsonRecord = {};
  for (const key of keys) {
    const value = source[key];
    if (isPrimitive(value)) target[key] = value;
  }
  return target;
};

const compactArray = <T>(values: Array<T | undefined>): T[] =>
  values.filter((value): value is T => value !== undefined);

const MOTOR_KEYS = [
  "id", "model", "year", "hp", "horsepower", "price", "image",
  "hero_image_url", "image_url", "stockStatus", "stockNumber", "model_number",
  "in_stock", "stock_quantity", "availability", "category", "type", "specs",
  "model_key", "hero_media_id", "salePrice", "msrp", "originalPrice", "savings",
  "promoEndsAt", "shaft", "family", "hasManualSalePrice", "basePrice",
  // Agent-created quotes use these camel-cased compatibility keys.
  "modelKey", "motorType", "inStock", "modelYear", "imageUrl", "model_display",
] as const;

const TRADE_KEYS = [
  "hasTradeIn", "brand", "year", "horsepower", "model", "condition",
  "estimatedValue", "confidenceLevel", "engineType", "startType", "engineHours",
] as const;

const BOAT_KEYS = [
  "type", "make", "model", "length", "currentMotorBrand", "currentHp",
  "currentMotorYear", "controlType", "controlsOption", "hasBattery",
  "hasCompatibleProp", "shaftLength",
] as const;

const INSTALL_KEYS = [
  "controls", "steering", "gauges", "mounting", "waterTest",
  "propellerDecision", "installationCost", "recommendedPackage",
] as const;

const FINANCING_KEYS = [
  "downPayment", "term", "rate", "term_months", "monthly_payment", "total_cost",
  "monthlyPayment", "amortizationMonths", "contractTermMonths", "amountFinanced",
  "dealerFee",
] as const;

const PRICING_KEYS = [
  "msrp", "discount", "adminDiscount", "promoValue", "motorSubtotal", "subtotal",
  "hst", "totalCashPrice", "savings",
] as const;

const FROZEN_PRICING_KEYS = [
  "motorMSRP", "motorDiscount", "adminDiscount", "promoSavings", "subtotal", "hst",
  "total", "savings", "quoteExpiryDate", "promotionName", "promotionEndDate",
  "promotionCombinationMode", "selectedPromoOption", "selectedPromoValue",
  "selectedPaymentMethod", "financingRate", "financingAmortizationMonths",
  "financingContractTermMonths", "dealerFee", "amountFinanced",
] as const;

const AGENT_PRICING_KEYS = [
  "subtotal", "warrantyCost", "accessoryCost", "tradeInCredit", "rebateCredit",
  "adjustedSubtotal", "hst", "totalBeforeDiscount", "adminDiscount", "finalPrice",
] as const;

const PUBLIC_SCALAR_KEYS = [
  "motorId", "motorModel", "motorHp", "motorMsrp", "motorPrice", "purchasePath",
  "hasTradein", "selectedPromoOption", "selectedPromoRate", "selectedPromoTerm",
  "selectedPromoValue", "selectedPaymentMethod", "promoOption", "promoName", "promoId",
  "rebateAmount", "warrantyYears", "warrantyYearsExtra", "package", "customerName",
  "customerNotes", "currentStep",
  // A special discount is customer-visible quote pricing, not an internal note.
  "adminDiscount",
  ...AGENT_PRICING_KEYS,
] as const;

function sanitizeMotor(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, MOTOR_KEYS);
}

function sanitizeTrade(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  const result = copyPrimitives(value, TRADE_KEYS);

  // Agent-created quotes historically persisted these customer-visible trade
  // details with snake-case keys. Normalize them into the browser state shape
  // without exposing the surrounding internal valuation metadata.
  if (!("engineType" in result) && isPrimitive(value.engine_type)) {
    result.engineType = value.engine_type;
  }
  if (!("engineHours" in result) && isPrimitive(value.engine_hours)) {
    result.engineHours = value.engine_hours;
  }
  if (!("confidenceLevel" in result) && isPrimitive(value.confidence)) {
    result.confidenceLevel = value.confidence;
  }
  return result;
}

function sanitizeBoat(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  const result = copyPrimitives(value, BOAT_KEYS);
  const tradeIn = sanitizeTrade(value.tradeIn);
  if (tradeIn) result.tradeIn = tradeIn;
  return result;
}

function sanitizeInstall(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, INSTALL_KEYS);
}

function sanitizeFinancing(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, FINANCING_KEYS);
}

function sanitizeWarranty(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, ["extendedYears", "warrantyPrice", "totalYears"]);
}

function sanitizeSelectedPackage(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, ["id", "label", "priceBeforeTax"]);
}

function sanitizeSelectedOptions(value: unknown): JsonRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return compactArray(value.map((item) => {
    if (!isRecord(item)) return undefined;
    return copyPrimitives(item, [
      "id", "optionId", "name", "price", "category", "assignmentType", "isIncluded",
    ]);
  }));
}

function sanitizeLineItems(value: unknown): JsonRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return compactArray(value.map((item) => {
    if (!isRecord(item)) return undefined;
    return copyPrimitives(item, ["name", "price", "description", "category"]);
  }));
}

function sanitizeFrozenPricing(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, FROZEN_PRICING_KEYS);
}

function sanitizePricing(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, PRICING_KEYS);
}

function sanitizePromotion(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, [
    "name", "endDate", "combinationMode", "selectedOption", "selectedValue",
  ]);
}

function sanitizeProductProtection(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, [
    "planYears", "totalCoverageYears", "priceBeforeTax", "monthlyDelta",
  ]);
}

function sanitizePdfSnapshot(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;

  const result = copyPrimitives(value, [
    "version", "createdAt", "validUntil", "purchasePath", "tradeInValue",
    "includedCoverageYears", "paymentMethod", "customerNotes",
  ]);
  const motor = sanitizeMotor(value.motor);
  const pricing = sanitizePricing(value.pricing);
  const accessoryBreakdown = sanitizeLineItems(value.accessoryBreakdown);
  const tradeInInfo = sanitizeTrade(value.tradeInInfo);
  const productProtection = sanitizeProductProtection(value.productProtection);
  const financing = sanitizeFinancing(value.financing);
  const promotion = sanitizePromotion(value.promotion);

  if (motor) result.motor = motor;
  if (pricing) result.pricing = pricing;
  if (accessoryBreakdown) result.accessoryBreakdown = accessoryBreakdown;
  if (tradeInInfo) result.tradeInInfo = tradeInInfo;
  if (productProtection) result.productProtection = productProtection;
  if (financing) result.financing = financing;
  if (promotion) result.promotion = promotion;
  return result;
}

/**
 * Build the only JSON shape that an unauthenticated UUID bearer may receive.
 * Unknown fields fail closed. Customer contact details, serial numbers, dealer
 * cost, internal notes, conversation IDs and admin/edit flags are deliberately
 * absent from every nested allowlist.
 */
export function buildPublicQuoteData(value: unknown): JsonRecord {
  if (!isRecord(value)) return {};

  const result = copyPrimitives(value, PUBLIC_SCALAR_KEYS);
  const motor = sanitizeMotor(value.motor);
  const selectedMotor = sanitizeMotor(value.selectedMotor);
  const boatInfo = sanitizeBoat(value.boatInfo);
  const tradeInInfo = sanitizeTrade(value.tradeInInfo);
  const tradeIn = sanitizeTrade(value.tradeIn);
  const fuelTankConfig = isRecord(value.fuelTankConfig)
    ? copyPrimitives(value.fuelTankConfig, ["externalTank"])
    : undefined;
  const installConfig = sanitizeInstall(value.installConfig);
  const looseMotorBattery = isRecord(value.looseMotorBattery)
    ? copyPrimitives(value.looseMotorBattery, ["wantsBattery", "batteryCost", "decision"])
    : undefined;
  const financing = sanitizeFinancing(value.financing);
  const warrantyConfig = sanitizeWarranty(value.warrantyConfig);
  const selectedOptions = sanitizeSelectedOptions(value.selectedOptions);
  const selectedPackage = sanitizeSelectedPackage(value.selectedPackage);
  const accessoryBreakdown = sanitizeLineItems(value.accessoryBreakdown);
  const adminCustomItems = sanitizeLineItems(value.adminCustomItems);
  const frozenPricing = sanitizeFrozenPricing(value.frozenPricing);
  const pdfSnapshot = sanitizePdfSnapshot(value.pdfSnapshot);
  const pricing = sanitizePricing(value.pricing);
  const uiFlags = isRecord(value.uiFlags)
    ? copyPrimitives(value.uiFlags, ["motorOnlyExpress", "suppressAdditionalPromoSavings"])
    : undefined;

  if (motor) result.motor = motor;
  if (selectedMotor) result.selectedMotor = selectedMotor;
  if (boatInfo) result.boatInfo = boatInfo;
  if (tradeInInfo) result.tradeInInfo = tradeInInfo;
  if (tradeIn) result.tradeIn = tradeIn;
  if (fuelTankConfig) result.fuelTankConfig = fuelTankConfig;
  if (installConfig) result.installConfig = installConfig;
  if (looseMotorBattery) result.looseMotorBattery = looseMotorBattery;
  if (financing) result.financing = financing;
  if (warrantyConfig) result.warrantyConfig = warrantyConfig;
  if (selectedOptions) result.selectedOptions = selectedOptions;
  if (selectedPackage) result.selectedPackage = selectedPackage;
  if (accessoryBreakdown) result.accessoryBreakdown = accessoryBreakdown;
  if (adminCustomItems) result.adminCustomItems = adminCustomItems;
  if (frozenPricing) result.frozenPricing = frozenPricing;
  if (pdfSnapshot) result.pdfSnapshot = pdfSnapshot;
  if (pricing) result.pricing = pricing;
  if (uiFlags) result.uiFlags = uiFlags;
  if (Array.isArray(value.completedSteps)) {
    result.completedSteps = value.completedSteps.filter((step) => typeof step === "number");
  }
  return result;
}

export function isSavedQuotePubliclyReadable(
  value: { expires_at?: unknown; is_soft_lead?: unknown },
  nowMs = Date.now(),
): boolean {
  if (value.is_soft_lead === true || typeof value.expires_at !== "string") return false;
  const expiresAtMs = Date.parse(value.expires_at);
  return Number.isFinite(expiresAtMs) && expiresAtMs > nowMs;
}

export function publicText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function buildPublicQuoteResponse({
  id,
  quoteData,
  customerName,
  customerNotes,
}: {
  id: string;
  quoteData: unknown;
  customerName?: unknown;
  customerNotes?: unknown;
}) {
  const publicQuoteData = buildPublicQuoteData(quoteData);
  return {
    id,
    quote_data: publicQuoteData,
    customer_name: typeof customerName === "string"
      ? customerName
      : publicText(publicQuoteData.customerName),
    customer_notes: typeof customerNotes === "string"
      ? customerNotes
      : publicText(publicQuoteData.customerNotes),
  };
}
