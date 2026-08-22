import { parseSavedQuoteId } from "./quote-document-policy.ts";

export const INVALID_DEPOSIT_SAVED_QUOTE = "Invalid saved quote for deposit";

export type DepositPaymentGuardInput = {
  action?: unknown;
  paymentType?: unknown;
  depositAmount?: unknown;
  savedQuoteId?: unknown;
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

export function createPaymentMayInvokeStripe(body: DepositPaymentGuardInput): boolean {
  if (body.action === "verify") return true;
  try {
    assertDepositRequestHasSavedQuoteId(body);
    return true;
  } catch {
    return false;
  }
}
