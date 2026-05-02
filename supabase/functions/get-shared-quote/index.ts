import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { corsHeaders } from "../_shared/cors.ts";

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
      .select("id, quote_state, email, user_id, deposit_status, deposit_amount, quote_pdf_path, deposit_pdf_path")
      .eq("id", quoteId)
      .single();

    if (savedQuote && !savedError) {
      // Update access tracking
      await supabase
        .from("saved_quotes")
        .update({ 
          access_count: ((savedQuote as any).access_count || 0) + 1,
          last_accessed: new Date().toISOString()
        })
        .eq("id", quoteId);

      // Strip admin-only fields from public-facing quote_state before returning.
      const rawQuote = savedQuote.quote_state ?? {};
      const { adminNotes: _adminNotes, adminDiscount: _adminDiscount, ...safeQuoteData } = rawQuote as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          id: savedQuote.id,
          quote_data: safeQuoteData,
          customer_name: (rawQuote as any)?.customerName ?? "",
          is_admin_quote: (rawQuote as any)?.isAdminQuote ?? false,
          customer_notes: (rawQuote as any)?.customerNotes ?? "",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fall back to customer_quotes table (used by share links).
    // Do NOT select admin_notes / admin_discount — these are internal-only.
    const { data: quote, error } = await supabase
      .from("customer_quotes")
      .select("id, quote_data, customer_name, is_admin_quote, customer_notes")
      .eq("id", quoteId)
      .single();

    if (error || !quote) {
      return new Response(
        JSON.stringify({ error: "Quote not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip any admin-only fields that may live inside quote_data JSON.
    const rawQuoteData = (quote.quote_data ?? {}) as Record<string, unknown>;
    const { adminNotes: _adminNotes2, adminDiscount: _adminDiscount2, ...safeQuoteData } = rawQuoteData;

    return new Response(
      JSON.stringify({
        id: quote.id,
        quote_data: safeQuoteData,
        customer_name: quote.customer_name ?? "",
        is_admin_quote: quote.is_admin_quote,
        customer_notes: quote.customer_notes,
      }),
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