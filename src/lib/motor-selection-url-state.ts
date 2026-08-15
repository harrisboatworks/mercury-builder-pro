import type { ConfigFiltersState } from '@/components/motors/ConfigFilterSheet';
import {
  MOTOR_HP_RANGES,
  type MotorHpRangeId,
} from '@/lib/motor-hp-ranges';

const FILTER_PARAMS = {
  query: 'q',
  hpRange: 'hp',
  inStock: 'stock',
  startType: 'start',
  controlType: 'control',
  shaftLength: 'shaft',
} as const;

const VALID_HP_RANGES = new Set<MotorHpRangeId>(
  MOTOR_HP_RANGES.map((range) => range.id),
);
const VALID_START_TYPES = new Set<NonNullable<ConfigFiltersState['startType']>>([
  'electric',
  'manual',
]);
const VALID_CONTROL_TYPES = new Set<NonNullable<ConfigFiltersState['controlType']>>([
  'tiller',
  'remote',
]);
const VALID_SHAFT_LENGTHS = new Set<NonNullable<ConfigFiltersState['shaftLength']>>([
  'short',
  'long',
  'xl',
  'xxl',
]);

export interface MotorSelectionUrlState {
  searchQuery: string;
  hpRange: MotorHpRangeId;
  configFilters: ConfigFiltersState | null;
}

function normalizedQuery(value: string | null): string {
  if (!value || !value.trim()) return '';
  return value.slice(0, 80);
}

export function readMotorSelectionUrlState(
  searchParams: URLSearchParams,
): MotorSelectionUrlState {
  const hpParam = searchParams.get(FILTER_PARAMS.hpRange) as MotorHpRangeId | null;
  const startParam = searchParams.get(FILTER_PARAMS.startType) as
    | NonNullable<ConfigFiltersState['startType']>
    | null;
  const controlParam = searchParams.get(FILTER_PARAMS.controlType) as
    | NonNullable<ConfigFiltersState['controlType']>
    | null;
  const shaftParam = searchParams.get(FILTER_PARAMS.shaftLength) as
    | NonNullable<ConfigFiltersState['shaftLength']>
    | null;

  const configFilters: ConfigFiltersState = {};
  if (searchParams.get(FILTER_PARAMS.inStock) === '1') configFilters.inStock = true;
  if (startParam && VALID_START_TYPES.has(startParam)) configFilters.startType = startParam;
  if (controlParam && VALID_CONTROL_TYPES.has(controlParam)) {
    configFilters.controlType = controlParam;
  }
  if (shaftParam && VALID_SHAFT_LENGTHS.has(shaftParam)) {
    configFilters.shaftLength = shaftParam;
  }

  return {
    searchQuery: normalizedQuery(searchParams.get(FILTER_PARAMS.query)),
    hpRange: hpParam && VALID_HP_RANGES.has(hpParam) ? hpParam : 'all',
    configFilters: Object.keys(configFilters).length > 0 ? configFilters : null,
  };
}

export function writeMotorSelectionUrlState(
  currentParams: URLSearchParams,
  state: MotorSelectionUrlState,
): URLSearchParams {
  const nextParams = new URLSearchParams(currentParams);
  Object.values(FILTER_PARAMS).forEach((key) => nextParams.delete(key));

  const query = normalizedQuery(state.searchQuery);
  if (query) nextParams.set(FILTER_PARAMS.query, query);
  if (state.hpRange !== 'all' && VALID_HP_RANGES.has(state.hpRange)) {
    nextParams.set(FILTER_PARAMS.hpRange, state.hpRange);
  }

  const filters = state.configFilters;
  if (filters?.inStock) nextParams.set(FILTER_PARAMS.inStock, '1');
  if (filters?.startType && VALID_START_TYPES.has(filters.startType)) {
    nextParams.set(FILTER_PARAMS.startType, filters.startType);
  }
  if (filters?.controlType && VALID_CONTROL_TYPES.has(filters.controlType)) {
    nextParams.set(FILTER_PARAMS.controlType, filters.controlType);
  }
  if (filters?.shaftLength && VALID_SHAFT_LENGTHS.has(filters.shaftLength)) {
    nextParams.set(FILTER_PARAMS.shaftLength, filters.shaftLength);
  }

  return nextParams;
}

export function motorSelectionUrlStatesEqual(
  left: MotorSelectionUrlState,
  right: MotorSelectionUrlState,
): boolean {
  return (
    left.searchQuery === right.searchQuery
    && left.hpRange === right.hpRange
    && left.configFilters?.inStock === right.configFilters?.inStock
    && left.configFilters?.startType === right.configFilters?.startType
    && left.configFilters?.controlType === right.configFilters?.controlType
    && left.configFilters?.shaftLength === right.configFilters?.shaftLength
  );
}
