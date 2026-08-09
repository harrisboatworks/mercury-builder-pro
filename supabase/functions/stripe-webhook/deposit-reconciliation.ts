export type BoundDepositQuoteData = {
  saved_quote_id?: string | null;
  quote_pdf_path?: string | null;
};

export type BoundDeposit = {
  customer_email?: string | null;
  deposit_amount?: string | number | null;
  quote_data?: BoundDepositQuoteData | null;
};

export type BoundSavedQuote = {
  id: string;
  email?: string | null;
  deposit_status?: string | null;
  deposit_amount?: string | number | null;
  quote_pdf_path?: string | null;
};

export type DepositPreclaimInput = {
  sessionCurrency?: string | null;
  sessionAmountTotal?: number | null;
  metadataDepositAmount?: string | null;
  metadataSavedQuoteId?: string | null;
  metadataQuotePdfPath?: string | null;
  stripeReceiptEmail?: string | null;
  boundDeposit: BoundDeposit;
  boundSavedQuote?: BoundSavedQuote | null;
};

export type ReconciledDeposit = {
  depositAmount: number;
  depositAmountCents: number;
  savedQuoteId: string;
  quotePdfPath: string;
  quoteAuthorizationEmail: string;
  stripeReceiptEmail: string;
};

function normalizeEmail(value?: string | null): string {
  return String(value || "").trim().toLowerCase();
}

/**
 * Validates every Stripe-controlled deposit value against the server-side
 * records created before checkout. Call this before claiming pending -> paid.
 */
export function validateDepositBeforeClaim(input: DepositPreclaimInput): ReconciledDeposit {
  const boundQuoteData = input.boundDeposit.quote_data || {};
  const boundDepositAmount = Number(input.boundDeposit.deposit_amount);
  const boundDepositAmountCents = boundDepositAmount * 100;
  const metadataDepositAmount = Number(input.metadataDepositAmount);
  const boundSavedQuoteId = String(boundQuoteData.saved_quote_id || "");
  const metadataSavedQuoteId = String(input.metadataSavedQuoteId || "");
  const boundQuotePdfPath = String(boundQuoteData.quote_pdf_path || "");
  const metadataQuotePdfPath = String(input.metadataQuotePdfPath || "");
  const quoteAuthorizationEmail = normalizeEmail(input.boundDeposit.customer_email);

  if (
    !Number.isFinite(boundDepositAmount)
    || boundDepositAmount <= 0
    || !Number.isSafeInteger(boundDepositAmountCents)
    || !Number.isFinite(metadataDepositAmount)
    || metadataDepositAmount !== boundDepositAmount
  ) {
    throw new Error("Stripe deposit amount metadata does not match the bound record");
  }

  if (input.sessionCurrency !== "cad") {
    throw new Error("Stripe deposit currency does not match the bound CAD deposit");
  }

  if (input.sessionAmountTotal !== boundDepositAmountCents) {
    throw new Error("Stripe deposit total does not match the bound deposit amount");
  }

  if (
    boundSavedQuoteId !== metadataSavedQuoteId
    || boundQuotePdfPath !== metadataQuotePdfPath
  ) {
    throw new Error("Stripe deposit metadata does not match the bound record");
  }

  if (!quoteAuthorizationEmail) {
    throw new Error("Bound deposit customer identity is missing");
  }

  if (boundSavedQuoteId) {
    const savedQuote = input.boundSavedQuote;
    if (
      !savedQuote
      || savedQuote.id !== boundSavedQuoteId
      || normalizeEmail(savedQuote.email) !== quoteAuthorizationEmail
      || Number(savedQuote.deposit_amount) !== boundDepositAmount
      || String(savedQuote.quote_pdf_path || "") !== boundQuotePdfPath
      || !["pending", "paid"].includes(String(savedQuote.deposit_status || ""))
    ) {
      throw new Error("Bound saved quote could not be verified");
    }
  } else if (input.boundSavedQuote) {
    throw new Error("Unexpected saved quote for unbound deposit");
  }

  return {
    depositAmount: boundDepositAmount,
    depositAmountCents: boundDepositAmountCents,
    savedQuoteId: boundSavedQuoteId,
    quotePdfPath: boundQuotePdfPath,
    quoteAuthorizationEmail,
    stripeReceiptEmail: normalizeEmail(input.stripeReceiptEmail),
  };
}

/**
 * Keeps the pending -> paid write behind the same reconciliation contract used
 * by the handler's early duplicate check. The callback is never entered when
 * any Stripe or saved-quote value is inconsistent with the bound records.
 */
export async function claimDepositAfterValidation<T>(
  input: DepositPreclaimInput,
  claim: (deposit: ReconciledDeposit) => Promise<T>,
): Promise<T> {
  return await claim(validateDepositBeforeClaim(input));
}
