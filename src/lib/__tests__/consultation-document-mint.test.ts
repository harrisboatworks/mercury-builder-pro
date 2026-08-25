import { describe, expect, it } from 'vitest';

import {
  createConsultationAccessToken,
  consultationSubmitDeliverySnapshot,
  hashConsultationToken,
  normalizeConsultationPhone,
  validateQuotePdf,
} from '../../../supabase/functions/_shared/consultation-document-policy.ts';
import { renderConsultationQuotePdf } from '../../../supabase/functions/_shared/consultation-document-pdf.ts';
import {
  type ConsultationCapabilityInsert,
  type ConsultationDocumentInsert,
  type ConsultationDocumentWriter,
  mintConsultationDocument,
} from '../../../supabase/functions/_shared/consultation-document-mint.ts';

const QUOTE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DOCUMENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const SNAPSHOT = consultationSubmitDeliverySnapshot({
  customerName: 'Jay Harris',
  customerEmail: 'jay@example.com',
  customerPhone: '+19053766208',
  motorModel: 'Mercury 150 FourStroke',
  totalPrice: 18450,
});

function memoryWriter(options: {
  failUpload?: boolean;
  failCapability?: boolean;
} = {}) {
  const documents: ConsultationDocumentInsert[] = [];
  const uploads: Array<{ path: string; bytes: Uint8Array }> = [];
  const capabilities: ConsultationCapabilityInsert[] = [];
  const deleted: string[] = [];
  const removed: string[] = [];
  const writer: ConsultationDocumentWriter = {
    async insertDocument(row) {
      documents.push(row);
      return { id: row.id };
    },
    async uploadPdf(path, bytes) {
      if (options.failUpload) throw new Error('upload failed');
      uploads.push({ path, bytes });
    },
    async insertCapability(row) {
      if (options.failCapability) throw new Error('capability failed');
      capabilities.push(row);
    },
    async deleteDocument(id) {
      deleted.push(id);
    },
    async removePdf(path) {
      removed.push(path);
    },
  };
  return { writer, documents, uploads, capabilities, deleted, removed };
}

describe('consultation document mint', () => {
  it('renders a valid server PDF from the persisted delivery snapshot', () => {
    const pdf = renderConsultationQuotePdf({
      quoteNumber: 'HBW-123456',
      snapshot: SNAPSHOT,
    });
    expect(() => validateQuotePdf(pdf, 'application/pdf')).not.toThrow();
    const text = new TextDecoder().decode(pdf);
    expect(text.startsWith('%PDF-1.7')).toBe(true);
    expect(text).toContain('HBW-123456');
    expect(text).toContain('Jay Harris');
    expect(text).toContain('Mercury 150 FourStroke');
    expect(text).toContain('18450');
  });

  it('normalizes NANP phones and rejects unusable numbers', () => {
    expect(normalizeConsultationPhone('+19053766208')).toBe('+19053766208');
    expect(normalizeConsultationPhone('(905) 376-6208')).toBe('+19053766208');
    expect(normalizeConsultationPhone('1-905-376-6208')).toBe('+19053766208');
    expect(() => normalizeConsultationPhone('3766208')).toThrow(/phone/);
    expect(() => normalizeConsultationPhone('+441234567890')).toThrow(/phone/);
  });

  it('persists the canonical object and token hash without storing the raw token', async () => {
    const access = await createConsultationAccessToken();
    const store = memoryWriter();
    const minted = await mintConsultationDocument({
      quoteId: QUOTE_ID,
      quoteNumber: 'HBW-123456',
      snapshot: SNAPSHOT,
      writer: store.writer,
      documentId: DOCUMENT_ID,
      accessToken: access,
    });

    expect(minted.documentId).toBe(DOCUMENT_ID);
    expect(minted.documentAccessUrl).toBe(`https://www.mercuryrepower.ca/quote/document#${access.token}`);
    expect(minted.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(store.documents[0]?.storage_key).toBe(`consultation/${DOCUMENT_ID}/quote.pdf`);
    expect(store.documents[0]?.quote_number).toBe('HBW-123456');
    expect(store.documents[0]?.customer_quote_id).toBe(QUOTE_ID);
    expect(store.uploads[0]?.path).toBe(`consultation/${DOCUMENT_ID}/quote.pdf`);
    expect(store.capabilities[0]?.purpose).toBe('submit');
    expect(store.capabilities[0]?.token_hash).toBe(await hashConsultationToken(access.token));
    expect(store.capabilities[0]?.bound_email).toBe('jay@example.com');
    expect(JSON.stringify(store.documents)).not.toContain(access.token);
    expect(JSON.stringify(store.capabilities)).not.toContain(access.token);
    expect(JSON.stringify(store.capabilities)).not.toContain('cd_');
  });

  it('deletes the document row when storage upload fails', async () => {
    const store = memoryWriter({ failUpload: true });
    await expect(mintConsultationDocument({
      quoteId: QUOTE_ID,
      quoteNumber: 'HBW-123456',
      snapshot: SNAPSHOT,
      writer: store.writer,
      documentId: DOCUMENT_ID,
    })).rejects.toThrow(/upload failed/);
    expect(store.deleted).toEqual([DOCUMENT_ID]);
    expect(store.capabilities).toHaveLength(0);
  });

  it('removes the object and document when capability persist fails', async () => {
    const store = memoryWriter({ failCapability: true });
    await expect(mintConsultationDocument({
      quoteId: QUOTE_ID,
      quoteNumber: 'HBW-123456',
      snapshot: SNAPSHOT,
      writer: store.writer,
      documentId: DOCUMENT_ID,
    })).rejects.toThrow(/capability failed/);
    expect(store.removed).toEqual([`consultation/${DOCUMENT_ID}/quote.pdf`]);
    expect(store.deleted).toEqual([DOCUMENT_ID]);
  });
});
