import {
  constantTimeEqual,
  MAX_QUOTE_DOCUMENT_BYTES,
  QuoteDocumentRequestError,
  QuoteDocumentUnavailableError,
  readLimitedStream,
  sha256Hex,
  validateQuotePdf,
} from "./quote-document-policy.ts";

export {
  constantTimeEqual,
  MAX_QUOTE_DOCUMENT_BYTES,
  QuoteDocumentRequestError,
  QuoteDocumentUnavailableError,
  readLimitedStream,
  sha256Hex,
  validateQuotePdf,
};

export const CONSULTATION_DOCUMENTS_BUCKET = "consultation-documents";
export const CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS = 60;
export const CONSULTATION_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const CONSULTATION_META_MAX_BYTES = 4 * 1024;
export const CONSULTATION_MULTIPART_OVERHEAD_BYTES = 8 * 1024;
export const CONSULTATION_DOCUMENT_ACCESS_ORIGIN = "https://www.mercuryrepower.ca";
export const CONSULTATION_DOCUMENT_PATH = "/quote/document";
export const CONSULTATION_UPLOAD_UNAVAILABLE_STATUS = 403;
export const CONSULTATION_UPLOAD_UNAVAILABLE_ERROR = "Consultation document upload is unavailable";

export function consultationMultipartUploadRejection(
  contentType: string | null | undefined,
): { status: number; body: { error: string } } | null {
  if ((contentType || "").toLowerCase().startsWith("multipart/")) {
    return {
      status: CONSULTATION_UPLOAD_UNAVAILABLE_STATUS,
      body: { error: CONSULTATION_UPLOAD_UNAVAILABLE_ERROR },
    };
  }
  return null;
}

export const CONSULTATION_FLOWS = ["submit", "send_email", "send_sms"] as const;
export type ConsultationFlow = (typeof CONSULTATION_FLOWS)[number];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const QUOTE_NUMBER_PATTERN = /^HBW-\d{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+1[2-9]\d{9}$/;
const FRAGMENT_TOKEN_PATTERN = /^cd_[0-9a-f]{64}$/;
const FORBIDDEN_META_KEYS = [
  "storagePath",
  "storage_path",
  "filePath",
  "file_path",
  "canonicalPath",
  "canonical_path",
  "pdfUrl",
  "pdf_url",
  "publicUrl",
  "signedUrl",
  "token",
  "documentAccessUrl",
] as const;

export class ConsultationDocumentRequestError extends QuoteDocumentRequestError {
  constructor(message = "Invalid consultation document request") {
    super(message);
    this.name = "ConsultationDocumentRequestError";
  }
}

export class ConsultationDocumentUnavailableError extends QuoteDocumentUnavailableError {
  constructor(message = "Not found") {
    super(message);
    this.name = "ConsultationDocumentUnavailableError";
  }
}

export interface ConsultationDeliverySnapshot {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  motorModel: string;
  totalPrice: number;
}

export interface ConsultationUploadMeta {
  flow: ConsultationFlow;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  motorModel: string;
  totalPrice: number;
  customerQuoteId: string | null;
}

export interface ConsultationCapability {
  documentId: string;
  tokenHash: string;
  purpose: ConsultationFlow;
  boundEmail: string;
  boundPhone: string;
  expiresAt: string;
  revokedAt: string | null;
}

function boundedString(value: unknown, maximumLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maximumLength ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseConsultationDocumentId(value: unknown): string {
  const documentId = boundedString(value, 36);
  if (!documentId || !UUID_PATTERN.test(documentId)) {
    throw new ConsultationDocumentRequestError();
  }
  return documentId.toLowerCase();
}

export function canonicalConsultationDocumentPath(documentId: unknown): string {
  return `consultation/${parseConsultationDocumentId(documentId)}/quote.pdf`;
}

export function parseConsultationQuoteNumber(value: unknown): string {
  const quoteNumber = boundedString(value, 10);
  if (!quoteNumber || !QUOTE_NUMBER_PATTERN.test(quoteNumber)) {
    throw new ConsultationDocumentRequestError("Quote number is invalid");
  }
  return quoteNumber;
}

export function parseConsultationEmail(value: unknown): string {
  const email = boundedString(value, 254);
  if (!email || !EMAIL_PATTERN.test(email) || email.includes("..")) {
    throw new ConsultationDocumentRequestError("Customer email is invalid");
  }
  return email.toLowerCase();
}

export function parseConsultationPhone(value: unknown): string {
  const phone = boundedString(value, 16);
  if (!phone || !PHONE_PATTERN.test(phone)) {
    throw new ConsultationDocumentRequestError("Customer phone is invalid");
  }
  return phone;
}

export function normalizeConsultationPhone(value: unknown): string {
  if (typeof value === "string") {
    try {
      return parseConsultationPhone(value);
    } catch {
      const digits = value.replace(/\D/g, "");
      if (digits.length === 11 && digits.startsWith("1")) {
        return parseConsultationPhone(`+${digits}`);
      }
      if (digits.length === 10) {
        return parseConsultationPhone(`+1${digits}`);
      }
    }
  }
  throw new ConsultationDocumentRequestError("Customer phone is invalid");
}

export function consultationSubmitDeliverySnapshot(input: {
  customerName: unknown;
  customerEmail: unknown;
  customerPhone: unknown;
  motorModel: unknown;
  totalPrice: unknown;
}): ConsultationDeliverySnapshot {
  return {
    customerName: parseConsultationName(input.customerName),
    customerEmail: parseConsultationEmail(input.customerEmail),
    customerPhone: normalizeConsultationPhone(input.customerPhone),
    motorModel: parseConsultationMotorModel(input.motorModel),
    totalPrice: parseConsultationTotalPrice(input.totalPrice),
  };
}

export function parseConsultationName(value: unknown): string {
  const name = boundedString(value, 100);
  if (!name) throw new ConsultationDocumentRequestError("Customer name is invalid");
  return name;
}

export function parseConsultationMotorModel(value: unknown): string {
  const motorModel = boundedString(value, 200);
  if (!motorModel) throw new ConsultationDocumentRequestError("Motor model is invalid");
  return motorModel;
}

export function parseConsultationTotalPrice(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 2_000_000) {
    throw new ConsultationDocumentRequestError("Total price is invalid");
  }
  return Math.round(value);
}

export function parseConsultationFlow(value: unknown): ConsultationFlow {
  if (value === "submit" || value === "send_email" || value === "send_sms") return value;
  throw new ConsultationDocumentRequestError("Consultation flow is invalid");
}

export function parseOptionalCustomerQuoteId(
  value: unknown,
  flow: ConsultationFlow,
): string | null {
  if (flow === "submit") {
    return parseConsultationDocumentId(value);
  }
  if (value == null || value === "") return null;
  throw new ConsultationDocumentRequestError("Standalone consultation sends cannot bind a quote");
}

export function parseConsultationUploadMeta(value: unknown): ConsultationUploadMeta {
  if (!isRecord(value)) throw new ConsultationDocumentRequestError("Consultation metadata is invalid");
  for (const key of FORBIDDEN_META_KEYS) {
    if (key in value) {
      throw new ConsultationDocumentRequestError("Caller-controlled document paths are not allowed");
    }
  }

  const flow = parseConsultationFlow(value.flow);
  return {
    flow,
    quoteNumber: parseConsultationQuoteNumber(value.quoteNumber),
    customerName: parseConsultationName(value.customerName),
    customerEmail: parseConsultationEmail(value.customerEmail),
    customerPhone: parseConsultationPhone(value.customerPhone),
    motorModel: parseConsultationMotorModel(value.motorModel),
    totalPrice: parseConsultationTotalPrice(value.totalPrice),
    customerQuoteId: parseOptionalCustomerQuoteId(value.customerQuoteId, flow),
  };
}

export function consultationDeliverySnapshot(
  meta: ConsultationUploadMeta,
): ConsultationDeliverySnapshot {
  return {
    customerName: meta.customerName,
    customerEmail: meta.customerEmail,
    customerPhone: meta.customerPhone,
    motorModel: meta.motorModel,
    totalPrice: meta.totalPrice,
  };
}

export function parseFragmentToken(value: unknown): string {
  const token = boundedString(value, 67);
  if (!token || !FRAGMENT_TOKEN_PATTERN.test(token)) {
    throw new ConsultationDocumentUnavailableError();
  }
  return token.toLowerCase();
}

export function consultationDocumentAccessUrl(token: string): string {
  const normalized = parseFragmentToken(token);
  return `${CONSULTATION_DOCUMENT_ACCESS_ORIGIN}${CONSULTATION_DOCUMENT_PATH}#${normalized}`;
}

export function parseDurableDocumentAccessUrl(value: unknown): string {
  const url = boundedString(value, 200);
  if (!url) throw new ConsultationDocumentRequestError("Document access URL is invalid");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ConsultationDocumentRequestError("Document access URL is invalid");
  }
  if (
    parsed.origin !== CONSULTATION_DOCUMENT_ACCESS_ORIGIN
    || parsed.pathname !== CONSULTATION_DOCUMENT_PATH
    || parsed.search !== ""
    || !FRAGMENT_TOKEN_PATTERN.test(parsed.hash.slice(1).toLowerCase())
  ) {
    throw new ConsultationDocumentRequestError("Document access URL is invalid");
  }
  return `${parsed.origin}${parsed.pathname}#${parsed.hash.slice(1).toLowerCase()}`;
}

export function isForbiddenConsultationAttachmentUrl(value: unknown): boolean {
  if (typeof value !== "string" || !value.trim()) return false;
  const candidate = value.toLowerCase();
  return (
    candidate.includes("spec-sheets")
    || candidate.includes("/storage/v1/object/sign")
    || candidate.includes("/storage/v1/object/public/")
    || candidate.includes("token=")
  );
}

export async function hashConsultationToken(token: string): Promise<string> {
  const normalized = parseFragmentToken(token);
  return sha256Hex(new TextEncoder().encode(normalized));
}

export async function createConsultationAccessToken(): Promise<{ token: string; tokenHash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const token = `cd_${hex}`;
  return { token, tokenHash: await hashConsultationToken(token) };
}

export function consultationCapabilityExpiry(now = new Date()): string {
  return new Date(now.getTime() + CONSULTATION_TOKEN_TTL_MS).toISOString();
}

export function assertConsultationStoredDocument(options: {
  documentId: string;
  storageKey: unknown;
  sha256: unknown;
  byteSize: unknown;
  contentType?: unknown;
}): { path: string; sha256: string } {
  const documentId = parseConsultationDocumentId(options.documentId);
  const path = boundedString(options.storageKey, 256);
  const sha256 = boundedString(options.sha256, 64)?.toLowerCase() || null;
  const byteSize = typeof options.byteSize === "number" ? options.byteSize : Number(options.byteSize);
  if (
    path !== canonicalConsultationDocumentPath(documentId)
    || !sha256
    || !SHA256_PATTERN.test(sha256)
    || !Number.isSafeInteger(byteSize)
    || byteSize <= 0
    || byteSize > MAX_QUOTE_DOCUMENT_BYTES
    || (options.contentType != null && String(options.contentType).toLowerCase() !== "application/pdf")
  ) {
    throw new ConsultationDocumentUnavailableError();
  }
  return { path, sha256 };
}

export function authorizeConsultationRedemption(options: {
  capability: ConsultationCapability;
  documentId: string;
  tokenHash: string;
  now?: Date;
}): string {
  const documentId = parseConsultationDocumentId(options.documentId);
  const now = options.now || new Date();
  const expiresAt = Date.parse(options.capability.expiresAt);
  if (
    !SHA256_PATTERN.test(options.tokenHash)
    || !constantTimeEqual(options.capability.tokenHash, options.tokenHash)
    || !constantTimeEqual(options.capability.documentId, documentId)
    || options.capability.revokedAt
    || !Number.isFinite(expiresAt)
    || expiresAt <= now.getTime()
  ) {
    throw new ConsultationDocumentUnavailableError();
  }
  return canonicalConsultationDocumentPath(documentId);
}

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array, start = 0): number {
  outer: for (let index = start; index <= haystack.length - needle.length; index += 1) {
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (haystack[index + offset] !== needle[offset]) continue outer;
    }
    return index;
  }
  return -1;
}

function parseMultipartBoundary(contentType: string): string {
  const match = contentType.match(/multipart\/form-data;\s*boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = (match?.[1] || match?.[2] || "").trim();
  if (!boundary || boundary.length > 70) {
    throw new ConsultationDocumentRequestError("Upload must be multipart form data");
  }
  return boundary;
}

function headerValue(headers: string, name: string): string | null {
  const match = headers.match(new RegExp(`(?:^|\\r\\n)${name}:\\s*([^\\r\\n]+)`, "i"));
  return match?.[1]?.trim() || null;
}

function partName(headers: string): string | null {
  const disposition = headerValue(headers, "content-disposition");
  const match = disposition?.match(/name="([^"]+)"/i);
  return match?.[1] || null;
}

export async function parseConsultationMultipart(req: Request): Promise<{
  meta: ConsultationUploadMeta;
  pdfBytes: Uint8Array;
}> {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw new ConsultationDocumentRequestError("Upload must be multipart form data");
  }
  if (!req.body) throw new ConsultationDocumentRequestError("Consultation document is required");

  const contentLength = Number(req.headers.get("content-length") || "");
  const maxBytes = MAX_QUOTE_DOCUMENT_BYTES + CONSULTATION_META_MAX_BYTES + CONSULTATION_MULTIPART_OVERHEAD_BYTES;
  if (Number.isSafeInteger(contentLength) && contentLength > maxBytes) {
    throw new ConsultationDocumentRequestError("Quote document size is invalid");
  }

  const body = await readLimitedStream(req.body, maxBytes);
  const boundary = parseMultipartBoundary(contentType);
  const encoder = new TextEncoder();
  const dashBoundary = encoder.encode(`--${boundary}`);
  const headerBreak = encoder.encode("\r\n\r\n");
  const parts = new Map<string, { headers: string; bytes: Uint8Array }>();

  let cursor = indexOfBytes(body, dashBoundary);
  if (cursor !== 0) throw new ConsultationDocumentRequestError("Upload must be multipart form data");

  while (cursor !== -1) {
    const partStart = cursor + dashBoundary.length;
    if (body[partStart] === 0x2d && body[partStart + 1] === 0x2d) break;
    if (body[partStart] !== 0x0d || body[partStart + 1] !== 0x0a) {
      throw new ConsultationDocumentRequestError("Upload must be multipart form data");
    }
    const headerStart = partStart + 2;
    const headerEnd = indexOfBytes(body, headerBreak, headerStart);
    const nextBoundary = indexOfBytes(body, dashBoundary, headerStart);
    if (headerEnd === -1 || nextBoundary === -1 || headerEnd > nextBoundary) {
      throw new ConsultationDocumentRequestError("Upload must be multipart form data");
    }
    const headers = new TextDecoder().decode(body.subarray(headerStart, headerEnd));
    const name = partName(headers);
    if (!name) throw new ConsultationDocumentRequestError("Upload parts are invalid");
    if (parts.has(name) || parts.size >= 2) {
      throw new ConsultationDocumentRequestError("Upload must include only metadata and a PDF");
    }
    let dataEnd = nextBoundary;
    if (dataEnd >= 2 && body[dataEnd - 2] === 0x0d && body[dataEnd - 1] === 0x0a) {
      dataEnd -= 2;
    }
    parts.set(name, { headers, bytes: body.subarray(headerEnd + 4, dataEnd) });
    cursor = nextBoundary;
  }

  if (parts.size !== 2 || !parts.has("meta") || !parts.has("pdf")) {
    throw new ConsultationDocumentRequestError("Upload must include only metadata and a PDF");
  }

  const metaPart = parts.get("meta")!;
  const pdfPart = parts.get("pdf")!;
  if (metaPart.bytes.byteLength === 0 || metaPart.bytes.byteLength > CONSULTATION_META_MAX_BYTES) {
    throw new ConsultationDocumentRequestError("Consultation metadata is invalid");
  }
  const metaType = headerValue(metaPart.headers, "content-type");
  if (metaType && !metaType.toLowerCase().startsWith("application/json")) {
    throw new ConsultationDocumentRequestError("Consultation metadata is invalid");
  }
  const pdfType = headerValue(pdfPart.headers, "content-type");
  if (pdfType && pdfType.toLowerCase() !== "application/pdf") {
    throw new ConsultationDocumentRequestError("Quote document must be a PDF");
  }

  let parsedMeta: unknown;
  try {
    parsedMeta = JSON.parse(new TextDecoder().decode(metaPart.bytes));
  } catch {
    throw new ConsultationDocumentRequestError("Consultation metadata is invalid");
  }

  validateQuotePdf(pdfPart.bytes, "application/pdf");
  return { meta: parseConsultationUploadMeta(parsedMeta), pdfBytes: pdfPart.bytes };
}

export function parseConsultationRedeemRequest(value: unknown): { token: string } {
  if (!isRecord(value) || (value.action != null && value.action !== "redeem")) {
    throw new ConsultationDocumentUnavailableError();
  }
  return { token: parseFragmentToken(value.token) };
}
