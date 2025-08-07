
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Gift } from 'lucide-react';
import type { Motor } from '../QuoteBuilder';

interface BonusOffersProps {
  motor: Motor | null;
}

export const BonusOffers = ({ motor }: BonusOffersProps) => {
  if (!motor || !motor.bonusOffers || motor.bonusOffers.length === 0) return null;

  const offers = [...motor.bonusOffers].sort((a, b) => (b.highlight === a.highlight ? (b.priority - a.priority) : (b.highlight ? 1 : -1)));

  return (
    <Card className="mt-6 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Gift className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Bonus Offers Included</h3>
        <Badge variant="secondary">{offers.length}</Badge>
      </div>

      <div className="space-y-4">
        {offers.map((o) => (
          <div key={o.id} className="border border-border rounded-md p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {o.warrantyExtraYears ? <ShieldCheck className="w-4 h-4 text-green-600" /> : <Gift className="w-4 h-4 text-primary" />}
                <div className="font-medium">
                  {o.title}
                  {o.shortBadge && <span className="ml-2 text-xs text-muted-foreground">({o.shortBadge})</span>}
                </div>
                {o.highlight && <Badge className="ml-2">Highlighted</Badge>}
              </div>
              {o.description && <p className="text-sm text-muted-foreground mt-1">{o.description}</p>}
              {o.warrantyExtraYears && (
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  +{o.warrantyExtraYears} additional year{o.warrantyExtraYears > 1 ? 's' : ''} warranty at no cost
                </p>
              )}
              {o.endsAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ends {new Date(o.endsAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              {o.termsUrl && (
                <a href={o.termsUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                  Terms
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
