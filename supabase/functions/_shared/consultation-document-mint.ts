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

export interface ConsultationDocumentWriter {
  insertDocument(row: ConsultationDocumentInsert): Promise<{ id: string }>;
  uploadPdf(path: string, bytes: Uint8Array): Promise<void>;
  insertCapability(row: ConsultationCapabilityInsert): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  removePdf(path: string): Promise<void>;
}

export interface MintConsultationDocumentResult {
  documentId: string;
  documentAccessUrl: string;
  sha256: string;
  pdfBytes: Uint8Array;
}

async function ignoreCleanup(task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch {
    // Compensating cleanup is best-effort. Retention still owns orphans.
  }
}

export function createSupabaseConsultationDocumentWriter(supabase: {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{ data: { id?: string } | null; error: unknown }>;
      };
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
      await supabase.from("consultation_documents").delete().eq("id", id);
    },
    async removePdf(path) {
      await supabase.storage.from(CONSULTATION_DOCUMENTS_BUCKET).remove([path]);
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

  try {
    await options.writer.uploadPdf(storageKey, pdfBytes);
  } catch (error) {
    await ignoreCleanup(() => options.writer.deleteDocument(documentId));
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
    await ignoreCleanup(() => options.writer.removePdf(storageKey));
    await ignoreCleanup(() => options.writer.deleteDocument(documentId));
    throw error;
  }

  return {
    documentId,
    documentAccessUrl: consultationDocumentAccessUrl(access.token),
    sha256,
    pdfBytes,
  };
}

export function consultationPdfBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
