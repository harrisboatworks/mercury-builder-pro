import { CONSULTATION_SAVED_QUOTE_SOURCE } from "./consultation-authoritative-quote.ts";
import {
  CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS,
  CONSULTATION_DOCUMENTS_BUCKET,
  type ConsultationDeliverySnapshot,
  ConsultationDocumentRequestError,
  ConsultationDocumentUnavailableError,
  assertConsultationDocumentBytes,
  assertConsultationStoredDocument,
  consultationCapabilityExpiry,
  consultationDocumentAccessUrl,
  consultationSubmitDeliverySnapshot,
  createConsultationAccessToken,
  parseConsultationDocumentId,
} from "./consultation-document-policy.ts";

export const ADMIN_CONSULTATION_DOCUMENT_ACTIONS = [
  "admin-download",
  "admin-share",
  "admin-email",
] as const;

export type AdminConsultationDocumentAction =
  (typeof ADMIN_CONSULTATION_DOCUMENT_ACTIONS)[number];

export interface StoredAdminConsultationDocument {
  id: string;
  customer_quote_id: string;
  storage_key: string;
  sha256: string;
  byte_size: number;
  content_type: string;
  quote_number: string;
  delivery_snapshot: unknown;
}

export interface AdminConsultationSavedQuote {
  convertedToQuoteId?: string | null;
  quoteState: Record<string, unknown> | null;
}

export interface AdminConsultationCapabilityInsert {
  document_id: string;
  token_hash: string;
  purpose: "send_email";
  bound_email: string;
  bound_phone: string;
  expires_at: string;
}

export interface AdminConsultationDocumentStore {
  findSavedQuote(quoteId: string): Promise<AdminConsultationSavedQuote | null>;
  findLatestDocument(customerQuoteId: string): Promise<StoredAdminConsultationDocument | null>;
  downloadPdf(path: string): Promise<{ bytes: Uint8Array; contentType?: string } | null>;
  createSignedUrl(path: string, expiresIn: number, filename: string): Promise<string | null>;
  insertCapability(row: AdminConsultationCapabilityInsert): Promise<void>;
  revokeCapability(tokenHash: string): Promise<void>;
}

export interface AdminConsultationQuoteEmailPayload {
  customerEmail: string;
  customerName: string;
  quoteNumber: string;
  motorModel: string;
  totalPrice: number;
  emailType: "quote_delivery";
  documentId: string;
  documentAccessUrl: string;
  leadData: { quoteId: string };
}

export interface AdminConsultationDocumentMailer {
  sendQuoteEmail(payload: AdminConsultationQuoteEmailPayload): Promise<boolean>;
}

export interface AdminConsultationDocumentAccess {
  createAccessToken(): Promise<{ token: string; tokenHash: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAdminConsultationDocumentAction(
  value: unknown,
): value is AdminConsultationDocumentAction {
  return value === "admin-download" || value === "admin-share" || value === "admin-email";
}

export function parseAdminConsultationDocumentRequest(body: unknown): {
  action: AdminConsultationDocumentAction;
  quoteId: string;
} {
  if (!isRecord(body) || !isAdminConsultationDocumentAction(body.action)) {
    throw new ConsultationDocumentRequestError();
  }
  return {
    action: body.action,
    quoteId: parseConsultationDocumentId(body.quoteId),
  };
}

export function resolveAdminConsultationQuoteId(input: {
  quoteId: string;
  savedQuote: AdminConsultationSavedQuote | null;
}): string {
  if (!input.savedQuote) return parseConsultationDocumentId(input.quoteId);
  const state = input.savedQuote.quoteState;
  if (!state || state.source !== CONSULTATION_SAVED_QUOTE_SOURCE) {
    throw new ConsultationDocumentUnavailableError();
  }
  try {
    // converted_to_quote_id references the separate quotes table, not customer_quotes.
    return parseConsultationDocumentId(state.customerQuoteId);
  } catch {
    throw new ConsultationDocumentUnavailableError();
  }
}

export function consultationAdminDeliveryIdentity(
  snapshot: unknown,
): ConsultationDeliverySnapshot {
  if (!isRecord(snapshot)) throw new ConsultationDocumentUnavailableError();
  try {
    return consultationSubmitDeliverySnapshot({
      customerName: snapshot.customerName,
      customerEmail: snapshot.customerEmail,
      customerPhone: snapshot.customerPhone,
      motorModel: snapshot.motorModel,
      totalPrice: snapshot.totalPrice,
    });
  } catch {
    throw new ConsultationDocumentUnavailableError();
  }
}

export function buildAdminConsultationQuoteEmailPayload(input: {
  snapshot: ConsultationDeliverySnapshot;
  document: StoredAdminConsultationDocument;
  documentAccessUrl: string;
  quoteId: string;
}): AdminConsultationQuoteEmailPayload {
  return {
    customerEmail: input.snapshot.customerEmail,
    customerName: input.snapshot.customerName,
    quoteNumber: input.document.quote_number,
    motorModel: input.snapshot.motorModel,
    totalPrice: input.snapshot.totalPrice,
    emailType: "quote_delivery",
    documentId: input.document.id,
    documentAccessUrl: input.documentAccessUrl,
    leadData: { quoteId: input.quoteId },
  };
}

export async function handleAdminConsultationDocument(options: {
  req: Request;
  body: unknown;
  authorize: (req: Request) => Promise<{ userId: string } | Response>;
  checkRateLimit: (req: Request, userId: string) => Promise<boolean>;
  rateLimitedResponse: () => Response;
  jsonResponse: (body: Record<string, unknown>, status?: number) => Response;
  store: AdminConsultationDocumentStore;
  mailer: AdminConsultationDocumentMailer;
  access?: AdminConsultationDocumentAccess;
  now?: Date;
}): Promise<Response> {
  const authorization = await options.authorize(options.req);
  if (authorization instanceof Response) return authorization;

  const allowed = await options.checkRateLimit(options.req, authorization.userId);
  if (!allowed) return options.rateLimitedResponse();

  const request = parseAdminConsultationDocumentRequest(options.body);
  const savedQuote = await options.store.findSavedQuote(request.quoteId);
  const quoteId = resolveAdminConsultationQuoteId({
    quoteId: request.quoteId,
    savedQuote,
  });
  const document = await options.store.findLatestDocument(quoteId);
  if (!document || document.customer_quote_id !== quoteId) throw new ConsultationDocumentUnavailableError();

  const binding = assertConsultationStoredDocument({
    documentId: document.id,
    storageKey: document.storage_key,
    sha256: document.sha256,
    byteSize: document.byte_size,
    contentType: document.content_type,
  });
  const object = await options.store.downloadPdf(binding.path);
  if (!object) throw new ConsultationDocumentUnavailableError();
  await assertConsultationDocumentBytes({
    bytes: object.bytes,
    byteSize: document.byte_size,
    binding,
    documentId: document.id,
  });

  if (request.action === "admin-download") {
    const signedUrl = await options.store.createSignedUrl(
      binding.path,
      CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS,
      `Quote-${document.quote_number}.pdf`,
    );
    if (!signedUrl) throw new ConsultationDocumentUnavailableError();
    return options.jsonResponse({
      signedUrl,
      expiresIn: CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS,
    });
  }

  const snapshot = consultationAdminDeliveryIdentity(document.delivery_snapshot);
  const access = options.access || { createAccessToken: createConsultationAccessToken };
  const { token, tokenHash } = await access.createAccessToken();
  const expiresAt = consultationCapabilityExpiry(options.now);
  await options.store.insertCapability({
    document_id: document.id,
    token_hash: tokenHash,
    purpose: "send_email",
    bound_email: snapshot.customerEmail,
    bound_phone: snapshot.customerPhone,
    expires_at: expiresAt,
  });
  const documentAccessUrl = consultationDocumentAccessUrl(token);

  if (request.action === "admin-share") {
    return options.jsonResponse({ documentAccessUrl, expiresAt });
  }

  const payload = buildAdminConsultationQuoteEmailPayload({
    snapshot,
    document,
    documentAccessUrl,
    quoteId,
  });
  let sent = false;
  try {
    sent = await options.mailer.sendQuoteEmail(payload);
  } catch {
    sent = false;
  }
  if (!sent) {
    try {
      await options.store.revokeCapability(tokenHash);
    } catch {
      // Still fail closed to the caller if revoke itself failed.
    }
    return options.jsonResponse({ error: "Quote email could not be sent" }, 502);
  }
  return options.jsonResponse({ success: true });
}

export function createSupabaseAdminConsultationDocumentStore(service: {
  from: (table: string) => any;
  storage: { from: (bucket: string) => any };
}): AdminConsultationDocumentStore {
  return {
    async findSavedQuote(quoteId) {
      const { data, error } = await service
        .from("saved_quotes")
        .select("quote_state")
        .eq("id", quoteId)
        .maybeSingle();
      if (error) throw new ConsultationDocumentUnavailableError();
      if (!data) return null;
      return {
        quoteState: isRecord(data.quote_state) ? data.quote_state : null,
      };
    },
    async findLatestDocument(customerQuoteId) {
      const { data, error } = await service
        .from("consultation_documents")
        .select("id, customer_quote_id, storage_key, sha256, byte_size, content_type, quote_number, delivery_snapshot")
        .eq("customer_quote_id", customerQuoteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      if (
        typeof data.id !== "string"
        || typeof data.storage_key !== "string"
        || typeof data.sha256 !== "string"
        || typeof data.quote_number !== "string"
        || data.customer_quote_id !== customerQuoteId
      ) {
        return null;
      }
      return {
        id: data.id,
        customer_quote_id: typeof data.customer_quote_id === "string"
          ? data.customer_quote_id
          : customerQuoteId,
        storage_key: data.storage_key,
        sha256: data.sha256,
        byte_size: Number(data.byte_size),
        content_type: String(data.content_type || "application/pdf"),
        quote_number: data.quote_number,
        delivery_snapshot: data.delivery_snapshot,
      };
    },
    async downloadPdf(path) {
      const { data, error } = await service.storage
        .from(CONSULTATION_DOCUMENTS_BUCKET)
        .download(path);
      if (error || !data) return null;
      return { bytes: new Uint8Array(await data.arrayBuffer()) };
    },
    async createSignedUrl(path, expiresIn, filename) {
      const { data, error } = await service.storage
        .from(CONSULTATION_DOCUMENTS_BUCKET)
        .createSignedUrl(path, expiresIn, { download: filename });
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    },
    async insertCapability(row) {
      const { error } = await service.from("consultation_document_capabilities").insert(row);
      if (error) throw new ConsultationDocumentUnavailableError();
    },
    async revokeCapability(tokenHash) {
      await service
        .from("consultation_document_capabilities")
        .update({ revoked_at: new Date().toISOString() })
        .eq("token_hash", tokenHash);
    },
  };
}
