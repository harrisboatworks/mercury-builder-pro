import type { BoatInfo } from '@/components/QuoteBuilder';
import type { TradeInInfo } from '@/lib/trade-valuation';

export const TRADE_IN_MIN_YEAR = 1950;

export function parseMotorHorsepowerInput(value: string): number {
  const horsepower = Number(value);
  return Number.isFinite(horsepower) && horsepower > 0 ? horsepower : 0;
}

export function isSupportedTradeInYear(year: number, currentYear = new Date().getFullYear()): boolean {
  return year >= TRADE_IN_MIN_YEAR && year <= currentYear;
}

export function buildEmptyTradeInInfo(): TradeInInfo {
  return {
    hasTradeIn: false,
    brand: '',
    year: 0,
    horsepower: 0,
    model: '',
    serialNumber: '',
    condition: 'good',
    estimatedValue: 0,
    confidenceLevel: 'medium',
  };
}

export function buildInitialTradeInInfo(
  existing: TradeInInfo | null | undefined,
  boatInfo: BoatInfo | null | undefined,
): TradeInInfo {
  if (existing) return { ...existing };

  return {
    ...buildEmptyTradeInInfo(),
    brand: boatInfo?.currentMotorBrand || '',
    year: boatInfo?.currentMotorYear || 0,
    horsepower: boatInfo?.currentHp || 0,
  };
}
