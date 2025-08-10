import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Info, Shield, Sparkles } from 'lucide-react';
import mercuryLogo from '@/assets/mercury-logo.png';

export interface PromoDetailsModalProps {
  promo: {
    id: string;
    name: string;
    end_date?: string | null;
    terms_url?: string | null;
    details?: any;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromoDetailsModal: React.FC<PromoDetailsModalProps> = ({ promo, open, onOpenChange }) => {
  const details = (promo as any)?.details || {};
  const eligibility: string[] = Array.isArray(details.eligibility) ? details.eligibility : [];
  const terms: string[] = Array.isArray(details.terms) ? details.terms : [];
  const amount: string | undefined = details.amount;
  const finePrint: string | undefined = details.finePrint;
  const processingTime: string | undefined = details.processingTime;
  const expiryNote: string | undefined = details.expiryNote;

  const title = promo?.name || 'Promotion Details';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {/* Header with Mercury branding */}
        <div className="bg-gradient-to-r from-primary to-primary/80 -m-6 mb-6 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <img
              src={mercuryLogo}
              alt="Mercury Marine"
              className="h-8 w-auto"
              loading="lazy"
            />
            <span className="text-white/90 text-xs font-medium">Official Promotion</span>
          </div>
        </div>

        {/* Promo Title & Amount */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2 text-foreground">{title}</h2>
          {(amount || details.amount) && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
              <span className="text-2xl">✨</span>
              <span className="font-bold text-xl">Save {amount}</span>
            </div>
          )}
        </div>

        {/* Details with icons */}
        <div className="space-y-5 mb-6">
          {eligibility.length > 0 && (
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Eligibility Requirements</h3>
                <ul className="space-y-2">
                  {eligibility.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground">
                      <span className="text-green-500">✓</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {(promo?.end_date || expiryNote) && (
            <div className="flex items-start gap-3">
              <Calendar className="text-primary mt-1" size={20} />
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Important Dates</h3>
                <p className="text-muted-foreground">
                  {promo?.end_date ? (
                    <>Offer valid through {new Date(promo.end_date as string).toLocaleDateString()}</>
                  ) : (
                    expiryNote
                  )}
                </p>
              </div>
            </div>
          )}

          {(terms.length > 0 || processingTime || finePrint || promo?.terms_url) && (
            <div className="flex items-start gap-3">
              <Info className="text-amber-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Additional Terms</h3>
                {terms.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {terms.map((term, i) => (
                      <li key={i} className="text-muted-foreground">• {term}</li>
                    ))}
                  </ul>
                )}
                {processingTime && (
                  <p className="text-sm text-muted-foreground mt-2">Processing time: {processingTime}</p>
                )}
                {promo?.terms_url && (
                  <p className="text-xs mt-2"><a href={promo.terms_url} target="_blank" rel="noreferrer" className="underline">View official terms</a></p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Trust reinforcement */}
        <div className="bg-primary/10 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-3">
            <Shield className="text-primary" size={24} />
            <div>
              <p className="font-semibold text-foreground">Harris Boat Works Guarantee</p>
              <p className="text-sm text-muted-foreground">
                We handle all rebate paperwork for you. Fast, accurate, and hassle-free.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
          >
            Close
          </Button>
          <Button 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            <Sparkles className="mr-2" size={16} />
            Continue
          </Button>
        </div>

        {/* Fine print */}
        {finePrint && (
          <p className="text-xs text-muted-foreground text-center mt-4">{finePrint}</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PromoDetailsModal;
