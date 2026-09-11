import { supabase } from "@/integrations/supabase/client";

export async function claimSavedQuotesForCurrentUser() {
  try {
    const { error: claimError } = await supabase.rpc(
      "claim_saved_quotes_for_current_user",
    );
    if (claimError) {
      console.warn("Could not reconcile guest saved quotes:", claimError);
    }
  } catch (claimError) {
    console.warn("Could not reconcile guest saved quotes:", claimError);
  }
}

/**
 * Reconcile pre-authentication guest saves, then load rows authorized by the
 * active RLS policy. Deliberately omit a client user-id filter so a client-first
 * rollout can still use the previous database's confirmed-email fallback. The
 * expand-compatible migration deliberately leaves existing SELECT/UPDATE RLS
 * in place for cached clients; owner-only tightening is a separate post-age-out
 * release. Claim failure remains non-fatal so already-owned quotes stay
 * available.
 */
export async function loadOwnedSavedQuotes() {
  await claimSavedQuotesForCurrentUser();

  return supabase
    .from("saved_quotes")
    .select("*")
    .or("is_soft_lead.is.null,is_soft_lead.eq.false")
    .order("created_at", { ascending: false });
}
