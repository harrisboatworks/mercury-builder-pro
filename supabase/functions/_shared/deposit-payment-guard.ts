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
  if (body.action === "verify") return true;
  try {
    assertDepositRequestReadyForStripe(body);
    return true;
  } catch {
    return false;
  }
}
