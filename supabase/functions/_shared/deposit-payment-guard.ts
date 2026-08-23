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
  quoteData?: unknown;
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

export const QUOTE_CHECKOUT_AUTH_REQUIRED = "Authentication required for quote payments";

export function quoteCheckoutRequiresAuthentication(body: DepositPaymentGuardInput): boolean {
  if (body.action === "verify" || body.action === "recover_stripe_billing") return false;
  return !isDepositPaymentRequest(body);
}

export function assertQuoteCheckoutAuthenticated(
  body: DepositPaymentGuardInput,
  user: { id: string } | null | undefined,
): void {
  if (quoteCheckoutRequiresAuthentication(body) && !user) {
    throw new Error(QUOTE_CHECKOUT_AUTH_REQUIRED);
  }
}

export function isJsonRequestSyntaxError(error: unknown): boolean {
  if (error instanceof SyntaxError) return true;
  return Boolean(error && typeof error === "object" && (error as { name?: string }).name === "SyntaxError");
}

export function mapCreatePaymentCaughtError(error: unknown): { status: number; error: string } {
  if (isJsonRequestSyntaxError(error)) {
    return { status: 400, error: "Invalid input data" };
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes("Authentication required")) {
    return { status: 401, error: "Authentication required" };
  }
  if (errorMessage.includes("Invalid deposit amount")) {
    return { status: 400, error: "Invalid deposit amount" };
  }
  if (
    errorMessage.includes("Customer identity and address are required")
    || errorMessage.includes("Customer information required")
  ) {
    return { status: 400, error: "Full name, email, phone, and complete address are required for a deposit" };
  }
  if (errorMessage.includes("Invalid saved quote document")) {
    return { status: 400, error: "The saved quote document could not be verified. Please refresh and try again." };
  }
  if (errorMessage.includes("Invalid saved quote")) {
    return { status: 400, error: "The saved quote could not be verified. Please refresh and try again." };
  }
  if (errorMessage.includes("Invalid quote snapshot")) {
    return { status: 400, error: "Invalid quote data" };
  }
  if (errorMessage.includes("Price validation failed")) {
    return { status: 400, error: "Price validation failed. Please refresh and try again." };
  }
  if (errorMessage.includes("Quote data is required")) {
    return { status: 400, error: "Quote data is required" };
  }
  return { status: 500, error: "An error occurred processing your payment. Please try again." };
}
