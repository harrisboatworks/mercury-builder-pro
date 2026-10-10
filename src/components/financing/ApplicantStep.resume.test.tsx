import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { completeFinancingFixture } from '@/test/financing-application.fixtures';
vi.mock('@/contexts/FinancingContext', () => ({ useFinancing: () => ({ state: {applicant: {...completeFinancingFixture().applicant, sin: undefined}},dispatch:vi.fn() }) }));
import { ApplicantStep } from './ApplicantStep';
afterEach(cleanup);
it('shows saved address and housing selections when resuming', () => {
  render(<ApplicantStep />);
  expect(screen.getByRole('combobox',{name:/Province/})).toHaveTextContent('Ontario');
  expect(screen.getByRole('combobox',{name:/Time at Address/})).toHaveTextContent('5+ years');
  expect(screen.getByRole('radio',{name:'Own'})).toBeChecked();
});

it('continues after re-entering the SIN on a restored server draft', async () => {
  render(<ApplicantStep />);
  fireEvent.change(screen.getByLabelText('Social Insurance Number (SIN) *'),{target:{value:'000000000'}});
  await waitFor(() => expect(screen.getByRole('button',{name:/Continue/i})).toBeEnabled());
});
