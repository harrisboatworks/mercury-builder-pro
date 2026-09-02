import { getMotorReservationDeposit } from '../../supabase/functions/_shared/deposit-policy';

export { getMotorReservationDeposit };

/**
 * Recommended quote deposit by motor horsepower.
 *
 * Keep this shared between the quote summary and customer PDF so the amount
 * printed on a downloaded quote always matches the reservation button.
 */
export function getRecommendedDeposit(hp: number): number {
  return getMotorReservationDeposit(hp);
}

/**
 * Low-friction reservation used by the express portable-motor sale path.
 * Larger motors retain the normal HP-based deposit schedule.
 */
export function getExpressReservationDeposit(hp: number): number {
  return getMotorReservationDeposit(hp, hp <= 25);
}
