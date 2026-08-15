import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Phone, Mail, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { SaveQuotePrompt } from '@/components/auth/SaveQuotePrompt';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuote } from '@/contexts/QuoteContext';
import { clearQuoteId, getQuoteId, trackClaritySubmission, trackEvent } from '@/lib/analytics';

import { useNoIndex } from '@/hooks/useNoIndex';
export default function QuoteSuccessPage() {
  useNoIndex();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(false);
  const { user } = useAuth();
  const { state: quoteState } = useQuote();
  const firedRef = useRef(false);

  const referenceNumber = searchParams.get('ref') || 'PENDING';
  const isOAuthCallback = searchParams.get('oauth') === 'google';
  
  // Get contact info from navigation state (passed from ScheduleConsultation)
  const contactInfo = location.state?.contactInfo as { name: string; email: string; phone: string } | undefined;
  const quoteId = location.state?.quoteId as string | undefined;

  // Fire quote_complete once. Only fires if a quote_id exists (prevents bookmark re-fires).
  useEffect(() => {
    if (firedRef.current) return;
    const qid = getQuoteId() || searchParams.get('quote_id') || quoteId;
    if (!qid) return;
    firedRef.current = true;
    const m: any = quoteState?.motor || {};
    const b: any = quoteState?.boatInfo || {};
    const fsa = (b.postalCode || '').toString().replace(/\s+/g, '').slice(0, 3).toUpperCase();
    const price = Number(m.price || 0);
    trackEvent('quote_complete', {
      motor_model: m.model || '',
      motor_hp: Number(m.hp || 0),
      price_cad: price,
      value: price,
      currency: 'CAD',
      financing_selected: Boolean(quoteState?.financing?.term),
      trade_in: quoteState?.tradeInInfo?.hasTradeIn ? 'yes' : 'no',
      boat_make: b.make || '',
      boat_year: Number(b.year || 0) || 0,
      postal_code_fsa: fsa,
      quote_id: qid,
    });
    trackClaritySubmission('quote');
    clearQuoteId();
  }, [quoteState, quoteId, searchParams]);


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
    <div className="min-h-screen bg-repower-paper flex items-center justify-center px-4 sm:px-6 md:px-14 py-10 sm:py-14 md:py-20">
      <div className="bg-white border border-repower-navy-900/10 p-6 sm:p-8 md:p-12 max-w-2xl w-full">
        <div className="text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-repower-cream border border-repower-gold/40">
              <span className="absolute inset-0 rounded-full bg-repower-gold/15 animate-ping" />
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-repower-gold relative" strokeWidth={1.75} />
            </div>
          </div>

          {/* Eyebrow + H1 */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-8 bg-repower-mercury-red" />
            <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red">
              Received
            </p>
            <span className="h-px w-8 bg-repower-mercury-red" />
          </div>

          <h1 className="font-display font-bold text-repower-navy-900 mb-4" style={{ fontSize: 'clamp(32px, 4vw, 44px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Quote request received
          </h1>

          <p className="font-sans text-[16px] font-semibold text-repower-navy-900 mb-3 max-w-[52ch] mx-auto">
            We usually respond within 1 business day.
          </p>
          <p className="font-sans text-[15px] text-repower-navy-900/65 mb-8 max-w-[52ch] mx-auto">
            Thanks for sending your details to Harris Boat Works. A real person reviews every quote.
          </p>

          {/* Reference Number */}
          <div className="bg-repower-cream border border-repower-navy-900/10 p-5 sm:p-6 mb-8">
            <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-navy-900/55 mb-2">Your Quote Reference Number</p>
            <code className="block font-display text-[24px] sm:text-[28px] md:text-[32px] font-bold text-repower-navy-900 tracking-[0.1em] break-all">
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
              <h2 className="font-display font-bold text-[20px] sm:text-[22px] text-repower-navy-900 mb-5 flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                <ArrowRight className="h-5 w-5 text-repower-mercury-red shrink-0" strokeWidth={1.75} />
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
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-[15px] text-repower-navy-900">{step.title}</p>
                      <p className="font-sans text-[13px] text-repower-navy-900/65 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Contact Information */}
            <div className="border-t border-repower-navy-900/10 pt-6">
              <h3 className="font-display font-semibold text-[16px] text-repower-navy-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-repower-mercury-red shrink-0" strokeWidth={1.75} />
                Questions?
              </h3>
              <p className="font-sans text-[14px] text-repower-navy-900/65 mb-3">
                Our team is here to help:
              </p>
              <div className="flex flex-col gap-2">
                <a href={`sms:${COMPANY_INFO.contact.sms.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 font-sans text-[14px] font-semibold text-repower-navy-900 hover:text-repower-mercury-red transition-colors break-all">
                  <MessageSquare className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  Text Us: {COMPANY_INFO.contact.sms}
                </a>
                <a href={`tel:${COMPANY_INFO.contact.phone}`} className="inline-flex items-center gap-2 font-sans text-[14px] font-semibold text-repower-navy-900 hover:text-repower-mercury-red transition-colors break-all">
                  <Phone className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  Call: {COMPANY_INFO.contact.phone}
                </a>
                <a href={`mailto:${COMPANY_INFO.contact.email}`} className="inline-flex items-center gap-2 font-sans text-[14px] font-semibold text-repower-navy-900 hover:text-repower-mercury-red transition-colors break-all">
                  <Mail className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {COMPANY_INFO.contact.email}
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-repower-mercury-red text-repower-cream px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors"
            >
              Return Home
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => navigate('/quote/motor-selection')}
              className="w-full sm:w-auto inline-flex items-center justify-center border border-repower-navy-900/20 bg-white text-repower-navy-900 px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:border-repower-navy-900 transition-colors"
            >
              Get Another Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
