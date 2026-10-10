import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { completeFinancingFixture } from '@/test/financing-application.fixtures';
import { completeApplicationSchema } from '@/lib/financingValidation';

const mocks = vi.hoisted(() => ({ state: {} as any, dispatch: vi.fn(), clear: vi.fn(), submit: vi.fn(), encrypt: vi.fn(), log: vi.fn(), toast: vi.fn(), navigate: vi.fn(), invoke: vi.fn() }));
vi.mock('@/contexts/FinancingContext', () => ({ useFinancing: () => ({ state: mocks.state, dispatch: mocks.dispatch, clearStoredData: mocks.clear }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/hooks/useActivePromotions', () => ({ useActivePromotions: () => ({ getChooseOneOptions: () => [] }) }));
vi.mock('@/lib/financingApplicationApi', () => ({ submitFinancingApplication: mocks.submit }));
vi.mock('@/lib/sinEncryption', async (original) => ({ ...await original<any>(), encryptSIN: mocks.encrypt }));
vi.mock('@/lib/financingSubmissionLog', () => ({ logFinancingSubmission: mocks.log }));
vi.mock('@/lib/analytics', () => ({ trackClaritySubmission: vi.fn() }));
vi.mock('./SuccessConfetti', () => ({ SuccessConfetti: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, functions: { invoke: mocks.invoke } } }));
import { ReviewSubmitStep } from './ReviewSubmitStep';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state = { ...completeFinancingFixture(), hasCoApplicant: false, quoteId: null, applicationId: null, resumeToken: null };
  mocks.encrypt.mockResolvedValue('synthetic-encrypted-value');
  mocks.submit.mockResolvedValue({ applicationId: '11111111-1111-4111-8111-111111111111' });
  mocks.invoke.mockResolvedValue({ data: { emailSent: true }, error: null });
});
afterEach(cleanup);
const consentAndSubmit = async () => {
  render(<ReviewSubmitStep />);
  fireEvent.change(screen.getByLabelText(/Full Name \(as signature\)/), { target: { value: 'Test Applicant' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /Credit Check Authorization/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Accuracy Confirmation/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Terms & Privacy Policy/ }));
  const button = screen.getByRole('button', { name: /Submit Application/ });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
};

describe('financing final submission', () => {
  it('accepts a complete application without a co-applicant', () => {
    expect(completeApplicationSchema.safeParse(completeFinancingFixture()).success).toBe(true);
  });
  it('submits through the secure API with a signature date and no co-applicant', async () => {
    await consentAndSubmit();
    await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
    expect(mocks.submit.mock.calls[0][0]).toMatchObject({ application: { coApplicant: null, hasCoApplicant: false, consent: { signatureDate: expect.any(Date) }, purchaseDetails: { amountToFinance: 17252.23 } }, applicantSinEncrypted: 'synthetic-encrypted-value' });
    expect(mocks.clear).toHaveBeenCalledTimes(1);
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Application Submitted!' }));
  });
  it('keeps the application available when the secure API rejects the submission', async () => {
    mocks.submit.mockRejectedValue(new Error('Synthetic service failure'));
    await consentAndSubmit();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Could not save application' })));
    expect(mocks.clear).not.toHaveBeenCalled();
  });
  it('does not submit or clear the form if SIN encryption fails', async () => {
    mocks.encrypt.mockRejectedValue(new Error('Synthetic encryption failure'));
    await consentAndSubmit();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalled());
    expect(mocks.submit).not.toHaveBeenCalled();
    expect(mocks.clear).not.toHaveBeenCalled();
  });
  it('submits and encrypts both applicants when a co-applicant is included', async () => {
    mocks.state.hasCoApplicant = true;
    mocks.state.coApplicant = { ...mocks.state.applicant, firstName: 'Second', lastName: 'Applicant', sin: '000000001', annualIncome: 60000 };
    await consentAndSubmit();
    await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
    expect(mocks.encrypt).toHaveBeenCalledTimes(2);
    expect(mocks.submit.mock.calls[0][0]).toMatchObject({ coApplicantSinEncrypted: 'synthetic-encrypted-value', application: { hasCoApplicant: true, coApplicant: { firstName: 'Second' } } });
  });

});
