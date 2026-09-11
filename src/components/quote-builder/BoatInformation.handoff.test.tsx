import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BoatInformation } from './BoatInformation';
import type { BoatInfo, Motor } from '../QuoteBuilder';

const draft: BoatInfo = {type:'',make:'Lund',model:'Pro-V',length:'',currentMotorBrand:'Mercury',currentMotorYear:2010,currentHp:75,serialNumber:'',controlType:'',shaftLength:''};
describe('agent handoff into the actual boat form',()=>{
 it('shows prefilled values and preserves buyer edits across rerenders',()=>{
  const props={onStepComplete:vi.fn(),onBack:vi.fn(),selectedMotor:{id:'fixture',model:'90 ELPT FourStroke',hp:90,price:14000,year:2026,image:'',stockStatus:'In Stock',category:'high-performance',type:'FourStroke',specs:'90 HP'} as Motor,includeTradeIn:false};
  const {rerender}=render(<BoatInformation {...props} initialBoatInfo={draft}/>);
  fireEvent.click(screen.getByRole('button',{name:/^V-Hull Fishing boat/}));
  const make=screen.getByLabelText('Boat Make');
  expect(make).toHaveValue('Lund');
  expect(screen.getByLabelText('Boat Model')).toHaveValue('Pro-V');
  fireEvent.change(make,{target:{value:'Buyer correction'}});
  rerender(<BoatInformation {...props} initialBoatInfo={{...draft,make:'Stale URL'}}/>);
  expect(make).toHaveValue('Buyer correction');
  expect(props.onStepComplete).not.toHaveBeenCalled();
 });
});
