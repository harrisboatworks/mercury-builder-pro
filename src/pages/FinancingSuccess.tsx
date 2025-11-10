import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, ArrowRight, Phone, Mail } from 'lucide-react';
import { useFinancing } from '@/contexts/FinancingContext';
import confetti from 'canvas-confetti';

export default function FinancingSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useFinancing();
  const [showConfetti, setShowConfetti] = useState(false);

  const applicationId = searchParams.get('id') || state.applicationId;
  const referenceNumber = applicationId?.substring(0, 8).toUpperCase() || 'PENDING';

  useEffect(() => {
    // Clear localStorage after successful submission
    localStorage.removeItem('financingApplication');
    
    // Trigger confetti animation
    if (!showConfetti) {
      setShowConfetti(true);
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        confetti({
          particleCount: 3,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        });
      }, 150);
    }
  }, [showConfetti]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background flex items-center justify-center px-4 py-12">
      <Card className="p-8 max-w-2xl w-full shadow-xl">
        <div className="text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
              <CheckCircle2 className="w-20 h-20 text-green-500 relative" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Application Submitted!
          </h1>
          
          <p className="text-muted-foreground mb-6 text-lg">
            Thank you for submitting your financing application.
          </p>
          
          {/* Reference Number */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-6 mb-8 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Your Reference Number</p>
            <code className="text-3xl font-mono font-bold text-primary tracking-wider">
              #{referenceNumber}
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Save this number for your records
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-6 text-left mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <ArrowRight className="h-6 w-6 text-primary" />
                What Happens Next?
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Review Period</p>
                    <p className="text-sm text-muted-foreground">Our financing team will review your application within 24-48 hours</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Additional Information</p>
                    <p className="text-sm text-muted-foreground">We may contact you if we need additional information</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Decision Notification</p>
                    <p className="text-sm text-muted-foreground">You'll receive an email and phone call with the financing decision</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Finalize Your Purchase</p>
                    <p className="text-sm text-muted-foreground">Once approved, we'll guide you through the final steps to complete your motor purchase</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t border-border pt-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Questions?
              </h3>
              <p className="text-muted-foreground text-sm mb-2">
                Our financing team is here to help:
              </p>
              <div className="flex flex-col gap-2">
                <a 
                  href="tel:1-800-555-0123" 
                  className="text-primary hover:underline flex items-center gap-2 font-medium"
                >
                  <Phone className="h-4 w-4" />
                  1-800-555-0123
                </a>
                <a 
                  href="mailto:financing@harrisboatworks.com" 
                  className="text-primary hover:underline flex items-center gap-2 font-medium"
                >
                  <Mail className="h-4 w-4" />
                  financing@harrisboatworks.com
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="gap-2"
            >
              Return Home
            </Button>
            <Button
              onClick={() => navigate('/quote/new')}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              Get Another Quote
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
