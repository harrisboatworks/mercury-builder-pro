import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Phone, Mail } from 'lucide-react';
import { useFinancing } from '@/contexts/FinancingContext';
import confetti from 'canvas-confetti';
import { clearFinancingStorage } from '@/lib/financingApplicationApi';
import harrisLogo from '@/assets/harris-logo-white.png';
import mercuryLogo from '@/assets/mercury-logo-white.png';

import { useNoIndex } from '@/hooks/useNoIndex';
export default function FinancingSuccess() {
  useNoIndex();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useFinancing();
  const [showConfetti, setShowConfetti] = useState(false);

  const applicationId = searchParams.get('id') || state.applicationId;
  const referenceNumber = applicationId?.substring(0, 8).toUpperCase() || 'PENDING';

  useEffect(() => {
    // Clear localStorage after successful submission
    clearFinancingStorage();
    
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
    <div className="min-h-screen bg-repower-paper">
      <header className="border-b border-white/10 bg-repower-navy-900">
        <div className="mx-auto flex h-[72px] max-w-[1000px] items-center gap-5 px-4 sm:px-6">
          <img src={harrisLogo} alt="Harris Boat Works" className="h-10 w-auto" />
          <span className="h-8 w-px bg-white/20" aria-hidden="true" />
          <img src={mercuryLogo} alt="Mercury Repower Center" className="h-7 w-auto" />
        </div>
      </header>

      <main className="mx-auto max-w-[860px] px-4 py-10 sm:px-6 md:py-16">
        <Card className="rounded-sm border-repower-navy-900/10 bg-white p-6 shadow-[0_22px_60px_-40px_rgba(5,18,36,0.45)] sm:p-10 md:p-12">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-repower-gold/20">
                <CheckCircle2 className="h-9 w-9 text-repower-navy-900" />
              </div>
            </div>
            <p className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-repower-mercury-red">Securely received</p>
            <h1 className="font-display text-[clamp(34px,6vw,52px)] font-bold leading-none tracking-[-0.025em] text-repower-navy-900">
              Application submitted
            </h1>
            <p className="mx-auto mt-4 max-w-xl font-sans text-[16px] leading-relaxed text-repower-navy-900/65">
              Thank you. The Harris Boat Works financing team will review your information and contact you if anything else is needed.
            </p>

            <div className="mx-auto my-8 max-w-md rounded-sm border border-repower-gold/40 bg-repower-cream p-5">
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-repower-navy-900/50">Reference number</p>
              <code className="mt-2 block font-mono text-2xl font-bold tracking-[0.08em] text-repower-navy-900 sm:text-3xl">
                #{referenceNumber}
              </code>
              <p className="mt-2 font-sans text-xs text-repower-navy-900/50">Keep this number for your records.</p>
            </div>
          </div>

          <div className="border-t border-repower-navy-900/10 pt-8">
            <h2 className="mb-5 flex items-center gap-2 font-display text-2xl font-semibold text-repower-navy-900">
              <ArrowRight className="h-5 w-5 text-repower-mercury-red" />
              What happens next
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['1', 'Personal review', 'Our team checks the application and confirms the lender fit.'],
                ['2', 'Quick follow-up', 'We will call or email if a detail or document is needed.'],
                ['3', 'Clear next steps', 'We explain the decision and help you finish the purchase.'],
              ].map(([number, title, description]) => (
                <div key={number} className="border border-repower-navy-900/10 bg-repower-paper p-4">
                  <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-repower-navy-900 font-sans text-[11px] font-bold text-white">{number}</div>
                  <p className="font-display font-semibold text-repower-navy-900">{title}</p>
                  <p className="mt-1 font-sans text-[13px] leading-relaxed text-repower-navy-900/60">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-repower-navy-900/10 pt-7">
            <h3 className="font-display text-lg font-semibold text-repower-navy-900">Questions?</h3>
            <p className="mt-1 font-sans text-sm text-repower-navy-900/60">Talk directly with Harris Boat Works.</p>
            <div className="mt-4 flex flex-col gap-3 font-sans text-sm font-semibold sm:flex-row sm:gap-6">
              <a href="tel:+19053422153" className="inline-flex items-center gap-2 text-repower-navy-900 hover:text-repower-mercury-red">
                <Phone className="h-4 w-4 text-repower-gold" />
                (905) 342-2153
              </a>
              <a href="mailto:info@harrisboatworks.ca" className="inline-flex items-center gap-2 text-repower-navy-900 hover:text-repower-mercury-red">
                <Mail className="h-4 w-4 text-repower-gold" />
                info@harrisboatworks.ca
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-repower-navy-900/10 pt-7 sm:flex-row">
            <Button
              onClick={() => navigate('/')}
              className="h-12 flex-1 rounded-none bg-repower-navy-900 font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-white"
            >
              Return home
            </Button>
            <Button
              onClick={() => navigate('/quote')}
              variant="outline"
              className="h-12 flex-1 rounded-none border-repower-navy-900/20 bg-white font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-repower-navy-900"
            >
              Build another quote
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
