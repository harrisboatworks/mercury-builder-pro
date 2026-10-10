import { describe, expect, it } from 'vitest';
import { completeApplicationSchema, financialSchema, phoneSchema } from './financingValidation';
import { completeFinancingFixture } from '@/test/financing-application.fixtures';
describe('financing form data round trips', () => {
  it('accepts step-validated phone numbers again at final submission and on resume', () => {
    const stepValidated = completeApplicationSchema.parse(completeFinancingFixture());
    expect(completeApplicationSchema.safeParse(stepValidated).success).toBe(true);
  });
  it.each(['9055550100', '(905) 555-0100', '+1 (905) 555-0100'])('accepts supported phone formatting %s', phone => {
    expect(phoneSchema.safeParse(phone).success).toBe(true);
  });
  it.each(['abc9055550100', '905-555', '0000000000'])('rejects invalid phone numbers %s', phone => {
    expect(phoneSchema.safeParse(phone).success).toBe(false);
  });
  it.each(['discharged','undischarged','consumer_proposal_active','consumer_proposal_completed','active'])('accepts the displayed or legacy bankruptcy status %s', status => {
    expect(financialSchema.safeParse({...completeFinancingFixture().financial,hasBankruptcy:true,bankruptcyDetails:{date:new Date('2020-01-01'),status}}).success).toBe(true);
  });
});
