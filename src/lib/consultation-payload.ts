import type { BoatInfo } from '@/components/QuoteBuilder';

export interface ConsultationTradeInAuditFields {
  tradein_value_pre_penalty: number | null;
  tradein_value_final: number | null;
  penalty_applied: boolean;
  penalty_factor: number | null;
  penalty_reason: 'brand_out_of_business' | null;
}

export const buildConsultationTradeInAuditFields = (
  boatInfo: BoatInfo | null | undefined,
): ConsultationTradeInAuditFields => {
  const tradeIn = boatInfo?.tradeIn;

  return {
    tradein_value_pre_penalty: tradeIn?.tradeinValuePrePenalty ?? null,
    tradein_value_final: tradeIn?.tradeinValueFinal ?? tradeIn?.estimatedValue ?? null,
    penalty_applied: Boolean(tradeIn?.penaltyApplied),
    penalty_factor: tradeIn?.penaltyFactor ?? null,
    penalty_reason: tradeIn?.penaltyApplied ? 'brand_out_of_business' : null,
  };
};
