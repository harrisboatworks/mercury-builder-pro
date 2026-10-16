// Full submit path for /quote/schedule through supabase/functions/submit-quote-lead.
// Runtime deps (Supabase, Resend, rate limit) are in-memory fakes; every shared
// consultation module (snapshot, PDF render, mint, emails) runs for real.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as zod from 'zod';

type Row = Record<string, unknown>;

const state = vi.hoisted(() => ({
  handler: null as null | ((req: Request) => Promise<Response>),
  tables: {} as Record<string, Array<Record<string, unknown>>>,
  uploads: [] as string[],
  emails: [] as Array<Record<string, unknown>>,
  fetches: [] as Array<{ url: string; body: Record<string, unknown> }>,
}));

class FakeResend {
  emails = {
    send: async (msg: Record<string, unknown>) => {
      state.emails.push(msg);
      return { data: { id: `email-${state.emails.length}` }, error: null };
    },
  };
}
vi.mock('../../../supabase/functions/_shared/turnstile.ts', () => ({
  MISSING_TURNSTILE: 'Captcha verification required',
  verifyTurnstileToken: async () => undefined,
}));

function query(table: string) {
  let pending: Row | Row[] | null = null;
  let mode: 'insert' | 'update' | 'delete' | 'select' = 'select';
  let filter: [string, unknown] | null = null;
  const rows = () => (state.tables[table] ||= []);
  const run = () => {
    if (mode === 'insert') {
      const list = (Array.isArray(pending) ? pending : [pending!]).map((r) => ({
        id: r.id ?? crypto.randomUUID(),
        ...r,
      }));
      rows().push(...list);
      return list;
    }
    const matched = rows().filter((r) => !filter || r[filter[0]] === filter[1]);
    if (mode === 'update') matched.forEach((r) => Object.assign(r, pending));
    if (mode === 'delete') state.tables[table] = rows().filter((r) => !matched.includes(r));
    return matched;
  };
  const builder: Record<string, unknown> = {
    insert(v: Row | Row[]) { mode = 'insert'; pending = v; return builder; },
    update(v: Row) { mode = 'update'; pending = v; return builder; },
    delete() { mode = 'delete'; return builder; },
    select() { return builder; },
    eq(col: string, val: unknown) { filter = [col, val]; return builder; },
    async single() { const out = run(); return { data: out[0] ?? null, error: null }; },
    then(resolve: (v: unknown) => void) { resolve({ data: run(), error: null }); },
  };
  return builder;
}

const fakeCreateClient = () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
    from: (table: string) => query(table),
    storage: {
      from: () => ({
        upload: async (path: string) => { state.uploads.push(path); return { error: null }; },
        remove: async () => ({ error: null }),
      }),
    },
  });

// Test fixture values only (mirrors consultation-authoritative-quote.test.ts).
const MOTOR_MODEL = 'Mercury 150 FourStroke';
const TOTAL = 18458.55;
const SNAPSHOT = {
  version: 1,
  createdAt: '2026-08-25T12:00:00.000Z',
  validUntil: '2026-09-24',
  motor: {
    model: MOTOR_MODEL,
    hp: 150,
    msrp: 18000,
    modelYear: 2026,
    category: 'FourStroke',
    imageUrl: 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/heroes/150.jpg',
  },
  pricing: {
    msrp: 18000,
    discount: 1200,
    promoValue: 250,
    motorSubtotal: 16550,
    subtotal: 16335,
    hst: 2123.55,
    totalCashPrice: 18458.55,
    savings: 1450,
  },
  accessoryBreakdown: [
    { name: 'Control Adaptor Harness', price: 125, description: 'Keeps existing controls', category: 'equipment' },
    { name: 'Professional Installation', price: 450, description: 'Shop rigging and Lake Test', category: 'installation' },
    { name: 'Propeller: Use Existing', price: 0, category: 'equipment' },
  ],
  purchasePath: 'installed',
  tradeInValue: 790,
  tradeInInfo: { brand: 'Mercury', year: 2014, horsepower: 115, model: 'ELPT' },
  includedCoverageYears: 3,
  productProtection: {
    planYears: 2,
    totalCoverageYears: 5,
    priceBeforeTax: 1365,
    monthlyDelta: 29,
  },
  financing: {
    monthlyPayment: 336,
    rate: 5.48,
    amortizationMonths: 60,
    contractTermMonths: 60,
    amountFinanced: 17621.05,
    dealerFee: 349,
    downPayment: 500,
  },
  paymentMethod: 'standard_financing',
  promotion: {
    name: 'Summer Savings Rebate',
    endDate: '2026-08-31',
    combinationMode: 'choose_one',
    selectedOption: 'cash_rebate',
    selectedValue: '$250 rebate',
  },
  customerNotes: 'Confirm mid-ship controls before the Lake Test.',
};

function payload(overrides: Row = {}): Row {
  return {
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_phone: null,
    contact_method: 'email',
    motor_model: MOTOR_MODEL,
    base_price: 16550,
    final_price: TOTAL,
    total_cost: TOTAL,
    ...overrides,
  };
}

async function submit(body: Row) {
  const res = await state.handler!(new Request('https://fn.local/submit-quote-lead', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://www.mercuryrepower.ca' },
    body: JSON.stringify(body),
  }));
  return { status: res.status, json: await res.json() as Row };
}

beforeAll(async () => {
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    state.fetches.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : {} });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  });
  const { createSubmitQuoteLeadHandler } = await import('../../../supabase/functions/submit-quote-lead/handler.ts');
  const env: Record<string, string> = {
    SUPABASE_URL: 'https://fn.local',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
    RESEND_API_KEY: 'resend',
  };
  state.handler = createSubmitQuoteLeadHandler({
    z: zod.z,
    isAllowedOrigin: () => true,
    forbiddenOriginResponse: () => new Response(null, { status: 403 }),
    createClient: fakeCreateClient as never,
    Resend: FakeResend as never,
    checkRateLimit: async () => true,
    rateLimitedResponse: () => new Response(null, { status: 429 }),
    getClientIdentifier: () => '127.0.0.1',
    getEnv: (k) => env[k],
  } as never);
});

beforeEach(() => {
  // The fixture quote is from Aug 2026; pin the clock inside its pricing window
  // so the submit path's quote-expiry guard treats it as current.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-08-26T12:00:00.000Z'));
  state.tables = {};
  state.uploads = [];
  state.emails = [];
  state.fetches = [];
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('submit-quote-lead with optional phone', () => {
  it('email reply with no phone builds the snapshot, mints the PDF and succeeds with no orphan row', async () => {
    const { status, json } = await submit(payload({ quote_snapshot: SNAPSHOT }));
    expect(json).toMatchObject({ success: true });
    expect(status).toBe(200);

    const quotes = state.tables.customer_quotes || [];
    expect(quotes).toHaveLength(1);
    expect(quotes[0].id).toBe(json.quoteId);
    expect(quotes[0].customer_phone).toBeNull();
    // Quote state was persisted on the same row (no orphan without quote_data).
    expect(quotes[0].quote_data).toBeTruthy();

    const docs = state.tables.consultation_documents || [];
    expect(docs).toHaveLength(1);
    expect((docs[0].delivery_snapshot as Row).customerPhone).toBeNull();
    expect(state.uploads).toHaveLength(1);
    const caps = state.tables.consultation_document_capabilities || [];
    expect(caps).toHaveLength(1);
    expect(caps[0].bound_phone).toBeNull();
    expect(caps[0].bound_email).toBe('test@example.com');

    expect(state.emails).toHaveLength(1);
    expect(state.emails[0].attachments).toBeTruthy();
  });

  it('email reply with a blank-string phone also succeeds', async () => {
    const { status, json } = await submit(payload({ customer_phone: '   ', quote_snapshot: SNAPSHOT }));
    expect(status).toBe(200);
    expect(json.success).toBe(true);
    expect(state.tables.customer_quotes?.[0].customer_phone).toBeNull();
  });

  it('keeps the phone on the document when one is given', async () => {
    const { status } = await submit(payload({
      contact_method: 'phone',
      customer_phone: '+19053422153',
      quote_snapshot: SNAPSHOT,
    }));
    expect(status).toBe(200);
    expect(state.tables.consultation_document_capabilities?.[0].bound_phone).toBe('+19053422153');
  });

  it.each(['phone', 'text'])('%s reply with no phone is rejected before any insert', async (method) => {
    const { status, json } = await submit(payload({ contact_method: method }));
    expect(status).toBe(400);
    expect(json.success).toBe(false);
    expect(state.tables.customer_quotes || []).toHaveLength(0);
    expect(state.tables.saved_quotes || []).toHaveLength(0);
  });

  it('malformed phone is rejected before any insert', async () => {
    const { status } = await submit(payload({ customer_phone: '555-12345', quote_snapshot: SNAPSHOT }));
    expect(status).toBe(400);
    expect(state.tables.customer_quotes || []).toHaveLength(0);
  });

  it('email-only lead still reaches the HBW admin notification without a null phone', async () => {
    const { status } = await submit(payload({ quote_snapshot: SNAPSHOT }));
    expect(status).toBe(200);
    const admin = state.fetches.find((f) => f.url.endsWith('/send-quote-email') && f.body.emailType === 'admin_quote_notification');
    expect(admin).toBeDefined();
    const leadData = admin!.body.leadData as Record<string, unknown>;
    expect(leadData.customerPhone ?? undefined).toBeUndefined();
    expect(leadData.customerPhone).not.toBeNull();
  });

  it('expired quote pricing is still rejected before any insert', async () => {
    vi.setSystemTime(new Date('2026-10-15T12:00:00.000Z'));
    const { status, json } = await submit(payload({ quote_snapshot: SNAPSHOT }));
    expect(status).toBe(400);
    expect(json.success).toBe(false);
    expect(state.tables.customer_quotes || []).toHaveLength(0);
  });
});

describe('consultation document helpers with optional phone', () => {
  it('snapshot accepts null/blank phone but still rejects malformed numbers', async () => {
    const policy = await import('../../../supabase/functions/_shared/consultation-document-policy.ts');
    const base = { customerName: 'A', customerEmail: 'a@example.com', motorModel: 'M', totalPrice: 1 };
    expect(policy.consultationSubmitDeliverySnapshot({ ...base, customerPhone: null }).customerPhone).toBeNull();
    expect(policy.consultationSubmitDeliverySnapshot({ ...base, customerPhone: '' }).customerPhone).toBeNull();
    expect(policy.consultationSubmitDeliverySnapshot({ ...base, customerPhone: '(905) 342-2153' }).customerPhone).toBe('+19053422153');
    expect(() => policy.consultationSubmitDeliverySnapshot({ ...base, customerPhone: '3422153' })).toThrow(/phone/);
  });

  it('upload meta allows no phone for email flows but requires it for SMS', async () => {
    const policy = await import('../../../supabase/functions/_shared/consultation-document-policy.ts');
    const meta = {
      quoteNumber: 'HBW-123456',
      customerName: 'A',
      customerEmail: 'a@example.com',
      motorModel: 'M',
      totalPrice: 1,
      customerQuoteId: null,
    };
    expect(policy.parseConsultationUploadMeta({ ...meta, flow: 'send_email', customerPhone: null }).customerPhone).toBeNull();
    expect(() => policy.parseConsultationUploadMeta({ ...meta, flow: 'send_sms', customerPhone: null })).toThrow(/phone/);
    expect(() => policy.parseConsultationUploadMeta({ ...meta, flow: 'send_email', customerPhone: 'abc' })).toThrow(/phone/);
  });

  it('PDF omits the phone line when absent and keeps it when present', async () => {
    const { buildConsultationQuotePdfLines } = await import('../../../supabase/functions/_shared/consultation-document-pdf.ts');
    const snap = { customerName: 'A', customerEmail: 'a@example.com', motorModel: 'M', totalPrice: 1 };
    const without = buildConsultationQuotePdfLines({ quoteNumber: 'HBW-123456', snapshot: { ...snap, customerPhone: null } });
    expect(without).not.toContain(null);
    expect(without.slice(4, 7)).toEqual(['A', 'a@example.com', 'M']);
    const withPhone = buildConsultationQuotePdfLines({ quoteNumber: 'HBW-123456', snapshot: { ...snap, customerPhone: '+19053422153' } });
    expect(withPhone).toContain('+19053422153');
  });
});
