import { supabase } from '@/integrations/supabase/client';

/**
 * Reconcile pre-authentication guest saves, then load rows with explicit
 * account ownership. Claim failure is non-fatal so existing owned quotes stay
 * available during a transient migration or network problem.
 */
export async function loadOwnedSavedQuotes(userId: string) {
  try {
    const { error: claimError } = await supabase
      .rpc('claim_saved_quotes_for_current_user');
    if (claimError) {
      console.warn('Could not reconcile guest saved quotes:', claimError);
    }
  } catch (claimError) {
    console.warn('Could not reconcile guest saved quotes:', claimError);
  }

  return supabase
    .from('saved_quotes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}
