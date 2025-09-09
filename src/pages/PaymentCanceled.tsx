import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";

export default function PaymentCanceled() {
  useEffect(() => {
    document.title = "Payment Canceled - Harris Boat Works";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Payment Canceled</CardTitle>
          <p className="text-muted-foreground">
            Your payment was canceled. No charges have been made to your account.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-secondary/50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What happened?</h3>
            <p className="text-sm text-muted-foreground">
              You chose to cancel the payment process or closed the payment window before completing your purchase.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Want to complete your purchase?</h3>
            <p className="text-sm text-blue-700 mb-3">
              Return to your quote summary to review your order and try again.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return Home
              </Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link to="/quote/summary">
                <CreditCard className="w-4 h-4 mr-2" />
                Try Payment Again
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