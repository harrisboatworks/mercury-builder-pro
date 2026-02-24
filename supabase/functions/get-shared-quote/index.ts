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

    // Return only first name for privacy
    const firstName = quote.customer_name?.split(" ")[0] ?? "";

    return new Response(
      JSON.stringify({
        id: quote.id,
        quote_data: quote.quote_data,
        customer_name: firstName,
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
