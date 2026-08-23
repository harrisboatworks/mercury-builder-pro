import { formatDepositAddress, type DepositPostalAddress } from "@/lib/deposit-identity";

export const ADMIN_DEAL_PACKET_SECTIONS = [
  "customer-identity",
  "motor-configuration",
  "payment-status",
  "boat-trade-financing",
  "canonical-document",
  "email-deliveries",
] as const;

export function adminDealPacketPath(savedQuoteId: string): string {
  return `/admin/quotes/${savedQuoteId}`;
}

export type AdminQuoteListRow = {
  id: string;
  saved_quote_id?: string | null;
  lead_source?: string | null;
  payment_status?: string | null;
  _source: "customer_quotes" | "saved_quotes";
  quote_data?: { saved_quote_id?: string | null } | null;
};

function knownSavedQuoteIdSet(
  knownSavedQuoteIds?: Iterable<string> | null,
): Set<string> | null {
  if (!knownSavedQuoteIds) return null;
  return knownSavedQuoteIds instanceof Set
    ? knownSavedQuoteIds
    : new Set(knownSavedQuoteIds);
}

export function resolveAdminDealPacketId(
  row: AdminQuoteListRow,
  knownSavedQuoteIds?: Iterable<string> | null,
): string {
  if (row._source === "saved_quotes") return row.id;
  if (row.saved_quote_id) return row.saved_quote_id;
  const legacyId = row.quote_data?.saved_quote_id || null;
  const known = knownSavedQuoteIdSet(knownSavedQuoteIds);
  if (legacyId && known?.has(legacyId)) return legacyId;
  return row.id;
}

export function dedupeAdminDealPacketRows<C extends AdminQuoteListRow, S extends AdminQuoteListRow>(
  customerQuotes: C[],
  savedQuotes: S[],
): Array<C | S> {
  const savedIds = new Set(savedQuotes.map((row) => row.id));
  const joinedCustomerQuotes = customerQuotes.filter((row) => {
    const packetId = resolveAdminDealPacketId({ ...row, _source: "customer_quotes" }, savedIds);
    const isJoinedDeposit = Boolean(
      packetId
      && savedIds.has(packetId)
      && (row.lead_source === "deposit" || row.saved_quote_id || row.quote_data?.saved_quote_id),
    );
    return !isJoinedDeposit;
  });

  return [
    ...savedQuotes.map((row) => ({ ...row, id: row.id })),
    ...joinedCustomerQuotes,
  ];
}

export function formatAdminSubmittedAddress(address: DepositPostalAddress | null | undefined): string {
  if (!address) return "";
  return formatDepositAddress(address);
}

export function shouldOfferCanonicalDocumentDownload(options: {
  quotePdfPath?: string | null;
  quotePdfSha256?: string | null;
  savedQuoteId: string;
}): boolean {
  return options.quotePdfPath === `saved-quotes/${options.savedQuoteId}/quote.pdf`
    && Boolean(options.quotePdfSha256);
}

export function canonicalDocumentLabel(hasCanonical: boolean): {
  button: string;
  fallback?: string;
} {
  if (hasCanonical) {
    return { button: "Download canonical reservation PDF" };
  }
  return {
    button: "Generate legacy PDF snapshot",
    fallback: "Legacy regeneration — not the canonical bound reservation document.",
  };
}

export type AdminDealRecordIds = {
  id: string;
  _source?: "customer_quotes" | "saved_quotes";
  _joined_customer_quote_id?: string | null;
  saved_quote_id?: string | null;
};

export function operationalCustomerQuoteId(quote: AdminDealRecordIds): string | null {
  if (quote._joined_customer_quote_id) return quote._joined_customer_quote_id;
  if (quote._source === "saved_quotes") return null;
  return quote.id;
}

export function dealPacketSavedQuoteId(quote: AdminDealRecordIds): string | null {
  if (quote.saved_quote_id) return quote.saved_quote_id;
  if (quote._source === "saved_quotes") return quote.id;
  return null;
}

export type AdminDeliveryRow = {
  audience: string;
  status: string;
  attempt_count?: number | null;
  last_attempted_at?: string | null;
  sent_at?: string | null;
  last_error?: string | null;
  claim_expires_at?: string | null;
};

const DEAL_PACKET_AUDIENCES = ["customer", "hbw", "grok_bot"] as const;

function deliveryLeaseActive(row: AdminDeliveryRow, now: number): boolean {
  if (row.status !== "sending" || !row.claim_expires_at) return false;
  const expiresAt = Date.parse(row.claim_expires_at);
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export function deliveryRowDisplayStatus(
  row: AdminDeliveryRow | undefined,
  now: number = Date.now(),
): string {
  if (!row) return "missing / not yet sent";
  if (deliveryLeaseActive(row, now)) return "sending (in progress)";
  if (row.status === "sending") return "sending (lease expired — retryable)";
  return row.status;
}

export function depositDeliveryInProgress(
  rows: AdminDeliveryRow[] | null | undefined,
  now: number = Date.now(),
): boolean {
  return (rows || []).some((row) => deliveryLeaseActive(row, now));
}

export function canRetryDepositDeliveries(options: {
  rows?: AdminDeliveryRow[] | null;
  paymentPaid: boolean;
  now?: number;
}): boolean {
  if (!options.paymentPaid) return false;
  const now = options.now ?? Date.now();
  const rows = options.rows || [];
  if (depositDeliveryInProgress(rows, now)) return false;
  return DEAL_PACKET_AUDIENCES.some((audience) => {
    const row = rows.find((item) => item.audience === audience);
    if (!row) return true;
    if (row.status === "sent") return false;
    if (row.status === "failed" || row.status === "pending") return true;
    if (row.status === "sending") return !deliveryLeaseActive(row, now);
    return true;
  });
}

export function summarizeDeliveryRetry(
  rows: AdminDeliveryRow[] | null | undefined,
  now: number = Date.now(),
): string {
  return DEAL_PACKET_AUDIENCES
    .map((audience) => {
      const row = (rows || []).find((item) => item.audience === audience);
      return `${audience}: ${deliveryRowDisplayStatus(row, now)}`;
    })
    .join("; ");
}

export function summarizeDeliveryRetryFromMailer(deliveries?: Record<string, string> | null): string {
  return DEAL_PACKET_AUDIENCES
    .map((audience) => `${audience}: ${deliveries?.[audience] || "unknown"}`)
    .join("; ");
}

export function historicalCanonicalPdfNote(options: {
  hasCanonical: boolean;
  addressSource: "saved_quote_submitted" | "customer_quote_submitted" | "stripe_billing" | "missing";
}): string | null {
  if (!options.hasCanonical) return null;
  if (options.addressSource === "saved_quote_submitted") return null;
  return "This immutable bound PDF may not include a contact address. It will not be regenerated. Future deposits bind a PDF that includes the submitted address.";
}

export function shouldOfferStripeBillingRecovery(options: {
  hasOperationalCustomerQuote: boolean;
  boundSessionId?: string | null;
  addressSource: "saved_quote_submitted" | "customer_quote_submitted" | "stripe_billing" | "missing";
  hasStripeBilling?: boolean;
}): boolean {
  return options.hasOperationalCustomerQuote
    && Boolean(options.boundSessionId)
    && !options.hasStripeBilling
    && (options.addressSource === "missing" || options.addressSource === "stripe_billing");
}

export function authoritativeDepositPaymentStatus(options: {
  customerQuotePaymentStatus?: string | null;
  savedQuoteDepositStatus?: string | null;
}): string | null {
  if (options.customerQuotePaymentStatus) return options.customerQuotePaymentStatus;
  if (options.savedQuoteDepositStatus) return options.savedQuoteDepositStatus;
  return null;
}

export function isAuthoritativeDepositPaid(options: {
  customerQuotePaymentStatus?: string | null;
  savedQuoteDepositStatus?: string | null;
}): boolean {
  return options.customerQuotePaymentStatus === "paid"
    || options.savedQuoteDepositStatus === "paid";
}

export function legacyJsonPaymentStatusLabel(status: unknown): string | null {
  if (status !== "paid" && status !== "pending" && status !== "failed" && status !== "refunded") {
    return null;
  }
  return `Legacy quote_data.payment_status=${status} is not Stripe payment proof`;
}

export function summarizeStripeRecovery(promoted?: {
  customerQuoteFields?: string[];
  savedQuoteFields?: string[];
  paymentStatus?: string | null;
  savedQuoteDepositStatus?: string | null;
} | null): string {
  const customerFields = promoted?.customerQuoteFields?.join(", ") || "none";
  const savedFields = promoted?.savedQuoteFields?.join(", ") || "none";
  return `Recovered/promoted customer quote: ${customerFields}. Saved quote: ${savedFields} (${promoted?.savedQuoteDepositStatus || "unchanged"}).`;
}
