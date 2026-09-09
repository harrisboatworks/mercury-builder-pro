import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Gift, Shield } from 'lucide-react';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { daysUntil, formatPromoDaysLeft } from '@/lib/quote-utils';
import { getAppliedPromotion, getAppliedWarrantyExtraYears } from '@/lib/warranty-display';

interface PromoPanelProps {
  motorHp?: number;
}

export function PromoPanel({ motorHp }: PromoPanelProps) {
  const { promotions, loading } = useActivePromotions();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!promotions.length) {
    return null;
  }

  const appliedPromotion = getAppliedPromotion(promotions);
  const warrantyYears = getAppliedWarrantyExtraYears(appliedPromotion);
  const totalWarranty = 3 + warrantyYears;

  return (
    <Card className="border border-repower-navy-900/10 bg-white p-5  ">
      {promotions.map((promo) => (
        <div key={promo.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">{promo.name}</span>
            </div>
            {promo.end_date && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatPromoDaysLeft(daysUntil(promo.end_date))}
              </Badge>
            )}
          </div>
          
          {promo.id === appliedPromotion?.id && warrantyYears > 0 && (
            <div className="flex items-center gap-2 bg-repower-cream text-repower-gold   px-3 py-2 rounded-lg">
              <Shield className="w-4 h-4" />
              <span className="font-medium">{totalWarranty} Years Factory Coverage</span>
            </div>
          )}
          
          {promo.bonus_description && (
            <p className="text-sm text-muted-foreground">{promo.bonus_description}</p>
          )}
        </div>
      ))}
    </Card>
  );
}
