import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({dispatch:vi.fn(),employment:null as any}));
const dispatch = mocks.dispatch;
vi.mock('@/contexts/FinancingContext', () => ({ useFinancing: () => ({ state: { employment: mocks.employment }, dispatch: mocks.dispatch }) }));
import { EmploymentStep } from './EmploymentStep';
beforeEach(() => { mocks.employment=null;dispatch.mockClear(); });
afterEach(cleanup);
it('can continue after selecting retired without entering hidden employer fields', async () => {
  render(<EmploymentStep />);
  fireEvent.click(screen.getByRole('radio', {name:'Retired'}));
  fireEvent.change(screen.getByLabelText(/Gross Annual Income/), {target:{value:'60000'}});
  const button = screen.getByRole('button',{name:/Continue/i});
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await waitFor(() => expect(dispatch).toHaveBeenCalledWith({type:'SET_CURRENT_STEP',payload:4}));
});

it('preserves retired status and income when a saved application resumes', async () => {
  mocks.employment = {status:'retired',annualIncome:60000};
  render(<EmploymentStep />);
  expect(screen.getByRole('radio',{name:'Retired'})).toBeChecked();
  await waitFor(() => expect(screen.getByRole('button',{name:/Continue/i})).toBeEnabled());
});
