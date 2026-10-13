import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ScheduleConsultation } from './ScheduleConsultation';
const { invoke }=vi.hoisted(()=>({invoke:vi.fn()}));
vi.mock('@/components/auth/AuthProvider',()=>({useAuth:()=>({user:null})}));
vi.mock('@/contexts/QuoteContext',()=>({useQuote:()=>({dispatch:vi.fn()})}));
vi.mock('@/hooks/use-toast',()=>({useToast:()=>({toast:vi.fn()})}));
vi.mock('@/lib/turnstile-client',()=>({getTurnstileSiteKey:()=>'',loadTurnstileScript:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{functions:{invoke}}}));
const quote:any={motor:{model:'9.9 MH FourStroke',hp:9.9,price:2999},financing:{downPayment:0,rate:0,term:60},purchasePath:'loose',pdfSnapshot:{version:1,createdAt:'2026-10-13T12:00:00Z',validUntil:'2026-10-31T03:59:59.999Z',motor:{model:'9.9 MH FourStroke',hp:9.9,msrp:3860},pricing:{msrp:3860,discount:861,promoValue:300,motorSubtotal:2699,subtotal:2699,hst:350.87,totalCashPrice:3049.87,savings:1161},accessoryBreakdown:[],includedCoverageYears:5,purchasePath:'loose',promotion:{endDate:'2026-10-30'}}};
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-31T03:59:59Z'));invoke.mockReset();invoke.mockResolvedValue({error:new Error('synthetic stop after request')});});
afterEach(()=>{cleanup();vi.useRealTimers();});
function form(data=quote){render(<MemoryRouter><ScheduleConsultation quoteData={data} onBack={vi.fn()}/></MemoryRouter>);fireEvent.change(screen.getByLabelText(/Full Name/),{target:{value:'Synthetic Boater'}});fireEvent.change(screen.getByLabelText(/Email Address/),{target:{value:'synthetic@example.com'}});fireEvent.change(screen.getByLabelText(/Phone Number/),{target:{value:'9055550100'}});}
describe('consultation action-time expiry',()=>{
 it('uses authoritative snapshot loan and down-payment terms when mutable state differs',async()=>{
  const recorded={...quote,pdfSnapshot:{...quote.pdfSnapshot,paymentMethod:'standard_financing',financing:{rate:0,amortizationMonths:60,contractTermMonths:60,dealerFee:0,downPayment:500,amountFinanced:2549.87,monthlyPayment:42}}};
  form(recorded);fireEvent.click(screen.getByRole('button',{name:'Send My Quote for Review'}));
  await waitFor(()=>expect(invoke).toHaveBeenCalledWith('submit-quote-lead',expect.objectContaining({body:expect.objectContaining({deposit_amount:500,loan_amount:2549.87,monthly_payment:42,term_months:60,total_cost:3020,quote_snapshot:recorded.pdfSnapshot})})));
 });
 it('blocks a form opened before expiry when submitted after midnight',()=>{form();vi.setSystemTime(new Date('2026-10-31T04:00:00Z'));fireEvent.click(screen.getByRole('button',{name:'Send My Quote for Review'}));expect(invoke).not.toHaveBeenCalled();expect(screen.getByRole('heading',{name:'Quote pricing has expired'})).toBeTruthy();});
 it('blocks PDF on an already-open form after expiry',()=>{form();vi.setSystemTime(new Date('2026-10-31T04:00:00Z'));fireEvent.click(screen.getByRole('button',{name:'Download PDF'}));expect(invoke).not.toHaveBeenCalled();expect(screen.getByRole('heading',{name:'Quote pricing has expired'})).toBeTruthy();});
 it('allows the valid pre-deadline snapshot to reach the existing submission boundary',async()=>{form();fireEvent.click(screen.getByRole('button',{name:'Send My Quote for Review'}));await waitFor(()=>expect(invoke).toHaveBeenCalledWith('submit-quote-lead',expect.objectContaining({body:expect.objectContaining({quote_snapshot:quote.pdfSnapshot})})));});
});
