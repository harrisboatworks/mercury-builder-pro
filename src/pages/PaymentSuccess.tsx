import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<any>(null);

  useEffect(() => {
    document.title = "Payment Successful - Harris Boat Works";
    
    const fetchQuoteData = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Find the quote associated with this Stripe session
        const { data: quotes, error } = await supabase
          .from('quotes')
          .select('*')
          .contains('quote_data', { stripe_session_id: sessionId })
          .single();

        if (error) {
          console.error('Error fetching quote:', error);
        } else {
          setQuoteData(quotes);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {quoteData && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Motor Model:</span>
                  <span>{quoteData.motor_model}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold">${quoteData.total_price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Date:</span>
                  <span>{new Date(quoteData.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• You'll receive a confirmation email shortly</li>
              <li>• Our team will contact you within 1 business day</li>
              <li>• We'll schedule your motor installation</li>
              <li>• Delivery typically takes 2-4 weeks</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {quoteData?.pdf_url && (
              <Button variant="outline" className="flex-1" asChild>
                <a href={quoteData.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </a>
              </Button>
            )}
            <Button className="flex-1" asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Need help? Contact us at <a href="tel:+1234567890" className="text-primary hover:underline">(123) 456-7890</a></p>
            <p>or email <a href="mailto:support@harrisboatworks.com" className="text-primary hover:underline">support@harrisboatworks.com</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}