import { useState, useEffect, useMemo } from 'react';
import { FrozenPricing } from '@/contexts/QuoteContext';
import { money } from '@/lib/money';
import { promoEndOfDay } from '@/lib/quote-utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface StaleQuoteAlertProps {
  frozenPricing: FrozenPricing;
  liveMotorMSRP: number;
  livePromoSavings: number;
  liveTotal: number;
  promoEndDate: string | null;
  onKeepOriginal: () => void;
  onUpdatePricing: () => void;
}

interface PriceChange {
  label: string;
  icon: 'up' | 'down' | 'expired';
  detail: string;
}

export function StaleQuoteAlert({
  frozenPricing,
  liveMotorMSRP,
  livePromoSavings,
  liveTotal,
  promoEndDate,
  onKeepOriginal,
  onUpdatePricing,
}: StaleQuoteAlertProps) {
  const [open, setOpen] = useState(false);

  const changes = useMemo(() => {
    const result: PriceChange[] = [];

    // Motor MSRP changed
    const msrpDelta = liveMotorMSRP - frozenPricing.motorMSRP;
    if (Math.abs(msrpDelta) > 1) {
      result.push({
        label: 'Motor price changed',
        icon: msrpDelta > 0 ? 'up' : 'down',
        detail: msrpDelta > 0
          ? `Increased by ${money(msrpDelta)}`
          : `Decreased by ${money(Math.abs(msrpDelta))}`,
      });
    }

    // Promo savings changed
    const promoDelta = livePromoSavings - frozenPricing.promoSavings;
    if (Math.abs(promoDelta) > 1) {
      if (livePromoSavings === 0 && frozenPricing.promoSavings > 0) {
        result.push({
          label: 'Promotion has ended',
          icon: 'expired',
          detail: `${money(frozenPricing.promoSavings)} in savings no longer available`,
        });
      } else {
        result.push({
          label: 'Promotional savings changed',
          icon: promoDelta > 0 ? 'down' : 'up',
          detail: promoDelta > 0
            ? `${money(promoDelta)} more in savings available`
            : `${money(Math.abs(promoDelta))} less in savings`,
        });
      }
    }

    // Promo expired by date
    const promoEnd = promoEndDate ? new Date(promoEndDate) : null;
    if (promoEnd) promoEnd.setHours(23, 59, 59, 999);
    if (promoEnd && promoEnd < new Date() && frozenPricing.promoSavings > 0 && livePromoSavings > 0) {
      // Only add if not already caught by savings delta
      if (Math.abs(promoDelta) <= 1) {
        result.push({
          label: 'Promotion period has ended',
          icon: 'expired',
          detail: 'The promotion active when this quote was created has expired',
        });
      }
    }

    // Total differs significantly
    const totalDelta = liveTotal - frozenPricing.total;
    if (Math.abs(totalDelta) > 10 && result.length === 0) {
      // Only show total change if no specific cause was found above
      result.push({
        label: 'Total price has changed',
        icon: totalDelta > 0 ? 'up' : 'down',
        detail: totalDelta > 0
          ? `Increased by ${money(totalDelta)}`
          : `Decreased by ${money(Math.abs(totalDelta))}`,
      });
    }

    return result;
  }, [frozenPricing, liveMotorMSRP, livePromoSavings, liveTotal, promoEndDate]);

  useEffect(() => {
    if (changes.length > 0) {
      // Small delay so page renders first
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [changes.length]);

  if (changes.length === 0) return null;

  const IconForChange = ({ type }: { type: 'up' | 'down' | 'expired' }) => {
    if (type === 'up') return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (type === 'down') return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            This quote's pricing may have changed
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Since this quote was created, the following has changed:
              </p>
              <ul className="space-y-2">
                {changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <IconForChange type={change.icon} />
                    <div>
                      <span className="font-medium text-foreground">{change.label}</span>
                      <span className="text-muted-foreground"> — {change.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground pt-1">
                You can keep the original pricing (as shown on your PDF) or update to today's prices.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { setOpen(false); onKeepOriginal(); }}>
            View Original Quote
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => { setOpen(false); onUpdatePricing(); }}>
            Update to Current Pricing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
