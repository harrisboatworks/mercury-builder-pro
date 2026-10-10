import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const dispatch = vi.hoisted(() => vi.fn());
vi.mock('@/contexts/FinancingContext', () => ({ useFinancing: () => ({ state: { applicant: { monthlyHousingPayment: 1000 }, employment: { annualIncome:60000 }, financial: { bankName:'Test Bank',accountType:'chequing',timeWithBank:'5+' } },dispatch }) }));
import { FinancialStep } from './FinancialStep';
afterEach(cleanup);
it('accepts blank optional debt payments and the displayed No bankruptcy default', async () => {
  render(<FinancialStep />);
  fireEvent.click(screen.getByRole('radio',{name:/Good 700/}));
  const button = screen.getByRole('button',{name:/Continue to References/i});
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await waitFor(() => expect(dispatch).toHaveBeenCalledWith({type:'SET_CURRENT_STEP',payload:5}));
  expect(dispatch).toHaveBeenCalledWith({type:'SET_FINANCIAL',payload:expect.objectContaining({hasBankruptcy:false,monthlyCarPayment:undefined})});
});
