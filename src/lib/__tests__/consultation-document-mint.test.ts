import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  createConsultationAccessToken,
  consultationSubmitDeliverySnapshot,
  hashConsultationToken,
  normalizeConsultationPhone,
  validateQuotePdf,
} from '../../../supabase/functions/_shared/consultation-document-policy.ts';
import { renderConsultationQuotePdf } from '../../../supabase/functions/_shared/consultation-document-pdf.ts';
import {
  createSupabaseConsultationDocumentWriter,
  type ConsultationCapabilityInsert,
  type ConsultationDocumentInsert,
  type ConsultationDocumentJobInsert,
  type ConsultationDocumentWriter,
  markConsultationDocumentJobDeliveryFailed,
  mintConsultationDocument,
} from '../../../supabase/functions/_shared/consultation-document-mint.ts';
import { mergeConsultationDeliverySnapshot } from '../../../supabase/functions/_shared/consultation-authoritative-quote.ts';

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
  failCleanup?: boolean;
} = {}) {
  const documents: ConsultationDocumentInsert[] = [];
  const uploads: Array<{ path: string; bytes: Uint8Array }> = [];
  const capabilities: ConsultationCapabilityInsert[] = [];
  const jobs: ConsultationDocumentJobInsert[] = [];
  const jobUpdates: Array<{ id: string; status: string; error_name?: string | null }> = [];
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
      if (options.failCleanup) throw new Error('cleanup failed');
      deleted.push(id);
    },
    async removePdf(path) {
      if (options.failCleanup) throw new Error('cleanup failed');
      removed.push(path);
    },
    async insertJob(row) {
      jobs.push(row);
      return { id: row.id };
    },
    async updateJob(id, patch) {
      jobUpdates.push({ id, ...patch });
    },
  };
  return { writer, documents, uploads, capabilities, jobs, jobUpdates, deleted, removed };
}

describe('consultation document mint', () => {
  it('accepts all three typed insert rows without index signatures', () => {
    type SupabaseWriterInput = Parameters<typeof createSupabaseConsultationDocumentWriter>[0];
    type SupabaseInsertRow = Parameters<ReturnType<SupabaseWriterInput['from']>['insert']>[0];

    expectTypeOf<ConsultationDocumentInsert>().toMatchTypeOf<SupabaseInsertRow>();
    expectTypeOf<ConsultationCapabilityInsert>().toMatchTypeOf<SupabaseInsertRow>();
    expectTypeOf<ConsultationDocumentJobInsert>().toMatchTypeOf<SupabaseInsertRow>();
  });

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
    expect(minted.jobId).toBe(store.jobs[0]?.id);
    expect(store.jobs[0]?.status).toBe('started');
    expect(store.jobUpdates.at(-1)?.status).toBe('persisted');
    expect(JSON.stringify(store.documents)).not.toContain(access.token);
    expect(JSON.stringify(store.capabilities)).not.toContain(access.token);
    expect(JSON.stringify(store.capabilities)).not.toContain('cd_');
    expect(JSON.stringify(store.jobs)).not.toContain(access.token);
    expect(JSON.stringify(store.jobs)).not.toContain('cd_');
    expect(JSON.stringify(store.jobUpdates)).not.toContain(access.token);
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
    expect(store.jobUpdates.at(-1)?.status).toBe('cleaned');
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
    expect(store.jobUpdates.at(-1)?.status).toBe('cleaned');
  });

  it('keeps a minted job persisted with an error name when email delivery fails', async () => {
    const store = memoryWriter();
    const minted = await mintConsultationDocument({
      quoteId: QUOTE_ID,
      quoteNumber: 'HBW-123456',
      snapshot: SNAPSHOT,
      writer: store.writer,
      documentId: DOCUMENT_ID,
    });
    await markConsultationDocumentJobDeliveryFailed(
      store.writer,
      minted.jobId,
      Object.assign(new Error('provider rejected'), { name: 'ResendError' }),
    );
    expect(store.jobUpdates.at(-1)).toMatchObject({
      id: minted.jobId,
      status: 'persisted',
      error_name: 'ResendError',
    });
    expect(store.deleted).toHaveLength(0);
    expect(store.removed).toHaveLength(0);
  });

  it('stores the complete delivery snapshot used to render the PDF', async () => {
    const complete = mergeConsultationDeliverySnapshot(SNAPSHOT, {
      accessories: [{ name: 'Professional Installation', price: 450 }],
      tradeIn: { value: 790, brand: 'Mercury' },
      priceBreakdown: { subtotal: 16335, hst: 2123.55 },
      financing: { monthlyPayment: 336, amortizationMonths: 60, rate: 5.48 },
    });
    const store = memoryWriter();
    await mintConsultationDocument({
      quoteId: QUOTE_ID,
      quoteNumber: 'HBW-123456',
      snapshot: complete,
      writer: store.writer,
      documentId: DOCUMENT_ID,
    });
    expect(store.documents[0]?.delivery_snapshot.accessories).toEqual([
      { name: 'Professional Installation', price: 450 },
    ]);
    expect(store.documents[0]?.delivery_snapshot.tradeIn?.value).toBe(790);
    const pdfText = new TextDecoder().decode(store.uploads[0]?.bytes || new Uint8Array());
    expect(pdfText).toContain('Professional Installation');
    expect(pdfText).toContain('Estimated trade-in value');
    expect(pdfText).toContain('HST \\(13%\\)');
  });

  it('marks the mint job failed when compensating cleanup cannot finish', async () => {
    const store = memoryWriter({ failCapability: true, failCleanup: true });
    await expect(mintConsultationDocument({
      quoteId: QUOTE_ID,
      quoteNumber: 'HBW-123456',
      snapshot: SNAPSHOT,
      writer: store.writer,
      documentId: DOCUMENT_ID,
    })).rejects.toThrow(/capability failed/);
    expect(store.jobUpdates.at(-1)?.status).toBe('failed');
    expect(store.deleted).toHaveLength(0);
  });
});
