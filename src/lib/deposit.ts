/**
 * Recommended quote deposit by motor horsepower.
 *
 * Keep this shared between the quote summary and customer PDF so the amount
 * printed on a downloaded quote always matches the reservation button.
 */
export function getRecommendedDeposit(hp: number): number {
  if (hp <= 25) return 200;
  if (hp <= 115) return 500;
  return 1000; // Above 115 HP
}

/**
 * Low-friction reservation used by the express portable-motor sale path.
 * Larger motors retain the normal HP-based deposit schedule.
 */
export function getExpressReservationDeposit(hp: number): number {
  if (hp <= 25) return 100;
  return getRecommendedDeposit(hp);
}
