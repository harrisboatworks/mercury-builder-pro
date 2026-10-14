import { normalizeHbwStroke, type CanonicalHbwValuationPayload } from "./hbw-valuation-response.ts";
import type { ResolvedTradeInInput } from "./trade-in-input.ts";

/** Carry facts and resolved defaults, never a client-trusted valuation or serial number. */
export function buildTradeInHandoffFields(trade: ResolvedTradeInInput | null, valuation: CanonicalHbwValuationPayload | null) {
  if (!trade) return {};
  let engineType = trade.engineType;
  if (!engineType) {
    try { engineType = normalizeHbwStroke(valuation?.effectiveInputs?.stroke); } catch { /* Buyer must confirm architecture. */ }
  }
  return {
    trade_replace: 1,
    trade_brand: trade.brand,
    trade_year: trade.year,
    trade_hp: trade.horsepower,
    trade_model: trade.model,
    trade_condition: trade.condition,
    trade_engine_type: engineType,
    trade_engine_hours: trade.engineHours,
  };
}
