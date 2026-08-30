export const MAX_QUOTE_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const QUOTE_DOCUMENT_SIGNED_URL_SECONDS = 60;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RESUME_TOKEN_PATTERN = /^dep_[0-9a-f]{24}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export interface QuoteDocumentSavedQuote {
  id: unknown;
  user_id: unknown;
  email: unknown;
  resume_token: unknown;
  expires_at: unknown;
  is_soft_lead: unknown;
  deposit_status: unknown;
  quote_pdf_path: unknown;
  quote_pdf_sha256: unknown;
  quote_state: unknown;
}

export interface QuoteDocumentUser {
  id: string;
  email?: string | null;
  emailConfirmedAt?: string | null;
  isAdmin?: boolean;
}

export class QuoteDocumentRequestError extends Error {
  constructor(message = 'Invalid quote document request') {
    super(message);
    this.name = 'QuoteDocumentRequestError';
  }
}

export class QuoteDocumentUnavailableError extends Error {
  constructor(message = 'Quote document unavailable') {
    super(message);
    this.name = 'QuoteDocumentUnavailableError';
  }
}

export class QuoteDocumentConflictError extends Error {
  constructor(message = 'A different quote document already exists') {
    super(message);
    this.name = 'QuoteDocumentConflictError';
  }
}

function boundedString(value: unknown, maximumLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maximumLength ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export function parseSavedQuoteId(value: unknown): string {
  const savedQuoteId = boundedString(value, 36);
  if (!savedQuoteId || !UUID_PATTERN.test(savedQuoteId)) {
    throw new QuoteDocumentRequestError();
  }
  return savedQuoteId.toLowerCase();
}

export function parseResumeToken(value: unknown): string {
  const resumeToken = boundedString(value, 128);
  if (!resumeToken || !RESUME_TOKEN_PATTERN.test(resumeToken)) {
    throw new QuoteDocumentRequestError();
  }
  return resumeToken;
}

export function canonicalQuoteDocumentPath(savedQuoteId: unknown): string {
  return `saved-quotes/${parseSavedQuoteId(savedQuoteId)}/quote.pdf`;
}

export function quoteDocumentBinding(options: {
  row: Pick<QuoteDocumentSavedQuote, 'quote_pdf_path' | 'quote_pdf_sha256'>;
  savedQuoteId: string;
}): { path: string | null; sha256: string | null } {
  const canonicalPath = canonicalQuoteDocumentPath(options.savedQuoteId);
  const path = boundedString(options.row.quote_pdf_path, 256);
  const sha256 = boundedString(options.row.quote_pdf_sha256, 64)?.toLowerCase() || null;

  if (options.row.quote_pdf_path == null && options.row.quote_pdf_sha256 == null) {
    return { path: null, sha256: null };
  }
  if (path !== canonicalPath || !sha256 || !SHA256_PATTERN.test(sha256)) {
    throw new QuoteDocumentConflictError();
  }
  return { path, sha256 };
}

function normalizedEmail(value: unknown): string | null {
  const email = boundedString(value, 254);
  return email ? email.toLowerCase() : null;
}

export type QuoteDocumentAvailability = Pick<
  QuoteDocumentSavedQuote,
  'id' | 'expires_at' | 'is_soft_lead' | 'deposit_status' | 'quote_state'
>;

function assertAvailableSavedQuote(
  row: QuoteDocumentAvailability,
  savedQuoteId: string,
  now: Date,
): void {
  const rowId = parseSavedQuoteId(row.id);
  const expiry = Date.parse(boundedString(row.expires_at, 64) || '');
  if (
    !constantTimeEqual(rowId, savedQuoteId)
    || row.is_soft_lead === true
    || row.deposit_status !== 'pending'
    || !Number.isFinite(expiry)
    || expiry <= now.getTime()
    || !isRecord(row.quote_state)
    || !isRecord(row.quote_state.motor)
  ) {
    throw new QuoteDocumentUnavailableError();
  }
}

export function assertQuoteDocumentPaymentAvailable(options: {
  row: QuoteDocumentAvailability;
  savedQuoteId: string;
  now?: Date;
}): void {
  const savedQuoteId = parseSavedQuoteId(options.savedQuoteId);
  assertAvailableSavedQuote(options.row, savedQuoteId, options.now || new Date());
}

function assertPaidSavedQuote(row: QuoteDocumentAvailability, savedQuoteId: string): void {
  const rowId = parseSavedQuoteId(row.id);
  if (
    !constantTimeEqual(rowId, savedQuoteId)
    || row.is_soft_lead === true
    || row.deposit_status !== 'paid'
    || !isRecord(row.quote_state)
    || !isRecord(row.quote_state.motor)
  ) {
    throw new QuoteDocumentUnavailableError();
  }
}

export function assertQuoteDocumentPaidAvailable(options: {
  row: QuoteDocumentAvailability;
  savedQuoteId: string;
}): void {
  const savedQuoteId = parseSavedQuoteId(options.savedQuoteId);
  assertPaidSavedQuote(options.row, savedQuoteId);
}

export function authorizeQuoteDocumentUpload(options: {
  row: QuoteDocumentSavedQuote;
  savedQuoteId: string;
  resumeToken?: string | null;
  user?: QuoteDocumentUser | null;
  now?: Date;
}): string {
  const savedQuoteId = parseSavedQuoteId(options.savedQuoteId);
  assertAvailableSavedQuote(options.row, savedQuoteId, options.now || new Date());

  const rowUserId = boundedString(options.row.user_id, 36);
  const ownerAuthorized = Boolean(options.user?.id && rowUserId === options.user.id);
  let suppliedResumeToken: string | null = null;
  let rowResumeToken: string | null = null;
  try {
    suppliedResumeToken = options.resumeToken ? parseResumeToken(options.resumeToken) : null;
    rowResumeToken = options.row.resume_token ? parseResumeToken(options.row.resume_token) : null;
  } catch {
    // A malformed stored or supplied capability must never grant document access.
  }
  const capabilityAuthorized = Boolean(
    suppliedResumeToken
    && rowResumeToken
    && constantTimeEqual(rowResumeToken, suppliedResumeToken),
  );

  if (!ownerAuthorized && !capabilityAuthorized) {
    throw new QuoteDocumentUnavailableError();
  }

  const canonicalPath = canonicalQuoteDocumentPath(savedQuoteId);
  if (options.row.quote_pdf_path != null && options.row.quote_pdf_path !== canonicalPath) {
    throw new QuoteDocumentConflictError();
  }
  return canonicalPath;
}

export function authorizeQuoteDocumentDownload(options: {
  row: QuoteDocumentSavedQuote;
  savedQuoteId: string;
  user: QuoteDocumentUser | null;
}): string {
  const savedQuoteId = parseSavedQuoteId(options.savedQuoteId);
  const rowId = parseSavedQuoteId(options.row.id);
  if (
    !constantTimeEqual(rowId, savedQuoteId)
    || options.row.is_soft_lead === true
    || !options.user?.id
  ) {
    throw new QuoteDocumentUnavailableError();
  }

  const rowUserId = boundedString(options.row.user_id, 36);
  const confirmedEmailMatch = Boolean(
    rowUserId === null
    && options.user.emailConfirmedAt
    && normalizedEmail(options.user.email)
    && normalizedEmail(options.user.email) === normalizedEmail(options.row.email),
  );
  if (rowUserId !== options.user.id && !confirmedEmailMatch && !options.user.isAdmin) {
    throw new QuoteDocumentUnavailableError();
  }

  const canonicalPath = canonicalQuoteDocumentPath(savedQuoteId);
  if (options.row.quote_pdf_path !== canonicalPath) {
    throw new QuoteDocumentUnavailableError();
  }
  try {
    quoteDocumentBinding({ row: options.row, savedQuoteId });
  } catch {
    throw new QuoteDocumentUnavailableError();
  }
  return canonicalPath;
}

export function validateQuotePdf(bytes: Uint8Array, contentType?: string | null): void {
  if (contentType && contentType.toLowerCase() !== 'application/pdf') {
    throw new QuoteDocumentRequestError('Quote document must be a PDF');
  }
  if (bytes.byteLength < 5 || bytes.byteLength > MAX_QUOTE_DOCUMENT_BYTES) {
    throw new QuoteDocumentRequestError('Quote document size is invalid');
  }
  if (
    bytes[0] !== 0x25
    || bytes[1] !== 0x50
    || bytes[2] !== 0x44
    || bytes[3] !== 0x46
    || bytes[4] !== 0x2d
  ) {
    throw new QuoteDocumentRequestError('Quote document signature is invalid');
  }
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const source = new Uint8Array(bytes);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', source));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function readLimitedStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes = MAX_QUOTE_DOCUMENT_BYTES,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new QuoteDocumentRequestError('Quote document size is invalid');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (totalBytes < 5) {
    throw new QuoteDocumentRequestError('Quote document size is invalid');
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function assertCanonicalQuoteDocumentReady(options: {
  row: QuoteDocumentAvailability & Pick<QuoteDocumentSavedQuote, 'quote_pdf_path' | 'quote_pdf_sha256'>;
  savedQuoteId: string;
  object: { bytes: Uint8Array; contentType?: string | null } | null;
  now?: Date;
}): Promise<{ path: string; sha256: string }> {
  assertQuoteDocumentPaymentAvailable({
    row: options.row,
    savedQuoteId: options.savedQuoteId,
    now: options.now,
  });

  let binding: { path: string | null; sha256: string | null };
  try {
    binding = quoteDocumentBinding({
      row: options.row,
      savedQuoteId: options.savedQuoteId,
    });
  } catch {
    throw new QuoteDocumentUnavailableError();
  }
  if (!binding.path || !binding.sha256 || !options.object) {
    throw new QuoteDocumentUnavailableError();
  }

  try {
    validateQuotePdf(options.object.bytes, options.object.contentType);
    if (!constantTimeEqual(await sha256Hex(options.object.bytes), binding.sha256)) {
      throw new QuoteDocumentUnavailableError();
    }
  } catch (error) {
    if (error instanceof QuoteDocumentUnavailableError) throw error;
    throw new QuoteDocumentUnavailableError();
  }

  return { path: binding.path, sha256: binding.sha256 };
}

export async function assertCanonicalPaidQuoteDocument(options: {
  row: QuoteDocumentAvailability & Pick<QuoteDocumentSavedQuote, 'quote_pdf_path' | 'quote_pdf_sha256'>;
  savedQuoteId: string;
  object: { bytes: Uint8Array; contentType?: string | null } | null;
}): Promise<{ path: string; sha256: string }> {
  assertQuoteDocumentPaidAvailable({
    row: options.row,
    savedQuoteId: options.savedQuoteId,
  });

  let binding: { path: string | null; sha256: string | null };
  try {
    binding = quoteDocumentBinding({
      row: options.row,
      savedQuoteId: options.savedQuoteId,
    });
  } catch {
    throw new QuoteDocumentUnavailableError();
  }
  if (!binding.path || !binding.sha256 || !options.object) {
    throw new QuoteDocumentUnavailableError();
  }

  try {
    validateQuotePdf(options.object.bytes, options.object.contentType);
    if (!constantTimeEqual(await sha256Hex(options.object.bytes), binding.sha256)) {
      throw new QuoteDocumentUnavailableError();
    }
  } catch (error) {
    if (error instanceof QuoteDocumentUnavailableError) throw error;
    throw new QuoteDocumentUnavailableError();
  }

  return { path: binding.path, sha256: binding.sha256 };
}
