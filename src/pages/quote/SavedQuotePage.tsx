import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuote } from "@/contexts/QuoteContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SavedQuotePage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { dispatch } = useQuote();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSavedQuote = async () => {
      if (!quoteId) {
        toast({
          title: "Invalid quote link",
          description: "The quote link is invalid or expired.",
          variant: "destructive",
        });
        navigate('/quote/motor-selection');
        return;
      }

      try {
        // Fetch the saved quote
        const { data: quote, error } = await supabase
          .from('customer_quotes')
          .select('*')
          .eq('id', quoteId)
          .single();

        if (error || !quote) {
          toast({
            title: "Quote not found",
            description: "We couldn't find this saved quote. It may have been deleted.",
            variant: "destructive",
          });
          navigate('/quote/motor-selection');
          return;
        }

        // Restore the quote data to context
        const quoteData = quote.quote_data;
        
        if (quoteData) {
          // Restore motor (handle both 'motor' and 'selectedMotor' keys)
          const motorData = quoteData.motor || quoteData.selectedMotor;
          if (motorData) {
            dispatch({ type: 'SET_MOTOR', payload: motorData });
          }
          if (quoteData.purchasePath) {
            dispatch({ type: 'SET_PURCHASE_PATH', payload: quoteData.purchasePath });
          }
          if (quoteData.boatInfo) {
            dispatch({ type: 'SET_BOAT_INFO', payload: quoteData.boatInfo });
          }
          if (quoteData.fuelTankConfig) {
            dispatch({ type: 'SET_FUEL_TANK_CONFIG', payload: quoteData.fuelTankConfig });
          }
          if (quoteData.tradeInInfo) {
            dispatch({ type: 'SET_TRADE_IN_INFO', payload: quoteData.tradeInInfo });
          }
          if (quoteData.installConfig) {
            dispatch({ type: 'SET_INSTALL_CONFIG', payload: quoteData.installConfig });
          }
          if (quoteData.warrantyConfig) {
            dispatch({ type: 'SET_WARRANTY_CONFIG', payload: quoteData.warrantyConfig });
          }
          if (quoteData.selectedOptions) {
            dispatch({ type: 'SET_SELECTED_OPTIONS', payload: quoteData.selectedOptions });
          }
          if (quoteData.selectedPackage) {
            dispatch({ type: 'SET_SELECTED_PACKAGE', payload: quoteData.selectedPackage });
          }
          if (quoteData.looseMotorBattery) {
            dispatch({ type: 'SET_LOOSE_MOTOR_BATTERY', payload: quoteData.looseMotorBattery });
          }
          
          // Restore promo selection with full details
          if (quoteData.selectedPromoOption) {
            dispatch({ 
              type: 'SET_PROMO_DETAILS', 
              payload: {
                option: quoteData.selectedPromoOption,
                rate: quoteData.selectedPromoRate,
                term: quoteData.selectedPromoTerm,
                value: quoteData.selectedPromoValue
              }
            });
          }
          
          // Restore admin fields from quote_data OR direct columns
          const adminDiscountValue = quoteData.adminDiscount ?? quote.admin_discount ?? 0;
          const adminNotesValue = quoteData.adminNotes ?? quote.admin_notes ?? '';
          const customerNotesValue = quoteData.customerNotes ?? quote.customer_notes ?? '';
          
          if (adminDiscountValue > 0 || adminNotesValue || customerNotesValue || quoteData.isAdminQuote || quote.is_admin_quote) {
            dispatch({ 
              type: 'SET_ADMIN_QUOTE_DATA', 
              payload: { 
                adminDiscount: adminDiscountValue,
                adminNotes: adminNotesValue,
                customerNotes: customerNotesValue
              }
            });
            
            // Set admin mode with the quote ID for potential editing
            if (quoteData.isAdminQuote || quote.is_admin_quote) {
              dispatch({ 
                type: 'SET_ADMIN_MODE', 
                payload: { isAdmin: true, editingQuoteId: quoteId }
              });
            }
          }
        }

        // Navigate to summary page
        navigate('/quote/summary');
      } catch (error) {
        console.error('Error loading saved quote:', error);
        toast({
          title: "Error loading quote",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
        navigate('/quote/motor-selection');
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedQuote();
  }, [quoteId, dispatch, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Loading your saved quote...</h2>
          <p className="text-muted-foreground">Please wait while we restore your configuration</p>
        </div>
      </div>
    );
  }

  return null;
}
