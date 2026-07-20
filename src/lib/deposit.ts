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
