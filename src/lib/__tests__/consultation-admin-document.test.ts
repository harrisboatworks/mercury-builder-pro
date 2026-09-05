import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CONSULTATION_SAVED_QUOTE_SOURCE } from '../../../supabase/functions/_shared/consultation-authoritative-quote.ts';
import {
  buildAdminConsultationQuoteEmailPayload,
  consultationAdminDeliveryIdentity,
  handleAdminConsultationDocument,
  parseAdminConsultationDocumentRequest,
  resolveAdminConsultationQuoteId,
  type AdminConsultationDocumentStore,
  type AdminConsultationQuoteEmailPayload,
  type StoredAdminConsultationDocument,
} from '../../../supabase/functions/_shared/consultation-admin-document.ts';
import {
  CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS,
  ConsultationDocumentRequestError,
  ConsultationDocumentUnavailableError,
  canonicalConsultationDocumentPath,
  consultationDocumentAccessUrl,
  sha256Hex,
} from '../../../supabase/functions/_shared/consultation-document-policy.ts';

const SAVED_ID = '11111111-1111-4111-8111-111111111111';
const CUSTOMER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DOCUMENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TOKEN = `cd_${'ab'.repeat(32)}`;
const TOKEN_HASH = 'c'.repeat(64);
const ACCESS_URL = consultationDocumentAccessUrl(TOKEN);

const SNAPSHOT = {
  customerName: 'Jay Harris',
  customerEmail: 'jay@example.com',
  customerPhone: '+19053766208',
  motorModel: 'Mercury 150 FourStroke',
  totalPrice: 18193,
};

function pdfBytes(label = 'quote'): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.7\n${label}`);
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function storedDocument(overrides: {
  bytes?: Uint8Array;
  sha256?: string;
  byteSize?: number;
  storageKey?: string;
  snapshot?: unknown;
} = {}) {
  const bytes = overrides.bytes ?? pdfBytes();
  const sha256 = overrides.sha256 ?? await sha256Hex(bytes);
  const document: StoredAdminConsultationDocument = {
    id: DOCUMENT_ID,
    customer_quote_id: CUSTOMER_ID,
    storage_key: overrides.storageKey ?? canonicalConsultationDocumentPath(DOCUMENT_ID),
    sha256,
    byte_size: overrides.byteSize ?? bytes.byteLength,
    content_type: 'application/pdf',
    quote_number: 'HBW-150193',
    delivery_snapshot: overrides.snapshot === undefined ? SNAPSHOT : overrides.snapshot,
  };
  return { document, bytes };
}

function memoryStore(seed: {
  savedById?: Record<string, { convertedToQuoteId: string | null; quoteState: Record<string, unknown> | null } | null>;
  document?: StoredAdminConsultationDocument | null;
  bytes?: Uint8Array | null;
  signedUrl?: string | null;
}) {
  const lookups = { saved: [] as string[], documents: [] as string[] };
  const capabilities: Array<Record<string, unknown>> = [];
  const revoked: string[] = [];
  const downloads: string[] = [];
  const signed: Array<{ path: string; expiresIn: number; filename: string }> = [];
  const store: AdminConsultationDocumentStore = {
    async findSavedQuote(quoteId) {
      lookups.saved.push(quoteId);
      if (!seed.savedById) return null;
      return seed.savedById[quoteId] ?? null;
    },
    async findLatestDocument(customerQuoteId) {
      lookups.documents.push(customerQuoteId);
      return seed.document ?? null;
    },
    async downloadPdf(path) {
      downloads.push(path);
      if (!seed.bytes) return null;
      return { bytes: seed.bytes };
    },
    async createSignedUrl(path, expiresIn, filename) {
      signed.push({ path, expiresIn, filename });
      return seed.signedUrl === undefined ? 'https://storage.example/signed-quote.pdf' : seed.signedUrl;
    },
    async insertCapability(row) {
      capabilities.push({ ...row });
    },
    async revokeCapability(tokenHash) {
      revoked.push(tokenHash);
    },
  };
  return { store, lookups, capabilities, revoked, downloads, signed };
}

describe('admin consultation document policy', () => {
  it('reads only action and quoteId from the request body', () => {
    expect(parseAdminConsultationDocumentRequest({
      action: 'admin-download',
      quoteId: CUSTOMER_ID,
      customerEmail: 'attacker@example.com',
      path: 'consultation/evil/quote.pdf',
      documentAccessUrl: 'https://evil.example/quote.pdf',
      storageKey: 'spec-sheets/temp/quote.pdf',
    })).toEqual({ action: 'admin-download', quoteId: CUSTOMER_ID });
    expect(() => parseAdminConsultationDocumentRequest({
      action: 'redeem',
      quoteId: CUSTOMER_ID,
    })).toThrow(ConsultationDocumentRequestError);
  });

  it('resolves a staff customer quote id or a nested saved-quote id', () => {
    expect(resolveAdminConsultationQuoteId({ quoteId: CUSTOMER_ID, savedQuote: null })).toBe(CUSTOMER_ID);
    expect(resolveAdminConsultationQuoteId({
      quoteId: SAVED_ID,
      savedQuote: {
        convertedToQuoteId: CUSTOMER_ID,
        quoteState: { source: CONSULTATION_SAVED_QUOTE_SOURCE, customerQuoteId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' },
      },
    })).toBe(CUSTOMER_ID);
    expect(resolveAdminConsultationQuoteId({
      quoteId: SAVED_ID,
      savedQuote: {
        convertedToQuoteId: null,
        quoteState: { source: CONSULTATION_SAVED_QUOTE_SOURCE, customerQuoteId: CUSTOMER_ID },
      },
    })).toBe(CUSTOMER_ID);
    expect(() => resolveAdminConsultationQuoteId({
      quoteId: SAVED_ID,
      savedQuote: {
        convertedToQuoteId: CUSTOMER_ID,
        quoteState: { source: 'saved' },
      },
    })).toThrow(ConsultationDocumentUnavailableError);
  });

  it('uses the persisted delivery snapshot, not a caller recipient', () => {
    expect(consultationAdminDeliveryIdentity(SNAPSHOT)).toMatchObject({
      customerEmail: 'jay@example.com',
      customerName: 'Jay Harris',
    });
    expect(() => consultationAdminDeliveryIdentity({
      ...SNAPSHOT,
      customerEmail: 'not-an-email',
    })).toThrow(ConsultationDocumentUnavailableError);
  });
});

describe('admin consultation document handler', () => {
  const req = new Request('https://www.mercuryrepower.ca/functions/v1/admin-consultation-document', {
    method: 'POST',
  });
  const mailer = { sendQuoteEmail: vi.fn<(payload: AdminConsultationQuoteEmailPayload) => Promise<boolean>>() };
  const access = { createAccessToken: vi.fn(async () => ({ token: TOKEN, tokenHash: TOKEN_HASH })) };

  beforeEach(() => {
    mailer.sendQuoteEmail.mockReset();
    mailer.sendQuoteEmail.mockResolvedValue(true);
    access.createAccessToken.mockClear();
  });

  async function run(body: Record<string, unknown>, store: AdminConsultationDocumentStore, extras: {
    authorize?: () => Promise<{ userId: string } | Response>;
    rateLimit?: boolean;
  } = {}) {
    return handleAdminConsultationDocument({
      req,
      body,
      authorize: extras.authorize || (async () => ({ userId: 'admin-user-1' })),
      checkRateLimit: async () => extras.rateLimit !== false,
      rateLimitedResponse: () => jsonResponse({ error: 'Too many requests' }, 429),
      jsonResponse,
      store,
      mailer,
      access,
    });
  }

  it('denies anonymous and non-admin callers before any quote lookup', async () => {
    const seeded = memoryStore({});
    const anonymous = await run(
      { action: 'admin-download', quoteId: CUSTOMER_ID },
      seeded.store,
      { authorize: async () => jsonResponse({ error: 'Missing Authorization header' }, 401) },
    );
    expect(anonymous.status).toBe(401);
    expect(seeded.lookups.saved).toEqual([]);
    expect(seeded.lookups.documents).toEqual([]);
    expect(seeded.downloads).toEqual([]);

    const nonAdmin = await run(
      { action: 'admin-download', quoteId: CUSTOMER_ID },
      seeded.store,
      { authorize: async () => jsonResponse({ error: 'Forbidden: Admin access required' }, 403) },
    );
    expect(nonAdmin.status).toBe(403);
    expect(seeded.lookups.saved).toEqual([]);
    expect(seeded.downloads).toEqual([]);
  });

  it('does not treat a public quote UUID as a PDF capability', async () => {
    const { document, bytes } = await storedDocument();
    const seeded = memoryStore({ document, bytes });
    const response = await run(
      { action: 'admin-download', quoteId: CUSTOMER_ID },
      seeded.store,
      { authorize: async () => jsonResponse({ error: 'Missing Authorization header' }, 401) },
    );
    expect(response.status).toBe(401);
    expect(seeded.downloads).toEqual([]);
    expect(seeded.signed).toEqual([]);
  });

  it('resolves a staff customer quote id and a nested saved-quote id to the same document', async () => {
    const { document, bytes } = await storedDocument();
    const customerStore = memoryStore({ document, bytes, signedUrl: 'https://storage.example/customer.pdf' });
    const customer = await run({ action: 'admin-download', quoteId: CUSTOMER_ID }, customerStore.store);
    expect(customer.status).toBe(200);
    expect(customerStore.lookups.saved).toEqual([CUSTOMER_ID]);
    expect(customerStore.lookups.documents).toEqual([CUSTOMER_ID]);
    expect(await customer.json()).toEqual({
      signedUrl: 'https://storage.example/customer.pdf',
      expiresIn: CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS,
    });

    const savedStore = memoryStore({
      savedById: {
        [SAVED_ID]: {
          convertedToQuoteId: CUSTOMER_ID,
          quoteState: { source: CONSULTATION_SAVED_QUOTE_SOURCE, customerQuoteId: CUSTOMER_ID },
        },
      },
      document,
      bytes,
      signedUrl: 'https://storage.example/saved.pdf',
    });
    const saved = await run({ action: 'admin-download', quoteId: SAVED_ID }, savedStore.store);
    expect(saved.status).toBe(200);
    expect(savedStore.lookups.saved).toEqual([SAVED_ID]);
    expect(savedStore.lookups.documents).toEqual([CUSTOMER_ID]);
    expect(savedStore.downloads).toEqual([canonicalConsultationDocumentPath(DOCUMENT_ID)]);
  });

  it('rejects a missing document, a digest mismatch, and a size mismatch before signing', async () => {
    const missing = memoryStore({ document: null, bytes: pdfBytes() });
    await expect(run({ action: 'admin-download', quoteId: CUSTOMER_ID }, missing.store))
      .rejects.toBeInstanceOf(ConsultationDocumentUnavailableError);
    expect(missing.signed).toEqual([]);

    const { document, bytes } = await storedDocument();
    const wrongHash = memoryStore({
      document: { ...document, sha256: 'd'.repeat(64) },
      bytes,
    });
    await expect(run({ action: 'admin-download', quoteId: CUSTOMER_ID }, wrongHash.store))
      .rejects.toBeInstanceOf(ConsultationDocumentUnavailableError);
    expect(wrongHash.signed).toEqual([]);

    const wrongSize = memoryStore({
      document: { ...document, byte_size: document.byte_size + 8 },
      bytes,
    });
    await expect(run({ action: 'admin-download', quoteId: CUSTOMER_ID }, wrongSize.store))
      .rejects.toBeInstanceOf(ConsultationDocumentUnavailableError);
    expect(wrongSize.signed).toEqual([]);
  });

  it('ignores caller recipient and path fields in favor of the persisted snapshot', async () => {
    const { document, bytes } = await storedDocument();
    const seeded = memoryStore({ document, bytes });
    const response = await run({
      action: 'admin-email',
      quoteId: CUSTOMER_ID,
      customerEmail: 'attacker@example.com',
      path: 'consultation/evil/quote.pdf',
      storageKey: 'spec-sheets/temp/quote.pdf',
      documentAccessUrl: 'https://evil.example/quote.pdf',
      documentId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    }, seeded.store);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(seeded.downloads).toEqual([canonicalConsultationDocumentPath(DOCUMENT_ID)]);
    expect(seeded.capabilities[0]).toMatchObject({
      document_id: DOCUMENT_ID,
      token_hash: TOKEN_HASH,
      purpose: 'send_email',
      bound_email: 'jay@example.com',
      bound_phone: '+19053766208',
    });
    expect(mailer.sendQuoteEmail).toHaveBeenCalledWith({
      customerEmail: 'jay@example.com',
      customerName: 'Jay Harris',
      quoteNumber: 'HBW-150193',
      motorModel: 'Mercury 150 FourStroke',
      totalPrice: 18193,
      emailType: 'quote_delivery',
      documentId: DOCUMENT_ID,
      documentAccessUrl: ACCESS_URL,
      leadData: { quoteId: CUSTOMER_ID },
    });
    const payload = mailer.sendQuoteEmail.mock.calls[0][0];
    expect(payload).not.toHaveProperty('pdfUrl');
    expect(payload.documentAccessUrl).toBe(ACCESS_URL);
    expect(payload.documentAccessUrl).not.toContain('/storage/v1/');
    expect(payload.customerEmail).not.toBe('attacker@example.com');
  });

  it('mints a private share capability instead of a public quote UUID or signed storage URL', async () => {
    const { document, bytes } = await storedDocument();
    const seeded = memoryStore({ document, bytes });
    const response = await run({ action: 'admin-share', quoteId: CUSTOMER_ID }, seeded.store);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      documentAccessUrl: ACCESS_URL,
      expiresAt: expect.any(String),
    });
    expect(body).not.toHaveProperty('signedUrl');
    expect(body).not.toHaveProperty('token');
    expect(body.documentAccessUrl).toContain('/quote/document#cd_');
    expect(seeded.signed).toEqual([]);
    expect(mailer.sendQuoteEmail).not.toHaveBeenCalled();
    expect(seeded.capabilities[0]).toMatchObject({
      token_hash: TOKEN_HASH,
      bound_email: 'jay@example.com',
    });
    expect(JSON.stringify(seeded.capabilities)).not.toContain(TOKEN);
  });

  it('revokes the minted capability when the mailer does not confirm provider success', async () => {
    const { document, bytes } = await storedDocument();
    const seeded = memoryStore({ document, bytes });
    mailer.sendQuoteEmail.mockResolvedValue(false);
    const response = await run({ action: 'admin-email', quoteId: CUSTOMER_ID }, seeded.store);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'Quote email could not be sent' });
    expect(seeded.revoked).toEqual([TOKEN_HASH]);

    const thrown = memoryStore({ document, bytes });
    mailer.sendQuoteEmail.mockRejectedValueOnce(new Error('network'));
    const failed = await run({ action: 'admin-email', quoteId: CUSTOMER_ID }, thrown.store);
    expect(failed.status).toBe(502);
    expect(thrown.revoked).toEqual([TOKEN_HASH]);
  });

  it('does not download a legacy saved quote or a missing object', async () => {
    const { document, bytes } = await storedDocument();
    const legacy = memoryStore({
      savedById: {
        [SAVED_ID]: {
          convertedToQuoteId: CUSTOMER_ID,
          quoteState: { source: 'saved' },
        },
      },
      document,
      bytes,
    });
    await expect(run({ action: 'admin-download', quoteId: SAVED_ID }, legacy.store))
      .rejects.toBeInstanceOf(ConsultationDocumentUnavailableError);
    expect(legacy.lookups.documents).toEqual([]);
    expect(legacy.downloads).toEqual([]);

    const missingObject = memoryStore({ document, bytes: null });
    await expect(run({ action: 'admin-download', quoteId: CUSTOMER_ID }, missingObject.store))
      .rejects.toBeInstanceOf(ConsultationDocumentUnavailableError);
    expect(missingObject.signed).toEqual([]);
  });

  it('rejects a document row bound to another customer quote', async () => {
    const { document, bytes } = await storedDocument();
    const seeded = memoryStore({ document: { ...document, customer_quote_id: SAVED_ID }, bytes });
    await expect(run({ action: 'admin-download', quoteId: CUSTOMER_ID }, seeded.store))
      .rejects.toBeInstanceOf(ConsultationDocumentUnavailableError);
    expect(seeded.downloads).toEqual([]);
    expect(seeded.signed).toEqual([]);
  });

  it('rate-limits staff before looking up documents', async () => {
    const seeded = memoryStore({});
    const response = await run(
      { action: 'admin-download', quoteId: CUSTOMER_ID },
      seeded.store,
      { rateLimit: false },
    );
    expect(response.status).toBe(429);
    expect(seeded.lookups.saved).toEqual([]);
  });

  it('keeps the bound quote identity on the customer resend payload', () => {
    const payload = buildAdminConsultationQuoteEmailPayload({
      snapshot: SNAPSHOT,
      document: {
        id: DOCUMENT_ID,
        customer_quote_id: CUSTOMER_ID,
        storage_key: canonicalConsultationDocumentPath(DOCUMENT_ID),
        sha256: 'a'.repeat(64),
        byte_size: 12,
        content_type: 'application/pdf',
        quote_number: 'HBW-150193',
        delivery_snapshot: SNAPSHOT,
      },
      documentAccessUrl: ACCESS_URL,
      quoteId: CUSTOMER_ID,
    });
    expect(payload.leadData.quoteId).toBe(CUSTOMER_ID);
    expect(payload.documentId).toBe(DOCUMENT_ID);
    expect(payload.quoteNumber).toBe('HBW-150193');
  });
});
