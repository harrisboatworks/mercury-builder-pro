import { Star, Award, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export type PopularityType = 'best-seller' | 'popular' | 'dealers-pick' | 'special-price';

interface PopularityBadgeProps {
  type: PopularityType;
  className?: string;
}

const badgeConfig = {
  'best-seller': {
    label: 'Best Seller',
    Icon: Star,
    variant: 'gold' as const
  },
  'popular': {
    label: 'Popular',
    Icon: Star,
    variant: 'dark' as const
  },
  'dealers-pick': {
    label: "Dealer's Pick",
    Icon: Award,
    variant: 'gold' as const
  },
  'special-price': {
    label: 'Special Price',
    Icon: Tag,
    variant: 'promo' as const
  }
};

export function PopularityBadge({ type, className }: PopularityBadgeProps) {
  const config = badgeConfig[type];
  if (!config) return null;

  const { label, Icon, variant } = config;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide uppercase shadow-sm",
        variant === 'gold' && "bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950",
        variant === 'dark' && "bg-gray-900 text-gray-100",
        variant === 'promo' && "bg-gradient-to-r from-red-500 to-red-600 text-white",
        className
      )}
    >
      <Icon className="w-3 h-3" strokeWidth={2.5} />
      <span>{label}</span>
    </div>
  );
}

// Rule-based detection for motor popularity
// Returns a PopularityType if the motor qualifies, otherwise null
export function getMotorPopularity(motor: { model?: string; hp?: number; model_display?: string }): PopularityType | null {
  if (!motor) return null;
  
  const modelText = (motor.model_display || motor.model || '').toUpperCase();
  const hp = typeof motor.hp === 'number' ? motor.hp : parseInt(modelText.match(/\d+/)?.[0] || '0');
  
  // Known best sellers by model pattern - most popular motors
  const bestSellerPatterns = [
    // 9.9 HP portable motors - extremely popular
    { pattern: /9\.9/, minHp: 9, maxHp: 10 },
    // 20 HP - best value vs 15HP
    { pattern: /\b20\s*(HP)?/, minHp: 20, maxHp: 20 },
    // 60 HP Command Thrust - popular pontoon motor
    { pattern: /60.*CT|CT.*60|COMMAND.*THRUST/i, minHp: 60, maxHp: 60 },
    // 115 HP - versatile mid-range
    { pattern: /\b115\b/, minHp: 115, maxHp: 115 },
  ];
  
  // Check best sellers first
  for (const seller of bestSellerPatterns) {
    if (hp >= seller.minHp && hp <= seller.maxHp && seller.pattern.test(modelText)) {
      return 'best-seller';
    }
  }
  
  // Popular choices - second tier
  const popularPatterns = [
    // 25 HP - popular tiller motors
    { pattern: /\b25\b/, minHp: 25, maxHp: 25 },
    // 40 HP - popular for aluminum boats
    { pattern: /\b40\b/, minHp: 40, maxHp: 40 },
    // 90 HP - better value than 75HP
    { pattern: /\b90\b/, minHp: 90, maxHp: 90 },
    // 150 HP - popular for pontoons
    { pattern: /\b150\b/, minHp: 150, maxHp: 150 },
  ];
  
  for (const pop of popularPatterns) {
    if (hp >= pop.minHp && hp <= pop.maxHp && pop.pattern.test(modelText)) {
      return 'popular';
    }
  }
  
  return null;
}
