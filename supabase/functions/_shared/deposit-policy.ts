export type DepositAmount = 100 | 200 | 500 | 1000;

/**
 * Canonical reservation deposit schedule for a specific motor.
 *
 * The $100 path is reserved for the exact express-offer motor after the
 * server has verified both its catalog identity and the saved quote flag.
 */
export function getMotorReservationDeposit(
  horsepower: number,
  expressOfferVerified = false,
): DepositAmount {
  if (expressOfferVerified) return 100;
  if (horsepower <= 25) return 200;
  if (horsepower <= 115) return 500;
  return 1000;
}
