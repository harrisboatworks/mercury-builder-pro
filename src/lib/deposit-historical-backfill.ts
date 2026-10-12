export const HISTORICAL_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const HISTORICAL_CHECKOUT_SESSION_PATTERN = /^cs_(?:test_|live_)?[A-Za-z0-9]+$/;
export const HISTORICAL_PAYMENT_INTENT_PATTERN = /^pi_(?:test_|live_)?[A-Za-z0-9]+$/;
export const HISTORICAL_PAYMENT_STATUSES = ["paid", "pending", "failed", "refunded"] as const;

export type HistoricalDepositQuoteRow = {
  id: string;
  lead_source: string | null;
  saved_quote_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_status: string | null;
  deposit_amount?: number | null;
  payment_paid_at?: string | null;
  quote_data?: Record<string, unknown> | null;
};

export type HistoricalSavedQuoteRow = {
  id: string;
  deposit_status: string | null;
  deposit_amount?: number | null;
  deposit_paid_at?: string | null;
};

export type HistoricalBackfillSkipReason =
  | "invalid_saved_quote_id"
  | "missing_saved_quote"
  | "invalid_session"
  | "invalid_payment_intent"
  | "ambiguous_saved_quote"
  | "session_conflict"
  | "existing_column_conflict"
  | "not_a_deposit_join";

export type HistoricalCustomerQuotePatch = {
  saved_quote_id?: string;
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
};

export type HistoricalSavedQuotePatch = {
  deposit_status?: "paid";
  deposit_amount?: number;
  deposit_paid_at?: string;
};

export type HistoricalBackfillPlan = {
  customerQuoteUpdates: Array<{ id: string; patch: HistoricalCustomerQuotePatch }>;
  savedQuoteUpdates: Array<{ id: string; patch: HistoricalSavedQuotePatch }>;
  skipped: Array<{ id: string; field: string; reason: HistoricalBackfillSkipReason }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isHistoricalUuid(value: unknown): value is string {
  return typeof value === "string" && HISTORICAL_UUID_PATTERN.test(value.trim());
}

export function isHistoricalCheckoutSessionId(value: unknown): value is string {
  return typeof value === "string" && HISTORICAL_CHECKOUT_SESSION_PATTERN.test(value.trim());
}

export function isHistoricalPaymentIntentId(value: unknown): value is string {
  return typeof value === "string" && HISTORICAL_PAYMENT_INTENT_PATTERN.test(value.trim());
}

export function jsonSavedQuoteId(row: HistoricalDepositQuoteRow): string | null {
  const value = isRecord(row.quote_data) ? readTrimmed(row.quote_data.saved_quote_id) : "";
  return value || null;
}

export function jsonCheckoutSessionId(row: HistoricalDepositQuoteRow): string | null {
  const value = isRecord(row.quote_data) ? readTrimmed(row.quote_data.stripe_session_id) : "";
  return value || null;
}

export function jsonPaymentIntentId(row: HistoricalDepositQuoteRow): string | null {
  if (!isRecord(row.quote_data)) return null;
  const value = readTrimmed(row.quote_data.stripe_payment_intent)
    || readTrimmed(row.quote_data.payment_intent_id);
  return value || null;
}

export function jsonPaymentStatus(row: HistoricalDepositQuoteRow): string | null {
  const value = isRecord(row.quote_data) ? readTrimmed(row.quote_data.payment_status) : "";
  return (HISTORICAL_PAYMENT_STATUSES as readonly string[]).includes(value) ? value : null;
}

function effectiveSavedQuoteId(row: HistoricalDepositQuoteRow): string | null {
  if (isHistoricalUuid(row.saved_quote_id)) return row.saved_quote_id.trim().toLowerCase();
  const fromJson = jsonSavedQuoteId(row);
  return isHistoricalUuid(fromJson) ? fromJson.trim().toLowerCase() : null;
}

function effectiveSessionId(row: HistoricalDepositQuoteRow): string | null {
  if (isHistoricalCheckoutSessionId(row.stripe_checkout_session_id)) {
    return row.stripe_checkout_session_id.trim();
  }
  const fromJson = jsonCheckoutSessionId(row);
  return isHistoricalCheckoutSessionId(fromJson) ? fromJson.trim() : null;
}

function countBy<T>(values: Array<T | null>): Map<T, number> {
  const counts = new Map<T, number>();
  for (const value of values) {
    if (value == null) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

export function planHistoricalDepositBackfill(
  customerQuotes: HistoricalDepositQuoteRow[],
  savedQuotes: HistoricalSavedQuoteRow[] = [],
): HistoricalBackfillPlan {
  const knownSavedQuoteIds = new Set(
    savedQuotes
      .map((row) => row.id.trim().toLowerCase())
      .filter((id) => HISTORICAL_UUID_PATTERN.test(id)),
  );
  const depositSavedQuoteCounts = countBy(
    customerQuotes
      .filter((row) => row.lead_source === "deposit")
      .map((row) => effectiveSavedQuoteId(row)),
  );
  const sessionCounts = countBy(customerQuotes.map((row) => effectiveSessionId(row)));

  const customerQuoteUpdates: HistoricalBackfillPlan["customerQuoteUpdates"] = [];
  const skipped: HistoricalBackfillPlan["skipped"] = [];

  for (const row of customerQuotes) {
    const patch: HistoricalCustomerQuotePatch = {};

    if (!row.saved_quote_id) {
      const candidate = jsonSavedQuoteId(row);
      if (candidate) {
        if (row.lead_source !== "deposit") {
          skipped.push({ id: row.id, field: "saved_quote_id", reason: "not_a_deposit_join" });
        } else if (!isHistoricalUuid(candidate)) {
          skipped.push({ id: row.id, field: "saved_quote_id", reason: "invalid_saved_quote_id" });
        } else if (!knownSavedQuoteIds.has(candidate.trim().toLowerCase())) {
          skipped.push({ id: row.id, field: "saved_quote_id", reason: "missing_saved_quote" });
        } else if ((depositSavedQuoteCounts.get(candidate.trim().toLowerCase()) || 0) > 1) {
          skipped.push({ id: row.id, field: "saved_quote_id", reason: "ambiguous_saved_quote" });
        } else {
          patch.saved_quote_id = candidate.trim().toLowerCase();
        }
      }
    } else if (
      jsonSavedQuoteId(row)
      && isHistoricalUuid(jsonSavedQuoteId(row))
      && row.saved_quote_id.trim().toLowerCase() !== jsonSavedQuoteId(row)!.trim().toLowerCase()
    ) {
      skipped.push({ id: row.id, field: "saved_quote_id", reason: "existing_column_conflict" });
    }

    if (!row.stripe_checkout_session_id) {
      const candidate = jsonCheckoutSessionId(row);
      if (candidate) {
        if (row.lead_source !== "deposit") {
          skipped.push({ id: row.id, field: "stripe_checkout_session_id", reason: "not_a_deposit_join" });
        } else if (!isHistoricalCheckoutSessionId(candidate)) {
          skipped.push({ id: row.id, field: "stripe_checkout_session_id", reason: "invalid_session" });
        } else if ((sessionCounts.get(candidate.trim()) || 0) > 1) {
          skipped.push({ id: row.id, field: "stripe_checkout_session_id", reason: "session_conflict" });
        } else {
          patch.stripe_checkout_session_id = candidate.trim();
        }
      }
    } else if (
      jsonCheckoutSessionId(row)
      && isHistoricalCheckoutSessionId(jsonCheckoutSessionId(row))
      && row.stripe_checkout_session_id.trim() !== jsonCheckoutSessionId(row)!.trim()
    ) {
      skipped.push({ id: row.id, field: "stripe_checkout_session_id", reason: "existing_column_conflict" });
    }

    if (!row.stripe_payment_intent_id) {
      const candidate = jsonPaymentIntentId(row);
      if (candidate) {
        if (row.lead_source !== "deposit") {
          skipped.push({ id: row.id, field: "stripe_payment_intent_id", reason: "not_a_deposit_join" });
        } else if (!isHistoricalPaymentIntentId(candidate)) {
          skipped.push({ id: row.id, field: "stripe_payment_intent_id", reason: "invalid_payment_intent" });
        } else {
          patch.stripe_payment_intent_id = candidate.trim();
        }
      }
    } else if (
      jsonPaymentIntentId(row)
      && isHistoricalPaymentIntentId(jsonPaymentIntentId(row))
      && row.stripe_payment_intent_id.trim() !== jsonPaymentIntentId(row)!.trim()
    ) {
      skipped.push({ id: row.id, field: "stripe_payment_intent_id", reason: "existing_column_conflict" });
    }

    if (Object.keys(patch).length > 0) {
      customerQuoteUpdates.push({ id: row.id, patch });
    }
  }

  return { customerQuoteUpdates, savedQuoteUpdates: [], skipped };
}
