import { renderConsultationQuotePdf } from "./consultation-document-pdf.ts";
import {
  CONSULTATION_DOCUMENTS_BUCKET,
  type ConsultationDeliverySnapshot,
  ConsultationDocumentRequestError,
  assertConsultationStoredDocument,
  canonicalConsultationDocumentPath,
  consultationCapabilityExpiry,
  consultationDocumentAccessUrl,
  createConsultationAccessToken,
  parseConsultationDocumentId,
  parseConsultationQuoteNumber,
  sha256Hex,
} from "./consultation-document-policy.ts";

export interface ConsultationDocumentInsert {
  id: string;
  customer_quote_id: string;
  storage_key: string;
  sha256: string;
  byte_size: number;
  content_type: string;
  quote_number: string;
  delivery_snapshot: ConsultationDeliverySnapshot;
}

export interface ConsultationCapabilityInsert {
  document_id: string;
  token_hash: string;
  purpose: "submit";
  bound_email: string;
  bound_phone: string;
  expires_at: string;
}

export const CONSULTATION_DOCUMENT_JOB_STATUSES = [
  "started",
  "persisted",
  "emailed",
  "failed",
  "cleaned",
] as const;
export type ConsultationDocumentJobStatus = (typeof CONSULTATION_DOCUMENT_JOB_STATUSES)[number];

export interface ConsultationDocumentJobInsert {
  id: string;
  quote_id: string;
  document_id: string;
  storage_key: string;
  quote_number: string;
  sha256: string;
  status: ConsultationDocumentJobStatus;
  error_name: string | null;
}

export interface ConsultationDocumentWriter {
  insertDocument(row: ConsultationDocumentInsert): Promise<{ id: string }>;
  uploadPdf(path: string, bytes: Uint8Array): Promise<void>;
  insertCapability(row: ConsultationCapabilityInsert): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  removePdf(path: string): Promise<void>;
  insertJob?(row: ConsultationDocumentJobInsert): Promise<{ id: string } | null>;
  updateJob?(
    id: string,
    patch: { status: ConsultationDocumentJobStatus; error_name?: string | null },
  ): Promise<void>;
}

export interface MintConsultationDocumentResult {
  documentId: string;
  documentAccessUrl: string;
  sha256: string;
  pdfBytes: Uint8Array;
  jobId: string | null;
}

function jobErrorName(error: unknown): string {
  if (error instanceof Error && error.name && error.name !== "Error") return error.name;
  if (error instanceof Error && error.message) {
    const firstWord = error.message.split(/[\s:]+/)[0];
    return firstWord.slice(0, 64) || "Error";
  }
  return "Error";
}

async function recordJob(
  writer: ConsultationDocumentWriter,
  row: ConsultationDocumentJobInsert,
): Promise<string | null> {
  if (!writer.insertJob) return null;
  try {
    const recorded = await writer.insertJob(row);
    return recorded?.id || null;
  } catch {
    return null;
  }
}

async function markJob(
  writer: ConsultationDocumentWriter,
  jobId: string | null,
  status: ConsultationDocumentJobStatus,
  error?: unknown,
): Promise<void> {
  if (!jobId || !writer.updateJob) return;
  try {
    await writer.updateJob(jobId, {
      status,
      error_name: error ? jobErrorName(error) : null,
    });
  } catch {
    // Retention still owns jobs that cannot be marked.
  }
}

export async function markConsultationDocumentJobEmailed(
  writer: ConsultationDocumentWriter,
  jobId: string | null,
): Promise<void> {
  await markJob(writer, jobId, "emailed");
}

async function compensateMintFailure(
  writer: ConsultationDocumentWriter,
  options: { documentId: string; storageKey: string; uploaded: boolean },
): Promise<boolean> {
  try {
    if (options.uploaded) await writer.removePdf(options.storageKey);
    await writer.deleteDocument(options.documentId);
    return true;
  } catch {
    return false;
  }
}

export function createSupabaseConsultationDocumentWriter(supabase: {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{ data: { id?: string } | null; error: unknown }>;
      };
    };
    update: (row: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
  };
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Uint8Array,
        options: Record<string, unknown>,
      ) => Promise<{ error: unknown }>;
      remove: (paths: string[]) => Promise<{ error: unknown }>;
    };
  };
}): ConsultationDocumentWriter {
  return {
    async insertDocument(row) {
      const { data, error } = await supabase
        .from("consultation_documents")
        .insert(row)
        .select("id")
        .single();
      if (error || !data?.id) {
        throw new ConsultationDocumentRequestError("Consultation document persist failed");
      }
      return { id: parseConsultationDocumentId(data.id) };
    },
    async uploadPdf(path, bytes) {
      const { error } = await supabase.storage.from(CONSULTATION_DOCUMENTS_BUCKET).upload(path, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (error) {
        throw new ConsultationDocumentRequestError("Consultation document persist failed");
      }
    },
    async insertCapability(row) {
      const { error } = await supabase
        .from("consultation_document_capabilities")
        .insert(row)
        .select("id")
        .single();
      if (error) {
        throw new ConsultationDocumentRequestError("Consultation document persist failed");
      }
    },
    async deleteDocument(id) {
      const { error } = await supabase.from("consultation_documents").delete().eq("id", id);
      if (error) {
        throw new ConsultationDocumentRequestError("Consultation document cleanup failed");
      }
    },
    async removePdf(path) {
      const { error } = await supabase.storage.from(CONSULTATION_DOCUMENTS_BUCKET).remove([path]);
      if (error) {
        throw new ConsultationDocumentRequestError("Consultation document cleanup failed");
      }
    },
    async insertJob(row) {
      const { data, error } = await supabase
        .from("consultation_document_jobs")
        .insert(row)
        .select("id")
        .single();
      if (error || !data?.id) return null;
      return { id: parseConsultationDocumentId(data.id) };
    },
    async updateJob(id, patch) {
      const { error } = await supabase
        .from("consultation_document_jobs")
        .update({
          status: patch.status,
          error_name: patch.error_name ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) {
        throw new ConsultationDocumentRequestError("Consultation document job update failed");
      }
    },
  };
}

export async function mintConsultationDocument(options: {
  quoteId: string;
  quoteNumber: string;
  snapshot: ConsultationDeliverySnapshot;
  writer: ConsultationDocumentWriter;
  now?: Date;
  documentId?: string;
  accessToken?: { token: string; tokenHash: string };
}): Promise<MintConsultationDocumentResult> {
  const quoteId = parseConsultationDocumentId(options.quoteId);
  const quoteNumber = parseConsultationQuoteNumber(options.quoteNumber);
  const documentId = parseConsultationDocumentId(options.documentId || crypto.randomUUID());
  const storageKey = canonicalConsultationDocumentPath(documentId);
  const pdfBytes = renderConsultationQuotePdf({
    quoteNumber,
    snapshot: options.snapshot,
  });
  const sha256 = await sha256Hex(pdfBytes);
  assertConsultationStoredDocument({
    documentId,
    storageKey,
    sha256,
    byteSize: pdfBytes.byteLength,
    contentType: "application/pdf",
  });

  const access = options.accessToken || await createConsultationAccessToken();
  if (access.tokenHash.includes("cd_") || access.tokenHash.length !== 64) {
    throw new ConsultationDocumentRequestError("Consultation token hash is invalid");
  }

  const documentRow: ConsultationDocumentInsert = {
    id: documentId,
    customer_quote_id: quoteId,
    storage_key: storageKey,
    sha256,
    byte_size: pdfBytes.byteLength,
    content_type: "application/pdf",
    quote_number: quoteNumber,
    delivery_snapshot: options.snapshot,
  };

  await options.writer.insertDocument(documentRow);
  const jobId = await recordJob(options.writer, {
    id: parseConsultationDocumentId(crypto.randomUUID()),
    quote_id: quoteId,
    document_id: documentId,
    storage_key: storageKey,
    quote_number: quoteNumber,
    sha256,
    status: "started",
    error_name: null,
  });

  try {
    await options.writer.uploadPdf(storageKey, pdfBytes);
  } catch (error) {
    const cleaned = await compensateMintFailure(options.writer, {
      documentId,
      storageKey,
      uploaded: false,
    });
    await markJob(options.writer, jobId, cleaned ? "cleaned" : "failed", error);
    throw error;
  }

  try {
    await options.writer.insertCapability({
      document_id: documentId,
      token_hash: access.tokenHash,
      purpose: "submit",
      bound_email: options.snapshot.customerEmail,
      bound_phone: options.snapshot.customerPhone,
      expires_at: consultationCapabilityExpiry(options.now),
    });
  } catch (error) {
    const cleaned = await compensateMintFailure(options.writer, {
      documentId,
      storageKey,
      uploaded: true,
    });
    await markJob(options.writer, jobId, cleaned ? "cleaned" : "failed", error);
    throw error;
  }

  await markJob(options.writer, jobId, "persisted");

  return {
    documentId,
    documentAccessUrl: consultationDocumentAccessUrl(access.token),
    sha256,
    pdfBytes,
    jobId,
  };
}

export function consultationPdfBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
