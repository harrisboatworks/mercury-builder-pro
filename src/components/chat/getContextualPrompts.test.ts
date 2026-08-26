import { describe, expect, it } from 'vitest';
import {
  getContextualPrompts,
  getPageWelcomeMessage,
  isMotorFocusedPage,
} from './getContextualPrompts';

describe('getContextualPrompts', () => {
  it('asks accessory questions on options, not retired warranty packages', () => {
    const prompts = getContextualPrompts(null, null, '/quote/options');
    expect(prompts.join(' ')).toMatch(/fuel tank|SmartCraft|service kit|included/i);
    expect(prompts.join(' ')).not.toMatch(/Complete package|Premium add/i);
    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it('treats bare /quote as motor selection', () => {
    expect(getContextualPrompts(null, null, '/quote')).toEqual(
      getContextualPrompts(null, null, '/quote/motor-selection'),
    );
  });

  it('does not repeat the fishing prompt on motor selection', () => {
    const prompts = getContextualPrompts(null, null, '/quote/motor-selection');
    expect(prompts.filter((prompt) => prompt === "What's a good motor for fishing?")).toHaveLength(1);
    expect(prompts).toContain("What's a good motor for a pontoon?");
  });

  it('keeps promo, trade-in, and review pages on the current quote flow', () => {
    expect(getContextualPrompts(null, null, '/quote/promo-selection')[0]).toMatch(/saves the most/i);
    expect(getContextualPrompts(null, null, '/quote/trade-in')[0]).toMatch(/old motor worth/i);
    expect(getContextualPrompts(null, null, '/quote/schedule')[0]).toMatch(/consultation/i);
  });
});

describe('getPageWelcomeMessage', () => {
  it('describes options as accessories instead of packages', () => {
    expect(getPageWelcomeMessage('/quote/options', null, null)).toMatch(/tanks, batteries, or add-ons/i);
    expect(getPageWelcomeMessage('/quote/options', null, null)).not.toMatch(/package/i);
  });
});

describe('isMotorFocusedPage', () => {
  it('treats the live motor-selection route as motor-focused', () => {
    expect(isMotorFocusedPage('/quote/motor-selection')).toBe(true);
    expect(isMotorFocusedPage('/quote')).toBe(true);
    expect(isMotorFocusedPage('/quote/options')).toBe(false);
    expect(isMotorFocusedPage('/repower')).toBe(true);
  });
});
