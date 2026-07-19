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
        // Fetch via edge function to bypass RLS for shared links
        const { data: quote, error } = await supabase.functions.invoke('get-shared-quote', {
          body: { quoteId }
        });

        if (error || !quote || quote.error) {
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
          // Restore motor (handle both 'motor' and 'selectedMotor' keys, plus flat-field fallback for agent-created quotes)
          let motorData = quoteData.motor || quoteData.selectedMotor;
          if (!motorData && quoteData.motorId) {
            motorData = {
              id: quoteData.motorId,
              model: quoteData.motorModel,
              hp: quoteData.motorHp,
              price: quoteData.motorPrice,
              msrp: quoteData.motorMsrp,
            };
          }
          // Restore the saved state atomically. Dispatching SET_MOTOR first can
          // legitimately clear motor-dependent fields before later dispatches,
          // which made QR resumes lose the authoritative PDF snapshot and other
          // quote details during the same render.
          dispatch({
            type: 'RESTORE_QUOTE',
            payload: {
              ...quoteData,
              motor: motorData || null,
              customerName: quoteData.customerName ?? quote.customer_name ?? '',
              customerEmail: quoteData.customerEmail ?? '',
              customerPhone: quoteData.customerPhone ?? '',
              customerNotes: quoteData.customerNotes ?? quote.customer_notes ?? '',
              isAdminQuote: quoteData.isAdminQuote ?? quote.is_admin_quote ?? false,
            },
          });

          if (quoteData.isAdminQuote || quote.is_admin_quote) {
            dispatch({
              type: 'SET_ADMIN_MODE',
              payload: { isAdmin: true, editingQuoteId: quoteId },
            });
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
