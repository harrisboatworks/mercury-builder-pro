import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Home, Phone, Mail, Clock, Package, Wrench, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

const timelineSteps = [
  { icon: CheckCircle, label: "Payment Confirmed", description: "Your payment has been processed", complete: true },
  { icon: Mail, label: "Confirmation Email", description: "You'll receive details shortly", complete: false, timing: "Within 5 minutes" },
  { icon: Phone, label: "Team Contact", description: "We'll reach out to discuss details", complete: false, timing: "Within 1 business day" },
  { icon: Package, label: "Order Processing", description: "Your motor is being prepared", complete: false, timing: "1-2 business days" },
  { icon: Wrench, label: "Installation Scheduled", description: "We'll coordinate installation timing", complete: false, timing: "2-3 business days" },
  { icon: Truck, label: "Delivery & Installation", description: "Your new motor arrives", complete: false, timing: "2-4 weeks" },
];

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    document.title = "Payment Successful - Harris Boat Works";
    
    // Trigger celebration confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Animate timeline steps
    const stepInterval = setInterval(() => {
      setVisibleSteps(prev => {
        if (prev >= timelineSteps.length) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 300);

    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
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
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl border-0 shadow-2xl overflow-hidden">
        {/* Success Header with Animation */}
        <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white py-10">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm animate-scale-in">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold animate-fade-in">Payment Successful!</CardTitle>
          <p className="text-green-100 mt-2 animate-fade-in" style={{ animationDelay: '150ms' }}>
            Thank you for choosing Harris Boat Works
          </p>
        </CardHeader>
        
        <CardContent className="p-6 md:p-8 space-y-8">
          {/* Order Summary */}
          {quoteData && (
            <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-xl p-6 border border-border/50 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Order Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Motor Model</span>
                  <span className="font-medium">{quoteData.motor_model}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Order Date</span>
                  <span className="font-medium">{new Date(quoteData.created_at).toLocaleDateString('en-CA', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-primary/5 rounded-lg px-3 -mx-3">
                  <span className="font-semibold">Total Paid</span>
                  <span className="text-2xl font-bold text-primary">${quoteData.total_price?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Animated Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              What Happens Next
            </h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-green-500 via-primary/30 to-border" />
              
              <div className="space-y-4">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isVisible = index < visibleSteps;
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-start gap-4 transition-all duration-500 ${
                        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        step.complete 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'bg-background border-border text-muted-foreground'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-medium">{step.label}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        {step.timing && (
                          <p className="text-xs text-primary mt-1">{step.timing}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {quoteData?.pdf_url && (
              <Button 
                variant="outline" 
                className="flex-1 h-12 border-2 hover:bg-secondary transition-all duration-300" 
                asChild
              >
                <a href={quoteData.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </a>
              </Button>
            )}
            <Button 
              className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300" 
              asChild
            >
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Link>
            </Button>
          </div>

          {/* Contact Info */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Questions about your order?</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a href="tel:+17058876568" className="flex items-center gap-1 text-primary hover:underline">
                <Phone className="h-4 w-4" />
                (705) 887-6568
              </a>
              <a href="mailto:info@harrisboatworks.com" className="flex items-center gap-1 text-primary hover:underline">
                <Mail className="h-4 w-4" />
                info@harrisboatworks.com
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
