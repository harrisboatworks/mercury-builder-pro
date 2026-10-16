export class HorsepowerFilterError extends Error {}

export interface HorsepowerFilter {
  min_hp: number | null;
  max_hp: number | null;
}

/** Shared GET/POST list contract. Exact HP narrows a compatible range. */
export function parseHorsepowerFilter(
  input: URLSearchParams | Record<string, unknown>,
): HorsepowerFilter {
  function number(key: string, allowZero = false): number | null {
    if (input instanceof URLSearchParams && input.getAll(key).length > 1) {
      throw new HorsepowerFilterError(`${key} must be supplied only once.`);
    }
    const raw = input instanceof URLSearchParams ? input.get(key) : input[key];
    if (raw === undefined || raw === null) return null;
    if (typeof raw !== 'number' &&
      (typeof raw !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw.trim()))) {
      throw new HorsepowerFilterError(`${key} must be a finite ${allowZero ? 'non-negative' : 'positive'} number.`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
      throw new HorsepowerFilterError(`${key} must be a finite ${allowZero ? 'non-negative' : 'positive'} number.`);
    }
    return value;
  }

  const exact = number('horsepower');
  const min = number('min_hp', true);
  const max = number('max_hp');
  if (min !== null && max !== null && min > max) {
    throw new HorsepowerFilterError('min_hp must not exceed max_hp.');
  }
  if (exact !== null && ((min !== null && exact < min) || (max !== null && exact > max))) {
    throw new HorsepowerFilterError('horsepower conflicts with min_hp or max_hp.');
  }
  return { min_hp: exact ?? min, max_hp: exact ?? max };
}
