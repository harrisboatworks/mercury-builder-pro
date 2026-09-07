import React from 'react';
import {render,screen,fireEvent,act,cleanup} from '@testing-library/react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {TradeInValuation} from '@/components/quote-builder/TradeInValuation';
import {fetchHBWValuation} from '@/lib/trade-valuation';
vi.mock('@/lib/trade-valuation',async importOriginal=>({...await importOriginal<any>(),fetchHBWValuation:vi.fn()}));
vi.mock('@/hooks/useHapticFeedback',()=>({useHapticFeedback:()=>({triggerHaptic:vi.fn()})}));
const info={hasTradeIn:true,brand:'Mercury',year:2020,horsepower:90,model:'90 FourStroke',serialNumber:'',condition:'good' as const,engineType:'4-stroke' as const,estimatedValue:0,confidenceLevel:'medium' as const};
const result={ok:true as const,value:{low:4250,high:5750,average:5000,confidence:'high' as const,source:'fixture',factors:[],listingValue:6500,hstSavings:650,fromHBW:true}};
afterEach(()=>{cleanup();vi.clearAllMocks()});
describe('actual trade-in form request lifecycle',()=>{
 it('ignores a response for motor inputs edited while it was pending',async()=>{let resolve!:Function;vi.mocked(fetchHBWValuation).mockImplementation(()=>new Promise(r=>resolve=r));const changed=vi.fn();const view=render(<TradeInValuation standalone tradeInInfo={info} onTradeInChange={changed}/>);fireEvent.click(screen.getByRole('button',{name:'Get My Estimate'}));expect(fetchHBWValuation).toHaveBeenCalledOnce();view.rerender(<TradeInValuation standalone tradeInInfo={{...info,horsepower:115,model:'115 FourStroke'}} onTradeInChange={changed}/>);await act(async()=>resolve(result));expect(changed).not.toHaveBeenCalled();expect(screen.queryByText('Your estimated trade value')).not.toBeInTheDocument()});
 it('does not promote a response after unmount',async()=>{let resolve!:Function;vi.mocked(fetchHBWValuation).mockImplementation(()=>new Promise(r=>resolve=r));const changed=vi.fn();const view=render(<TradeInValuation standalone tradeInInfo={info} onTradeInChange={changed}/>);fireEvent.click(screen.getByRole('button',{name:'Get My Estimate'}));view.unmount();await act(async()=>resolve(result));expect(changed).not.toHaveBeenCalled()});
});

it('shows the amount retained by a fresh saved draft without making an API request',()=>{render(<TradeInValuation standalone tradeInInfo={{...info,estimatedValue:5000,valuedAt:Date.now()}} onTradeInChange={vi.fn()}/>);expect(screen.getByRole('status')).toHaveTextContent('Saved trade-in estimate: $5,000');expect(fetchHBWValuation).not.toHaveBeenCalled()});
it.each([Date.now()-31*60*1000,Date.now()+60*1000])('does not present stale or future saved amounts as usable',valuedAt=>{render(<TradeInValuation standalone tradeInInfo={{...info,estimatedValue:5000,valuedAt}} onTradeInChange={vi.fn()}/>);expect(screen.queryByText(/Saved trade-in estimate/)).not.toBeInTheDocument()});
