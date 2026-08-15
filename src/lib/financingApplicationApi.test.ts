import { describe, expect, it, vi } from 'vitest';
import {
  clearFinancingStorage,
  FINANCING_STORAGE_KEYS,
  stripLocalSensitiveFields,
  stripSin,
} from './financingApplicationApi';

describe('financing application data protection', () => {
  it('never places a plaintext SIN in the general applicant JSON', () => {
    const applicant = {
      firstName: 'Test',
      dateOfBirth: '1980-01-01',
      sin: '046-454-286',
    };

    expect(stripSin(applicant)).toEqual({
      firstName: 'Test',
      dateOfBirth: '1980-01-01',
    });
    expect(applicant.sin).toBe('046-454-286');
  });

  it('also removes date of birth from browser storage', () => {
    expect(stripLocalSensitiveFields({
      firstName: 'Test',
      dateOfBirth: '1980-01-01',
      sin: '046-454-286',
    })).toEqual({ firstName: 'Test' });
  });

  it('clears every legacy and current financing storage key', () => {
    const removeItem = vi.fn();

    clearFinancingStorage({ removeItem });

    expect(removeItem.mock.calls.map(([key]) => key)).toEqual(FINANCING_STORAGE_KEYS);
  });
});
