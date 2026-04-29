// Public Quote API — open, no-auth, read-only quote estimates for AI agents.
// Returns CAD pricing only. Final out-the-door price requires human confirmation.
// Excludes Verado (we do not sell or service Verado).
//
// Actions:
//   - list_motors            : current Mercury inventory (light)
//   - estimate_trade_in      : ballpark trade value for a motor
//   - build_quote            : itemized estimate (motor + accessories + trade + tax + financing tier)
//
// All responses include `priceValidUntil` (24h) and a disclaimer.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE = "mercuryrepower.ca";
const SITE_URL = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";
const HST_RATE = 0.13;
const FINANCING_MINIMUM = 5000;
const FIN_RATE_LOW = 0.0799; // $10k+
const FIN_RATE_HIGH = 0.0899; // under $10k
const DEFAULT_TERM = 144;
const DISCLAIMER =
  "Estimate only. Final out-the-door price, install scheduling, and trade-in require confirmation by Harris Boat Works. CAD only. No Verado. Pickup at Gores Landing, ON.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // GET → return docs
    if (req.method === "GET") {
      return json(docs(), 200, true);
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed. Use POST." }, 405);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    switch (action) {
      case "list_motors":
        return await listMotors(supabase, body);
      case "estimate_trade_in":
        return await estimateTradeIn(supabase, body);
      case "build_quote":
        return await buildQuote(supabase, body);
      default:
        return json(
          {
            error: `Unknown action: ${action || "(none)"}`,
            available_actions: ["list_motors", "estimate_trade_in", "build_quote"],
            docs_url: `${SITE_URL}/agents`,
          },
          400,
        );
    }
  } catch (err: any) {
    console.error("public-quote-api error:", err);
    return json({ error: err?.message || "Internal server error" }, 500);
  }
});

// ── Helpers ─────────────────────────────────────────────

function json(data: unknown, status = 200, cacheable = false) {
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };
  if (cacheable) headers["Cache-Control"] = "public, max-age=300";
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

function nowISO() {
  return new Date().toISOString();
}

function validUntilISO(hours = 24) {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

function isVerado(family?: string | null, model?: string | null) {
  const s = `${family || ""} ${model || ""}`.toUpperCase();
  return s.includes("VERADO");
}

// Resolve selling price using the canonical hierarchy:
// manual_overrides.sale_price > manual_overrides.base_price > sale_price > dealer_price > msrp
function resolveSellingPrice(motor: any): number | null {
  const o = (motor.manual_overrides || {}) as Record<string, any>;
  const candidates = [
    Number(o.sale_price),
    Number(o.base_price),
    Number(motor.sale_price),
    Number(motor.dealer_price),
    Number(motor.msrp),
  ];
  for (const v of candidates) if (Number.isFinite(v) && v > 0) return v;
  return null;
}

function slugify(modelKey?: string | null) {
  if (!modelKey) return "";
  return modelKey.toLowerCase().replace(/_/g, "-");
}

function financingTier(loanAmount: number) {
  if (loanAmount < FINANCING_MINIMUM) {
    return {
      eligible: false,
      reason: `Financing requires minimum $${FINANCING_MINIMUM} CAD`,
    };
  }
  const rate = loanAmount >= 10000 ? FIN_RATE_LOW : FIN_RATE_HIGH;
  const term = DEFAULT_TERM;
  const monthly = monthlyPayment(loanAmount, rate, term);
  return {
    eligible: true,
    apr: rate,
    apr_label: `${(rate * 100).toFixed(2)}%`,
    term_months: term,
    monthly_payment: round2(monthly),
    note: "Estimate via LightStream / Financeit. Final approval by lender.",
  };
}

function monthlyPayment(principal: number, annualRate: number, months: number) {
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function getPropellerAllowance(hp: number) {
  if (hp < 25) return null;
  if (hp <= 115) {
    return {
      name: "Propeller Allowance (Aluminum)",
      price: 350,
      description: "Standard aluminum propeller — final selection after water test",
    };
  }
  return {
    name: "Propeller Allowance (Stainless Steel)",
    price: 1200,
    description: "Stainless steel propeller — final selection after water test",
  };
}

function isTillerMotor(modelDisplay: string): boolean {
  if (!modelDisplay) return false;
  const u = modelDisplay.toUpperCase().trim();
  if (u.includes("TILLER") || u.includes("BIG TILLER")) return true;
  if (/\b\d+\.?\d*\s*(MLH|ELH|EXLH|MH)\b/i.test(u)) return true;
  if (/\bMH\b/i.test(u) && !u.includes("EXLPT") && !u.includes("CT")) return true;
  return false;
}

function depositForHp(hp: number) {
  if (hp >= 200) return 1000;
  if (hp >= 75) return 500;
  return 200;
}

function quoteUrl(motorId: string, opts: Record<string, string | number | undefined>) {
  const params = new URLSearchParams({ motor: motorId });
  for (const [k, v] of Object.entries(opts)) {
    if (v != null && v !== "") params.set(k, String(v));
  }
  return `${SITE_URL}/quote/motor-selection?${params.toString()}`;
}

// ── Trade-in (simplified ballpark for public agents) ──
const BRAND_PENALTIES: Record<string, number> = {
  JOHNSON: 0.5,
  EVINRUDE: 0.5,
  OMC: 0.5,
};
const MIN_TRADE_VALUE = 100;

function brandFactor(brand: string) {
  const b = (brand || "").toUpperCase();
  for (const k of Object.keys(BRAND_PENALTIES)) {
    if (b.includes(k)) return BRAND_PENALTIES[k];
  }
  return 1;
}

function ballparkTradeValue(opts: {
  brand: string;
  year: number;
  hp: number;
  condition: "excellent" | "good" | "fair" | "poor";
  engine_type?: "2-stroke" | "4-stroke" | "optimax";
  engine_hours?: number;
}) {
  const cy = new Date().getFullYear();
  const age = Math.max(0, cy - opts.year);
  // Rough depreciation curve: Mercury holds value better
  const isMercury = /mercury/i.test(opts.brand);
  const yearlyDep = isMercury ? 0.06 : 0.09;
  const ageFactor = Math.max(0.18, 1 - age * yearlyDep);

  // Base anchor: $40/HP (rough industry midpoint, intentionally conservative)
  const base = opts.hp * 40 * ageFactor;

  const conditionMult: Record<string, number> = {
    excellent: 1.0,
    good: 0.8,
    fair: 0.6,
    poor: 0.35,
  };
  let value = base * (conditionMult[opts.condition] ?? 0.6);

  // 2-stroke / OptiMax penalty
  if (opts.engine_type === "2-stroke" || opts.engine_type === "optimax") {
    value *= 0.825;
  }
  // Hours adjustment
  if (typeof opts.engine_hours === "number") {
    if (opts.engine_hours <= 100) value *= 1.075;
    else if (opts.engine_hours >= 1000) value *= 0.825;
    else if (opts.engine_hours >= 500) value *= 0.9;
  }
  // Brand penalty
  value *= brandFactor(opts.brand);
  // Mercury bonus for newer
  if (isMercury && age <= 3) value *= 1.1;

  value = Math.max(MIN_TRADE_VALUE, value);
  const low = Math.round(value * 0.85);
  const high = Math.round(value * 1.15);
  return { low, high, average: Math.round((low + high) / 2) };
}

// ── Actions ─────────────────────────────────────────────

async function listMotors(supabase: any, body: any) {
  const limit = Math.min(Number(body?.limit) || 50, 200);
  const search = String(body?.search || "").trim();
  const family = String(body?.family || "").trim();
  const minHp = Number(body?.min_hp) || 0;
  const maxHp = Number(body?.max_hp) || 9999;

  let q = supabase
    .from("motor_models")
    .select(
      "id, model_display, model, model_key, horsepower, family, msrp, sale_price, dealer_price, manual_overrides, in_stock, image_url, hero_image_url, year",
    )
    .eq("is_brochure", true)
    .gte("horsepower", minHp)
    .lte("horsepower", maxHp)
    .order("horsepower", { ascending: true })
    .limit(limit);

  if (search) {
    const hpNum = parseFloat(search);
    if (!isNaN(hpNum)) q = q.eq("horsepower", hpNum);
    else q = q.ilike("model_display", `%${search}%`);
  }
  if (family) q = q.ilike("family", `%${family}%`);

  const { data, error } = await q;
  if (error) throw new Error(`list_motors failed: ${error.message}`);

  const motors = (data || [])
    .filter((m: any) => !isVerado(m.family, m.model_display))
    .map((m: any) => {
      const price = resolveSellingPrice(m);
      const slug = slugify(m.model_key);
      return {
        id: m.id,
        slug,
        modelDisplay: m.model_display,
        family: m.family,
        horsepower: Number(m.horsepower) || 0,
        year: m.year,
        sellingPrice: price,
        msrp: Number(m.msrp) || null,
        availability: m.in_stock ? "In Stock" : "Available to Order",
        imageUrl: m.hero_image_url || m.image_url || null,
        url: slug ? `${SITE_URL}/motors/${slug}` : null,
        quoteUrl: `${SITE_URL}/quote/motor-selection?motor=${m.id}`,
      };
    });

  return json({
    site: SITE,
    currency: "CAD",
    count: motors.length,
    lastUpdated: nowISO(),
    priceValidUntil: validUntilISO(),
    disclaimer: DISCLAIMER,
    motors,
  });
}

// Map quote-api engine_type → HBW stroke values
function toHbwStroke(engineType?: string): string {
  const t = (engineType || "").toLowerCase().trim();
  if (t === "2-stroke" || t === "optimax" || t === "etec" || t === "proxs") return t;
  return "4-stroke";
}

async function fetchHbwValuation(input: {
  brand: string;
  year: number;
  hp: number;
  condition: string;
  stroke: string;
  hours?: number;
  model?: string;
}): Promise<any | null> {
  const apiKey = Deno.env.get("HBW_API_KEY");
  if (!apiKey) {
    console.error("HBW_API_KEY not configured");
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://hbw-valuation-hbw.vercel.app/api/motor-valuation", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    if (!res.ok) {
      console.error("HBW upstream error", res.status, text);
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch (err) {
    clearTimeout(timer);
    console.error("HBW fetch failed:", err);
    return null;
  }
}

async function estimateTradeIn(_supabase: any, body: any) {
  const brand = String(body?.brand || "").trim();
  const year = Number(body?.year);
  const hp = Number(body?.horsepower);
  const condition = String(body?.condition || "good").toLowerCase();
  const model = body?.model ? String(body.model).trim() : undefined;
  if (!brand || !year || !hp) {
    return json(
      { error: "Required: brand, year, horsepower. Optional: condition, engine_type, engine_hours, model" },
      400,
    );
  }
  if (!["excellent", "good", "fair", "poor"].includes(condition)) {
    return json({ error: "condition must be one of: excellent, good, fair, poor" }, 400);
  }

  const stroke = toHbwStroke(body?.engine_type);
  const hours =
    typeof body?.engine_hours === "number" && Number.isFinite(body.engine_hours)
      ? body.engine_hours
      : undefined;

  const hbw = await fetchHbwValuation({ brand, year, hp, condition, stroke, hours, model });

  if (!hbw || typeof hbw.rangeLow !== "number" || typeof hbw.rangeHigh !== "number") {
    return json(
      {
        error: "Trade-in valuation service unavailable",
        notes: [
          "HBW valuation API did not return a valid response.",
          "Please retry, or refer the customer to https://mercuryrepower.ca/trade-in-value",
        ],
      },
      502,
    );
  }

  return json({
    site: SITE,
    currency: "CAD",
    input: {
      brand,
      year,
      horsepower: hp,
      condition,
      engine_type: body?.engine_type,
      engine_hours: hours,
      model,
      stroke,
    },
    estimate: {
      low: hbw.rangeLow,
      high: hbw.rangeHigh,
      average: hbw.wholesale,
      listing: hbw.listing,
      hst_savings: hbw.hstSavings,
      confidence: hbw.confidence,
      market_demand: hbw.marketDemand,
      seasonal: hbw.seasonal,
      factors: hbw.factors || [],
    },
    source: "HBW Motor Valuation API (canonical)",
    notes: [
      "Trade-in estimate from HBW canonical valuation engine. Final value requires in-person inspection at Gores Landing, ON.",
      "Customer can get a detailed report at https://mercuryrepower.ca/trade-in-value",
    ],
    lastUpdated: nowISO(),
    priceValidUntil: validUntilISO(),
    disclaimer: DISCLAIMER,
  });
}

async function buildQuote(supabase: any, body: any) {
  // Required: motor identifier (motor_id OR (horsepower + family))
  const motorId = body?.motor_id ? String(body.motor_id) : null;
  const hp = Number(body?.horsepower);
  const family = String(body?.family || "").trim();

  if (!motorId && !(hp && family)) {
    return json(
      {
        error:
          "Required: motor_id, OR (horsepower + family). Optional: shaft, controls, trade_in, contact, customer_has_propeller",
      },
      400,
    );
  }

  // Resolve motor
  let motor: any = null;
  if (motorId) {
    const { data, error } = await supabase
      .from("motor_models")
      .select(
        "id, model_display, model, model_key, horsepower, family, msrp, sale_price, dealer_price, manual_overrides, in_stock, hero_image_url, image_url",
      )
      .eq("id", motorId)
      .maybeSingle();
    if (error) throw new Error(`motor lookup failed: ${error.message}`);
    motor = data;
  } else {
    const { data, error } = await supabase
      .from("motor_models")
      .select(
        "id, model_display, model, model_key, horsepower, family, msrp, sale_price, dealer_price, manual_overrides, in_stock, hero_image_url, image_url",
      )
      .eq("is_brochure", true)
      .eq("horsepower", hp)
      .ilike("family", `%${family}%`)
      .order("dealer_price", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`motor lookup failed: ${error.message}`);
    motor = data;
  }

  if (!motor) return json({ error: "Motor not found" }, 404);
  if (isVerado(motor.family, motor.model_display)) {
    return json(
      {
        error:
          "Verado motors are not sold or serviced by Harris Boat Works. Please choose FourStroke, Pro XS, SeaPro, or Racing.",
      },
      422,
    );
  }

  const motorPrice = resolveSellingPrice(motor);
  if (!motorPrice) {
    return json({ error: "Motor has no published price. Contact Harris Boat Works for a quote." }, 422);
  }

  const motorHp = Number(motor.horsepower) || hp || 0;
  const isTiller = isTillerMotor(motor.model_display || "");
  const purchasePath = (body?.purchase_path === "loose" || isTiller) ? "loose" : "installed";
  const customerHasProp = !!body?.customer_has_propeller;

  // Build line items
  const items: { name: string; price: number; description?: string }[] = [
    {
      name: motor.model_display || "Mercury Outboard",
      price: motorPrice,
      description: `${motorHp} HP ${motor.family || ""}`.trim(),
    },
  ];

  if (!isTiller && purchasePath === "installed") {
    items.push({
      name: "Professional Installation",
      price: 450,
      description: "Expert rigging, mounting, and commissioning by certified technicians",
    });
  }

  const propAllowance = getPropellerAllowance(motorHp);
  if (propAllowance) {
    if (customerHasProp) {
      items.push({
        name: "Use of Customer Propeller",
        price: 0,
        description: "If a different prop is required, additional cost applies",
      });
    } else {
      items.push(propAllowance);
    }
  }

  const accessoryCost = items.slice(1).reduce((s, i) => s + i.price, 0);
  const subtotal = items.reduce((s, i) => s + i.price, 0);

  // Trade-in
  let tradeIn: any = null;
  let tradeInCredit = 0;
  if (body?.trade_in?.brand && body?.trade_in?.year && body?.trade_in?.horsepower) {
    const t = ballparkTradeValue({
      brand: body.trade_in.brand,
      year: Number(body.trade_in.year),
      hp: Number(body.trade_in.horsepower),
      condition: (body.trade_in.condition || "good").toLowerCase(),
      engine_type: body.trade_in.engine_type,
      engine_hours: body.trade_in.engine_hours,
    });
    tradeInCredit = Math.min(t.average, subtotal); // capped at subtotal
    tradeIn = {
      input: body.trade_in,
      estimate: t,
      credit_applied: tradeInCredit,
      note: "Trade-in credit capped at subtotal. Final value requires in-person inspection.",
    };
  }

  const adjustedSubtotal = subtotal - tradeInCredit;
  const hst = round2(adjustedSubtotal * HST_RATE);
  const finalPrice = round2(adjustedSubtotal + hst);
  const deposit = depositForHp(motorHp);

  // Financing tier
  const financing = financingTier(finalPrice);

  // Deep-link prefilled URL for the customer
  const slug = slugify(motor.model_key);
  const deepLink = quoteUrl(motor.id, {
    boat_make: body?.boat_info?.make,
    boat_model: body?.boat_info?.model,
    trade_brand: body?.trade_in?.brand,
    trade_year: body?.trade_in?.year,
    trade_hp: body?.trade_in?.horsepower,
  });

  // Optional lead capture (only if contact provided)
  let leadCaptured = false;
  if (body?.contact?.email && body?.contact?.name) {
    try {
      await supabase.from("customer_quotes").insert({
        customer_name: String(body.contact.name).slice(0, 200),
        customer_email: String(body.contact.email).slice(0, 200),
        customer_phone: body.contact.phone ? String(body.contact.phone).slice(0, 50) : null,
        motor_model_id: motor.id,
        base_price: motorPrice,
        deposit_amount: deposit,
        final_price: finalPrice,
        loan_amount: financing.eligible ? finalPrice : 0,
        monthly_payment: financing.eligible ? Number(financing.monthly_payment) : 0,
        term_months: financing.eligible ? financing.term_months! : 0,
        total_cost: finalPrice,
        tradein_value_final: tradeInCredit || null,
        lead_source: "public-quote-api",
        lead_status: "new",
        notes: `Public agent quote — referrer: ${body?.contact?.referrer || "unknown"}`,
        quote_data: { items, financing, trade_in: tradeIn, boat_info: body?.boat_info || null },
      });
      leadCaptured = true;
    } catch (e: any) {
      console.error("lead capture failed:", e?.message);
    }
  }

  return json({
    site: SITE,
    currency: "CAD",
    motor: {
      id: motor.id,
      slug,
      modelDisplay: motor.model_display,
      family: motor.family,
      horsepower: motorHp,
      url: slug ? `${SITE_URL}/motors/${slug}` : null,
      imageUrl: motor.hero_image_url || motor.image_url || null,
    },
    purchase_path: purchasePath,
    line_items: items,
    pricing: {
      subtotal: round2(subtotal),
      accessory_cost: round2(accessoryCost),
      trade_in_credit: round2(tradeInCredit),
      adjusted_subtotal: round2(adjustedSubtotal),
      hst: hst,
      final_price: finalPrice,
      deposit_required: deposit,
    },
    trade_in: tradeIn,
    financing,
    deep_link: deepLink,
    lead_captured: leadCaptured,
    lastUpdated: nowISO(),
    priceValidUntil: validUntilISO(),
    disclaimer: DISCLAIMER,
  });
}

// ── Docs (GET response) ─────────────────────────────────

function docs() {
  return {
    name: "Harris Boat Works — Public Quote API",
    site: SITE,
    description:
      "Public, read-only quote API for AI agents. CAD pricing. No Verado. Pickup-only at Gores Landing, ON.",
    endpoint: `${SITE_URL.replace("https://", "https://").replace("mercuryrepower.ca", "eutsoqdpjurknjsshxes.supabase.co/functions/v1")}/public-quote-api`,
    method: "POST",
    actions: {
      list_motors: {
        description: "List Mercury inventory with current CAD pricing",
        body: {
          action: "list_motors",
          search: "(optional) string or HP number",
          family: "(optional) FourStroke | ProXS | SeaPro | Racing",
          min_hp: "(optional) number",
          max_hp: "(optional) number",
          limit: "(optional) max 200",
        },
      },
      estimate_trade_in: {
        description: "Ballpark trade-in value",
        body: {
          action: "estimate_trade_in",
          brand: "Mercury | Yamaha | Honda | etc.",
          year: 2015,
          horsepower: 90,
          condition: "excellent | good | fair | poor",
          engine_type: "(optional) 2-stroke | 4-stroke | optimax",
          engine_hours: "(optional) number",
        },
      },
      build_quote: {
        description: "Itemized quote estimate with optional trade-in & lead capture",
        body: {
          action: "build_quote",
          motor_id: "(or use horsepower + family)",
          horsepower: 90,
          family: "FourStroke",
          purchase_path: "installed | loose",
          customer_has_propeller: false,
          boat_info: { make: "Lund", model: "Pro-V" },
          trade_in: {
            brand: "Mercury",
            year: 2010,
            horsepower: 75,
            condition: "good",
            engine_type: "4-stroke",
            engine_hours: 800,
          },
          contact: {
            name: "(optional) creates a lead",
            email: "(optional)",
            phone: "(optional)",
            referrer: "ChatGPT | Perplexity | Claude | etc.",
          },
        },
      },
    },
    rules: [
      "All pricing is CAD. Final price requires human confirmation.",
      "No Verado motors — Harris does not sell or service them.",
      "Pickup only at Gores Landing, ON. No delivery.",
      "Financing minimum: $5,000 CAD. Tiered: 8.99% under $10k, 7.99% $10k+.",
      "Trade-in credits capped at subtotal.",
    ],
    lastUpdated: nowISO(),
  };
}
