import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Gift } from 'lucide-react';
import { money, formatExpiry } from '@/lib/quote-utils';
import { useActivePromotions } from '@/hooks/useActivePromotions';

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

  // Calculate total promotional value
  const totalPromoValue = promotions.reduce((total, promo) => {
    let value = 0;
    if (promo.discount_fixed_amount) value += promo.discount_fixed_amount;
    if (promo.warranty_extra_years) value += promo.warranty_extra_years * 100; // Estimate warranty value
    // Add percentage discount value if motor price is available
    if (promo.discount_percentage && motorHp) {
      // Rough estimate based on HP - this would need actual motor price for accuracy
      const estimatedMotorPrice = motorHp * 500; // Rough estimate
      value += (estimatedMotorPrice * promo.discount_percentage) / 100;
    }
    return total + value;
  }, 0);

  return (
    <Card className="border-2 border-green-200 bg-green-50/50">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-primary">
            Active Promotions
          </h3>
        </div>

        {/* Promotion Lines */}
        <div className="space-y-3">
          {promotions.map((promo) => {
            const expiryText = promo.end_date ? formatExpiry(promo.end_date) : null;
            let promoValue = 0;
            
            // Calculate individual promo value
            if (promo.discount_fixed_amount) promoValue += promo.discount_fixed_amount;
            if (promo.warranty_extra_years) promoValue += promo.warranty_extra_years * 100;
            if (promo.discount_percentage && motorHp) {
              const estimatedMotorPrice = motorHp * 500; // Rough estimate
              promoValue += (estimatedMotorPrice * promo.discount_percentage) / 100;
            }

            return (
              <div key={promo.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-primary">
                    {promo.name}
                  </div>
                  {expiryText && (
                    <div className="flex items-center gap-1 text-sm text-orange-600">
                      <Clock className="w-3 h-3" />
                      {expiryText}
                    </div>
                  )}
                </div>
                {promoValue > 0 && (
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {money(promoValue)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total Value */}
        {totalPromoValue > 0 && (
          <div className="pt-3 border-t border-green-200">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-primary">
                Total Promotional Value:
              </div>
              <div className="text-xl font-bold text-green-600">
                {money(totalPromoValue)}
              </div>
            </div>
          </div>
        )}

        {/* Promotional Badge */}
        <div className="flex justify-center">
          <Badge className="bg-green-600 text-white">
            Limited Time Offers
          </Badge>
        </div>
      </div>
    </Card>
  );
}