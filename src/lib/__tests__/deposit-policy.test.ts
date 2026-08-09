import { describe, expect, it } from 'vitest';

import { getMotorReservationDeposit } from '../../../supabase/functions/_shared/deposit-policy';

describe('server-authoritative motor reservation deposit policy', () => {
  it.each([
    [9.9, false, 200],
    [25, false, 200],
    [30, false, 500],
    [115, false, 500],
    [150, false, 1000],
    [400, false, 1000],
  ])('derives the normal deposit for %s HP', (hp, expressOfferVerified, expected) => {
    expect(getMotorReservationDeposit(hp, expressOfferVerified)).toBe(expected);
  });

  it('allows the $100 deposit only after the express offer is verified', () => {
    expect(getMotorReservationDeposit(9.9, true)).toBe(100);
    expect(getMotorReservationDeposit(9.9, false)).toBe(200);
  });
});
