export interface IdentifiedPdfCustomer {
  name?: string | null;
  email?: string | null;
}

export interface PdfLeadIdempotencyInput {
  email: string;
  snapshot: unknown;
}

function canonicalizeSnapshot(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeSnapshot);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, entry]) => key !== 'createdAt' && key !== 'validUntil' && entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalizeSnapshot(entry)]),
  );
}

/**
 * customer_quotes is a contactable CRM table and requires both fields.
 * Unidentified PDF downloads are already represented by the resumable
 * saved_quotes record and quote activity events, so they should not be forced
 * into the CRM with fake placeholder contact details.
 */
export function hasIdentifiedPdfCustomer(customer: IdentifiedPdfCustomer): boolean {
  return Boolean(customer.name?.trim() && customer.email?.trim());
}

/**
 * Stable, privacy-safe business key for one identified customer's unchanged
 * quote snapshot. It survives a component remount or PDF retry without
 * storing the email address in the key itself.
 */
export async function buildPdfLeadIdempotencyKey({
  email,
  snapshot,
}: PdfLeadIdempotencyInput): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('A customer email is required for PDF lead tracking');

  const material = JSON.stringify({
    email: normalizedEmail,
    snapshot: canonicalizeSnapshot(snapshot),
  });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `pdf_${hex}`;
}
