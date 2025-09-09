import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

interface StripePaymentButtonProps {
  quoteData: any;
  motorPrice: number;
  accessoryCosts: number;
  totalCashPrice: number;
  hasTradeIn: boolean;
  tradeInValue: number;
}

export const StripePaymentButton = ({
  quoteData,
  motorPrice,
  accessoryCosts,
  totalCashPrice,
  hasTradeIn,
  tradeInValue
}: StripePaymentButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleStripePayment = async () => {
    if (!user) {
      toast({ 
        title: 'Please sign in', 
        description: 'You need to be signed in to complete your purchase.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Prepare quote data for Stripe
      const stripeQuoteData = {
        motorModel: quoteData.motor?.model || 'Mercury Motor',
        horsepower: quoteData.motor?.hp || 0,
        motorPrice,
        accessoryCosts,
        installationCost: quoteData.installation?.selectedOption?.price || 0,
        tradeInCredit: hasTradeIn ? tradeInValue : 0,
        totalPrice: totalCashPrice,
        customerName: user.email,
        customerPhone: user.phone || ''
      };

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { quoteData: stripeQuoteData }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new window
        window.open(data.url, '_blank');
        toast({ 
          title: 'Redirecting to payment', 
          description: 'Opening Stripe checkout in a new window...' 
        });
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast({ 
        title: 'Payment Error', 
        description: error.message || 'Failed to initiate payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleStripePayment}
      disabled={loading}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Opening checkout...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pay ${totalCashPrice.toLocaleString()} with Card
        </>
      )}
    </Button>
  );
};