import { parseSavedQuoteId } from "./quote-document-policy.ts";
import {
  DEPOSIT_IDENTITY_ERROR,
  parseDepositIdentity,
} from "./deposit-identity.ts";

export const INVALID_DEPOSIT_SAVED_QUOTE = "Invalid saved quote for deposit";
export const INVALID_DEPOSIT_IDENTITY = DEPOSIT_IDENTITY_ERROR;

export type DepositPaymentGuardInput = {
  action?: unknown;
  sessionId?: unknown;
  paymentType?: unknown;
  depositAmount?: unknown;
  savedQuoteId?: unknown;
  customerInfo?: unknown;
};

export function isDepositPaymentRequest(body: DepositPaymentGuardInput): boolean {
  if (body.action === "verify") return false;
  return body.paymentType === "deposit" || Boolean(body.depositAmount);
}

export function assertDepositRequestHasSavedQuoteId(
  body: DepositPaymentGuardInput,
): string | null {
  if (!isDepositPaymentRequest(body)) return null;
  try {
    return parseSavedQuoteId(body.savedQuoteId);
  } catch {
    throw new Error(INVALID_DEPOSIT_SAVED_QUOTE);
  }
}

export function assertDepositRequestHasIdentity(body: DepositPaymentGuardInput): void {
  if (!isDepositPaymentRequest(body)) return;
  try {
    parseDepositIdentity(body.customerInfo);
  } catch {
    throw new Error(INVALID_DEPOSIT_IDENTITY);
  }
}

export function assertDepositRequestReadyForStripe(
  body: DepositPaymentGuardInput,
): string | null {
  const savedQuoteId = assertDepositRequestHasSavedQuoteId(body);
  assertDepositRequestHasIdentity(body);
  return savedQuoteId;
}

export function createPaymentMayInvokeStripe(body: DepositPaymentGuardInput): boolean {
  return decideCreatePaymentStripeAccess(body).allowStripeAccess;
}

export type CreatePaymentStripeAccessDecision =
  | { allowStripeAccess: false; status: 400; error: string; savedQuoteId: null }
  | { allowStripeAccess: true; savedQuoteId: string | null };

export function decideCreatePaymentStripeAccess(
  body: DepositPaymentGuardInput,
): CreatePaymentStripeAccessDecision {
  if (body.action === "verify" || body.action === "recover_stripe_billing") {
    return { allowStripeAccess: true, savedQuoteId: null };
  }
  try {
    return {
      allowStripeAccess: true,
      savedQuoteId: assertDepositRequestReadyForStripe(body),
    };
  } catch (error) {
    return {
      allowStripeAccess: false,
      status: 400,
      error: error instanceof Error ? error.message : INVALID_DEPOSIT_IDENTITY,
      savedQuoteId: null,
    };
  }
}

export function readRequiredStripeSecret(
  env: { get(name: string): string | undefined } | Record<string, string | undefined>,
): string {
  const value = typeof (env as { get?: unknown }).get === "function"
    ? (env as { get(name: string): string | undefined }).get("STRIPE_SECRET_KEY")
    : (env as Record<string, string | undefined>).STRIPE_SECRET_KEY;
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) throw new Error("STRIPE_SECRET_KEY is not set");
  return trimmed;
}
