import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const DEALERPLAN_FEE = 299;
const HST_RATE = 0.13;
const SITE_URL = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Auth: API key check ---
  const agentKey = req.headers.get("x-agent-key");
  const expectedKey = Deno.env.get("AGENT_QUOTE_API_KEY");
  if (!expectedKey || agentKey !== expectedKey) {
    return json({ error: "Unauthorized" }, 401);
  }

  // --- Rate limiting (simple in-memory, resets on cold start) ---
  const now = Date.now();
  if (now - rateBucket.windowStart > 60_000) {
    rateBucket.windowStart = now;
    rateBucket.count = 0;
  }
  rateBucket.count++;
  if (rateBucket.count > 30) {
    return json({ error: "Rate limit exceeded. Max 30 requests/minute." }, 429);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();
    const action = body.action;

    switch (action) {
      case "list_motors":
        return await listMotors(supabase, body);
      case "create_quote":
        return await createQuote(supabase, body);
      case "update_quote":
        return await updateQuote(supabase, body);
      case "get_quote":
        return await getQuote(supabase, body);
      case "list_quotes":
        return await listQuotes(supabase, body);
      default:
        return json({
          error: `Unknown action: ${action}`,
          available_actions: ["list_motors", "create_quote", "update_quote", "get_quote", "list_quotes"],
        }, 400);
    }
  } catch (err: any) {
    console.error("agent-quote-api error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});

// ── Helpers ──────────────────────────────────────────────

const rateBucket = { windowStart: Date.now(), count: 0 };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function shareUrl(quoteId: string) {
  return `${SITE_URL}/quote/saved/${quoteId}`;
}

function calcPricing(motorPrice: number, adminDiscount = 0, customItemsTotal = 0) {
  const subtotal = motorPrice + customItemsTotal;
  const hst = subtotal * HST_RATE;
  const totalBeforeDiscount = subtotal + hst + DEALERPLAN_FEE;
  const finalPrice = Math.max(0, totalBeforeDiscount - adminDiscount);
  return { subtotal, hst, dealerplanFee: DEALERPLAN_FEE, totalBeforeDiscount, adminDiscount, finalPrice };
}

// ── Actions ─────────────────────────────────────────────

async function listMotors(supabase: any, body: any) {
  const search = (body.search || "").trim();
  const limit = Math.min(body.limit || 20, 50);

  let query = supabase
    .from("motor_models")
    .select("id, model_display, model, horsepower, msrp, sale_price, in_stock, model_key, motor_type, year, base_price")
    .eq("is_brochure", true)
    .order("horsepower", { ascending: true })
    .limit(limit);

  if (search) {
    // If search is a number, search by HP; otherwise search by model name
    const hpNum = parseFloat(search);
    if (!isNaN(hpNum)) {
      query = query.eq("horsepower", hpNum);
    } else {
      query = query.ilike("model_display", `%${search}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(`list_motors failed: ${error.message}`);

  return json({
    ok: true,
    motors: (data || []).map((m: any) => ({
      id: m.id,
      model_display: m.model_display,
      horsepower: m.horsepower,
      msrp: m.msrp,
      sale_price: m.sale_price || m.base_price,
      in_stock: m.in_stock,
      model_key: m.model_key,
      motor_type: m.motor_type,
      year: m.year,
    })),
    count: (data || []).length,
  });
}

async function createQuote(supabase: any, body: any) {
  // Validate required fields
  const { customer_name, customer_email, motor_id } = body;
  if (!customer_name?.trim()) throw new Error("customer_name is required");
  if (!customer_email?.trim()) throw new Error("customer_email is required");
  if (!motor_id?.trim()) throw new Error("motor_id is required");

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
    throw new Error("Invalid email format");
  }

  // Look up motor
  const { data: motor, error: motorErr } = await supabase
    .from("motor_models")
    .select("*")
    .eq("id", motor_id)
    .single();
  if (motorErr || !motor) throw new Error(`Motor not found: ${motor_id}`);

  const motorPrice = motor.sale_price || motor.base_price || motor.msrp || 0;
  const adminDiscount = Math.max(0, body.admin_discount || 0);
  const customItems: Array<{ name: string; price: number }> = body.custom_items || [];
  const customItemsTotal = customItems.reduce((sum: number, i: any) => sum + (i.price || 0), 0);

  const pricing = calcPricing(motorPrice, adminDiscount, customItemsTotal);

  const quoteData = {
    motorId: motor.id,
    motorModel: motor.model_display || motor.model,
    motorHp: motor.horsepower,
    motorMsrp: motor.msrp,
    motorPrice,
    motor: {
      id: motor.id,
      model: motor.model_display || motor.model,
      hp: motor.horsepower,
      price: motorPrice,
      msrp: motor.msrp,
      salePrice: motor.sale_price || motor.base_price,
      modelKey: motor.model_key,
      motorType: motor.motor_type,
      year: motor.year,
      inStock: motor.in_stock,
    },
    purchasePath: "loose",
    adminDiscount,
    adminNotes: body.admin_notes || "",
    customerNotes: body.customer_notes || "",
    customerName: customer_name.trim(),
    customerEmail: customer_email.trim(),
    customerPhone: body.customer_phone || "",
    isAdminQuote: true,
    adminCustomItems: customItems,
    ...pricing,
  };

  const payload = {
    customer_name: customer_name.trim(),
    customer_email: customer_email.trim(),
    customer_phone: body.customer_phone || null,
    base_price: motorPrice,
    final_price: pricing.finalPrice,
    deposit_amount: 0,
    loan_amount: pricing.finalPrice,
    monthly_payment: 0,
    term_months: 0,
    total_cost: pricing.finalPrice,
    user_id: null,
    motor_model_id: motor.id,
    admin_discount: adminDiscount,
    admin_notes: body.admin_notes || null,
    customer_notes: body.customer_notes || null,
    is_admin_quote: true,
    lead_status: "scheduled",
    lead_source: "ai_agent",
    quote_data: quoteData,
  };

  const { data, error } = await supabase
    .from("customer_quotes")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create quote: ${error.message}`);

  return json({
    ok: true,
    quote_id: data.id,
    share_url: shareUrl(data.id),
    motor: {
      model: motor.model_display || motor.model,
      horsepower: motor.horsepower,
      msrp: motor.msrp,
    },
    pricing,
  });
}

async function updateQuote(supabase: any, body: any) {
  const { quote_id } = body;
  if (!quote_id?.trim()) throw new Error("quote_id is required");

  // Fetch existing quote
  const { data: existing, error: fetchErr } = await supabase
    .from("customer_quotes")
    .select("*, motor_model_id")
    .eq("id", quote_id)
    .single();
  if (fetchErr || !existing) throw new Error(`Quote not found: ${quote_id}`);

  // Build update payload from provided fields
  const updates: Record<string, any> = {
    last_modified_at: new Date().toISOString(),
  };
  const quoteData = { ...(existing.quote_data || {}) };

  if (body.customer_name !== undefined) {
    updates.customer_name = body.customer_name.trim();
    quoteData.customerName = body.customer_name.trim();
  }
  if (body.customer_email !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer_email)) {
      throw new Error("Invalid email format");
    }
    updates.customer_email = body.customer_email.trim();
    quoteData.customerEmail = body.customer_email.trim();
  }
  if (body.customer_phone !== undefined) {
    updates.customer_phone = body.customer_phone || null;
    quoteData.customerPhone = body.customer_phone || "";
  }
  if (body.admin_notes !== undefined) {
    updates.admin_notes = body.admin_notes;
    quoteData.adminNotes = body.admin_notes;
  }
  if (body.customer_notes !== undefined) {
    updates.customer_notes = body.customer_notes;
    quoteData.customerNotes = body.customer_notes;
  }
  if (body.custom_items !== undefined) {
    quoteData.adminCustomItems = body.custom_items;
  }

  // Recalculate pricing if discount or custom items changed
  const adminDiscount = body.admin_discount !== undefined ? Math.max(0, body.admin_discount) : (existing.admin_discount || 0);
  const customItems = body.custom_items || quoteData.adminCustomItems || [];
  const customItemsTotal = customItems.reduce((sum: number, i: any) => sum + (i.price || 0), 0);
  const motorPrice = existing.base_price || 0;

  const pricing = calcPricing(motorPrice, adminDiscount, customItemsTotal);

  updates.admin_discount = adminDiscount;
  updates.final_price = pricing.finalPrice;
  updates.total_cost = pricing.finalPrice;
  updates.loan_amount = pricing.finalPrice;
  updates.quote_data = { ...quoteData, ...pricing, adminDiscount };

  const { error } = await supabase
    .from("customer_quotes")
    .update(updates)
    .eq("id", quote_id);

  if (error) throw new Error(`Failed to update quote: ${error.message}`);

  return json({
    ok: true,
    quote_id,
    share_url: shareUrl(quote_id),
    pricing,
  });
}

async function getQuote(supabase: any, body: any) {
  const { quote_id } = body;
  if (!quote_id?.trim()) throw new Error("quote_id is required");

  const { data, error } = await supabase
    .from("customer_quotes")
    .select("*, motor_model_id")
    .eq("id", quote_id)
    .single();

  if (error || !data) throw new Error(`Quote not found: ${quote_id}`);

  // Look up motor info if available
  let motor = null;
  if (data.motor_model_id) {
    const { data: m } = await supabase
      .from("motor_models")
      .select("id, model_display, model, horsepower, msrp, sale_price, base_price")
      .eq("id", data.motor_model_id)
      .single();
    if (m) {
      motor = {
        id: m.id,
        model_display: m.model_display || m.model,
        horsepower: m.horsepower,
        msrp: m.msrp,
        sale_price: m.sale_price || m.base_price,
      };
    }
  }

  return json({
    ok: true,
    quote: {
      id: data.id,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      base_price: data.base_price,
      final_price: data.final_price,
      admin_discount: data.admin_discount,
      admin_notes: data.admin_notes,
      customer_notes: data.customer_notes,
      lead_status: data.lead_status,
      lead_source: data.lead_source,
      created_at: data.created_at,
      last_modified_at: data.last_modified_at,
      share_url: shareUrl(data.id),
      motor,
      custom_items: data.quote_data?.adminCustomItems || [],
    },
  });
}

async function listQuotes(supabase: any, body: any) {
  const limit = Math.min(body.limit || 20, 50);
  let query = supabase
    .from("customer_quotes")
    .select("id, customer_name, customer_email, base_price, final_price, admin_discount, lead_status, lead_source, created_at, motor_model_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (body.customer_email) {
    query = query.ilike("customer_email", body.customer_email.trim());
  }
  if (body.lead_source) {
    query = query.eq("lead_source", body.lead_source);
  }

  const { data, error } = await query;
  if (error) throw new Error(`list_quotes failed: ${error.message}`);

  return json({
    ok: true,
    quotes: (data || []).map((q: any) => ({
      ...q,
      share_url: shareUrl(q.id),
    })),
    count: (data || []).length,
  });
}
