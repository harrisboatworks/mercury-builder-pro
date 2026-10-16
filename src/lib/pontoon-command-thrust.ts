/**
 * Pontoon fit-check helper for the boat-information step.
 *
 * Pontoons push a lot of hull at low speed, so HBW recommends the Command
 * Thrust gearcase wherever Mercury offers one. In HBW's catalogue Command
 * Thrust remote/tiller variants exist from 40 to 115 HP; below and above that
 * band there is no CT version to steer the buyer toward.
 */

export const COMMAND_THRUST_MIN_HP = 40;
export const COMMAND_THRUST_MAX_HP = 115;

type CommandThrustSource = {
  model?: string | null;
  model_number?: string | null;
  features?: unknown;
  commandThrust?: boolean | null;
  has_command_thrust?: boolean | null;
};

export function isCommandThrustMotor(motor: CommandThrustSource | null | undefined): boolean {
  if (!motor) return false;
  if (motor.commandThrust === true || motor.has_command_thrust === true) return true;
  const text = [motor.model, motor.model_number].filter(Boolean).join(' ');
  if (/\bcommand\s*thrust\b/i.test(text)) return true;
  // Mercury rig codes put CT as its own token (e.g. "90ELPT CT").
  if (/(?:^|\s)CT(?:\s|$)/.test(text)) return true;
  if (Array.isArray(motor.features)) {
    return motor.features.some(
      (feature) => typeof feature === 'string' && /^(?:command\s*thrust(?:\s+gearcase)?|ct)$/i.test(feature.trim()),
    );
  }
  return false;
}

/** True when a pontoon buyer picked a non-CT motor in a size that has a CT version. */
export function pontoonShouldUseCommandThrust(
  boatTypeId: string | null | undefined,
  motorHP: number,
  motor: CommandThrustSource | null | undefined,
): boolean {
  if (boatTypeId !== 'pontoon') return false;
  if (!Number.isFinite(motorHP)) return false;
  if (motorHP < COMMAND_THRUST_MIN_HP || motorHP > COMMAND_THRUST_MAX_HP) return false;
  return !isCommandThrustMotor(motor);
}
