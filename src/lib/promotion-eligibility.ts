import { resolveMotorAvailability } from './motorAvailability';

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

/** Quote estimates fail closed on known stock/product restrictions. */
export function isPromotionMotorEligible(details: PromotionEligibility | undefined, motor: PromotionMotor | null | undefined): boolean {
  const rule = details?.motor_eligibility;
  if (!rule) return true;
  if (!motor || !Number.isFinite(motor.hp)) return false;
  if (rule.min_hp != null && motor.hp! < rule.min_hp) return false;
  if (rule.max_hp != null && motor.hp! > rule.max_hp) return false;
  if (rule.stock_required && resolveMotorAvailability({...motor, availability: motor.availability ?? motor.stockStatus}).status !== 'in_stock') return false;
  const identity = `${motor.model || ''} ${motor.family || ''} ${motor.type || ''}`.toLowerCase();
  return !(rule.excluded_families || []).some(family => identity.includes(family.toLowerCase()));
}
