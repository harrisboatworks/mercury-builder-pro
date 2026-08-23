import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, Phone, Mail, Clock, CircleAlert, LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import confetti from "canvas-confetti";
import { COMPANY_INFO } from "@/lib/companyInfo";

import { useNoIndex } from '@/hooks/useNoIndex';
import { DEPOSIT_POLICY_PUBLIC_SUMMARY } from '../../supabase/functions/_shared/deposit-policy';
interface PaymentVerification {
  verified: boolean;
  paymentStatus: string;
  checkoutStatus: string | null;
  paymentIntentStatus: string | null;
  paymentType: string | null;
  amountPaid: number | null;
  currency: string | null;
  motorModel: string | null;
  createdAt: string;
}

export default function PaymentSuccess() {
  useNoIndex();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<PaymentVerification | null>(null);
  const [verificationError, setVerificationError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const { triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    if (!verification?.verified) return;

    document.title = "Payment Confirmed - Harris Boat Works";
    triggerHaptic('addedToQuote');

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

    const stepInterval = setInterval(() => {
      setVisibleSteps(prev => {
        if (prev >= 3) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 300);

    return () => clearInterval(stepInterval);
  }, [triggerHaptic, verification?.verified]);

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      if (!sessionId) {
        setVerificationError(true);
        setLoading(false);
        return;
      }

      try {
        for (let attempt = 0; attempt < 15; attempt += 1) {
          const { data, error } = await supabase.functions.invoke('create-payment', {
            body: { action: 'verify', sessionId },
          });
          if (cancelled) return;
          if (error) throw error;
          if (data?.verified) {
            setVerification(data as PaymentVerification);
            setProcessing(false);
            return;
          }

          const isDelayedPayment = data?.checkoutStatus === 'complete'
            && data?.paymentStatus === 'unpaid'
            && data?.paymentIntentStatus === 'processing';
          if (!isDelayedPayment) throw new Error('Payment is not verified');

          setProcessing(true);
          setLoading(false);
          if (attempt < 14) {
            await new Promise(resolve => window.setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Payment verification failed:', error);
        setVerificationError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verifyPayment();
    return () => {
      cancelled = true;
    };
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

  if (processing && !verification?.verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl border-0 shadow-2xl overflow-hidden">
          <CardHeader className="text-center bg-repower-navy-900 text-white py-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <LoaderCircle className="h-9 w-9 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">Your payment is processing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-7 text-center">
            <p className="text-muted-foreground">
              Stripe has not confirmed the payment yet. Keep your Stripe receipt; Harris Boat Works will email you after the payment clears.
            </p>
            <p className="text-sm text-muted-foreground">You can safely close this page.</p>
            <Button asChild variant="outline">
              <a href={`tel:${COMPANY_INFO.contact.phone.replace(/[^0-9]/g, '')}`}>Call {COMPANY_INFO.contact.phone}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationError || !verification?.verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl border-0 shadow-2xl overflow-hidden">
          <CardHeader className="text-center bg-repower-navy-900 text-white py-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <CircleAlert className="h-9 w-9" />
            </div>
            <CardTitle className="text-2xl font-bold">We could not verify this payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-7 text-center">
            <p className="text-muted-foreground">
              No payment has been confirmed on this page. If Stripe charged your card, contact Harris Boat Works and we will verify it using your receipt.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="flex-1">
                <a href={`tel:${COMPANY_INFO.contact.phone.replace(/[^0-9]/g, '')}`}>Call {COMPANY_INFO.contact.phone}</a>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/"><Home className="mr-2 h-4 w-4" />Return Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDeposit = verification.paymentType === 'motor_deposit';
  const timelineSteps = [
    { icon: CheckCircle, label: "Payment Confirmed", description: isDeposit ? "Your reservation deposit has been processed successfully" : "Your payment has been processed successfully", complete: true },
    isDeposit
      ? { icon: Mail, label: "Confirmation Email", description: "You'll receive a reservation-deposit confirmation email", complete: false, timing: "Usually within a few minutes" }
      : { icon: Clock, label: "Order Review", description: "Harris Boat Works will match the payment to your quote and review the order", complete: false, timing: "Within 1 business day" },
    { icon: Phone, label: "We'll Be In Touch", description: isDeposit ? "Our team will confirm the exact motor, availability, ETA, and next steps" : "Our team will contact you about the next steps for your order", complete: false, timing: "Within 1 business day" },
  ];

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
          <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-xl p-6 border border-border/50 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              {isDeposit ? 'Reservation Deposit Summary' : 'Payment Summary'}
            </h3>
            <div className="space-y-3">
              {verification.motorModel && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Motor Model</span>
                  <span className="font-medium">{verification.motorModel}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Payment Date</span>
                <span className="font-medium">{new Date(verification.createdAt).toLocaleDateString('en-CA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-primary/5 rounded-lg px-3 -mx-3">
                <span className="font-semibold">Total Paid</span>
                <span className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('en-CA', {
                    style: 'currency',
                    currency: verification.currency || 'CAD',
                  }).format(verification.amountPaid || 0)}
                </span>
              </div>
            </div>
          </div>

          {isDeposit && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm leading-relaxed text-foreground">
              {DEPOSIT_POLICY_PUBLIC_SUMMARY}
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
              <a href={`tel:${COMPANY_INFO.contact.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1 text-primary hover:underline">
                <Phone className="h-4 w-4" />
                {COMPANY_INFO.contact.phone}
              </a>
              <a href={`mailto:${COMPANY_INFO.contact.email}`} className="flex items-center gap-1 text-primary hover:underline">
                <Mail className="h-4 w-4" />
                {COMPANY_INFO.contact.email}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
