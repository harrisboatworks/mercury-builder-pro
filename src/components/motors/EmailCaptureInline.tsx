import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Lightweight inline email capture — shows after the motor grid.
 * Writes to email_sequence_queue with sequence_type = 'pricing_updates'.
 */
export function EmailCaptureInline() {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dismissed, setDismissed] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    // Basic validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setStatus('loading');

    try {
      const { error } = await supabase.from('email_sequence_queue').insert({
        email: email.trim().toLowerCase(),
        sequence_type: 'pricing_updates',
        status: 'active',
        metadata: {
          source: 'motor_selection_inline',
          captured_at: new Date().toISOString(),
          device: isMobile ? 'mobile' : 'desktop',
        },
      });

      if (error) throw error;

      setStatus('success');

      // Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'lead_capture', {
          source: 'motor_selection_inline',
          method: 'email',
        });
      }
    } catch {
      setStatus('error');
      // Reset after a moment so user can retry
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [email, status, isMobile]);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="relative max-w-lg mx-auto mt-8 mb-4 px-4"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 text-center justify-center py-1"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-foreground">
                You're in! We'll notify you of deals &amp; new arrivals.
              </span>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Get pricing updates &amp; deal alerts
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 
                    text-sm placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                    disabled:opacity-50"
                  disabled={status === 'loading'}
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || !email}
                  className="h-10 px-4 rounded-lg bg-[hsl(var(--cta-navy))] text-white text-sm font-medium
                    active:scale-[0.97] active:bg-[hsl(var(--cta-navy-active))]
                    disabled:opacity-50 transition-all duration-150 touch-manipulation
                    flex items-center gap-1.5 whitespace-nowrap"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Notify Me'
                  )}
                </button>
              </div>

              {status === 'error' && (
                <p className="text-xs text-destructive">
                  Something went wrong. Please try again.
                </p>
              )}

              <p className="text-[11px] text-muted-foreground">
                No spam. Unsubscribe anytime.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Dismiss */}
      {status !== 'success' && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-6 text-gray-300 hover:text-gray-500 text-xs p-1"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </motion.div>
  );
}
