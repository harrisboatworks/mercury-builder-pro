import { beforeEach, describe, expect, it, vi } from 'vitest';
const invoke = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke } } }));
import { submitFinancingApplication } from './financingApplicationApi';
const params = { submissionId: '11111111-1111-4111-8111-111111111111', applicantSinEncrypted: 'synthetic-encryption', application: { purchaseDetails: null, applicant: { sin: '000000000' }, employment: null, financial: null, coApplicant: null, hasCoApplicant: false, references: null, quoteId: null, consent: {} } };
beforeEach(() => vi.clearAllMocks());
describe('financing submission acknowledgement', () => {
  it.each([{}, [], { applicationId: 'undefined' }, null])('rejects incomplete service acknowledgement %j', async (data) => {
    invoke.mockResolvedValue({ data, error: null });
    await expect(submitFinancingApplication(params)).rejects.toThrow();
  });
  it('requires a saved application ID and removes plaintext SIN from the request', async () => {
    const result = { applicationId: '22222222-2222-4222-8222-222222222222' };
    invoke.mockResolvedValue({ data: result, error: null });
    await expect(submitFinancingApplication(params)).resolves.toEqual(result);
    expect(invoke.mock.calls[0][1].body.application.applicant).not.toHaveProperty('sin');
  });
});
