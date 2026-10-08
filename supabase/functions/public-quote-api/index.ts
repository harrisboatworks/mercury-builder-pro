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
  normalizeHbwStroke,
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
import { formatMercuryShaftMarkdown, resolveMercuryCatalogSpecs } from "../_shared/mercury-codes.ts";

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

  const isGet = req.method === "GET";
  let getFormat: "markdown" | "json" = "markdown";

  try {
    if (!isGet && req.method !== "POST") {
      return json({ error: "Method not allowed. Use GET or POST." }, 405);
    }

    let body: any;
    if (isGet) {
      const params = new URL(req.url).searchParams;
      // GET with no action stays the self-description document.
      if (!params.get("action")) {
        return json(docs(), 200, true);
      }
      getFormat = (params.get("format") || "").toLowerCase() === "json" ? "json" : "markdown";
      // Contact/PII params are dropped here and never reach an action or a log.
      body = bodyFromQuery(params);
    } else {
      body = await req.json().catch(() => ({}));
    }

    const action = body?.action;

    const actionKey = typeof action === "string" ? action : "unknown";

    if (actionKey === "build_quote") {
      // Stricter, fail-CLOSED limiter on the write path. Lead inserts are
      // throttled to 10 per 10 minutes per source IP. If the RPC errors, we
      // reject (429) rather than fall open, because this path writes rows.
      // GET shares the same bucket, so it is not a rate-limit bypass.
      const ip = clientIp(req);
      try {
        const { data, error } = await supabase.rpc("check_rate_limit", {
          _identifier: ip,
          _action: "public_quote_build_quote",
          _max_attempts: 10,
          _window_minutes: 10,
        });
        if (error || data === false) {
          return withGetHeaders(rateLimitedResponse(corsHeaders, 600), isGet);
        }
      } catch (_e) {
        return withGetHeaders(rateLimitedResponse(corsHeaders, 600), isGet);
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
      if (!allowed) return withGetHeaders(rateLimitedResponse(corsHeaders, 600), isGet);
    }

    let response: Response;
    switch (action) {
      case "list_motors":
        response = await listMotors(supabase, body);
        break;
      case "estimate_trade_in":
        response = await estimateTradeIn(supabase, body);
        break;
      case "build_quote":
        response = await buildQuote(supabase, body);
        break;
      default:
        response = json(
          {
            error: `Unknown action: ${action || "(none)"}`,
            available_actions: ["list_motors", "estimate_trade_in", "build_quote"],
            docs_url: `${SITE_URL}/agents`,
          },
          400,
        );
    }

    if (!isGet) return response;
    return await renderGetResponse(response, actionKey, getFormat);
  } catch (err: any) {
    console.error("public-quote-api error:", err);
    if (err instanceof McpInvalidParamsError || err instanceof TradeInInputError) {
      return withGetHeaders(json({ error: err.message }, 400), isGet);
    }
    if (err instanceof HbwValuationError) {
      return withGetHeaders(
        json(
          {
            error: err.message,
            code: err.code,
            notes: [
              `Please retry, or refer the customer to ${SITE_URL}/trade-in-value`,
            ],
          },
          err.status,
        ),
        isGet,
      );
    }
    return withGetHeaders(json({ error: err?.message || "Internal server error" }, 500), isGet);
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
  // Keep in lockstep with the site's canonical detector (src/lib/motor-helpers.ts):
  // [E|M] + optional shaft (L, XL, XXL) + H + optional PT + optional alpha suffix.
  // Matches MH, MLH, EH, ELH, EXLH, ELHPT, EXLHPT, MLHA ... never ELPT / EXLPT.
  return /\b(\d+\.?\d*)?\s*[ME]X{0,2}L?H(?:PT)?[A-Z]*\b/i.test(u);
}


function quoteUrl(motorId: string, opts: Record<string, string | number | undefined>) {
  const params = new URLSearchParams({ motor: motorId });
  for (const [k, v] of Object.entries(opts)) {
    if (v != null && v !== "") params.set(k, String(v));
  }
  return `${SITE_URL}/quote/motor-selection?${params.toString()}`;
}

const DEEP_LINK_TRADE_CONDITIONS = new Set(["excellent", "good", "fair", "poor"]);

function deepLinkTradeCondition(trade: unknown): string | undefined {
  if (!trade || typeof trade !== "object") return undefined;
  const raw = (trade as Record<string, unknown>).condition;
  if (raw == null || raw === "") return undefined;
  const value = String(raw).trim().toLowerCase();
  return DEEP_LINK_TRADE_CONDITIONS.has(value) ? value : undefined;
}

function deepLinkTradeEngineType(trade: unknown): string | undefined {
  if (!trade || typeof trade !== "object") return undefined;
  const record = trade as Record<string, unknown>;
  const raw = record.engine_type ?? record.engineType;
  if (raw == null || raw === "") return undefined;
  try {
    return normalizeHbwStroke(raw);
  } catch {
    return undefined;
  }
}

function deepLinkTradeEngineHours(trade: unknown): number | undefined {
  if (!trade || typeof trade !== "object") return undefined;
  const record = trade as Record<string, unknown>;
  const raw = record.engine_hours ?? record.engineHours ?? record.hours;
  if (raw == null || raw === "") return undefined;
  const hours = typeof raw === "number" || typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(hours) || hours < 0 || hours > 100000) return undefined;
  return hours;
}

// ── GET support ─────────────────────────────────────────
// GET is a read-only front door for assistants that can only issue HTTP GET
// (Meta AI, most ChatGPT/Gemini chat modes). It maps flat query params onto the
// exact same body shape POST uses and calls the same action functions, so the
// numbers are identical. GET never captures a lead and never writes anything.

// Query params that could carry personal information. They are dropped before
// the body is built, so they never reach an action, a database row, or a log.
const GET_IGNORED_PII_PARAMS = new Set([
  "contact",
  "name",
  "customer_name",
  "email",
  "customer_email",
  "phone",
  "customer_phone",
  "referrer",
]);

// Free text supplied by an agent is stripped of control characters and markdown
// syntax before it is echoed back, so it cannot inject instructions or links.
function safeText(value: unknown, maxLen = 80): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, " ")
    .replace(/[`*_~<>[\]()|\\#]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function queryString(params: URLSearchParams, key: string, maxLen = 200): string | undefined {
  const raw = params.get(key);
  if (raw == null) return undefined;
  // Assistants often copy a URL out of a sentence and keep the sentence's closing
  // punctuation ("...engine_type=4-stroke."). Strip it so the value still validates.
  const trimmed = raw.trim().replace(/[.,;:!?)\]]+$/, "").trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

function queryNumber(params: URLSearchParams, key: string): number | undefined {
  const raw = queryString(params, key, 32);
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : Number.NaN;
}

function queryBool(params: URLSearchParams, key: string): boolean | undefined {
  const raw = queryString(params, key, 8);
  if (raw === undefined) return undefined;
  const v = raw.toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return undefined;
}

function bodyFromQuery(params: URLSearchParams): Record<string, unknown> {
  for (const key of GET_IGNORED_PII_PARAMS) params.delete(key);

  const action = queryString(params, "action", 40);
  const body: Record<string, unknown> = { action };

  if (action === "list_motors") {
    const assign = (key: string, value: unknown) => {
      if (value !== undefined) body[key] = value;
    };
    assign("search", queryString(params, "search", 100));
    assign("family", queryString(params, "family", 40));
    assign("min_hp", queryNumber(params, "min_hp"));
    assign("max_hp", queryNumber(params, "max_hp"));
    assign("limit", queryNumber(params, "limit"));
    assign("in_stock_only", queryBool(params, "in_stock_only"));
    return body;
  }

  if (action === "estimate_trade_in") {
    body.brand = queryString(params, "brand", 60);
    body.year = queryNumber(params, "year");
    body.horsepower = queryNumber(params, "horsepower");
    body.condition = queryString(params, "condition", 20);
    const engineType = queryString(params, "engine_type", 20);
    if (engineType !== undefined) body.engine_type = engineType;
    const engineHours = queryNumber(params, "engine_hours");
    if (engineHours !== undefined) body.engine_hours = engineHours;
    const model = queryString(params, "model", 100);
    if (model !== undefined) body.model = model;
    return body;
  }

  if (action === "build_quote") {
    const motorId = queryString(params, "motor_id", 60);
    if (motorId !== undefined) body.motor_id = motorId;
    const hp = queryNumber(params, "horsepower");
    if (hp !== undefined) body.horsepower = hp;
    const family = queryString(params, "family", 40);
    if (family !== undefined) body.family = family;
    const purchasePath = queryString(params, "purchase_path", 20);
    if (purchasePath !== undefined) body.purchase_path = purchasePath;
    const hasProp = queryBool(params, "customer_has_propeller");
    if (hasProp !== undefined) body.customer_has_propeller = hasProp;
    const offerId = queryString(params, "financing_offer_id", 80);
    if (offerId !== undefined) body.financing_offer_id = offerId;

    const boatMake = queryString(params, "boat_make", 80);
    const boatModel = queryString(params, "boat_model", 80);
    if (boatMake !== undefined || boatModel !== undefined) {
      body.boat_info = { make: boatMake ?? null, model: boatModel ?? null };
    }

    const tradeBrand = queryString(params, "trade_brand", 60);
    const tradeYear = queryNumber(params, "trade_year");
    const tradeHp = queryNumber(params, "trade_hp");
    const tradeCondition = queryString(params, "trade_condition", 20);
    const tradeEngineType = queryString(params, "trade_engine_type", 20);
    const tradeEngineHours = queryNumber(params, "trade_engine_hours");
    if (
      tradeBrand !== undefined || tradeYear !== undefined || tradeHp !== undefined ||
      tradeCondition !== undefined || tradeEngineType !== undefined || tradeEngineHours !== undefined
    ) {
      const tradeIn: Record<string, unknown> = {};
      if (tradeBrand !== undefined) tradeIn.brand = tradeBrand;
      if (tradeYear !== undefined) tradeIn.year = tradeYear;
      if (tradeHp !== undefined) tradeIn.horsepower = tradeHp;
      if (tradeCondition !== undefined) tradeIn.condition = tradeCondition;
      if (tradeEngineType !== undefined) tradeIn.engine_type = tradeEngineType;
      if (tradeEngineHours !== undefined) tradeIn.engine_hours = tradeEngineHours;
      body.trade_in = tradeIn;
    }
    return body;
  }

  return body;
}

function withGetHeaders(response: Response, isGet: boolean): Response {
  if (!isGet) return response;
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex");
  return new Response(response.body, { status: response.status, headers });
}

function markdownResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

async function renderGetResponse(
  response: Response,
  actionKey: string,
  format: "markdown" | "json",
): Promise<Response> {
  const payload = await response.json().catch(() => null);

  // Errors keep the exact POST status code and JSON body, even in markdown mode.
  if (!response.ok || payload == null) {
    return withGetHeaders(json(payload ?? { error: "Internal server error" }, response.status), true);
  }

  if (format === "json") {
    const clean = { ...(payload as Record<string, unknown>) };
    delete clean.lead_captured;
    delete clean.lead_validation_error;
    delete clean.lead_capture_error;
    clean.lead_capture = "GET never captures a lead. Use POST with a contact block for lead capture.";
    return withGetHeaders(json(clean, 200), true);
  }

  if (actionKey === "build_quote") return markdownResponse(renderQuoteMarkdown(payload));
  if (actionKey === "estimate_trade_in") return markdownResponse(renderTradeInMarkdown(payload));
  if (actionKey === "list_motors") return markdownResponse(renderMotorsMarkdown(payload));
  return withGetHeaders(json(payload, 200), true);
}

function cad(value: unknown): string {
  const n = Number(value) || 0;
  return `$${n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD`;
}

const GET_RULES_LINES = [
  "- All pricing is CAD. We do not quote USD.",
  "- Estimate only. The final out-the-door price requires confirmation by Harris Boat Works.",
  "- Pickup only at Gores Landing, ON, in person with valid government photo ID. We do not deliver.",
  "- Mercury Verado is special-order only and is not quoted here. Call (905) 342-2153 for a Verado configuration.",
  "- This GET response never captures a lead. Send the customer the 'Continue this quote' link, or call (905) 342-2153.",
];

function renderQuoteMarkdown(p: any): string {
  const motor = p.motor || {};
  const lines: string[] = [];
  const title = safeText(motor.modelDisplay, 120) || "Mercury Outboard";
  lines.push(`# Mercury quote estimate: ${title}`);
  lines.push("");
  lines.push(`Generated: ${p.lastUpdated}`);
  lines.push(`Price valid until: ${p.priceValidUntil}`);
  lines.push(`Motor: ${title}, ${Number(motor.horsepower) || 0} HP ${safeText(motor.family, 40)}`.trim());
  lines.push(`Purchase path: ${p.purchase_path === "loose" ? "Loose motor, pickup only" : "Installed at Gores Landing"}`);
  if (p.purchase_path_note) lines.push(`Note: ${p.purchase_path_note}`);
  lines.push("");

  lines.push("## Line items");
  lines.push("");
  for (const item of (p.line_items || [])) {
    const desc = safeText(item.description, 120);
    lines.push(`- ${safeText(item.name, 120)}: ${cad(item.price)}${desc ? ` (${desc})` : ""}`);
  }
  lines.push("");

  const pricing = p.pricing || {};
  lines.push("## Totals");
  lines.push("");
  lines.push(`- Subtotal: ${cad(pricing.subtotal)}`);
  if (Number(pricing.trade_in_credit) > 0) {
    lines.push(`- Trade-in credit: -${cad(pricing.trade_in_credit)}`);
    lines.push(`- Adjusted subtotal: ${cad(pricing.adjusted_subtotal)}`);
  }
  lines.push(`- HST (13%): ${cad(pricing.hst)}`);
  lines.push(`- **Total: ${cad(pricing.final_price)}**`);
  if (Number(pricing.deposit_required) > 0) {
    lines.push(`- Deposit to reserve: ${cad(pricing.deposit_required)}`);
  }
  lines.push("");

  if (p.trade_in?.estimate) {
    const est = p.trade_in.estimate;
    lines.push("## Trade-in");
    lines.push("");
    lines.push(`- Estimated range: ${cad(est.low)} to ${cad(est.high)}`);
    lines.push(`- Credit applied: ${cad(p.trade_in.credit_applied)}`);
    lines.push("- Final trade value requires in-person inspection at Gores Landing.");
    lines.push("");
  }

  const financing = p.financing;
  if (financing?.eligible) {
    lines.push("## Financing");
    lines.push("");
    const aprPercent = financing.offer?.apr_percent ??
      (financing.apr != null ? (Number(financing.apr) < 1 ? Number(financing.apr) * 100 : Number(financing.apr)) : null);
    if (aprPercent != null) lines.push(`- APR: ${Number(aprPercent).toFixed(2)}%`);
    if (financing.monthly_payment != null) lines.push(`- Estimated monthly payment: ${cad(financing.monthly_payment)}`);
    if (financing.amortization_months != null) lines.push(`- Amortization: ${financing.amortization_months} months`);
    if (financing.amount_financed != null) lines.push(`- Amount financed: ${cad(financing.amount_financed)}`);
    for (const offer of (financing.available_offers || [])) {
      const offerBits = [safeText(offer.name || offer.label, 120)];
      if (offer.apr_percent != null) offerBits.push(`${Number(offer.apr_percent).toFixed(2)}% APR`);
      if (offer.amortization_months != null) offerBits.push(`${offer.amortization_months} months`);
      if (offer.monthly_payment != null) offerBits.push(`est. ${cad(offer.monthly_payment)}/month`);
      lines.push(`- Offer (financing_offer_id=${String(offer.id).replace(/[^A-Za-z0-9:_-]/g, "").slice(0, 80)}): ${offerBits.join(", ")}`);
    }
    lines.push("- Estimates only, subject to lender approval.");
    lines.push("");
  } else if (financing) {
    lines.push("## Financing");
    lines.push("");
    lines.push(`- Not available for this total. ${safeText(financing.reason, 200)}`.trim());
    lines.push("");
  }

  lines.push("## Continue this quote");
  lines.push("");
  lines.push(`${p.deep_link}`);
  lines.push("");
  lines.push("## Rules");
  lines.push("");
  lines.push(...GET_RULES_LINES);
  lines.push("");
  return lines.join("\n");
}

function renderTradeInMarkdown(p: any): string {
  const input = p.input || {};
  const est = p.estimate || {};
  const lines = [
    `# Trade-in estimate: ${safeText(input.brand, 40)} ${input.year || ""} ${input.horsepower || ""} HP`.trim(),
    "",
    `Generated: ${p.lastUpdated}`,
    `Condition: ${safeText(input.condition, 20)}`,
    "",
    "## Estimate",
    "",
    `- Range: ${cad(est.low)} to ${cad(est.high)}`,
    `- Wholesale average: ${cad(est.average)}`,
    `- Confidence: ${safeText(est.confidence, 40)}`,
    "",
    "## Rules",
    "",
    "- Trade-in estimate only. Final value requires in-person inspection at Gores Landing, ON.",
    `- Detailed report: ${SITE_URL}/trade-in-value`,
    ...GET_RULES_LINES,
    "",
  ];
  return lines.join("\n");
}

function renderMotorsMarkdown(p: any): string {
  const lines = [
    "# Mercury inventory",
    "",
    `Generated: ${p.lastUpdated}`,
    `Count: ${p.count}`,
    "",
    "| Model | HP | Shaft | Controls | Start | Price (CAD) | Availability | Quote link |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const m of (p.motors || [])) {
    lines.push(
      `| ${safeText(m.modelDisplay, 80)} | ${m.horsepower} | ${formatMercuryShaftMarkdown(m.shaftLength ?? null, m.shaftInches ?? null)} | ${safeText(m.controlType, 20) || "—"} | ${safeText(m.startType, 20) || "—"} | ${cad(m.sellingPrice)} | ${safeText(m.availability, 40)} | ${m.quoteUrl} |`,
    );
  }
  lines.push("");
  lines.push("Shaft, controls and start are decoded from the Mercury model code when the dealer record is blank. Confirm against the customer's transom before ordering. Tiller motors are always quoted as loose motors.");
  lines.push("");
  lines.push("## Rules");
  lines.push("");
  lines.push(...GET_RULES_LINES);
  lines.push("");
  return lines.join("\n");
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
      "id, model_display, model, model_key, model_number, horsepower, family, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, stock_quantity, image_url, hero_image_url, year, shaft, shaft_code, control_type",
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
      const specs = resolveMercuryCatalogSpecs({
        modelDisplay: m.model_display || m.model,
        shaft: m.shaft,
        shaftCode: m.shaft_code,
        controlType: m.control_type,
      });
      return {
        id: m.id,
        slug,
        modelDisplay: m.model_display,
        family: m.family,
        horsepower: Number(m.horsepower) || 0,
        shaftLength: specs.shaftLength,
        shaftInches: specs.shaftInches,
        controlType: specs.controlType,
        startType: specs.startType,
        powerTrim: specs.powerTrim,
        commandThrust: specs.commandThrust,
        specSource: specs.specSource,
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
  const purchasePathRequested = quoteFlags.purchase_path === "loose"
    ? "loose"
    : quoteFlags.purchase_path === "installed" ? "installed" : null;
  const purchasePathNote = isTiller && purchasePathRequested !== "loose"
    ? "Tiller-handle motors are quoted as a loose motor for pickup at Gores Landing, so no remote-rigging installation or propeller allowance lines apply. If the customer wants Harris Boat Works to mount it, tiller mounting options are chosen in the online quote builder (the Continue this quote link) or by calling (905) 342-2153."
    : null;
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
    trade_condition: deepLinkTradeCondition(body?.trade_in),
    trade_engine_type: deepLinkTradeEngineType(body?.trade_in),
    trade_engine_hours: deepLinkTradeEngineHours(body?.trade_in),
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
    purchase_path_requested: purchasePathRequested,
    purchase_path_note: purchasePathNote,
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
    method: "POST for full access (including lead capture), GET for read-only estimates",
    get_usage: {
      description:
        "For assistants that can only issue HTTP GET. Same pricing code as POST, so the numbers are identical. GET never captures a lead and never writes anything; contact params (name, email, phone, contact, referrer) are ignored and not logged.",
      format:
        "Default response is text/markdown; charset=utf-8. Add format=json for the same JSON POST returns, minus the lead fields.",
      headers: "GET action responses send Cache-Control: no-store and X-Robots-Tag: noindex.",
      rate_limits:
        "GET shares the per-IP buckets with POST: build_quote 10 per 10 minutes, estimate_trade_in 30 per 10 minutes, list_motors 120 per 10 minutes.",
      examples: {
        build_quote:
          "https://www.mercuryrepower.ca/api/agents/quote?action=build_quote&motor_id=b16ac296-e506-4357-ad69-18a0aa347cbf&purchase_path=installed&boat_make=Lund&boat_model=Pro-V&trade_brand=Mercury&trade_year=2010&trade_hp=75&trade_condition=good&trade_engine_type=4-stroke",
        estimate_trade_in:
          "https://www.mercuryrepower.ca/api/agents/quote?action=estimate_trade_in&brand=Mercury&year=2010&horsepower=75&condition=good&engine_type=4-stroke",
        list_motors:
          "https://www.mercuryrepower.ca/api/agents/quote?action=list_motors&family=FourStroke&min_hp=75&max_hp=115",
      },
      build_quote_params: [
        "motor_id OR (horsepower + family)",
        "purchase_path (installed | loose)",
        "customer_has_propeller (true | false)",
        "financing_offer_id",
        "boat_make",
        "boat_model",
        "trade_brand",
        "trade_year",
        "trade_hp",
        "trade_condition",
        "trade_engine_type",
        "trade_engine_hours",
      ],
      motor_specs:
        "list_motors rows include shaftLength (S | L | XL | XXL), shaftInches (15 | 20 | 25 | 30), controlType (Tiller | Remote), startType, powerTrim, commandThrust and specSource (database | model_code). Values decoded from the Mercury model code must be confirmed against the customer's transom before ordering; null means the model code does not state it.",
      tiller_motors:
        "Tiller-handle motors are always quoted as purchase_path loose (no remote-rigging installation or propeller allowance lines), even when installed was requested. The response carries purchase_path_requested and purchase_path_note explaining this.",
      lead_capture:
        "Lead capture is POST-only. On GET, hand the customer the 'Continue this quote' deep link in the response, or (905) 342-2153.",
    },
    errors: {
      note:
        "Errors always return JSON with the same status codes on GET and POST, even when the successful GET response is markdown.",
      "400": {
        body: '{"error": "<message>"}; an unknown action also returns available_actions and docs_url',
        action: "Fix the request parameters and retry.",
      },
      "404": {
        body: '{"error": "Motor not found"}',
        action: "Re-check motor_id against list_motors, or search by horsepower + family.",
      },
      "405": {
        body: '{"error": "Method not allowed. Use GET or POST."}',
        action: "Use GET or POST.",
      },
      "422": {
        body:
          '{"error": "<message>"} for Verado (special-order only, not quoted here) or a motor with no published price',
        action: "Do not estimate. Route the customer to (905) 342-2153.",
      },
      "429": {
        body: '{"error": "Too many requests. Please try again in a moment.", "code": "rate_limited"}',
        headers: "Retry-After: 600 (seconds)",
        action: "Back off for the Retry-After window, then retry.",
      },
      "500": {
        body: '{"error": "<message>"}',
        action:
          "Retry once. If it fails again, hand the customer the deep link or (905) 342-2153.",
      },
      trade_in_upstream: {
        body: '{"error": "<message>", "code": "<code>", "notes": [...]} at the upstream status code',
        action: `Retry, or send the customer to ${SITE_URL}/trade-in-value.`,
      },
    },
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
