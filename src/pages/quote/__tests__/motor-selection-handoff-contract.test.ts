/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('motor selection agent handoff contract', () => {
  it('applies the bounded handoff once and keeps the existing motor flows', () => {
    const page = read('src/pages/quote/MotorSelectionPage.tsx');
    const handoff = read('src/lib/agent-quote-handoff.ts');

    expect(page).toContain('useAgentQuoteHandoff');
    expect(page).toContain('parseAgentQuoteHandoff');
    expect(page).toContain('UCP_CHECKOUT_REF_FLAG');
    expect(page).toContain("searchParams.get('intent') === 'motor-only'");
    expect(page).toContain('motorId === MERCURY_99_MH_EXPRESS_MOTOR_ID');
    expect(page).toContain("type: 'START_MOTOR_ONLY_QUOTE'");
    expect(page).toContain('groupedMotors.find');
    expect(page).toContain('setShowConfigurator(true)');
    expect(page).toContain("if (!motorId || processedMotors.length === 0) return");
    expect(page).not.toContain("searchParams.delete('ucp')");
    expect(page).not.toContain("searchParams.delete('boat_make')");

    expect(handoff).toContain('SET_BOAT_INFO');
    expect(handoff).toContain('PROMOTE_TRADE_IN');
    expect(handoff).toContain('appliedRef');
    expect(handoff).not.toContain('COMPLETE_STEP');
    expect(handoff).not.toContain('SET_HAS_TRADEIN');
    expect(handoff).not.toContain('fetch(');
  });
});
