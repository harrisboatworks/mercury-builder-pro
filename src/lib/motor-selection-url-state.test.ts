import { describe, expect, it } from 'vitest';
import {
  motorSelectionUrlStatesEqual,
  readMotorSelectionUrlState,
  writeMotorSelectionUrlState,
  type MotorSelectionUrlState,
} from './motor-selection-url-state';

describe('motor selection URL state', () => {
  it('uses default filters for an empty URL', () => {
    expect(readMotorSelectionUrlState(new URLSearchParams())).toEqual({
      searchQuery: '',
      hpRange: 'all',
      configFilters: null,
    });
  });

  it('round-trips combined filters while preserving unrelated attribution params', () => {
    const state: MotorSelectionUrlState = {
      searchQuery: 'Pro XS',
      hpRange: 'high-output',
      configFilters: {
        inStock: true,
        startType: 'electric',
        controlType: 'remote',
        shaftLength: 'xl',
      },
    };

    const params = writeMotorSelectionUrlState(
      new URLSearchParams('utm_source=google&model=200-pro-xs'),
      state,
    );

    expect(params.get('utm_source')).toBe('google');
    expect(params.get('model')).toBe('200-pro-xs');
    expect(params.get('q')).toBe('Pro XS');
    expect(params.get('hp')).toBe('high-output');
    expect(params.get('stock')).toBe('1');
    expect(params.get('start')).toBe('electric');
    expect(params.get('control')).toBe('remote');
    expect(params.get('shaft')).toBe('xl');
    expect(motorSelectionUrlStatesEqual(readMotorSelectionUrlState(params), state)).toBe(true);
  });

  it('ignores invalid and empty filter params, then removes them canonically', () => {
    const current = new URLSearchParams(
      'q=%20%20&hp=huge&stock=true&start=rope&control=wheel&shaft=longest&utm_medium=cpc',
    );
    const state = readMotorSelectionUrlState(current);

    expect(state).toEqual({
      searchQuery: '',
      hpRange: 'all',
      configFilters: null,
    });

    const canonical = writeMotorSelectionUrlState(current, state);
    expect(canonical.toString()).toBe('utm_medium=cpc');
  });

  it('omits default values so unfiltered URLs stay compact', () => {
    const params = writeMotorSelectionUrlState(
      new URLSearchParams('q=old&hp=portable&stock=1&ref=agent'),
      {
        searchQuery: '',
        hpRange: 'all',
        configFilters: null,
      },
    );

    expect(params.toString()).toBe('ref=agent');
  });
});
