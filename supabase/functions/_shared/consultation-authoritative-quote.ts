import {
  type ConsultationDeliverySnapshot,
  consultationSubmitDeliverySnapshot,
  parseConsultationDocumentId,
  parseConsultationQuoteNumber,
} from "./consultation-document-policy.ts";

export const CONSULTATION_SAVED_QUOTE_SOURCE = "consultation-submit";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createConsultationResumeToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `quote_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function consultationSavedQuoteExpiry(now = new Date()): string {
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

export function buildConsultationSavedQuoteState(input: {
  quoteNumber: string;
  quoteId: string;
  snapshot: ConsultationDeliverySnapshot;
}): Record<string, unknown> {
  return {
    source: CONSULTATION_SAVED_QUOTE_SOURCE,
    quoteNumber: parseConsultationQuoteNumber(input.quoteNumber),
    customerQuoteId: parseConsultationDocumentId(input.quoteId),
    motor: { model: input.snapshot.motorModel },
    pricing: { totalPrice: input.snapshot.totalPrice },
    customer: {
      name: input.snapshot.customerName,
      email: input.snapshot.customerEmail,
      phone: input.snapshot.customerPhone,
    },
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
  return consultationSubmitDeliverySnapshot({
    customerName: customer.name || input.persistedName,
    customerEmail: input.persistedEmail,
    customerPhone: customer.phone || input.persistedPhone,
    motorModel: motor,
    totalPrice: pricing ?? input.fallbackTotal,
  });
}
