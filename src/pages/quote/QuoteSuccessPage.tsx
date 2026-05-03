import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
    <div className="min-h-screen bg-repower-paper flex items-center justify-center px-6 md:px-14 py-14 md:py-20">
      <div className="bg-white border border-repower-navy-900/10 p-8 md:p-12 max-w-2xl w-full">
        <div className="text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-repower-cream border border-repower-gold/40">
              <span className="absolute inset-0 rounded-full bg-repower-gold/15 animate-ping" />
              <CheckCircle2 className="w-10 h-10 text-repower-gold relative" strokeWidth={1.75} />
            </div>
          </div>

          {/* Eyebrow + H1 */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-8 bg-repower-mercury-red" />
            <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-mercury-red">
              Confirmed
            </p>
            <span className="h-px w-8 bg-repower-mercury-red" />
          </div>

          <h1 className="font-display font-bold text-repower-navy-900 mb-4" style={{ fontSize: 'clamp(32px, 4vw, 44px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Quote Submitted!
          </h1>

          <p className="font-sans text-[16px] text-repower-navy-900/65 mb-8 max-w-[52ch] mx-auto">
            Thank you for requesting a quote. We've received your information and will be in touch shortly.
          </p>

          {/* Reference Number */}
          <div className="bg-repower-cream border border-repower-navy-900/10 p-6 mb-8">
            <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-navy-900/55 mb-2">Your Quote Reference Number</p>
            <code className="block font-display text-[28px] md:text-[32px] font-bold text-repower-navy-900 tracking-[0.1em]">
              {referenceNumber}
            </code>
            <p className="font-sans text-[12px] text-repower-navy-900/55 mt-2">
              Save this number for your records
            </p>
          </div>

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
          <div className="space-y-8 text-left mb-8">
            <div>
              <h2 className="font-display font-bold text-[22px] text-repower-navy-900 mb-5 flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                <ArrowRight className="h-5 w-5 text-repower-mercury-red" strokeWidth={1.75} />
                What Happens Next?
              </h2>
              <ol className="space-y-3">
                {[
                  { title: 'Review', desc: 'Our team will review your quote and prepare your motor' },
                  { title: 'Confirmation Call', desc: "You'll receive a call within 24 hours to discuss details" },
                  { title: 'Schedule', desc: "We'll schedule your pickup at our Gores Landing location" },
                  { title: 'Complete Purchase', desc: 'Finalize payment and take home your new Mercury motor' },
                ].map((step, i) => (
                  <li key={i} className="flex gap-4 p-4 bg-repower-paper border border-repower-navy-900/10">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full border border-repower-navy-900/20 bg-white flex items-center justify-center font-display font-bold text-[14px] text-repower-navy-900">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-semibold text-[15px] text-repower-navy-900">{step.title}</p>
                      <p className="font-sans text-[13px] text-repower-navy-900/65 mt-0.5">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Contact Information */}
            <div className="border-t border-repower-navy-900/10 pt-6">
              <h3 className="font-display font-semibold text-[16px] text-repower-navy-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-repower-mercury-red" strokeWidth={1.75} />
                Questions?
              </h3>
              <p className="font-sans text-[14px] text-repower-navy-900/65 mb-3">
                Our team is here to help:
              </p>
              <div className="flex flex-col gap-2">
                <a href={`sms:${COMPANY_INFO.contact.sms.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 font-sans text-[14px] font-semibold text-repower-navy-900 hover:text-repower-mercury-red transition-colors">
                  <MessageSquare className="h-4 w-4" />
                  Text Us: {COMPANY_INFO.contact.sms}
                </a>
                <a href={`tel:${COMPANY_INFO.contact.phone}`} className="inline-flex items-center gap-2 font-sans text-[14px] font-semibold text-repower-navy-900 hover:text-repower-mercury-red transition-colors">
                  <Phone className="h-4 w-4" />
                  Call: {COMPANY_INFO.contact.phone}
                </a>
                <a href={`mailto:${COMPANY_INFO.contact.email}`} className="inline-flex items-center gap-2 font-sans text-[14px] font-semibold text-repower-navy-900 hover:text-repower-mercury-red transition-colors">
                  <Mail className="h-4 w-4" />
                  {COMPANY_INFO.contact.email}
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="group inline-flex items-center justify-center gap-2 bg-repower-mercury-red text-repower-cream px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors"
            >
              Return Home
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => navigate('/quote/motor-selection')}
              className="inline-flex items-center justify-center border border-repower-navy-900/20 bg-white text-repower-navy-900 px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:border-repower-navy-900 transition-colors"
            >
              Get Another Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
