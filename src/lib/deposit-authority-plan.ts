export const CUSTOMER_QUOTE_PAYMENT_AUTHORITY_COLUMNS = [
  "saved_quote_id",
  "stripe_checkout_session_id",
  "stripe_payment_intent_id",
  "payment_status",
  "payment_paid_at",
  "stripe_billing_address",
] as const;

export const DEPOSIT_QUOTE_DATA_AUTHORITY_KEYS = [
  "payment_status",
  "stripe_session_id",
  "stripe_payment_intent",
  "payment_intent_id",
  "saved_quote_id",
  "payment_type",
  "deposit_amount",
  "motor_info",
  "quote_snapshot",
  "deposit_outbox_schema",
  "notification_status",
  "notification_event_id",
  "notification_lease_expires_at",
  "notification_completed_at",
  "sms_notification_status",
] as const;

export type DepositAuthorityCaller = "anon" | "authenticated" | "admin" | "service_role";

export type CustomerQuoteAuthorityRow = {
  lead_source?: string | null;
  saved_quote_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  payment_status?: string | null;
  payment_paid_at?: string | null;
  stripe_billing_address?: unknown;
  quote_data?: Record<string, unknown> | null;
};

export function isDepositAuthorityCaller(caller: DepositAuthorityCaller): boolean {
  return caller === "admin" || caller === "service_role";
}

function authorityColumnIsSet(row: CustomerQuoteAuthorityRow, column: typeof CUSTOMER_QUOTE_PAYMENT_AUTHORITY_COLUMNS[number]): boolean {
  return row[column] != null;
}

function authorityColumnChanged(
  previous: CustomerQuoteAuthorityRow,
  next: CustomerQuoteAuthorityRow,
  column: typeof CUSTOMER_QUOTE_PAYMENT_AUTHORITY_COLUMNS[number],
): boolean {
  return JSON.stringify(previous[column] ?? null) !== JSON.stringify(next[column] ?? null);
}

function quoteDataAuthorityChanged(
  previous: CustomerQuoteAuthorityRow["quote_data"],
  next: CustomerQuoteAuthorityRow["quote_data"],
): boolean {
  return DEPOSIT_QUOTE_DATA_AUTHORITY_KEYS.some((key) => (
    JSON.stringify(previous?.[key] ?? null) !== JSON.stringify(next?.[key] ?? null)
  ));
}

export function customerQuoteMutationRejected(options: {
  op: "INSERT" | "UPDATE" | "DELETE";
  caller: DepositAuthorityCaller;
  oldRow?: CustomerQuoteAuthorityRow | null;
  newRow?: CustomerQuoteAuthorityRow | null;
}): boolean {
  if (isDepositAuthorityCaller(options.caller)) return false;

  if (options.op === "DELETE") {
    return options.oldRow?.lead_source === "deposit";
  }

  const next = options.newRow || {};
  if (options.op === "INSERT") {
    if (CUSTOMER_QUOTE_PAYMENT_AUTHORITY_COLUMNS.some((column) => authorityColumnIsSet(next, column))) {
      return true;
    }
    return next.lead_source === "deposit";
  }

  const previous = options.oldRow || {};
  if (CUSTOMER_QUOTE_PAYMENT_AUTHORITY_COLUMNS.some((column) => authorityColumnChanged(previous, next, column))) {
    return true;
  }
  const isDeposit = previous.lead_source === "deposit" || next.lead_source === "deposit";
  if (!isDeposit) return false;
  return previous.lead_source !== next.lead_source || quoteDataAuthorityChanged(previous.quote_data, next.quote_data);
}
