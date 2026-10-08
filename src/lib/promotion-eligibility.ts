export interface PromotionMotor {
  hp?: number;
  model?: string;
  family?: string | null;
  type?: string;
  stockStatus?: string;
  availability?: string;
  in_stock?: boolean | null;
  stock_quantity?: number | string | null;
}

export interface PromotionEligibility {
  coverage_summary?: string;
  motor_eligibility?: {
    stock_required?: boolean;
    min_hp?: number;
    max_hp?: number;
    excluded_families?: string[];
  };
}

/** HBW quotes apply promotions regardless of inventory status; product restrictions still apply. */
export function isPromotionMotorEligible(details: PromotionEligibility | undefined, motor: PromotionMotor | null | undefined): boolean {
  const rule = details?.motor_eligibility;
  if (!rule) return true;
  if (!motor || !Number.isFinite(motor.hp)) return false;
  if (rule.min_hp != null && motor.hp! < rule.min_hp) return false;
  if (rule.max_hp != null && motor.hp! > rule.max_hp) return false;
  // Jay's quoting policy: on-order, zero-stock and unknown-stock motors receive
  // the same promotional benefits as stocked motors. Keep stock_required as
  // source metadata, not as a quote eligibility gate.
  const identity = `${motor.model || ''} ${motor.family || ''} ${motor.type || ''}`.toLowerCase();
  return !(rule.excluded_families || []).some(family => identity.includes(family.toLowerCase()));
}
