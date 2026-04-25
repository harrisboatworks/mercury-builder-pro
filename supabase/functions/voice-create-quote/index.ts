import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Browser-safe wrapper around agent-quote-api's create_quote action.
 * The voice agent (Harris) and web chat both call this — it injects the
 * server-side AGENT_QUOTE_API_KEY so the secret never reaches the client.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Minimal validation — full validation happens in agent-quote-api
    if (!body.customer_name || typeof body.customer_name !== "string") {
      return json({ ok: false, error: "customer_name is required" }, 400);
    }
    if (!body.customer_email || typeof body.customer_email !== "string") {
      return json({ ok: false, error: "customer_email is required" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer_email)) {
      return json({ ok: false, error: "Invalid email format" }, 400);
    }
    if (!body.motor_id || typeof body.motor_id !== "string") {
      return json({ ok: false, error: "motor_id is required" }, 400);
    }

    const agentKey = Deno.env.get("AGENT_QUOTE_API_KEY");
    if (!agentKey) {
      console.error("AGENT_QUOTE_API_KEY not configured");
      return json({ ok: false, error: "Quote service unavailable" }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const upstream = await fetch(`${supabaseUrl}/functions/v1/agent-quote-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-key": agentKey,
      },
      body: JSON.stringify({
        action: "create_quote",
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone || null,
        motor_id: body.motor_id,
        purchase_path: body.purchase_path || "loose",
        customer_notes: body.customer_notes || null,
        conversation_id: body.conversation_id || null,
        conversation_channel: body.conversation_channel || "voice",
        source: body.source || "voice_agent",
        send_customer_email: body.send_customer_email !== false,
      }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("agent-quote-api error:", upstream.status, data);
      return json({ ok: false, error: data.error || "Failed to create quote" }, upstream.status);
    }

    const refShort = data.quote_id?.slice(0, 8).toUpperCase();
    const priceStr = (data.pricing?.finalPrice || 0).toLocaleString("en-CA", { minimumFractionDigits: 2 });
    return json({
      ok: true,
      quote_id: data.quote_id,
      share_url: data.share_url,
      final_price: data.pricing?.finalPrice,
      motor: data.motor,
      summary: `Quote ${refShort} for $${priceStr} CAD created and emailed to ${body.customer_email}.${data.share_url ? ` Share link: ${data.share_url}` : ""} Tell the customer the quote is in their inbox and mention you can also text them the link if they want it on their phone.`,
    });
  } catch (err: any) {
    console.error("voice-create-quote error:", err);
    return json({ ok: false, error: err?.message || "Internal error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
