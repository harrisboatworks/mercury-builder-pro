import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPublicApplication } from '../../supabase/functions/financing-application-api/public-application';

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  if (value === null || typeof value !== 'object') return keys;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key);
    collectKeys(nested, keys);
  }
  return keys;
}

const SENTINEL_SIN = 'SENTINEL_SIN_046454286';
const SENTINEL_SIN_LAST4 = 'SENTINEL_SIN_LAST4';
const SENTINEL_BUREAU = 'SENTINEL_BUREAU_RESPONSE';
const SENTINEL_NOTES = 'SENTINEL_INTERNAL_NOTES';

const address = {
  street: '12 Harbour Rd',
  city: 'Cobourg',
  province: 'Ontario',
  postalCode: 'K9A1A1',
  timeAtAddress: '2-3',
  streetAddress: SENTINEL_NOTES,
  bureauResponse: SENTINEL_BUREAU,
};

const populatedApplication = {
  id: '11111111-1111-4111-8111-111111111111',
  resume_token: '22222222-2222-4222-8222-222222222222',
  current_step: 4,
  completed_steps: [1, 2, 3, 'bad'],
  quote_id: '33333333-3333-4333-8333-333333333333',
  status: 'draft',
  resume_expires_at: '2099-01-01T00:00:00.000Z',
  user_id: '44444444-4444-4444-8444-444444444444',
  applicant_sin_encrypted: SENTINEL_SIN,
  consent_data: { signature: SENTINEL_NOTES },
  notes_history: [{ note: SENTINEL_NOTES }],
  bureauResponse: SENTINEL_BUREAU,
  internalNotes: SENTINEL_NOTES,
  sinLast4: SENTINEL_SIN_LAST4,
  purchase_data: {
    motorModel: '150 Pro XS',
    motorPrice: 27120,
    downPayment: 2000,
    tradeInValue: 1500,
    amountToFinance: 23620,
    priceBasis: 'all_in_after_trade',
    includedTradeInValue: 1500,
    preTradeSubtotal: 25000,
    preferredTerm: '60',
    promoOption: 'special_financing',
    promoRate: 4.99,
    promoTerm: 60,
    promoValue: '4.99%',
    promoName: 'Spring financing',
    promoSavings: 500,
    promoCombinationMode: 'choose_one',
    dealerCost: 17000,
    internalNotes: SENTINEL_NOTES,
    bureauResponse: SENTINEL_BUREAU,
  },
  applicant_data: {
    firstName: 'Alex',
    middleName: 'J',
    lastName: 'Rivera',
    suffix: 'Jr.',
    dateOfBirth: '1980-01-15',
    email: 'alex@example.test',
    primaryPhone: '9055550100',
    alternatePhone: '9055550101',
    housingStatus: 'own',
    monthlyHousingPayment: 1800,
    currentAddress: address,
    previousAddress: { ...address, street: '9 Lake St' },
    sin: SENTINEL_SIN,
    sinLast4: SENTINEL_SIN_LAST4,
    bureauResponse: SENTINEL_BUREAU,
    internalNotes: SENTINEL_NOTES,
    streetAddress: 'should-not-emit',
  },
  employment_data: {
    status: 'employed',
    employerName: 'Harbour Works',
    employerPhone: '9055550193',
    jobTitle: 'Technician',
    timeAtJob: '3-5',
    annualIncome: 72000,
    previousEmployer: {
      name: 'Prior Marina',
      timeAtJob: '1-2',
      internalNotes: SENTINEL_NOTES,
    },
    additionalIncome: [
      { source: 'rental', monthlyAmount: 400, bureauResponse: SENTINEL_BUREAU },
    ],
    sin: SENTINEL_SIN,
    bureauResponse: SENTINEL_BUREAU,
    internalNotes: SENTINEL_NOTES,
  },
  financial_data: {
    creditScoreEstimate: 'good',
    monthlyHousingPayment: 1800,
    monthlyCarPayment: 350,
    monthlyCreditCardPayments: 120,
    otherMonthlyDebt: 80,
    bankName: 'TD Canada Trust',
    accountType: 'chequing',
    timeWithBank: '5+',
    hasBankruptcy: true,
    bankruptcyDetails: {
      date: '2018-06-01',
      status: 'discharged',
      bureauResponse: SENTINEL_BUREAU,
    },
    sinLast4: SENTINEL_SIN_LAST4,
    bureauResponse: SENTINEL_BUREAU,
    internalNotes: SENTINEL_NOTES,
  },
  co_applicant_data: {
    firstName: 'Sam',
    middleName: 'K',
    lastName: 'Rivera',
    suffix: '',
    dateOfBirth: '1982-03-20',
    email: 'sam@example.test',
    primaryPhone: '9055550102',
    alternatePhone: '9055550103',
    housingStatus: 'own',
    monthlyHousingPayment: 1800,
    currentAddress: address,
    previousAddress: { ...address, street: '4 Mill St' },
    status: 'employed',
    employerName: 'Lake Credit',
    employerPhone: '9055550188',
    jobTitle: 'Analyst',
    timeAtJob: '5+',
    annualIncome: 64000,
    previousEmployer: { name: 'Prior Bank', timeAtJob: '2-3' },
    additionalIncome: [{ source: 'investment', monthlyAmount: 200 }],
    creditScoreEstimate: 'excellent',
    monthlyCarPayment: 0,
    monthlyCreditCardPayments: 50,
    otherMonthlyDebt: 0,
    bankName: 'RBC Royal Bank',
    accountType: 'savings',
    timeWithBank: '3-5',
    hasBankruptcy: false,
    bankruptcyDetails: { date: '2015-01-01', status: 'discharged' },
    sin: SENTINEL_SIN,
    sinLast4: SENTINEL_SIN_LAST4,
    bureauResponse: SENTINEL_BUREAU,
    internalNotes: SENTINEL_NOTES,
    relationship: 'spouse',
  },
  references_data: {
    reference1: {
      fullName: 'Jordan Lee',
      relationship: 'Friend',
      phone: '9055550110',
      howLongKnown: '5-10',
      sin: SENTINEL_SIN,
      internalNotes: SENTINEL_NOTES,
    },
    reference2: {
      fullName: 'Casey Ng',
      relationship: 'Colleague',
      phone: '9055550111',
      howLongKnown: '3-5',
      bureauResponse: SENTINEL_BUREAU,
    },
    internalNotes: SENTINEL_NOTES,
  },
};

const PUBLIC_APPLICATION_KEYS = [
  'accountType',
  'additionalIncome',
  'alternatePhone',
  'amountToFinance',
  'annualIncome',
  'applicant_data',
  'bankName',
  'bankruptcyDetails',
  'city',
  'co_applicant_data',
  'completed_steps',
  'creditScoreEstimate',
  'currentAddress',
  'current_step',
  'date',
  'dateOfBirth',
  'downPayment',
  'email',
  'employerName',
  'employerPhone',
  'employment_data',
  'financial_data',
  'firstName',
  'fullName',
  'hasBankruptcy',
  'housingStatus',
  'howLongKnown',
  'id',
  'includedTradeInValue',
  'jobTitle',
  'lastName',
  'middleName',
  'monthlyAmount',
  'monthlyCarPayment',
  'monthlyCreditCardPayments',
  'monthlyHousingPayment',
  'motorModel',
  'motorPrice',
  'name',
  'otherMonthlyDebt',
  'phone',
  'postalCode',
  'preferredTerm',
  'preTradeSubtotal',
  'previousAddress',
  'previousEmployer',
  'priceBasis',
  'primaryPhone',
  'promoCombinationMode',
  'promoName',
  'promoOption',
  'promoRate',
  'promoSavings',
  'promoTerm',
  'promoValue',
  'province',
  'purchase_data',
  'quote_id',
  'reference1',
  'reference2',
  'references_data',
  'relationship',
  'resume_token',
  'source',
  'status',
  'street',
  'suffix',
  'timeAtAddress',
  'timeAtJob',
  'timeWithBank',
  'tradeInValue',
] as const;

describe('public financing application DTO', () => {
  it('fails closed on SIN, invented future keys, and non-form columns', () => {
    const result = buildPublicApplication(populatedApplication);
    const publicKeys = [...collectKeys(result)];
    const serialized = JSON.stringify(result);

    for (const forbidden of [
      'sin', 'sinLast4', 'bureauResponse', 'internalNotes', 'streetAddress',
      'dealerCost', 'user_id', 'applicant_sin_encrypted', 'consent_data',
      'notes_history', 'resume_expires_at',
    ]) {
      expect(publicKeys).not.toContain(forbidden);
    }
    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('resume_expires_at');

    for (const privateValue of [
      SENTINEL_SIN, SENTINEL_SIN_LAST4, SENTINEL_BUREAU, SENTINEL_NOTES,
      'should-not-emit',
    ]) {
      expect(serialized).not.toContain(privateValue);
    }

    expect(result).toMatchObject({
      id: populatedApplication.id,
      resume_token: populatedApplication.resume_token,
      current_step: 4,
      completed_steps: [1, 2, 3],
      quote_id: populatedApplication.quote_id,
      purchase_data: {
        motorModel: '150 Pro XS',
        motorPrice: 27120,
        preferredTerm: '60',
      },
      applicant_data: {
        firstName: 'Alex',
        email: 'alex@example.test',
        currentAddress: {
          street: '12 Harbour Rd',
          city: 'Cobourg',
          province: 'Ontario',
        },
      },
      employment_data: {
        employerName: 'Harbour Works',
        annualIncome: 72000,
        additionalIncome: [{ source: 'rental', monthlyAmount: 400 }],
      },
      financial_data: {
        bankName: 'TD Canada Trust',
        hasBankruptcy: true,
        bankruptcyDetails: { date: '2018-06-01', status: 'discharged' },
      },
      co_applicant_data: {
        firstName: 'Sam',
        employerName: 'Lake Credit',
        bankName: 'RBC Royal Bank',
      },
      references_data: {
        reference1: { fullName: 'Jordan Lee', relationship: 'Friend' },
        reference2: { fullName: 'Casey Ng', phone: '9055550111' },
      },
    });
  });

  it('pins the exact emitted key set so new fields require a human edit', () => {
    const result = buildPublicApplication(populatedApplication);
    expect([...collectKeys(result)].sort()).toEqual([...PUBLIC_APPLICATION_KEYS].sort());
  });

  it('returns null nested objects and drops unknown top-level columns', () => {
    expect(buildPublicApplication({
      id: 'application-id',
      resume_token: 'resume-token',
      current_step: 1,
      completed_steps: [1],
      quote_id: null,
      status: 'draft',
      resume_expires_at: '2099-01-01T00:00:00.000Z',
      purchase_data: null,
      applicant_data: null,
      employment_data: null,
      financial_data: null,
      co_applicant_data: null,
      references_data: null,
    })).toEqual({
      id: 'application-id',
      resume_token: 'resume-token',
      current_step: 1,
      completed_steps: [1],
      quote_id: null,
      purchase_data: null,
      applicant_data: null,
      employment_data: null,
      financial_data: null,
      co_applicant_data: null,
      references_data: null,
    });
  });
});

describe('financing application load boundary source contract', () => {
  it('emits only the fail-closed public application DTO', () => {
    const edgeSource = readFileSync(
      resolve(process.cwd(), 'supabase/functions/financing-application-api/index.ts'),
      'utf8',
    );
    const contextSource = readFileSync(
      resolve(process.cwd(), 'src/contexts/FinancingContext.tsx'),
      'utf8',
    );
    const reviewSource = readFileSync(
      resolve(process.cwd(), 'src/components/financing/ReviewSubmitStep.tsx'),
      'utf8',
    );

    expect(edgeSource).toContain('buildPublicApplication');
    expect(edgeSource).toContain('application: buildPublicApplication(data)');
    expect(edgeSource).not.toContain('...data');
    expect(contextSource).toContain('applicationId: action.payload.id');
    expect(contextSource).toContain('resumeToken: action.payload.resume_token');
    expect(reviewSource).toContain('applicationId: state.applicationId');
    expect(reviewSource).toContain('application.id');
  });
});
