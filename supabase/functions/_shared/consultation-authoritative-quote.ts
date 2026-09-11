import {
  type ConsultationDeliverySnapshot,
  type ConsultationQuoteAccessory,
  type ConsultationQuoteAccessoryCategory,
  type ConsultationQuoteFinancing,
  type ConsultationQuoteMotorDetails,
  type ConsultationQuotePaymentMethod,
  type ConsultationQuotePriceBreakdown,
  type ConsultationQuoteProductProtection,
  type ConsultationQuotePromoOption,
  type ConsultationQuotePromotion,
  type ConsultationQuoteTradeIn,
  ConsultationDocumentRequestError,
  consultationSubmitDeliverySnapshot,
  parseConsultationDocumentId,
  parseConsultationMotorModel,
  parseConsultationQuoteNumber,
  parseConsultationTotalPrice,
} from "./consultation-document-policy.ts";

export const CONSULTATION_SAVED_QUOTE_SOURCE = "consultation-submit";
export const CONSULTATION_CALLER_QUOTE_SNAPSHOT_MAX_BYTES = 24 * 1024;
export const CONSULTATION_QUOTE_ACCESSORY_MAX = 40;
export const CONSULTATION_QUOTE_SNAPSHOT_VERSION = 1;

const FORBIDDEN_SNAPSHOT_KEYS = [
  "storagePath",
  "storage_path",
  "filePath",
  "file_path",
  "canonicalPath",
  "canonical_path",
  "pdfUrl",
  "pdf_url",
  "publicUrl",
  "signedUrl",
  "token",
  "documentAccessUrl",
  "documentId",
  "pdf",
  "attachment",
] as const;

const FORBIDDEN_FIELD_PATTERN =
  /spec-sheets|\/storage\/v1\/|documentAccessUrl|\/quote\/document#cd_|cd_[0-9a-f]{64}/i;

const ALLOWED_SNAPSHOT_KEYS = [
  "version",
  "createdAt",
  "validUntil",
  "motor",
  "pricing",
  "accessoryBreakdown",
  "purchasePath",
  "tradeInValue",
  "tradeInInfo",
  "includedCoverageYears",
  "productProtection",
  "financing",
  "paymentMethod",
  "promotion",
  "customerNotes",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function canMintConsultationDocumentFromPersistedQuote(
  hasAuthoritativeQuoteSnapshot: boolean,
  persistedQuoteState: unknown,
): persistedQuoteState is Record<string, unknown> {
  return hasAuthoritativeQuoteSnapshot && isRecord(persistedQuoteState);
}

function boundedString(value: unknown, maximumLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maximumLength ? trimmed : null;
}

function assertSafePrintable(value: string): string {
  if (FORBIDDEN_FIELD_PATTERN.test(value)) {
    throw new ConsultationDocumentRequestError("Caller-controlled document paths are not allowed");
  }
  return value;
}

function optionalSafeString(value: unknown, maximumLength: number): string | undefined {
  const parsed = boundedString(value, maximumLength);
  return parsed ? assertSafePrintable(parsed) : undefined;
}

function optionalFiniteNumber(value: unknown, min: number, max: number): number | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new ConsultationDocumentRequestError("Quote snapshot number is invalid");
  }
  return value;
}

function optionalPositiveInt(value: unknown, max: number): number | undefined {
  const parsed = optionalFiniteNumber(value, 0, max);
  if (parsed == null) return undefined;
  if (!Number.isInteger(parsed)) {
    throw new ConsultationDocumentRequestError("Quote snapshot number is invalid");
  }
  return parsed;
}

function normalizeMotorModel(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function pickAllowlistedSnapshot(value: Record<string, unknown>): Record<string, unknown> {
  for (const key of FORBIDDEN_SNAPSHOT_KEYS) {
    if (key in value) {
      throw new ConsultationDocumentRequestError("Caller-controlled document paths are not allowed");
    }
  }
  const picked: Record<string, unknown> = {};
  for (const key of ALLOWED_SNAPSHOT_KEYS) {
    if (key in value) picked[key] = value[key];
  }
  return picked;
}

export function createConsultationResumeToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `quote_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function consultationSavedQuoteExpiry(now = new Date()): string {
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

function parseAccessoryCategory(value: unknown): ConsultationQuoteAccessoryCategory | undefined {
  if (value == null || value === "") return undefined;
  if (value === "equipment" || value === "installation" || value === "protection" || value === "custom") {
    return value;
  }
  throw new ConsultationDocumentRequestError("Quote snapshot accessories are invalid");
}

function parseAccessories(value: unknown): ConsultationQuoteAccessory[] {
  if (!Array.isArray(value)) {
    throw new ConsultationDocumentRequestError("Quote snapshot accessories are invalid");
  }
  if (value.length > CONSULTATION_QUOTE_ACCESSORY_MAX) {
    throw new ConsultationDocumentRequestError("Quote snapshot accessories are invalid");
  }
  return value.map((item) => {
    if (!isRecord(item)) {
      throw new ConsultationDocumentRequestError("Quote snapshot accessories are invalid");
    }
    const name = optionalSafeString(item.name, 160);
    const price = optionalFiniteNumber(item.price, -2_000_000, 2_000_000);
    if (!name || price == null) {
      throw new ConsultationDocumentRequestError("Quote snapshot accessories are invalid");
    }
    return {
      name,
      price,
      description: optionalSafeString(item.description, 240),
      category: parseAccessoryCategory(item.category),
    };
  });
}

function parseTradeIn(
  value: unknown,
  info: unknown,
): ConsultationQuoteTradeIn | null {
  const amount = optionalFiniteNumber(value, 0, 2_000_000);
  if (amount == null || amount <= 0) return null;
  const record = isRecord(info) ? info : {};
  return {
    value: amount,
    brand: optionalSafeString(record.brand, 80),
    year: optionalPositiveInt(record.year, 2100),
    horsepower: optionalFiniteNumber(record.horsepower, 0, 1000),
    model: optionalSafeString(record.model, 80),
  };
}

function parsePaymentMethod(
  value: unknown,
): ConsultationQuotePaymentMethod | undefined {
  if (value == null) return undefined;
  if (
    value === "cash_purchase"
    || value === "standard_financing"
    || value === "special_financing"
  ) {
    return value;
  }
  throw new ConsultationDocumentRequestError("Quote snapshot financing is invalid");
}

function parseFinancing(value: unknown): ConsultationQuoteFinancing | null {
  if (value == null) return null;
  if (!isRecord(value)) {
    throw new ConsultationDocumentRequestError("Quote snapshot financing is invalid");
  }
  const monthlyPayment = optionalFiniteNumber(value.monthlyPayment, 0, 1_000_000);
  const amortizationMonths = optionalPositiveInt(value.amortizationMonths, 360);
  if (monthlyPayment == null || amortizationMonths == null) {
    throw new ConsultationDocumentRequestError("Quote snapshot financing is invalid");
  }
  return {
    monthlyPayment,
    rate: optionalFiniteNumber(value.rate, 0, 40),
    amortizationMonths,
    contractTermMonths: optionalPositiveInt(value.contractTermMonths, 360),
    amountFinanced: optionalFiniteNumber(value.amountFinanced, 0, 2_000_000),
    dealerFee: optionalFiniteNumber(value.dealerFee, 0, 10_000),
    downPayment: optionalFiniteNumber(value.downPayment, 0, 2_000_000),
    paymentMethod: parsePaymentMethod(value.paymentMethod),
  };
}

function parseProductProtection(value: unknown): ConsultationQuoteProductProtection | undefined {
  if (value == null) return undefined;
  if (!isRecord(value)) {
    throw new ConsultationDocumentRequestError("Quote snapshot protection is invalid");
  }
  const planYears = optionalPositiveInt(value.planYears, 20);
  const priceBeforeTax = optionalFiniteNumber(value.priceBeforeTax, 0, 2_000_000);
  if (planYears == null || priceBeforeTax == null) {
    throw new ConsultationDocumentRequestError("Quote snapshot protection is invalid");
  }
  return {
    planYears,
    totalCoverageYears: optionalPositiveInt(value.totalCoverageYears, 20),
    priceBeforeTax,
    monthlyDelta: optionalFiniteNumber(value.monthlyDelta, 0, 10_000),
  };
}

function parsePromotion(value: unknown): ConsultationQuotePromotion | undefined {
  if (value == null) return undefined;
  if (!isRecord(value)) {
    throw new ConsultationDocumentRequestError("Quote snapshot promotion is invalid");
  }
  let selectedOption: ConsultationQuotePromoOption | null = null;
  if (value.selectedOption != null) {
    if (
      value.selectedOption !== "no_payments"
      && value.selectedOption !== "special_financing"
      && value.selectedOption !== "cash_rebate"
    ) {
      throw new ConsultationDocumentRequestError("Quote snapshot promotion is invalid");
    }
    selectedOption = value.selectedOption;
  }
  let combinationMode: ConsultationQuotePromotion["combinationMode"];
  if (value.combinationMode != null) {
    if (value.combinationMode !== "layered" && value.combinationMode !== "choose_one") {
      throw new ConsultationDocumentRequestError("Quote snapshot promotion is invalid");
    }
    combinationMode = value.combinationMode;
  }
  const promotion: ConsultationQuotePromotion = {
    name: optionalSafeString(value.name, 120),
    endDate: optionalSafeString(value.endDate, 40),
    combinationMode,
    selectedOption,
    selectedValue: optionalSafeString(value.selectedValue, 80) ?? null,
  };
  if (
    !promotion.name
    && !promotion.endDate
    && !promotion.combinationMode
    && !promotion.selectedOption
    && !promotion.selectedValue
  ) {
    return undefined;
  }
  return promotion;
}

function parseMotorDetails(value: unknown, expectedMotor: string): ConsultationQuoteMotorDetails {
  if (!isRecord(value)) {
    throw new ConsultationDocumentRequestError("Quote snapshot motor is invalid");
  }
  const model = parseConsultationMotorModel(optionalSafeString(value.model, 200));
  if (normalizeMotorModel(model) !== normalizeMotorModel(expectedMotor)) {
    throw new ConsultationDocumentRequestError("Quote snapshot motor does not match the saved quote");
  }
  return {
    model,
    hp: optionalFiniteNumber(value.hp, 0, 1000),
    modelYear: optionalPositiveInt(value.modelYear, 2100),
    category: optionalSafeString(value.category, 80),
  };
}

function parsePriceBreakdown(
  pricing: Record<string, unknown>,
  purchasePath: unknown,
  promoName: unknown,
): ConsultationQuotePriceBreakdown {
  const path = purchasePath === "installed" || purchasePath === "loose" ? purchasePath : undefined;
  return {
    msrp: optionalFiniteNumber(pricing.msrp, 0, 2_000_000),
    discount: optionalFiniteNumber(pricing.discount, 0, 2_000_000),
    adminDiscount: optionalFiniteNumber(pricing.adminDiscount, 0, 2_000_000),
    promoValue: optionalFiniteNumber(pricing.promoValue, 0, 2_000_000),
    promoName: optionalSafeString(promoName, 120),
    motorSubtotal: optionalFiniteNumber(pricing.motorSubtotal, -2_000_000, 2_000_000),
    subtotal: optionalFiniteNumber(pricing.subtotal, -2_000_000, 2_000_000),
    hst: optionalFiniteNumber(pricing.hst, 0, 2_000_000),
    savings: optionalFiniteNumber(pricing.savings, 0, 2_000_000),
    purchasePath: path,
  };
}

function parseSnapshotDate(value: unknown, required: boolean): string | undefined {
  const text = optionalSafeString(value, 40);
  if (!text) {
    if (required) throw new ConsultationDocumentRequestError("Quote snapshot is invalid");
    return undefined;
  }
  if (!Number.isFinite(Date.parse(text))) {
    throw new ConsultationDocumentRequestError("Quote snapshot is invalid");
  }
  return text;
}

function assertSnapshotReconciles(input: {
  accessories: ConsultationQuoteAccessory[];
  tradeIn: ConsultationQuoteTradeIn | null;
  breakdown: ConsultationQuotePriceBreakdown;
  totalPrice: number;
}): void {
  const { accessories, tradeIn, breakdown, totalPrice } = input;
  if (
    breakdown.motorSubtotal == null
    || breakdown.subtotal == null
    || breakdown.hst == null
  ) {
    throw new ConsultationDocumentRequestError("Quote snapshot pricing is incomplete");
  }
  const accessoryTotal = accessories.reduce((sum, item) => sum + item.price, 0);
  const expectedSubtotal = breakdown.motorSubtotal + accessoryTotal - (tradeIn?.value || 0);
  const expectedHst = breakdown.subtotal * 0.13;
  const expectedTotal = breakdown.subtotal + breakdown.hst;
  if (Math.abs(breakdown.subtotal - expectedSubtotal) > 0.02) {
    throw new ConsultationDocumentRequestError("Quote snapshot prices do not reconcile");
  }
  if (Math.abs(breakdown.hst - expectedHst) > 0.02) {
    throw new ConsultationDocumentRequestError("Quote snapshot prices do not reconcile");
  }
  if (Math.abs(breakdown.subtotal + breakdown.hst - expectedTotal) > 0.02) {
    throw new ConsultationDocumentRequestError("Quote snapshot prices do not reconcile");
  }
  if (Math.round(expectedTotal) !== totalPrice) {
    throw new ConsultationDocumentRequestError("Quote snapshot total does not match the saved quote");
  }
}

export function parseConsultationCallerQuoteSnapshot(
  value: unknown,
  expected: { total: number; motorModel: string },
): Partial<ConsultationDeliverySnapshot> {
  if (!isRecord(value)) {
    throw new ConsultationDocumentRequestError("Quote snapshot is invalid");
  }
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new ConsultationDocumentRequestError("Quote snapshot is invalid");
  }
  if (new TextEncoder().encode(serialized).byteLength > CONSULTATION_CALLER_QUOTE_SNAPSHOT_MAX_BYTES) {
    throw new ConsultationDocumentRequestError("Quote snapshot is invalid");
  }

  const snapshot = pickAllowlistedSnapshot(value);
  if (snapshot.version !== CONSULTATION_QUOTE_SNAPSHOT_VERSION || !isRecord(snapshot.pricing)) {
    throw new ConsultationDocumentRequestError("Quote snapshot is invalid");
  }

  const totalPrice = parseConsultationTotalPrice(snapshot.pricing.totalCashPrice);
  if (totalPrice !== Math.round(expected.total)) {
    throw new ConsultationDocumentRequestError("Quote snapshot total does not match the saved quote");
  }

  const motorDetails = parseMotorDetails(snapshot.motor, expected.motorModel);
  const accessories = parseAccessories(snapshot.accessoryBreakdown);
  const tradeIn = parseTradeIn(snapshot.tradeInValue, snapshot.tradeInInfo);
  const promotion = parsePromotion(snapshot.promotion);
  const breakdown = parsePriceBreakdown(snapshot.pricing, snapshot.purchasePath, promotion?.name);
  assertSnapshotReconciles({ accessories, tradeIn, breakdown, totalPrice });

  const paymentMethod = parsePaymentMethod(snapshot.paymentMethod);
  let financing = parseFinancing(snapshot.financing);
  if (paymentMethod === "cash_purchase") {
    financing = financing
      ? { ...financing, paymentMethod: "cash_purchase" }
      : { monthlyPayment: 0, amortizationMonths: 0, paymentMethod: "cash_purchase" };
  } else if (financing && paymentMethod) {
    financing = { ...financing, paymentMethod };
  }

  return {
    createdAt: parseSnapshotDate(snapshot.createdAt, true),
    validUntil: parseSnapshotDate(snapshot.validUntil, false),
    motorDetails,
    priceBreakdown: breakdown,
    accessories,
    purchasePath: breakdown.purchasePath,
    includedCoverageYears: optionalPositiveInt(snapshot.includedCoverageYears, 20),
    paymentMethod: paymentMethod ?? financing?.paymentMethod ?? null,
    promotion,
    customerNotes: optionalSafeString(snapshot.customerNotes, 1000),
    ...(tradeIn ? { tradeIn } : {}),
    ...(financing ? { financing } : {}),
    productProtection: parseProductProtection(snapshot.productProtection),
  };
}

export function consultationDetailsFromLeadPayload(input: {
  basePrice: number;
  finalPrice: number;
  depositAmount: number;
  loanAmount: number;
  monthlyPayment: number;
  termMonths: number;
  tradeInFinal?: number | null;
}): Partial<ConsultationDeliverySnapshot> {
  const subtotal = input.basePrice;
  const totalPrice = Math.round(input.finalPrice);
  const hst = Math.round((totalPrice - subtotal) * 100) / 100;
  const details: Partial<ConsultationDeliverySnapshot> = {
    priceBreakdown: {
      subtotal,
      ...(hst >= 0 ? { hst } : {}),
    },
    depositAmount: input.depositAmount > 0 ? input.depositAmount : undefined,
  };
  if (input.tradeInFinal && input.tradeInFinal > 0) {
    details.tradeIn = { value: input.tradeInFinal };
  }
  if (input.monthlyPayment > 0 && input.termMonths > 0 && input.loanAmount > 0) {
    details.financing = {
      monthlyPayment: input.monthlyPayment,
      amortizationMonths: input.termMonths,
      amountFinanced: input.loanAmount,
      downPayment: input.depositAmount > 0 ? input.depositAmount : undefined,
    };
  }
  return details;
}

export function mergeConsultationDeliverySnapshot(
  identity: ConsultationDeliverySnapshot,
  details?: Partial<ConsultationDeliverySnapshot> | null,
): ConsultationDeliverySnapshot {
  if (!details) return identity;
  return {
    ...details,
    ...identity,
    createdAt: details.createdAt,
    validUntil: details.validUntil,
    motorDetails: details.motorDetails,
    priceBreakdown: details.priceBreakdown,
    accessories: details.accessories,
    purchasePath: details.purchasePath,
    tradeIn: details.tradeIn,
    includedCoverageYears: details.includedCoverageYears,
    financing: details.financing,
    paymentMethod: details.paymentMethod,
    promotion: details.promotion,
    customerNotes: details.customerNotes,
    depositAmount: details.depositAmount,
    productProtection: details.productProtection,
  };
}

export function buildConsultationSavedQuoteState(input: {
  quoteNumber: string;
  quoteId: string;
  snapshot: ConsultationDeliverySnapshot;
}): Record<string, unknown> {
  const motor = input.snapshot.motorDetails;
  return {
    source: CONSULTATION_SAVED_QUOTE_SOURCE,
    quoteNumber: parseConsultationQuoteNumber(input.quoteNumber),
    customerQuoteId: parseConsultationDocumentId(input.quoteId),
    createdAt: input.snapshot.createdAt,
    validUntil: input.snapshot.validUntil,
    motor: {
      model: input.snapshot.motorModel,
      ...(motor?.hp != null ? { hp: motor.hp } : {}),
      ...(motor?.modelYear != null ? { modelYear: motor.modelYear } : {}),
      ...(motor?.category ? { category: motor.category } : {}),
    },
    pricing: {
      totalPrice: input.snapshot.totalPrice,
      ...(input.snapshot.priceBreakdown || {}),
    },
    accessories: input.snapshot.accessories || [],
    purchasePath: input.snapshot.purchasePath,
    tradeIn: input.snapshot.tradeIn || null,
    includedCoverageYears: input.snapshot.includedCoverageYears,
    financing: input.snapshot.financing || null,
    paymentMethod: input.snapshot.paymentMethod ?? input.snapshot.financing?.paymentMethod ?? null,
    promotion: input.snapshot.promotion,
    customerNotes: input.snapshot.customerNotes,
    depositAmount: input.snapshot.depositAmount,
    productProtection: input.snapshot.productProtection,
    customer: {
      name: input.snapshot.customerName,
      email: input.snapshot.customerEmail,
      phone: input.snapshot.customerPhone,
    },
  };
}

function accessoriesFromState(state: Record<string, unknown>): ConsultationQuoteAccessory[] | undefined {
  if (!Array.isArray(state.accessories) || state.accessories.length === 0) return undefined;
  return state.accessories.flatMap((item) => {
    if (!isRecord(item) || typeof item.name !== "string" || typeof item.price !== "number") return [];
    return [{
      name: item.name,
      price: item.price,
      description: typeof item.description === "string" ? item.description : undefined,
      category: item.category === "equipment"
        || item.category === "installation"
        || item.category === "protection"
        || item.category === "custom"
        ? item.category
        : undefined,
    }];
  });
}

function tradeInFromState(state: Record<string, unknown>): ConsultationQuoteTradeIn | null | undefined {
  if (state.tradeIn == null) return state.tradeIn === null ? null : undefined;
  if (!isRecord(state.tradeIn) || typeof state.tradeIn.value !== "number") return undefined;
  return {
    value: state.tradeIn.value,
    brand: typeof state.tradeIn.brand === "string" ? state.tradeIn.brand : undefined,
    year: typeof state.tradeIn.year === "number" ? state.tradeIn.year : undefined,
    horsepower: typeof state.tradeIn.horsepower === "number" ? state.tradeIn.horsepower : undefined,
    model: typeof state.tradeIn.model === "string" ? state.tradeIn.model : undefined,
  };
}

function financingFromState(state: Record<string, unknown>): ConsultationQuoteFinancing | null | undefined {
  if (state.financing == null) return state.financing === null ? null : undefined;
  if (!isRecord(state.financing) || typeof state.financing.monthlyPayment !== "number") return undefined;
  const amortizationMonths = typeof state.financing.amortizationMonths === "number"
    ? state.financing.amortizationMonths
    : undefined;
  if (amortizationMonths == null) return undefined;
  return {
    monthlyPayment: state.financing.monthlyPayment,
    rate: typeof state.financing.rate === "number" ? state.financing.rate : undefined,
    amortizationMonths,
    contractTermMonths: typeof state.financing.contractTermMonths === "number"
      ? state.financing.contractTermMonths
      : undefined,
    amountFinanced: typeof state.financing.amountFinanced === "number"
      ? state.financing.amountFinanced
      : undefined,
    dealerFee: typeof state.financing.dealerFee === "number" ? state.financing.dealerFee : undefined,
    downPayment: typeof state.financing.downPayment === "number" ? state.financing.downPayment : undefined,
    paymentMethod: state.financing.paymentMethod === "cash_purchase"
      || state.financing.paymentMethod === "standard_financing"
      || state.financing.paymentMethod === "special_financing"
      ? state.financing.paymentMethod
      : undefined,
  };
}

function breakdownFromState(state: Record<string, unknown>): ConsultationQuotePriceBreakdown | undefined {
  const pricing = isRecord(state.pricing) ? state.pricing : {};
  const hasBreakdown = [
    pricing.msrp,
    pricing.discount,
    pricing.subtotal,
    pricing.hst,
    pricing.motorSubtotal,
    pricing.savings,
  ].some((value) => typeof value === "number");
  if (!hasBreakdown) return undefined;
  const purchasePath = state.purchasePath === "loose" || state.purchasePath === "installed"
    ? state.purchasePath
    : pricing.purchasePath === "loose" || pricing.purchasePath === "installed"
      ? pricing.purchasePath
      : undefined;
  return {
    msrp: typeof pricing.msrp === "number" ? pricing.msrp : undefined,
    discount: typeof pricing.discount === "number" ? pricing.discount : undefined,
    adminDiscount: typeof pricing.adminDiscount === "number" ? pricing.adminDiscount : undefined,
    promoValue: typeof pricing.promoValue === "number" ? pricing.promoValue : undefined,
    promoName: typeof pricing.promoName === "string" ? pricing.promoName : undefined,
    motorSubtotal: typeof pricing.motorSubtotal === "number" ? pricing.motorSubtotal : undefined,
    subtotal: typeof pricing.subtotal === "number" ? pricing.subtotal : undefined,
    hst: typeof pricing.hst === "number" ? pricing.hst : undefined,
    savings: typeof pricing.savings === "number" ? pricing.savings : undefined,
    purchasePath,
  };
}

function motorDetailsFromState(
  state: Record<string, unknown>,
  model: string,
): ConsultationQuoteMotorDetails | undefined {
  const motor = isRecord(state.motor) ? state.motor : {};
  if (
    typeof motor.hp !== "number"
    && typeof motor.modelYear !== "number"
    && typeof motor.category !== "string"
  ) {
    return undefined;
  }
  return {
    model,
    hp: typeof motor.hp === "number" ? motor.hp : undefined,
    modelYear: typeof motor.modelYear === "number" ? motor.modelYear : undefined,
    category: typeof motor.category === "string" ? motor.category : undefined,
  };
}

function promotionFromState(state: Record<string, unknown>): ConsultationQuotePromotion | undefined {
  if (!isRecord(state.promotion)) return undefined;
  const selectedOption = state.promotion.selectedOption;
  return {
    name: typeof state.promotion.name === "string" ? state.promotion.name : undefined,
    endDate: typeof state.promotion.endDate === "string" ? state.promotion.endDate : undefined,
    combinationMode: state.promotion.combinationMode === "layered"
      || state.promotion.combinationMode === "choose_one"
      ? state.promotion.combinationMode
      : undefined,
    selectedOption: selectedOption === "no_payments"
      || selectedOption === "special_financing"
      || selectedOption === "cash_rebate"
      ? selectedOption
      : selectedOption === null
        ? null
        : undefined,
    selectedValue: typeof state.promotion.selectedValue === "string" ? state.promotion.selectedValue : null,
  };
}

export function consultationSnapshotFromAuthoritativeQuote(input: {
  persistedName: unknown;
  persistedEmail: unknown;
  persistedPhone: unknown;
  quoteState: unknown;
  fallbackMotor: unknown;
  fallbackTotal: unknown;
}): ConsultationDeliverySnapshot {
  const state = isRecord(input.quoteState) ? input.quoteState : {};
  const motor = isRecord(state.motor) ? state.motor.model : input.fallbackMotor;
  const pricing = isRecord(state.pricing) ? state.pricing.totalPrice : input.fallbackTotal;
  const customer = isRecord(state.customer) ? state.customer : {};
  const identity = consultationSubmitDeliverySnapshot({
    customerName: customer.name || input.persistedName,
    customerEmail: input.persistedEmail,
    customerPhone: customer.phone || input.persistedPhone,
    motorModel: motor,
    totalPrice: pricing ?? input.fallbackTotal,
  });
  const protection = isRecord(state.productProtection)
    && typeof state.productProtection.planYears === "number"
    && typeof state.productProtection.priceBeforeTax === "number"
    ? {
      planYears: state.productProtection.planYears,
      totalCoverageYears: typeof state.productProtection.totalCoverageYears === "number"
        ? state.productProtection.totalCoverageYears
        : undefined,
      priceBeforeTax: state.productProtection.priceBeforeTax,
      monthlyDelta: typeof state.productProtection.monthlyDelta === "number"
        ? state.productProtection.monthlyDelta
        : undefined,
    }
    : undefined;
  const paymentMethod = state.paymentMethod === "cash_purchase"
    || state.paymentMethod === "standard_financing"
    || state.paymentMethod === "special_financing"
    ? state.paymentMethod
    : null;
  return mergeConsultationDeliverySnapshot(identity, {
    createdAt: typeof state.createdAt === "string" ? state.createdAt : undefined,
    validUntil: typeof state.validUntil === "string" ? state.validUntil : undefined,
    motorDetails: motorDetailsFromState(state, identity.motorModel),
    priceBreakdown: breakdownFromState(state),
    accessories: accessoriesFromState(state),
    purchasePath: state.purchasePath === "loose" || state.purchasePath === "installed"
      ? state.purchasePath
      : undefined,
    tradeIn: tradeInFromState(state),
    includedCoverageYears: typeof state.includedCoverageYears === "number"
      ? state.includedCoverageYears
      : undefined,
    financing: financingFromState(state),
    paymentMethod,
    promotion: promotionFromState(state),
    customerNotes: typeof state.customerNotes === "string" ? state.customerNotes : undefined,
    depositAmount: typeof state.depositAmount === "number" ? state.depositAmount : undefined,
    productProtection: protection,
  });
}
