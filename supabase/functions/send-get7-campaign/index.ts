// RETIRED (Oct 16 2026, approved by Jay).
//
// This function used to email and text the entire customer list with
// Mercury's "Get 7" promotion. Its offer text and end date were hard-coded and
// expired in spring 2026, so it is now a stub that sends nothing.
// Every request gets 410 Gone. It reads no secrets, parses no body and
// contacts no email or SMS provider.
//
// It stays deployed as a stub (rather than deleted) so the previously deployed
// version can't keep running with stale offers. Future promo campaigns should
// read the live `promotions` table instead of hard-coding offer text.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return new Response(
    JSON.stringify({ success: false, error: "The GET7 campaign has been retired. Nothing was sent." }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
