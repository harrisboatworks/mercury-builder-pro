/**
 * Per-step validation gate for the quote builder.
 *
 * Both the global mobile sticky bar (UnifiedMobileBar) and the desktop
 * StickyQuoteBar use this to disable the bottom "Continue" CTA until the
 * required selection on the current step has been made.
 *
 * Keep this PURE — no React hooks, no side effects — so it can be reused
 * from anywhere.
 */

import { hasElectricStart } from '@/lib/motor-config-utils';

export interface QuoteStepGate {
  disabled: boolean;
  reason?: string;
}

/**
 * Compute whether the bottom-bar "Continue" CTA should be disabled for the
 * current pathname, based on what the user has selected so far.
 */
export function getQuoteStepGate(pathname: string, state: any): QuoteStepGate {
  // /quote/options — battery choice required for electric-start motors
  if (pathname === '/quote/options') {
    const model = state?.motor?.model || '';
    if (hasElectricStart(model)) {
      const choice = state?.looseMotorBattery?.wantsBattery;
      if (choice === undefined || choice === null) {
        return {
          disabled: true,
          reason: 'Choose a battery option to continue',
        };
      }
    }
    return { disabled: false };
  }

  // /quote/purchase-path — must pick Loose or Installed
  if (pathname === '/quote/purchase-path') {
    if (!state?.purchasePath) {
      return {
        disabled: true,
        reason: 'Pick Loose Motor or Professional Install',
      };
    }
    return { disabled: false };
  }

  // /quote/boat-info — must pick a boat type (the "Not Sure / Skip" tile in
  // BoatInformation.handleSkip sets type='utility' before submitting, so this
  // covers both cases).
  if (pathname === '/quote/boat-info') {
    if (!state?.boatInfo?.type) {
      return {
        disabled: true,
        reason: 'Pick a boat type or tap "Not Sure"',
      };
    }
    return { disabled: false };
  }

  return { disabled: false };
}
