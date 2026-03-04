import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId } = await req.json();

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
          access_count: (savedQuote.access_count || 0) + 1,
          last_accessed: new Date().toISOString()
        })
        .eq("id", quoteId);

      const quoteData = savedQuote.quote_state;
      return new Response(
        JSON.stringify({
          id: savedQuote.id,
          quote_data: quoteData,
          customer_name: quoteData?.customerName ?? "",
          is_admin_quote: quoteData?.isAdminQuote ?? false,
          admin_discount: quoteData?.adminDiscount ?? 0,
          admin_notes: quoteData?.adminNotes ?? "",
          customer_notes: quoteData?.customerNotes ?? "",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fall back to customer_quotes table (used by share links)
    const { data: quote, error } = await supabase
      .from("customer_quotes")
      .select("id, quote_data, customer_name, is_admin_quote, admin_discount, admin_notes, customer_notes")
      .eq("id", quoteId)
      .single();

    if (error || !quote) {
      return new Response(
        JSON.stringify({ error: "Quote not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        id: quote.id,
        quote_data: quote.quote_data,
        customer_name: quote.customer_name ?? "",
        is_admin_quote: quote.is_admin_quote,
        admin_discount: quote.admin_discount,
        admin_notes: quote.admin_notes,
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