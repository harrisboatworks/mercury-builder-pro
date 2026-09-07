export type DepositAmount = 100 | 200 | 500 | 1000;

export const EXPRESS_MOTOR_ID = "e920cfdf-223a-408a-850b-6f112e15c4d7";
export const EXPRESS_MOTOR_MODEL_NUMBER = "1A10201LK";

type ExpressMotorAuthority = {
  motorId: unknown;
  modelNumber: unknown;
};

/**
 * The low-friction $100 offer is limited to one exact catalog motor and a
 * catalog model number. No browser-authored flow flag can grant this tier.
 */
export function isVerifiedExpressMotorReservation({
  motorId,
  modelNumber,
}: ExpressMotorAuthority): boolean {
  return motorId === EXPRESS_MOTOR_ID &&
    modelNumber === EXPRESS_MOTOR_MODEL_NUMBER;
}

/**
 * Canonical reservation deposit schedule for a specific motor.
 *
 * Callers may enable the $100 tier only after verifying the exact express
 * motor with `isVerifiedExpressMotorReservation`.
 */
export function getMotorReservationDeposit(
  horsepower: number,
  expressOfferVerified = false,
): DepositAmount {
  if (expressOfferVerified && horsepower <= 25) return 100;
  if (horsepower <= 25) return 200;
  if (horsepower <= 115) return 500;
  return 1000;
}
