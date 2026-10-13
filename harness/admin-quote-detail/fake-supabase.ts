import {
  DEPOSIT_CUSTOMER_QUOTE_ID,
  DEPOSIT_SAVED_ID,
  PRIVATE_DOCUMENT_URL,
  PRIVATE_DOWNLOAD_URL,
  RESERVATION_DOWNLOAD_URL,
  SUBMITTED_ID,
  depositCustomerQuote,
  depositSavedQuote,
  submittedCustomerQuote,
} from './fixtures';
import { recordHarnessEvent } from './harness-log';

type RowResult = { data: unknown; error: null | { message: string }; count?: number };

function quoteRows(table: string, filters: Record<string, unknown>, single: boolean): RowResult {
  if (table === 'saved_quotes') {
    const row = filters.id === DEPOSIT_SAVED_ID ? depositSavedQuote() : null;
    return { data: single ? row : row ? [row] : [], error: null };
  }

  if (table === 'customer_quotes') {
    let row: Record<string, unknown> | null = null;
    if (filters.id === SUBMITTED_ID) row = submittedCustomerQuote();
    else if (filters.saved_quote_id === DEPOSIT_SAVED_ID) row = depositCustomerQuote();
    else if (filters.id === DEPOSIT_CUSTOMER_QUOTE_ID) row = depositCustomerQuote();
    else if (filters.customer_email) {
      const email = String(filters.customer_email);
      const submitted = submittedCustomerQuote();
      const deposit = depositCustomerQuote();
      const matches = [submitted, deposit].filter((candidate) => candidate.customer_email === email);
      return { data: single ? matches[0] ?? null : matches, error: null };
    }
    return { data: single ? row : row ? [row] : [], error: null };
  }

  if (table === 'deposit_email_deliveries') return { data: [], error: null };
  if (table === 'financing_applications') return { data: null, error: null, count: 0 };
  return { data: single ? null : [], error: null };
}

function from(table: string) {
  const filters: Record<string, unknown> = {};
  let head = false;
  let write = false;

  const finish = (single: boolean): RowResult => {
    recordHarnessEvent('table', { table, filters: { ...filters }, head, write, single });
    if (write || head) return { data: null, error: null, count: 0 };
    return quoteRows(table, filters, single);
  };

  const api: Record<string, unknown> = {
    select: (_columns?: string, options?: { head?: boolean; count?: string }) => {
      if (options?.head) head = true;
      return api;
    },
    eq: (column: string, value: unknown) => {
      filters[column] = value;
      return api;
    },
    in: () => api,
    contains: () => api,
    order: () => api,
    limit: () => api,
    update: () => {
      write = true;
      return api;
    },
    insert: (payload: unknown) => {
      recordHarnessEvent('table', { table, write: true, payload });
      return Promise.resolve({ data: null, error: null });
    },
    upsert: () => {
      write = true;
      return api;
    },
    delete: () => {
      write = true;
      return api;
    },
    maybeSingle: () => Promise.resolve(finish(true)),
    single: () => Promise.resolve(finish(true)),
    then: (
      resolve: (value: RowResult) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(finish(false)).then(resolve, reject),
  };
  return api;
}

const session = {
  user: {
    id: 'admin-synthetic',
    email: 'harness-admin@example.test',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
  },
};

function invoke(name: string, args?: { body?: Record<string, unknown> }) {
  const body = args?.body;
  recordHarnessEvent('invoke', { name, body: body ?? null });
  if (name === 'admin-consultation-document' && body?.action === 'admin-share') {
    return Promise.resolve({ data: { documentAccessUrl: PRIVATE_DOCUMENT_URL }, error: null });
  }
  if (name === 'admin-consultation-document' && body?.action === 'admin-download') {
    return Promise.resolve({ data: { signedUrl: PRIVATE_DOWNLOAD_URL }, error: null });
  }
  if (name === 'admin-consultation-document' && body?.action === 'admin-email') {
    return Promise.resolve({ data: { success: true }, error: null });
  }
  if (name === 'quote-document-api' && body?.action === 'download') {
    return Promise.resolve({ data: { signedUrl: RESERVATION_DOWNLOAD_URL }, error: null });
  }
  return Promise.resolve({ data: null, error: { message: `offline harness refused ${name}` } });
}

export const supabase = {
  from,
  rpc: (name: string, args?: Record<string, unknown>) => {
    recordHarnessEvent('rpc', { name, args: args ?? null });
    if (name === 'has_role') return Promise.resolve({ data: true, error: null });
    return Promise.resolve({ data: [], error: null });
  },
  functions: { invoke },
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
    subscribe: () => ({}),
  }),
  removeChannel: () => undefined,
  auth: {
    onAuthStateChange: (callback: (event: string, nextSession: typeof session | null) => void) => {
      queueMicrotask(() => callback('INITIAL_SESSION', session));
      return { data: { subscription: { unsubscribe: () => undefined } } };
    },
    getSession: () => Promise.resolve({ data: { session }, error: null }),
    getUser: () => Promise.resolve({ data: { user: session.user }, error: null }),
  },
};
