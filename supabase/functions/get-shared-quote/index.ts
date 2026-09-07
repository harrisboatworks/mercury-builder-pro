import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { corsHeaders } from "../_shared/cors.ts";
import {
  buildPublicQuoteResponse,
  isSavedQuotePubliclyReadable,
} from "./public-quote.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Fast warm-up ping — no DB hit, just wake the isolate
    if (body?.ping) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { quoteId } = body;

    if (!quoteId || typeof quoteId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid quoteId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(quoteId)) {
      return new Response(
        JSON.stringify({ error: "Invalid quote ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // First try saved_quotes table (used by "Save Quote" email links)
    const { data: savedQuote, error: savedError } = await supabase
      .from("saved_quotes")
      .select("id, quote_state, expires_at, is_soft_lead")
      .eq("id", quoteId)
      .maybeSingle();

    // A read failure cannot be treated as "not found" or an expired dual-write
    // could incorrectly fall through to its customer_quotes copy.
    if (savedError) throw savedError;

    if (savedQuote) {
      // A UUID is a bearer capability only for an intentional, unexpired save.
      // Soft leads are analytics state and are never customer share links.
      if (!isSavedQuotePubliclyReadable(savedQuote)) {
        return new Response(
          JSON.stringify({ error: "Quote not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Keep access telemetry atomic without exposing the row to public roles.
      const { error: accessError } = await supabase.rpc("increment_saved_quote_access", {
        p_quote_id: quoteId,
      });
      if (accessError) {
        console.warn("Could not update shared quote access telemetry:", accessError.message);
      }

      return new Response(
        JSON.stringify(buildPublicQuoteResponse({
          id: savedQuote.id,
          quoteData: savedQuote.quote_state,
        })),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fall back to customer_quotes table (used by share links).
    // Do NOT select admin_notes / admin_discount — these are internal-only.
    const { data: quote, error } = await supabase
      .from("customer_quotes")
      .select("id, quote_data, customer_name, customer_notes")
      .eq("id", quoteId)
      .maybeSingle();

    if (error) throw error;

    if (!quote) {
      return new Response(
        JSON.stringify({ error: "Quote not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(buildPublicQuoteResponse({
        id: quote.id,
        quoteData: quote.quote_data,
        customerName: quote.customer_name,
        customerNotes: quote.customer_notes,
      })),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-shared-quote error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
