import React from 'react';
import {render,screen,fireEvent,act,cleanup} from '@testing-library/react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {TradeInValuation} from '@/components/quote-builder/TradeInValuation';
import {fetchHBWValuation} from '@/lib/trade-valuation';
vi.mock('@/lib/trade-valuation',async original=>({...await original<any>(),fetchHBWValuation:vi.fn()}));
vi.mock('@/hooks/useHapticFeedback',()=>({useHapticFeedback:()=>({triggerHaptic:vi.fn()})}));
const info={hasTradeIn:true,brand:'Mercury',year:2020,horsepower:9.9,model:'9.9 FourStroke',serialNumber:'',condition:'good' as const,engineType:'4-stroke' as const,estimatedValue:0,confidenceLevel:'medium' as const};
const success={ok:true as const,value:{low:4250,high:5750,average:5000,confidence:'high' as const,source:'fixture',factors:[],listingValue:6500,hstSavings:650,fromHBW:true}};
afterEach(()=>{cleanup();vi.resetAllMocks()});
describe('customer trade behavior',()=>{
 it.each(['unavailable','rate_limited','input_rejected'] as const)('continues without fabricated money after %s',async reason=>{
  vi.mocked(fetchHBWValuation).mockResolvedValue({ok:false,reason});const changed=vi.fn(),advance=vi.fn();render(<TradeInValuation tradeInInfo={info} onTradeInChange={changed} onAutoAdvance={advance}/>);
  await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Get My Estimate'})));
  expect(changed.mock.calls.some(([v])=>v.estimatedValue>0)).toBe(false);fireEvent.click(screen.getByTestId('trade-in-continue'));expect(advance).toHaveBeenCalledOnce();
 });
 it('ignores response after trade is disabled',async()=>{
  let resolve!:Function;vi.mocked(fetchHBWValuation).mockImplementation(()=>new Promise(r=>resolve=r));const changed=vi.fn();const view=render(<TradeInValuation tradeInInfo={info} onTradeInChange={changed}/>);fireEvent.click(screen.getByRole('button',{name:'Get My Estimate'}));view.rerender(<TradeInValuation tradeInInfo={{...info,hasTradeIn:false}} onTradeInChange={changed}/>);await act(async()=>resolve(success));expect(changed).not.toHaveBeenCalled();
 });
 it('restores explicitly confirmed architecture with an ambiguous model',async()=>{
  vi.mocked(fetchHBWValuation).mockResolvedValue(success);const changed=vi.fn();render(<TradeInValuation standalone tradeInInfo={{...info,model:'9.9 ELPT',engineHours:0}} onTradeInChange={changed}/>);await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Get My Estimate'})));expect(fetchHBWValuation).toHaveBeenCalledWith(expect.objectContaining({horsepower:9.9,stroke:'4-stroke',hours:0}));expect(changed).toHaveBeenCalledWith(expect.objectContaining({estimatedValue:5000}));
 });
 it('keeps zero distinct from blank in the editable hours field',()=>{
  const changed=vi.fn();render(<TradeInValuation standalone tradeInInfo={{...info,engineHours:0}} onTradeInChange={changed}/>);fireEvent.click(screen.getByRole('button',{name:/More details/i}));const input=screen.getByLabelText('Engine Hours');expect(input).toHaveValue(0);fireEvent.change(input,{target:{value:''}});expect(changed).toHaveBeenCalledWith(expect.objectContaining({engineHours:undefined,estimatedValue:0}));
 });
});
