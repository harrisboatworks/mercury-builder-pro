export interface IdentifiedPdfCustomer {
  name?: string | null;
  email?: string | null;
}

export interface PdfLeadIdempotencyInput {
  email: string;
  snapshot: unknown;
}

export interface PdfDownloadAttemptInput<TPdf> {
  persistLead?: () => Promise<unknown>;
  onLeadError?: (error: unknown) => void;
  generatePdf: () => Promise<TPdf>;
  downloadPdf: (pdf: TPdf) => Promise<void>;
  afterDownload?: () => Promise<void> | void;
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
 * Keep CRM persistence independent from PDF generation while making the
 * success boundary explicit. Lead persistence remains best effort; download
 * and post-download activity run only after generation succeeds.
 */
export async function executePdfDownloadAttempt<TPdf>({
  persistLead,
  onLeadError = () => undefined,
  generatePdf,
  downloadPdf,
  afterDownload,
}: PdfDownloadAttemptInput<TPdf>): Promise<void> {
  if (persistLead) {
    try {
      await persistLead();
    } catch (error) {
      onLeadError(error);
    }
  }

  const pdf = await generatePdf();
  await downloadPdf(pdf);
  await afterDownload?.();
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
