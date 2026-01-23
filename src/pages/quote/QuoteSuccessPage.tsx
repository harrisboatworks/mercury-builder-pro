import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Phone, Mail, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { SaveQuotePrompt } from '@/components/auth/SaveQuotePrompt';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export default function QuoteSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(false);
  const { user } = useAuth();

  const referenceNumber = searchParams.get('ref') || 'PENDING';
  const isOAuthCallback = searchParams.get('oauth') === 'google';
  
  // Get contact info from navigation state (passed from ScheduleConsultation)
  const contactInfo = location.state?.contactInfo as { name: string; email: string; phone: string } | undefined;
  const quoteId = location.state?.quoteId as string | undefined;

  // Handle OAuth callback - link quote to new user
  useEffect(() => {
    const linkQuoteToUser = async () => {
      if (isOAuthCallback && user && referenceNumber !== 'PENDING') {
        try {
          // Update saved_quotes to link to the new user
          const { error: quoteError } = await supabase
            .from('saved_quotes')
            .update({ user_id: user.id })
            .eq('email', user.email)
            .is('user_id', null);
          
          if (quoteError) {
            console.error('Error linking quote to user:', quoteError);
          }

          // Update profile with phone if available from OAuth user metadata or contact info
          const phone = contactInfo?.phone || user.user_metadata?.phone;
          if (phone) {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ 
                phone,
                display_name: contactInfo?.name || user.user_metadata?.full_name || user.user_metadata?.name
              })
              .eq('user_id', user.id);
            
            if (profileError) {
              console.error('Error updating profile:', profileError);
            }
          }
        } catch (err) {
          console.error('Error in OAuth callback handling:', err);
        }
      }
    };

    linkQuoteToUser();
  }, [isOAuthCallback, user, referenceNumber, contactInfo]);

  useEffect(() => {
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
            Quote Submitted!
          </h1>
          
          <p className="text-muted-foreground mb-6 text-lg">
            Thank you for requesting a quote. We've received your information and will be in touch shortly.
          </p>
          
          {/* Reference Number */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-6 mb-8 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Your Quote Reference Number</p>
            <code className="text-3xl font-mono font-bold text-primary tracking-wider">
              {referenceNumber}
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Save this number for your records
            </p>
          </div>

          {/* Save Quote Prompt - Only show if not logged in */}
          {!user && (
            <div className="mb-8">
              <SaveQuotePrompt 
                referenceNumber={referenceNumber}
                contactInfo={contactInfo}
                quoteId={quoteId}
              />
            </div>
          )}

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
                    <p className="font-medium text-foreground">Review</p>
                    <p className="text-sm text-muted-foreground">Our team will review your quote and prepare your motor</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Confirmation Call</p>
                    <p className="text-sm text-muted-foreground">You'll receive a call within 24 hours to discuss details</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Schedule</p>
                    <p className="text-sm text-muted-foreground">We'll arrange pickup or delivery at your convenience</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Complete Purchase</p>
                    <p className="text-sm text-muted-foreground">Finalize payment and take home your new Mercury motor</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t border-border pt-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Questions?
              </h3>
              <p className="text-muted-foreground text-sm mb-2">
                Our team is here to help:
              </p>
              <div className="flex flex-col gap-2">
                {/* SMS - Primary option */}
                <a 
                  href={`sms:${COMPANY_INFO.contact.sms.replace(/[^0-9]/g, '')}`}
                  className="text-primary hover:underline flex items-center gap-2 font-medium"
                >
                  <MessageSquare className="h-4 w-4" />
                  Text Us: {COMPANY_INFO.contact.sms}
                </a>
                <a 
                  href={`tel:${COMPANY_INFO.contact.phone}`}
                  className="text-primary hover:underline flex items-center gap-2 font-medium"
                >
                  <Phone className="h-4 w-4" />
                  Call: {COMPANY_INFO.contact.phone}
                </a>
                <a 
                  href={`mailto:${COMPANY_INFO.contact.email}`}
                  className="text-primary hover:underline flex items-center gap-2 font-medium"
                >
                  <Mail className="h-4 w-4" />
                  {COMPANY_INFO.contact.email}
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
              onClick={() => navigate('/quote/motor-selection')}
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
