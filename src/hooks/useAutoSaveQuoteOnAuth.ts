import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuote } from '@/contexts/QuoteContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Watches for a user returning from Google OAuth on the summary page.
 * When `?auth_save=1` is in the URL and the user just authenticated,
 * auto-saves the current quote state to `saved_quotes` and notifies admin.
 */
export function useAutoSaveQuoteOnAuth() {
  const { user, loading: authLoading } = useAuth();
  const { state, getQuoteData } = useQuote();
  const { toast } = useToast();
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (authLoading || hasFiredRef.current) return;

    // Only fire if returning from OAuth with the auth_save flag
    const params = new URLSearchParams(window.location.search);
    if (!params.get('auth_save')) return;

    if (!user) return;
    if (!state.motor) return;

    hasFiredRef.current = true;

    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('auth_save');
    window.history.replaceState({}, '', url.pathname + url.search);

    // Perform the save
    (async () => {
      try {
        const quoteData = getQuoteData();
        const motorModel = state.motor?.model || 'Mercury Motor';
        const hp = state.motor?.hp || 0;

        // Generate resume token
        const tokenArray = new Uint8Array(24);
        crypto.getRandomValues(tokenArray);
        const resumeToken = `quote_${Array.from(tokenArray, b => b.toString(16).padStart(2, '0')).join('')}`;
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const { data: savedQuote, error } = await supabase
          .from('saved_quotes')
          .insert({
            email: user.email || '',
            resume_token: resumeToken,
            quote_state: state as any,
            user_id: user.id,
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('Auto-save quote error:', error);
          toast({
            title: 'Could not save quote',
            description: 'Please try again or use "Email Me This Quote".',
            variant: 'destructive',
          });
          return;
        }

        // Store ID for other features (QR, PDF, etc.)
        if (savedQuote?.id) {
          localStorage.setItem('current_saved_quote_id', savedQuote.id);
        }

        toast({
          title: '✓ Quote saved to your account',
          description: 'You can access it anytime from My Quotes.',
        });

        // Admin notifications (non-blocking)
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || 'Google User';
        const finalPrice = quoteData.motor?.price || 0;

        supabase.functions.invoke('send-quote-email', {
          body: {
            customerName: userName,
            customerEmail: user.email,
            quoteNumber: savedQuote.id?.slice(0, 8)?.toUpperCase() || 'NEW',
            motorModel,
            totalPrice: finalPrice,
            emailType: 'admin_quote_notification',
            leadData: {
              leadScore: 0,
              leadSource: 'google_auth_save',
            },
          },
        }).catch(() => {});

        supabase.functions.invoke('send-sms', {
          body: {
            to: 'admin',
            message: `📋 GOOGLE SAVE QUOTE!\n\nName: ${userName}\nEmail: ${user.email}\nMotor: ${motorModel} ${hp}HP\nPrice: $${finalPrice.toLocaleString()}\n\nAction: Follow up!\n\n- Harris Boat Works`,
            messageType: 'saved_quote_alert',
          },
        }).catch(() => {});

        // Send customer their saved quote email
        supabase.functions.invoke('send-saved-quote-email', {
          body: {
            customerEmail: user.email,
            customerName: userName,
            quoteId: savedQuote.id,
            savedQuoteId: savedQuote.id,
            resumeToken,
            motorModel,
            finalPrice,
            quoteData: state,
            includeAccountInfo: false,
          },
        }).catch(() => {});

      } catch (err) {
        console.error('Auto-save quote failed:', err);
      }
    })();
  }, [authLoading, user, state.motor]);
}
