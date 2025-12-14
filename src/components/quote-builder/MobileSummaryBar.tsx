import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ChevronUp, Check, Mail, MessageSquare, Calendar } from 'lucide-react';
import { money, calculateMonthly, type PricingBreakdown } from '@/lib/quote-utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileSummaryBarProps {
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

export function MobileSummaryBar({
  pricing,
  selectedPackage,
  packageInclusions,
  onReserveDeposit,
  onEmailQuote,
  onTextQuote,
  onBookConsult,
  depositAmount = 200,
  rate = 7.99
}: MobileSummaryBarProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const monthlyPayment = calculateMonthly(pricing.total, rate);

  // Only render on mobile
  if (!isMobile) return null;

  return (
    <>
      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="p-4 space-y-3">
          {/* Price and Expand Trigger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xl font-bold text-primary">
                    {money(pricing.total)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    From {money(monthlyPayment.amount)}/mo
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pricing.savings > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      Save {money(pricing.savings)}
                    </Badge>
                  )}
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </SheetTrigger>

            {/* Expandable Summary Sheet */}
            <SheetContent side="bottom" className="space-y-6 pb-24">
              <SheetHeader>
                <SheetTitle className="capitalize">
                  {selectedPackage} Package Summary
                </SheetTitle>
              </SheetHeader>

              {/* Package Inclusions */}
              <div className="space-y-2">
                <h4 className="font-medium text-primary">What's Included:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {packageInclusions.map((inclusion, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>{inclusion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Details */}
              <div className="space-y-2 py-4 border-y border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Your Price:</span>
                  <span className="text-xl font-bold text-primary">{money(pricing.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monthly Payment:</span>
                  <span className="font-medium">From {money(monthlyPayment.amount)}/mo</span>
                </div>
                {pricing.savings > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Savings:</span>
                    <span className="font-medium text-green-600">{money(pricing.savings)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setIsOpen(false);
                    onReserveDeposit();
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Reserve with ${depositAmount} deposit
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      onEmailQuote();
                    }}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      onTextQuote();
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Text
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      onBookConsult();
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Consult
                  </Button>
                </div>
              </div>

              {/* Policy */}
              <div className="text-xs text-muted-foreground text-center">
                Quote valid until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                <br />
                Includes PDI & standard install
              </div>
            </SheetContent>
          </Sheet>

          {/* Primary CTA Button */}
          <Button 
            onClick={onReserveDeposit}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Reserve with ${depositAmount} deposit
          </Button>
        </div>
      </div>

      {/* Spacer to prevent content overlap */}
      <div className="h-32" />
    </>
  );
}