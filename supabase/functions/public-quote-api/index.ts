// Public Quote API — open, no-auth quote estimates with optional lead capture for AI agents.
// Returns CAD pricing only. Final out-the-door price requires human confirmation.
// Verado is special-order only and is not quoted through this public estimate.
//
// Actions:
//   - list_motors            : current Mercury inventory (light)
//   - estimate_trade_in      : ballpark trade value for a motor
//   - build_quote            : itemized estimate (motor + accessories + trade + tax + financing tier)
//
// All responses include `priceValidUntil` (24h) and a disclaimer.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.22.4";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import { sanitizeAgentNote } from "../_shared/sanitize.ts";
import {
  fetchCanonicalHbwValuation,
  HbwValuationError,
} from "../_shared/hbw-valuation.ts";
import {
  fetchActiveFinancing,
  fetchActivePromotions,
} from "../_shared/customer-knowledge-context.ts";
import {
  buildPublicQuoteFinancing,
  PUBLIC_QUOTE_FINANCING_POLICY_VERSION,
} from "../_shared/public-quote-financing.ts";
import {
  applyMotorPresentationOverrides,
  motorSlug,
} from "../_shared/motor-slug.ts";
import {
  isPublicCatalogMotor,
  isPublicMotorInStock,
  isVeradoMotor,
  PUBLIC_CATALOG_AVAILABILITY_OR,
  PUBLIC_SITE_URL,
  PUBLIC_VERADO_POLICY,
  resolvePublicQuoteDeposit,
  resolvePublicSellingPrice,
  toPublicImageUrl,
} from "../_shared/public-motor-contract.ts";
import { parsePublicQuoteFlags, McpInvalidParamsError } from "../_shared/public-agent-mcp.ts";
import { applyTradeCredit } from "../_shared/trade-credit.ts";
import {
  isPresentTradeIn,
  resolveTradeInInput,
  TradeInInputError,
} from "../_shared/trade-in-input.ts";
import { insertPublicQuoteLead } from "../_shared/public-quote-lead.ts";

// Rate-limit identifier from x-forwarded-for (first hop), used to key the
// stricter fail-closed limiter on the write path (build_quote).
function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE = "mercuryrepower.ca";
const SITE_URL = PUBLIC_SITE_URL;
const HST_RATE = 0.13;
const DISCLAIMER =
  "Estimate only. Final out-the-door price, install scheduling, and trade-in require confirmation by Harris Boat Works. CAD only. Verado is special-order only and is not quoted here. Pickup at Gores Landing, ON.";

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

    const actionKey = typeof action === "string" ? action : "unknown";

    if (actionKey === "build_quote") {
      // Stricter, fail-CLOSED limiter on the write path. Lead inserts are
      // throttled to 10 per 10 minutes per source IP. If the RPC errors, we
      // reject (429) rather than fall open, because this path writes rows.
      const ip = clientIp(req);
      try {
        const { data, error } = await supabase.rpc("check_rate_limit", {
          _identifier: ip,
          _action: "public_quote_build_quote",
          _max_attempts: 10,
          _window_minutes: 10,
        });
        if (error || data === false) {
          return rateLimitedResponse(corsHeaders, 600);
        }
      } catch (_e) {
        return rateLimitedResponse(corsHeaders, 600);
      }
    } else {
      // Read-only actions stay fail-open (a transient DB issue must not
      // block legitimate buyer flows).
      const actionLimit =
        actionKey === "estimate_trade_in"
          ? { maxAttempts: 30, windowMinutes: 10 }
          : { maxAttempts: 120, windowMinutes: 10 };
      const allowed = await checkRateLimit(req, {
        identifier: clientIp(req),
        action: `public_quote_${actionKey}`.slice(0, 128),
        ...actionLimit,
      });
      if (!allowed) return rateLimitedResponse(corsHeaders, 600);
    }

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
    if (err instanceof McpInvalidParamsError || err instanceof TradeInInputError) {
      return json({ error: err.message }, 400);
    }
    if (err instanceof HbwValuationError) {
      return json(
        {
          error: err.message,
          code: err.code,
          notes: [
            `Please retry, or refer the customer to ${SITE_URL}/trade-in-value`,
          ],
        },
        err.status,
      );
    }
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
  return isVeradoMotor({ family, model_display: model, model });
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


function quoteUrl(motorId: string, opts: Record<string, string | number | undefined>) {
  const params = new URLSearchParams({ motor: motorId });
  for (const [k, v] of Object.entries(opts)) {
    if (v != null && v !== "") params.set(k, String(v));
  }
  return `${SITE_URL}/quote/motor-selection?${params.toString()}`;
}

// ── Actions ─────────────────────────────────────────────

async function listMotors(supabase: any, body: any) {
  const limit = Math.min(Number(body?.limit) || 50, 200);
  const search = String(body?.search || "").trim();
  const hpSearch = search ? Number.parseFloat(search) : Number.NaN;
  const textSearch =
    search && Number.isNaN(hpSearch) ? search.toLowerCase() : "";
  const family = String(body?.family || "").trim();
  const minHp = Number(body?.min_hp) || 0;
  const maxHp = Number(body?.max_hp) || 9999;
  const inStockOnly = body?.in_stock_only === true;

  let q = supabase
    .from("motor_models")
    .select(
      "id, model_display, model, model_key, model_number, horsepower, family, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, stock_quantity, image_url, hero_image_url, year",
    )
    .or(PUBLIC_CATALOG_AVAILABILITY_OR)
    .gte("horsepower", minHp)
    .lte("horsepower", maxHp)
    .order("horsepower", { ascending: true })
    .limit(textSearch ? 500 : limit);

  if (search) {
    if (!Number.isNaN(hpSearch)) q = q.eq("horsepower", hpSearch);
  }
  if (family) q = q.ilike("family", `%${family}%`);

  const { data, error } = await q;
  if (error) throw new Error(`list_motors failed: ${error.message}`);

  const motors = (data || [])
    .map((sourceMotor: any) => applyMotorPresentationOverrides(sourceMotor))
    .filter((m: any) => isPublicCatalogMotor(m))
    .filter((m: any) => !inStockOnly || isPublicMotorInStock(m))
    .filter((m: any) =>
      !textSearch ||
      `${m.model_display || m.model || ""} ${m.model_number || ""}`
        .toLowerCase()
        .includes(textSearch)
    )
    .slice(0, limit)
    .map((m: any) => {
      const price = resolvePublicSellingPrice(m);
      const slug = motorSlug(m);
      return {
        id: m.id,
        slug,
        modelDisplay: m.model_display,
        family: m.family,
        horsepower: Number(m.horsepower) || 0,
        year: m.year,
        sellingPrice: price,
        msrp: Number(m.msrp) || null,
        availability: isPublicMotorInStock(m) ? "In Stock" : "Available to Order",
        imageUrl: toPublicImageUrl(m.hero_image_url || m.image_url),
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

async function estimateTradeIn(_supabase: any, body: any) {
  const resolved = resolveTradeInInput(body);
  const hbw = await fetchCanonicalHbwValuation({
    brand: resolved.brand,
    year: resolved.year,
    hp: resolved.horsepower,
    condition: resolved.condition,
    stroke: resolved.engineType,
    hours: resolved.engineHours,
    model: resolved.model,
  });

  return json({
    site: SITE,
    currency: "CAD",
    input: {
      brand: resolved.brand,
      year: resolved.year,
      horsepower: resolved.horsepower,
      condition: resolved.condition,
      engine_type: resolved.engineType ?? null,
      engine_hours: resolved.engineHours,
      model: resolved.model,
      stroke: resolved.engineType,
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
      `Customer can get a detailed report at ${SITE_URL}/trade-in-value`,
    ],
    lastUpdated: nowISO(),
    priceValidUntil: validUntilISO(),
    disclaimer: DISCLAIMER,
  });
}

async function buildQuote(supabase: any, body: any) {
  const quoteFlags = parsePublicQuoteFlags(body && typeof body === "object" ? body : {});
  // Required: motor identifier (motor_id OR (horsepower + family))
  const motorId = body?.motor_id ? String(body.motor_id) : null;
  const hp = Number(body?.horsepower);
  const family = String(body?.family || "").trim();

  if (!motorId && !(hp && family)) {
    return json(
      {
        error:
          "Required: motor_id, OR (horsepower + family). Optional: trade_in, contact, customer_has_propeller",
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
        "id, model_display, model, model_key, model_number, horsepower, family, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, hero_image_url, image_url",
      )
      .eq("id", motorId)
      .maybeSingle();
    if (error) throw new Error(`motor lookup failed: ${error.message}`);
    motor = data;
  } else {
    const { data, error } = await supabase
      .from("motor_models")
      .select(
        "id, model_display, model, model_key, model_number, horsepower, family, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, hero_image_url, image_url",
      )
      .or(PUBLIC_CATALOG_AVAILABILITY_OR)
      .eq("horsepower", hp)
      .ilike("family", `%${family}%`)
      .order("dealer_price", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`motor lookup failed: ${error.message}`);
    motor = data;
  }

  if (!motor) return json({ error: "Motor not found" }, 404);
  motor = applyMotorPresentationOverrides(motor);
  if (motor.availability === "Exclude") {
    return json({ error: "Motor not found" }, 404);
  }
  if (isVerado(motor.family, motor.model_display)) {
    return json(
      {
        error: PUBLIC_VERADO_POLICY.message,
      },
      422,
    );
  }

  const motorPrice = resolvePublicSellingPrice(motor);
  if (!motorPrice) {
    return json({ error: "Motor has no published price. Contact Harris Boat Works for a quote." }, 422);
  }

  const motorHp = Number(motor.horsepower) || hp || 0;
  const isTiller = isTillerMotor(motor.model_display || "");
  const purchasePath = (quoteFlags.purchase_path === "loose" || isTiller) ? "loose" : "installed";
  const customerHasProp = quoteFlags.customer_has_propeller === true;

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

  // Trade-in — a present object must be accepted or rejected, never dropped.
  let tradeIn: any = null;
  let tradeInCredit = 0;
  if (isPresentTradeIn(body?.trade_in)) {
    const resolved = resolveTradeInInput(body.trade_in);
    const value = await fetchCanonicalHbwValuation({
      brand: resolved.brand,
      year: resolved.year,
      hp: resolved.horsepower,
      condition: resolved.condition,
      stroke: resolved.engineType,
      hours: resolved.engineHours,
      model: resolved.model,
    });
    tradeInCredit = applyTradeCredit({
      preTradeSubtotal: subtotal,
      estimatedValue: value.wholesale,
      hasTradeIn: true,
    }).credit;
    tradeIn = {
      input: {
        ...body.trade_in,
        horsepower: resolved.horsepower,
        engine_type: resolved.engineType ?? null,
      },
      estimate: {
        low: value.rangeLow,
        high: value.rangeHigh,
        average: value.wholesale,
        listing: value.listing,
        hst_savings: value.hstSavings,
        confidence: value.confidence,
        factors: value.factors,
      },
      credit_applied: tradeInCredit,
      source: "HBW Motor Valuation API (canonical)",
      note: "Trade-in credit capped at subtotal. Final value requires in-person inspection.",
    };
  }

  const adjustedSubtotal = subtotal - tradeInCredit;
  const hst = round2(adjustedSubtotal * HST_RATE);
  const finalPrice = round2(adjustedSubtotal + hst);
  const deposit = resolvePublicQuoteDeposit(motor);

  // Financing policy is loaded live. Pricing still returns if the lookup
  // fails, but no stale hardcoded rate is substituted.
  let activeFinancing: Awaited<ReturnType<typeof fetchActiveFinancing>> = [];
  let activePromotions: Awaited<ReturnType<typeof fetchActivePromotions>> = [];
  try {
    [activeFinancing, activePromotions] = await Promise.all([
      fetchActiveFinancing(supabase),
      fetchActivePromotions(supabase),
    ]);
  } catch (error) {
    console.error("public quote financing lookup failed:", error);
  }
  const financing = buildPublicQuoteFinancing({
    beforeTaxSubtotal: adjustedSubtotal,
    finalPriceWithTax: finalPrice,
    financing: activeFinancing,
    promotions: activePromotions,
    motorInStock: Boolean(motor.in_stock),
    selectedOfferId: typeof body?.financing_offer_id === "string"
      ? body.financing_offer_id
      : null,
  });

  // Deep-link prefilled URL for the customer
  const slug = motorSlug(motor);
  const deepLink = quoteUrl(motor.id, {
    boat_make: body?.boat_info?.make,
    boat_model: body?.boat_info?.model,
    trade_brand: body?.trade_in?.brand,
    trade_year: body?.trade_in?.year,
    trade_hp: body?.trade_in?.horsepower,
  });

  // Optional lead capture (only if contact provided)
  // Contact block is validated with zod; on validation failure we skip the
  // insert but still return the quote. `referrer` is agent-controlled free
  // text and is sanitized before being persisted in `notes`.
  let leadCaptured = false;
  let leadValidationError: string[] | null = null;
  let leadCaptureError: string | null = null;
  if (body?.contact && (body.contact.email || body.contact.name)) {
    const contactSchema = z.object({
      name: z.string().min(1).max(200),
      email: z.string().email().max(200),
      phone: z.string().max(50).optional(),
      referrer: z.string().max(500).optional(),
    });
    const parsed = contactSchema.safeParse(body.contact);
    if (!parsed.success) {
      leadValidationError = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    } else {
      const c = parsed.data;
      const safeReferrer = sanitizeAgentNote(c.referrer || "unknown", 200);
      const leadResult = await insertPublicQuoteLead(supabase, {
        customer_name: c.name.slice(0, 200),
        customer_email: c.email.slice(0, 200),
        customer_phone: c.phone ? c.phone.slice(0, 50) : null,
        motor_model_id: motor.id,
        base_price: motorPrice,
        deposit_amount: deposit,
        final_price: finalPrice,
        loan_amount: financing.eligible ? financing.amount_financed : 0,
        monthly_payment: financing.eligible ? Number(financing.monthly_payment) : 0,
        term_months: financing.eligible ? financing.amortization_months! : 0,
        total_cost: finalPrice,
        tradein_value_final: tradeInCredit || null,
        lead_source: "public-quote-api",
        lead_status: "new",
        notes: `Public agent quote — referrer: ${safeReferrer}`,
        quote_data: { items, financing, trade_in: tradeIn, boat_info: body?.boat_info || null },
      });
      leadCaptured = leadResult.captured;
      leadCaptureError = leadResult.error;
      if (leadResult.error) {
        console.error("lead capture failed:", leadResult.error);
      }
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
      imageUrl: toPublicImageUrl(motor.hero_image_url || motor.image_url),
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
      finance_fee: financing.eligible ? financing.finance_fee : 0,
      amount_financed: financing.eligible ? financing.amount_financed : 0,
    },
    trade_in: tradeIn,
    financing,
    deep_link: deepLink,
    lead_captured: leadCaptured,
    lead_validation_error: leadValidationError,
    lead_capture_error: leadCaptureError,
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
      "Public quote API for AI agents. Providing contact details attempts to save a lead; check lead_captured and lead_capture_error. CAD pricing. Verado is special-order only and is not quoted here. Pickup-only at Gores Landing, ON.",
    endpoint: `https://www.mercuryrepower.ca/api/agents/quote`,
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
          in_stock_only: "(optional) boolean; default catalog includes available-to-order motors",
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
          engine_type: "(optional) 2-stroke | 4-stroke | optimax | etec | proxs",
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
          financing_offer_id: "(optional) select an id returned in financing.available_offers; caller-supplied APR or term is ignored",
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
      "Mercury Verado is special-order only and is not quoted through this public estimate.",
      "Pickup only at Gores Landing, ON. No delivery.",
      "Financing is loaded from the active Canadian financing and promotion records; no stale rate fallback is used.",
      "Financing eligibility is tested before tax; financed principal includes HST plus the $349 DealerPlan fee.",
      "The standing offer is the default. Promotional financing is applied only when its returned offer id is explicitly selected and eligible.",
      `Financing response policy: ${PUBLIC_QUOTE_FINANCING_POLICY_VERSION}.`,
      "Trade-in credits capped at subtotal.",
    ],
    lastUpdated: nowISO(),
  };
}
