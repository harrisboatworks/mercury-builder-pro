import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Gift, Shield } from 'lucide-react';
import { useActivePromotions } from '@/hooks/useActivePromotions';

interface PromoPanelProps {
  motorHp?: number;
}

export function PromoPanel({ motorHp }: PromoPanelProps) {
  const { promotions, loading, getTotalWarrantyBonusYears } = useActivePromotions();

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

  // Calculate days left until promo ends
  const daysLeft = (endDate: string | null | undefined): number => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const warrantyYears = getTotalWarrantyBonusYears?.() || 0;
  const totalWarranty = 3 + warrantyYears;

  return (
    <Card className="border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
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
                {daysLeft(promo.end_date)} days left
              </Badge>
            )}
          </div>
          
          {warrantyYears > 0 && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-3 py-2 rounded-lg">
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