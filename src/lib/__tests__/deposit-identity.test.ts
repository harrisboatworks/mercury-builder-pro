import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DEPOSIT_COUNTRY,
  DEPOSIT_IDENTITY_REQUIRED_FIELDS,
  collectMissingDepositIdentityFields,
  depositRecordIsPaid,
  parseDepositIdentity,
  resolveDealAddress,
  resolveDepositMailContact,
  safeParseDepositIdentity,
} from '@/lib/deposit-identity';
import {
  parseDepositIdentity as parseSharedDepositIdentity,
} from '../../../supabase/functions/_shared/deposit-identity.ts';

const canadian = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '(905) 555-0100',
  addressLine1: '5369 Harris Boat Works Rd',
  addressLine2: '',
  city: 'Gores Landing',
  region: 'ON',
  postalCode: 'K0K 2E0',
  country: DEFAULT_DEPOSIT_COUNTRY,
};

const american = {
  name: 'Cher',
  email: 'cher@example.com',
  phone: '555-123-4567',
  addressLine1: '1600 Amphitheatre Parkway',
  city: 'Mountain View',
  region: 'CA',
  postalCode: '94043',
  country: 'United States',
};

describe('deposit identity contract', () => {
  it('keeps the browser and Edge identity contracts byte-identical', () => {
    expect(readFileSync('src/lib/deposit-identity.ts', 'utf8'))
      .toBe(readFileSync('supabase/functions/_shared/deposit-identity.ts', 'utf8'));
  });

  it('rejects every missing required identity/address field', () => {
    for (const field of DEPOSIT_IDENTITY_REQUIRED_FIELDS) {
      const input = { ...canadian, [field]: '' };
      expect(collectMissingDepositIdentityFields(input)).toContain(field);
      expect(safeParseDepositIdentity(input).success).toBe(false);
      expect(() => parseDepositIdentity(input)).toThrow();
      expect(() => parseSharedDepositIdentity(input)).toThrow();
    }
  });

  it('accepts a Canadian default address and a non-Canadian structured address', () => {
    expect(parseDepositIdentity(canadian)).toMatchObject({
      fullName: 'Ada Lovelace',
      address: { country: 'Canada', postalCode: 'K0K 2E0', city: 'Gores Landing' },
    });
    expect(parseSharedDepositIdentity(american)).toMatchObject({
      fullName: 'Cher',
      address: { country: 'United States', postalCode: '94043', region: 'CA' },
    });
  });

  it('accepts a single legal name and does not require two tokens', () => {
    expect(parseDepositIdentity({ ...canadian, name: 'Cher' }).fullName).toBe('Cher');
  });

  it('accepts Unicode letter names and rejects symbol-only names', () => {
    expect(parseDepositIdentity({ ...canadian, name: 'José García' }).fullName).toBe('José García');
    expect(parseSharedDepositIdentity({ ...canadian, name: '李明' }).fullName).toBe('李明');
    expect(() => parseDepositIdentity({ ...canadian, name: '---' })).toThrow();
    expect(() => parseSharedDepositIdentity({ ...canadian, name: '@@@' })).toThrow();
  });

  it('requires 10 to 15 phone digits after normalization', () => {
    expect(parseDepositIdentity({ ...canadian, phone: '(905) 555-0100' }).phone).toBe('(905) 555-0100');
    expect(parseSharedDepositIdentity({ ...canadian, phone: '+44 7911 123456' }).phone).toBe('+44 7911 123456');
    expect(() => parseDepositIdentity({ ...canadian, phone: '555-0100' })).toThrow();
    expect(() => parseSharedDepositIdentity({ ...canadian, phone: '1234567890123456' })).toThrow();
  });

  it('keeps the dialog and create-payment on the same required fields', () => {
    const dialog = readFileSync('src/components/quote-builder/DepositInfoDialog.tsx', 'utf8');
    const payment = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    const summary = readFileSync('src/pages/quote/QuoteSummaryPage.tsx', 'utf8');

    expect(dialog).toContain('safeParseDepositIdentity');
    expect(dialog).toContain('autoComplete="address-line1"');
    expect(dialog).toContain('autoComplete="postal-code"');
    expect(dialog).toContain('autoComplete="country-name"');
    expect(dialog).toContain('DEFAULT_DEPOSIT_COUNTRY');
    expect(dialog).toContain('aria-invalid={Boolean(errors.name)}');
    expect(dialog).toContain("aria-describedby={errors.name ? 'deposit-name-error' : undefined}");
    expect(dialog).toContain('id="deposit-name-error"');
    expect(dialog).toContain('id="deposit-email-error"');
    expect(dialog).toContain('id="deposit-phone-error"');
    expect(dialog).toContain('id="deposit-address-line1-error"');
    expect(dialog).toContain('id="deposit-address-line2-error"');
    expect(dialog).toContain('id="deposit-city-error"');
    expect(dialog).toContain('id="deposit-region-error"');
    expect(dialog).toContain('id="deposit-postal-error"');
    expect(dialog).toContain('id="deposit-country-error"');
    expect((dialog.match(/aria-invalid=\{Boolean\(errors\.\w+\)\}/g) || []).length).toBe(9);
    expect((dialog.match(/aria-describedby=\{errors\.\w+ \? '/g) || []).length).toBe(9);
    expect(payment).toContain('parseDepositIdentity(customerInfo)');
    expect(payment).toContain('addressLine1: z.string().trim().min(1).max(120)');
    expect(payment).toContain('digits.length >= 10 && digits.length <= 15');
    expect(summary).toContain('savedQuoteIdentityColumns(identity)');
    expect(summary).toContain('customerAddress: formatDepositAddress(identity.address)');
    expect(summary.indexOf('savedQuoteIdentityColumns(identity)')).toBeLessThan(summary.indexOf("'quote-document-api'"));
  });

  it('resolves historical contact from customer_quotes and never labels Stripe billing as submitted', () => {
    const historical = resolveDepositMailContact({
      savedQuote: { email: 'anonymous@soft-lead.local' },
      customerQuote: {
        customer_name: 'Ada Lovelace',
        customer_email: 'ada@example.com',
        customer_phone: '(905) 555-0100',
      },
    });
    expect(historical).toEqual({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '(905) 555-0100',
    });

    const stripeOnly = resolveDealAddress({
      savedQuote: {},
      customerQuote: {
        stripe_billing_address: {
          source: 'stripe_checkout_billing',
          line1: '1 Market St',
          city: 'San Francisco',
          region: 'CA',
          postal_code: '94105',
          country: 'US',
        },
      },
    });
    expect(stripeOnly.source).toBe('stripe_billing');
    expect(stripeOnly.isSubmittedContactAddress).toBe(false);
    expect(stripeOnly.label).toContain('not the submitted contact address');
    expect(depositRecordIsPaid({
      savedQuoteDepositStatus: 'pending',
      customerQuotePaymentStatus: null,
      quoteDataPaymentStatus: 'paid',
    })).toBe(false);
    expect(depositRecordIsPaid({
      savedQuoteDepositStatus: 'pending',
      customerQuotePaymentStatus: 'paid',
      quoteDataPaymentStatus: 'paid',
    })).toBe(true);
  });
});
