import { zodResolver } from '@hookform/resolvers/zod';
import { describe, expect, it } from 'vitest';
import {
  applicantSchema,
  employmentSchema,
  financialSchema,
  referencesSchema,
} from './financingValidation';

const resolverOptions = {
  criteriaMode: 'all' as const,
  fields: {},
  shouldUseNativeValidation: false,
};

describe('@hookform/resolvers financing compatibility', () => {
  it('returns the transformed applicant values used by the financing workflow', async () => {
    const resolveApplicant = zodResolver(applicantSchema);

    const result = await resolveApplicant(
      {
        firstName: 'Jamie',
        lastName: 'Harris',
        dateOfBirth: new Date('1985-06-15T12:00:00Z'),
        sin: '123-456-789',
        email: 'jamie@example.com',
        primaryPhone: '9053422153',
        currentAddress: {
          street: '5369 Harris Boat Works Road',
          city: 'Gores Landing',
          province: 'Ontario',
          postalCode: 'K0K 2E0',
          timeAtAddress: '5+',
        },
        housingStatus: 'own',
        monthlyHousingPayment: 0,
      },
      undefined,
      resolverOptions,
    );

    expect(result.errors).toEqual({});
    expect(result.values).toMatchObject({
      sin: '123456789',
      primaryPhone: '(905) 342-2153',
      currentAddress: { postalCode: 'K0K2E0' },
    });
  });

  it('keeps a refinement error on the nested reference phone field', async () => {
    const resolveReferences = zodResolver(referencesSchema);

    const result = await resolveReferences(
      {
        reference1: {
          fullName: 'Alex Example',
          relationship: 'Friend',
          phone: '9055550100',
          howLongKnown: '5-10',
        },
        reference2: {
          fullName: 'Taylor Example',
          relationship: 'Coworker',
          phone: '9055550100',
          howLongKnown: '3-5',
        },
      },
      undefined,
      resolverOptions,
    );

    expect(result.values).toEqual({});
    expect(result.errors.reference2?.phone?.message).toBe(
      'References must be different people',
    );
  });

  it('keeps path-less object refinements in form errors so invalid steps stay blocked', async () => {
    const employmentResult = await zodResolver(employmentSchema)(
      { status: 'employed', annualIncome: 50_000 },
      undefined,
      resolverOptions,
    );
    const financialResult = await zodResolver(financialSchema)(
      {
        creditScoreEstimate: 'good',
        monthlyHousingPayment: 0,
        bankName: 'Example Bank',
        accountType: 'chequing',
        timeWithBank: '5+',
        hasBankruptcy: true,
      },
      undefined,
      resolverOptions,
    );

    expect(JSON.stringify(employmentResult.errors)).toContain(
      'Employer details are required for employed/self-employed applicants',
    );
    expect(JSON.stringify(financialResult.errors)).toContain(
      'Bankruptcy details are required if bankruptcy is declared',
    );
  });
});
