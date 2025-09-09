import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Mail, MessageSquare, Calendar } from 'lucide-react';
import { money, calculateMonthly, type PricingBreakdown } from '@/lib/quote-utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface StickySummaryProps {
  pricing: PricingBreakdown;
  selectedPackage: string;
  packageInclusions: string[];
  onReserveDeposit: () => void;
  onEmailQuote: () => void;
  onTextQuote: () => void;
  onBookConsult: () => void;
  depositAmount?: number;
  rate?: number;
}

export function StickySummary({
  pricing,
  selectedPackage,
  packageInclusions,
  onReserveDeposit,
  onEmailQuote,
  onTextQuote,
  onBookConsult,
  depositAmount = 200,
  rate = 7.99
}: StickySummaryProps) {
  const isMobile = useIsMobile();
  const monthlyPayment = calculateMonthly(pricing.total, rate);

  // Don't render sticky summary on mobile (use MobileSummaryBar instead)
  if (isMobile) return null;

  return (
    <div className="sticky top-24 space-y-4 sticky-summary">
      <Card className="p-6 space-y-4 border-2 border-primary/20">
        {/* Package Selection */}
        <div>
          <h4 className="font-semibold text-primary mb-2 capitalize">
            {selectedPackage} Package
          </h4>
          <div className="space-y-1">
            {packageInclusions.slice(0, 3).map((inclusion, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">{inclusion}</span>
              </div>
            ))}
            {packageInclusions.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{packageInclusions.length - 3} more items
              </div>
            )}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="space-y-2 py-4 border-y border-border/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {money(pricing.total)}
            </div>
            {pricing.savings > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 mt-1 savings-badge">
                Save {money(pricing.savings)}
              </Badge>
            )}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            From {money(monthlyPayment.amount)}/mo
          </div>
        </div>

        {/* Primary CTA */}
        <Button 
          onClick={onReserveDeposit}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hover-scale"
          size="lg"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Reserve with ${depositAmount} deposit
        </Button>

        {/* Secondary CTAs */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full text-sm hover-scale" 
            size="sm"
            onClick={onEmailQuote}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email me this quote
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="text-xs hover-scale" 
              size="sm"
              onClick={onTextQuote}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Text quote
            </Button>
            <Button 
              variant="outline" 
              className="text-xs hover-scale" 
              size="sm"
              onClick={onBookConsult}
            >
              <Calendar className="w-3 h-3 mr-1" />
              Book consult
            </Button>
          </div>
        </div>

        {/* Policy Line */}
        <div className="text-xs text-muted-foreground text-center">
          Quote valid until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          <br />
          Includes PDI & standard install
        </div>
      </Card>
    </div>
  );
}