import { exactSubmittedConsultationQuote } from '@/test/consultation-submitted-quote.fixtures';

/** Synthetic ids. These rows are not customer records. */
export const SUBMITTED_ID = '11111111-1111-4111-8111-111111111111';
export const DEPOSIT_SAVED_ID = '22222222-2222-4222-8222-222222222222';
export const DEPOSIT_CUSTOMER_QUOTE_ID = '33333333-3333-4333-8333-333333333333';

export const PRIVATE_DOCUMENT_URL = 'https://documents.example.test/consultation/synthetic-share';
export const PRIVATE_DOWNLOAD_URL = 'https://documents.example.test/consultation/synthetic-download';
export const RESERVATION_DOWNLOAD_URL = 'https://documents.example.test/reservation/synthetic.pdf';

export function submittedCustomerQuote() {
  const receipt = exactSubmittedConsultationQuote();
  return {
    id: SUBMITTED_ID,
    created_at: '2026-08-01T15:00:00.000Z',
    customer_name: receipt.customer.name,
    customer_email: receipt.customer.email,
    customer_phone: receipt.customer.phone,
    base_price: receipt.pricing.msrp,
    final_price: receipt.pricing.totalPrice,
    deposit_amount: 0,
    loan_amount: 0,
    monthly_payment: 0,
    term_months: 0,
    total_cost: receipt.pricing.totalPrice,
    admin_discount: 0,
    admin_notes: '',
    customer_notes: receipt.customerNotes,
    quote_data: receipt,
    lead_status: 'saved',
    lead_source: 'website',
    payment_status: null,
    follow_up_date: null,
  };
}

export function depositSavedQuote() {
  return {
    id: DEPOSIT_SAVED_ID,
    created_at: '2026-08-02T15:00:00.000Z',
    email: 'synthetic-deposit@example.com',
    customer_full_name: 'Synthetic Deposit',
    customer_phone: '+19055550000',
    is_soft_lead: false,
    deposit_amount: 500,
    deposit_status: 'paid',
    deposit_paid_at: '2026-08-02T16:00:00.000Z',
    reference_number: 'HBW-900500',
    quote_pdf_path: `saved-quotes/${DEPOSIT_SAVED_ID}/quote.pdf`,
    quote_pdf_sha256: 'synthetic-sha256-not-a-document',
    quote_state: {
      source: 'saved',
      motor: { model: 'Mercury 90 FourStroke', hp: 90, price: 12000 },
      basePrice: 12000,
      finalPrice: 12000,
      customerNotes: '',
    },
  };
}

export function depositCustomerQuote() {
  return {
    id: DEPOSIT_CUSTOMER_QUOTE_ID,
    saved_quote_id: DEPOSIT_SAVED_ID,
    created_at: '2026-08-02T15:00:00.000Z',
    customer_name: 'Synthetic Deposit',
    customer_email: 'synthetic-deposit@example.com',
    customer_phone: '+19055550000',
    base_price: 12000,
    final_price: 12000,
    deposit_amount: 500,
    loan_amount: 0,
    monthly_payment: 0,
    term_months: 0,
    total_cost: 12000,
    admin_discount: 0,
    lead_source: 'deposit',
    payment_status: 'paid',
    payment_paid_at: '2026-08-02T16:00:00.000Z',
    follow_up_date: null,
    quote_data: {
      source: 'saved',
      motor: { model: 'Mercury 90 FourStroke', hp: 90 },
    },
  };
}
