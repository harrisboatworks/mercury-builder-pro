// UCP (Universal Commerce Protocol) checkout service for Harris Boat Works.
// Spec version 2026-04-08 (ucp.dev). QUOTE MODE by design:
//   - payment is never collected (spec-sanctioned: "e.g., quote generation")
//   - fulfillment is pickup-only at Gores Landing (type: "pickup", one Retail Location)
//   - sessions land in status "requires_escalation" with a requires_buyer_review
//     message and a continue_url into the HBW quote flow (dealer confirms final price)
//   - if the agent provides buyer contact info (email + name), a lead is captured
//     into customer_quotes (lead_source "ucp-checkout"), same pipeline as build_quote.
//     Captured once per session; flagged via the vendor extension key
//     "ca.mercuryrepower.lead_captured" on the checkout object.
//
// TWO TRANSPORTS on this endpoint:
//   REST: POST/GET/PUT /checkout-sessions[, /{id}, /{id}/complete, /{id}/cancel]
//   MCP (JSON-RPC 2.0 POST to bare endpoint): initialize | tools/list | tools/call
//     tools: create_checkout, get_checkout, update_checkout, complete_checkout, cancel_checkout

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sanitizeAgentNote } from "../_shared/sanitize.ts";
import {
  PUBLIC_CATALOG_AVAILABILITY_OR,
  PUBLIC_SITE_URL,
} from "../_shared/public-motor-contract.ts";
import {
  checkUcpPlatformProfile,
  parseUcpAllowedOrigins,
  parseUcpCheckoutLineItems,
  resolveUcpPricedItem,
  ucpQuoteScopeMessage,
  ucpTaxAndTotal,
  UCP_QUOTE_SCOPE_NOTICE,
  UcpClientError,
} from "../_shared/ucp-checkout-contract.ts";

const UCP_VERSION = "2026-04-08";
const SITE = PUBLIC_SITE_URL;
const HST_RATE = 0.13;
const LEAD_FLAG = "ca.mercuryrepower.lead_captured";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, ucp-agent, idempotency-key, signature, signature-input, request-id, mcp-session-id",
};

const ACTIVE_CAPABILITIES = [
  { name: "dev.ucp.shopping.checkout", version: UCP_VERSION },
  { name: "dev.ucp.shopping.fulfillment", version: UCP_VERSION },
];

function ucpEnvelope() {
  return { version: UCP_VERSION, capabilities: ACTIVE_CAPABILITIES };
}

const LINKS = [
  { type: "privacy_policy", url: `${SITE}/privacy` },
  { type: "terms_of_service", url: `${SITE}/terms` },
  { type: "merchant", url: SITE },
];

const PICKUP_DESTINATION = {
  id: "hbw-gores-landing",
  name: "Harris Boat Works",
  address: {
    street_address: "5369 Harris Boat Works Rd",
    address_locality: "Gores Landing",
    address_region: "ON",
    postal_code: "K0K 2E0",
    address_country: "CA",
  },
};

async function rateLimitOk(supabase: any, req: Request): Promise<boolean> {
  const xff = req.headers.get("x-forwarded-for");
  const identifier = xff ? xff.split(",")[0].trim() : (req.headers.get("x-real-ip") || "unknown");
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      _identifier: identifier,
      _action: "ucp_checkout",
      _max_attempts: 120,
      _window_minutes: 10,
    });
    if (error) return true;
    return data !== false;
  } catch (_e) {
    return true;
  }
}

const profileCache = new Map<string, { ok: boolean; ts: number }>();
const PROFILE_TTL_MS = 60_000;

function parseProfileUrl(req: Request, mcpMeta?: any): string | null {
  const fromMeta = mcpMeta?.["ucp-agent"]?.profile;
  if (typeof fromMeta === "string") return fromMeta;
  const h = req.headers.get("ucp-agent");
  if (!h) return null;
  const m = h.match(/profile="([^"]+)"/);
  return m ? m[1] : null;
}

async function checkPlatformProfile(url: string | null): Promise<{ warning?: any; reject?: { code: string; status: number } }> {
  return await checkUcpPlatformProfile({
    url,
    strict: (Deno.env.get("UCP_STRICT_PROFILES") || "").toLowerCase() === "true",
    allowedOrigins: parseUcpAllowedOrigins(Deno.env.get("UCP_PROFILE_ALLOWED_ORIGINS")),
    fetchImpl: fetch,
    cache: profileCache,
    ttlMs: PROFILE_TTL_MS,
  });
}

function newSessionId(): string {
  return "chk_" + crypto.randomUUID().replace(/-/g, "");
}

async function resolveLineItems(supabase: any, rawItems: any[]): Promise<{ line_items: any[]; problems: any[]; motorIds: string[] }> {
  const parsedItems = parseUcpCheckoutLineItems(rawItems);
  const line_items: any[] = [];
  const problems: any[] = [];
  const motorIds: string[] = [];
  for (let i = 0; i < parsedItems.length; i++) {
    const { itemId, quantity } = parsedItems[i];
    const { data, error } = await supabase
      .from("motor_models")
      .select("id, model, model_display, model_number, family, horsepower, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock")
      .eq("id", itemId)
      .or(PUBLIC_CATALOG_AVAILABILITY_OR)
      .limit(1);
    if (error) throw { status: 503, code: "catalog_unavailable", message: "Motor catalog is temporarily unavailable. Retry later." };
    if (!data?.length) {
      problems.push({ code: "item_not_found", severity: "requires_buyer_input", content: `Item ${itemId} was not found in current Mercury inventory. Search the catalog and retry.` });
      continue;
    }
    const priced = resolveUcpPricedItem(data[0], quantity);
    if (priced.problem) {
      problems.push({
        code: priced.problem.code,
        severity: priced.problem.code === "special_order_only" ? "requires_buyer_review" : "requires_buyer_input",
        content: priced.problem.content,
      });
      continue;
    }
    motorIds.push(itemId);
    line_items.push({
      id: `li_${i + 1}`,
      item: {
        id: itemId,
        title: `Mercury ${priced.motor.model_display || priced.motor.model}`,
        price: priced.cents,
      },
      quantity: priced.quantity,
      totals: [
        { type: "subtotal", amount: priced.lineTotal },
        { type: "total", amount: priced.lineTotal },
      ],
    });
  }
  return { line_items, problems, motorIds };
}

function buildCheckout(id: string, line_items: any[], problems: any[], buyer: any, profileWarning: any, expiresAt: string) {
  const subtotal = line_items.reduce((s, li) => s + (li.item.price * li.quantity), 0);
  const money = ucpTaxAndTotal(subtotal, HST_RATE);
  if (line_items.length > 0 && money === null) {
    throw new UcpClientError("invalid_request", "Checkout totals are not finite integer cents.");
  }
  const tax = money?.tax ?? 0;
  const total = money?.total ?? 0;
  const allIds = line_items.map((li) => li.id);

  const messages: any[] = [];
  if (line_items.length > 0) {
    messages.push({
      code: "dealer_confirmation_required",
      severity: "requires_buyer_review",
      content:
        "This is a quote, not a completed purchase. Outboard motors are high-value items: Harris Boat Works confirms final pricing, rigging fit, and availability with every buyer. Continue on our site or call (905) 342-2153 to finalize. Pickup only at Gores Landing, ON, by the buyer in person with valid government photo ID.",
    });
    messages.push(ucpQuoteScopeMessage());
  }
  messages.push(...problems);
  if (profileWarning) messages.push(profileWarning);

  const status = line_items.length === 0 ? "incomplete" : "requires_escalation";
  const motorParam = line_items.length === 1 ? `&motor=${line_items[0].item.id}` : "";
  const continue_url = `${SITE}/quote/motor-selection?ucp=${id}${motorParam}`;

  const checkout: any = {
    ucp: ucpEnvelope(),
    id,
    status,
    currency: "CAD",
    line_items,
    totals: [
      { type: "subtotal", amount: subtotal, display_text: "Subtotal" },
      { type: "tax", amount: tax, display_text: "HST (13%, estimate)" },
      { type: "fulfillment", amount: 0, display_text: "In-Store Pickup" },
      { type: "total", amount: total, display_text: "Estimated total. Final price confirmed by Harris Boat Works." },
    ],
    links: LINKS,
    messages,
    continue_url,
    expires_at: expiresAt,
  };

  if (buyer && typeof buyer === "object") checkout.buyer = buyer;

  if (line_items.length > 0) {
    checkout.fulfillment = {
      methods: [
        {
          id: "pickup",
          type: "pickup",
          line_item_ids: allIds,
          selected_destination_id: PICKUP_DESTINATION.id,
          destinations: [PICKUP_DESTINATION],
          groups: [
            {
              id: "g1",
              line_item_ids: allIds,
              selected_option_id: "in-store-pickup",
              options: [
                {
                  id: "in-store-pickup",
                  title: "In-Store Pickup",
                  description: "Pick up your motor at Harris Boat Works, 5369 Harris Boat Works Rd, Gores Landing, ON. Buyer must collect in person with valid government photo ID; we do not release motors to couriers or third parties.",
                  totals: [{ type: "total", amount: 0 }],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  return checkout;
}

// ---------- lead capture (same pipeline as public-quote-api build_quote) ----------
async function captureLead(supabase: any, checkout: any, motorIds: string[], profileUrl: string | null) {
  try {
    if (checkout[LEAD_FLAG]) return; // once per session
    const b = checkout.buyer || {};
    const email = typeof b.email === "string" ? b.email.trim() : "";
    const name = [b.first_name, b.last_name].filter(Boolean).join(" ").trim();
    if (!email || !name) return; // same bar as build_quote: email + name
    const totalLine = (checkout.totals || []).find((t: any) => t.type === "total");
    const subtotalLine = (checkout.totals || []).find((t: any) => t.type === "subtotal");
    const finalPrice = totalLine ? totalLine.amount / 100 : null;
    const basePrice = subtotalLine ? subtotalLine.amount / 100 : null;
    const safeProfile = sanitizeAgentNote(profileUrl || "none", 200);
    const { error } = await supabase.from("customer_quotes").insert({
      customer_name: name.slice(0, 200),
      customer_email: email.slice(0, 200),
      customer_phone: b.phone_number ? String(b.phone_number).slice(0, 50) : null,
      motor_model_id: motorIds[0] || null,
      base_price: basePrice,
      final_price: finalPrice,
      total_cost: finalPrice,
      deposit_amount: 0,
      loan_amount: 0,
      monthly_payment: 0,
      term_months: 0,
      lead_source: "ucp-checkout",
      lead_status: "new",
      notes: `UCP checkout session ${checkout.id} — agent profile: ${safeProfile}`,
      quote_data: { ucp_session_id: checkout.id, line_items: checkout.line_items, totals: checkout.totals, continue_url: checkout.continue_url },
    });
    if (!error) checkout[LEAD_FLAG] = true;
    else console.error("[ucp-checkout] lead capture failed:", error.message);
  } catch (e: any) {
    console.error("[ucp-checkout] lead capture exception:", e?.message);
  }
}

function db() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function saveSession(supabase: any, checkout: any, agentProfileUrl: string | null) {
  const { error } = await supabase.from("ucp_checkout_sessions").upsert({
    id: checkout.id,
    status: checkout.status,
    payload: checkout,
    agent_profile_url: agentProfileUrl,
    updated_at: new Date().toISOString(),
    expires_at: checkout.expires_at,
  });
  if (error) throw new Error(error.message);
}

async function loadSession(supabase: any, id: string): Promise<any | null> {
  const { data, error } = await supabase.from("ucp_checkout_sessions").select("id, status, payload, expires_at").eq("id", id).limit(1);
  if (error || !data?.length) return null;
  const row = data[0];
  const checkout = structuredClone(row.payload);
  if (!["completed", "canceled"].includes(row.status) && new Date(row.expires_at) < new Date()) {
    checkout.status = "canceled";
    checkout.messages = [...(checkout.messages || []), { code: "session_expired", severity: "info", content: "This checkout session expired. Create a new one or build a quote on our site." }];
    delete checkout.continue_url;
    // Expiration is projected on reads; GET and rejected updates never persist.
  }
  return checkout;
}

function checkoutRequest(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw { status: 400, code: "invalid_request", message: "Checkout body must be an object." };
  }
  const value = Object.prototype.hasOwnProperty.call(body, "checkout") ? (body as any).checkout : body;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw { status: 400, code: "invalid_request", message: "checkout must be an object." };
  }
  return value as Record<string, unknown>;
}

// ---------- shared operation handlers ----------
async function opCreate(supabase: any, co: any, profileWarning: any, profileUrl: string | null) {
  const rawItems = co?.line_items;
  parseUcpCheckoutLineItems(rawItems);
  const id = newSessionId();
  const expiresAt = new Date(Date.now() + 6 * 3600_000).toISOString();
  const { line_items, problems, motorIds } = await resolveLineItems(supabase, rawItems);
  const checkout = buildCheckout(id, line_items, problems, co?.buyer, profileWarning, expiresAt);
  await captureLead(supabase, checkout, motorIds, profileUrl);
  await saveSession(supabase, checkout, profileUrl);
  return checkout;
}

async function opUpdate(supabase: any, existing: any, co: any, profileWarning: any, profileUrl: string | null) {
  if (["completed", "canceled"].includes(existing.status)) {
    throw { status: 409, code: "session_terminal", message: `Session is ${existing.status} and immutable.` };
  }
  const rawItems = co?.line_items;
  parseUcpCheckoutLineItems(rawItems);
  const { line_items, problems, motorIds } = await resolveLineItems(supabase, rawItems);
  const checkout = buildCheckout(existing.id, line_items, problems, co?.buyer, profileWarning, existing.expires_at);
  if (existing[LEAD_FLAG]) checkout[LEAD_FLAG] = true; // carry the once-per-session flag
  await captureLead(supabase, checkout, motorIds, profileUrl);
  await saveSession(supabase, checkout, profileUrl);
  return checkout;
}

async function opComplete(supabase: any, existing: any, profileUrl: string | null) {
  if (existing.status === "canceled") throw { status: 409, code: "session_terminal", message: "Session is canceled." };
  existing.status = "requires_escalation";
  existing.messages = [
    {
      code: "dealer_completion_required",
      severity: "requires_buyer_review",
      content:
        "Harris Boat Works does not complete motor sales via API. The buyer finishes this purchase with the dealer: continue on our site or call (905) 342-2153. Final price, rigging fit, and availability are confirmed by the dealer. Pickup only at Gores Landing, ON, in person with valid government photo ID.",
    },
    ...(existing.messages || []).filter((m: any) => m.code !== "dealer_completion_required"),
  ];
  const motorIds = (existing.line_items || []).map((li: any) => li.item?.id).filter(Boolean);
  await captureLead(supabase, existing, motorIds, profileUrl);
  await saveSession(supabase, existing, profileUrl);
  return existing;
}

async function opCancel(supabase: any, existing: any, profileUrl: string | null) {
  if (existing.status === "completed") throw { status: 409, code: "session_terminal", message: "Session is completed and immutable." };
  existing.status = "canceled";
  delete existing.continue_url;
  await saveSession(supabase, existing, profileUrl);
  return existing;
}

// ---------- MCP layer ----------
const MCP_TOOLS = [
  {
    name: "create_checkout",
    description: "Create a UCP checkout session (quote mode) for Mercury outboards at Harris Boat Works. Item ids are HBW motor ids. Include buyer (first_name, last_name, email, phone_number) to register the quote with the dealership. Returns totals in CAD cents, pickup-only fulfillment, and a continue_url for dealer completion.",
    inputSchema: {
      type: "object",
      properties: {
        meta: { type: "object" },
        checkout: {
          type: "object",
          properties: {
            line_items: { type: "array", items: { type: "object" } },
            buyer: {
              type: "object",
              properties: {
                first_name: { type: "string" },
                last_name: { type: "string" },
                email: { type: "string" },
                phone_number: { type: "string" },
              },
            },
          },
          required: ["line_items"],
        },
      },
      required: ["checkout"],
    },
    outputSchema: { $ref: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/checkout.json` },
  },
  {
    name: "get_checkout",
    description: "Fetch a UCP checkout session by id.",
    inputSchema: { type: "object", properties: { meta: { type: "object" }, id: { type: "string" } }, required: ["id"] },
    outputSchema: { $ref: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/checkout.json` },
  },
  {
    name: "update_checkout",
    description: "Replace a UCP checkout session (full replacement per spec).",
    inputSchema: {
      type: "object",
      properties: { meta: { type: "object" }, id: { type: "string" }, checkout: { type: "object" } },
      required: ["id", "checkout"],
    },
    outputSchema: { $ref: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/checkout.json` },
  },
  {
    name: "complete_checkout",
    description: "Attempt to complete a checkout. Harris Boat Works operates in quote mode: this returns requires_escalation with a continue_url; the dealer completes every sale with the buyer directly.",
    inputSchema: { type: "object", properties: { meta: { type: "object" }, id: { type: "string" }, payment: { type: "object" } }, required: ["id"] },
    outputSchema: { $ref: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/checkout.json` },
  },
  {
    name: "cancel_checkout",
    description: "Cancel a UCP checkout session.",
    inputSchema: { type: "object", properties: { meta: { type: "object" }, id: { type: "string" } }, required: ["id"] },
    outputSchema: { $ref: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/checkout.json` },
  },
];

function rpcResult(id: any, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function rpcError(id: any, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function toolResult(checkout: any) {
  return {
    content: [{ type: "text", text: JSON.stringify(checkout) }],
    structuredContent: checkout,
  };
}

async function handleMcp(req: Request, supabase: any, payload: any): Promise<Response> {
  const { id = null, method, params = {} } = payload;

  if (method === "initialize") {
    return json(rpcResult(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: {
        name: "harris-boat-works-ucp",
        version: "1.1.0",
        description: "UCP checkout (quote mode) for Harris Boat Works. Mercury outboards, CAD, pickup only at Gores Landing, ON.",
      },
    }));
  }

  if (method === "tools/list") {
    return json(rpcResult(id, { tools: MCP_TOOLS }));
  }

  if (method === "tools/call") {
    const name = params?.name;
    const args = params?.arguments || {};
    const profileUrl = parseProfileUrl(req, args?.meta);
    const profileCheck = await checkPlatformProfile(profileUrl);
    if (profileCheck.reject) {
      return json(rpcError(id, -32000, `Platform profile validation failed (${profileCheck.reject.code}).`), profileCheck.reject.status);
    }
    try {
      switch (name) {
        case "create_checkout": {
          const checkout = await opCreate(supabase, args.checkout || {}, profileCheck.warning, profileUrl);
          return json(rpcResult(id, toolResult(checkout)), 201);
        }
        case "get_checkout": {
          const existing = await loadSession(supabase, args.id);
          if (!existing) return json(rpcError(id, -32004, `No checkout session ${args.id}.`), 404);
          return json(rpcResult(id, toolResult(existing)));
        }
        case "update_checkout": {
          const existing = await loadSession(supabase, args.id);
          if (!existing) return json(rpcError(id, -32004, `No checkout session ${args.id}.`), 404);
          const checkout = await opUpdate(supabase, existing, args.checkout || {}, profileCheck.warning, profileUrl);
          return json(rpcResult(id, toolResult(checkout)));
        }
        case "complete_checkout": {
          const existing = await loadSession(supabase, args.id);
          if (!existing) return json(rpcError(id, -32004, `No checkout session ${args.id}.`), 404);
          const checkout = await opComplete(supabase, existing, profileUrl);
          return json(rpcResult(id, toolResult(checkout)));
        }
        case "cancel_checkout": {
          const existing = await loadSession(supabase, args.id);
          if (!existing) return json(rpcError(id, -32004, `No checkout session ${args.id}.`), 404);
          const checkout = await opCancel(supabase, existing, profileUrl);
          return json(rpcResult(id, toolResult(checkout)));
        }
        default:
          return json(rpcError(id, -32601, `Unknown tool: ${name}`), 404);
      }
    } catch (e: any) {
      if (e instanceof UcpClientError) return json(rpcError(id, -32000, `${e.code}: ${e.message}`), e.status);
      if (e?.status && e?.code) return json(rpcError(id, -32000, `${e.code}: ${e.message}`), e.status);
      console.error("[ucp-checkout mcp] error:", e);
      return json(rpcError(id, -32603, "Unable to process checkout. Please try again later."), 500);
    }
  }

  return json(rpcError(id, -32601, `Method not found: ${method}`), 404);
}

function err(status: number, code: string, message: string) {
  return json({ ucp: { version: UCP_VERSION, status: "error" }, error: { code, message } }, status);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const fnIdx = parts.indexOf("ucp-checkout");
  const route = parts.slice(fnIdx + 1);

  const supabase = db();
  const allowed = await rateLimitOk(supabase, req);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Too many requests.", code: "rate_limited" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  if (route.length === 0) {
    if (req.method === "GET") {
      return json({
        ucp: ucpEnvelope(),
        service: "Harris Boat Works UCP checkout (quote mode)",
        profile: `${SITE}/.well-known/ucp`,
        transports: {
          rest: {
            create: "POST /checkout-sessions",
            get: "GET /checkout-sessions/{id}",
            update: "PUT /checkout-sessions/{id}",
            complete: "POST /checkout-sessions/{id}/complete",
            cancel: "POST /checkout-sessions/{id}/cancel",
          },
          mcp: { methods: ["initialize", "tools/list", "tools/call"], tools: MCP_TOOLS.map((t) => t.name) },
        },
        notes: [
          "Quote mode: payment is never collected via UCP. Sessions escalate to dealer confirmation via continue_url.",
          UCP_QUOTE_SCOPE_NOTICE,
          "Buyer contact attempts lead capture. Only report registration when ca.mercuryrepower.lead_captured is true.",
          "Pickup only at Gores Landing, ON, by the buyer in person with valid government photo ID.",
          "Item ids are Mercury motor ids from the HBW catalog (see search_motors on the MCP server or /pricing-reference).",
        ],
        docs: `${SITE}/agents`,
      });
    }
    if (req.method === "POST") {
      let payload: any;
      try { payload = await req.json(); } catch { return err(400, "invalid_request", "Body must be JSON."); }
      if (payload && payload.jsonrpc === "2.0") {
        return await handleMcp(req, supabase, payload);
      }
      return err(400, "invalid_request", "POST to the bare endpoint must be a JSON-RPC 2.0 message (MCP transport). REST operations live under /checkout-sessions.");
    }
  }

  if (route[0] !== "checkout-sessions") return err(404, "not_found", "Unknown route. See GET / for operations.");

  const profileUrl = parseProfileUrl(req);
  const profileCheck = await checkPlatformProfile(profileUrl);
  if (profileCheck.reject) return err(profileCheck.reject.status, profileCheck.reject.code, "Platform profile validation failed.");

  try {
    if (route.length === 1 && req.method === "POST") {
      let body: any;
      try { body = await req.json(); } catch { return err(400, "invalid_request", "Body must be JSON."); }
      const checkout = await opCreate(supabase, checkoutRequest(body), profileCheck.warning, profileUrl);
      return json(checkout, 201);
    }

    const id = route[1];
    if (!id) return err(400, "invalid_request", "Missing checkout session id.");
    const existing = await loadSession(supabase, id);
    if (!existing) return err(404, "not_found", `No checkout session ${id}.`);

    if (route.length === 2 && req.method === "GET") return json(existing);

    if (route.length === 2 && req.method === "PUT") {
      let body: any;
      try { body = await req.json(); } catch { return err(400, "invalid_request", "Body must be JSON."); }
      const checkout = await opUpdate(supabase, existing, checkoutRequest(body), profileCheck.warning, profileUrl);
      return json(checkout);
    }

    if (route.length === 3 && route[2] === "complete" && req.method === "POST") {
      const checkout = await opComplete(supabase, existing, profileUrl);
      return json(checkout);
    }

    if (route.length === 3 && route[2] === "cancel" && req.method === "POST") {
      const checkout = await opCancel(supabase, existing, profileUrl);
      return json(checkout);
    }

    return err(405, "method_not_allowed", "Unsupported method for this route.");
  } catch (e: any) {
    if (e?.status && e?.code) return err(e.status, e.code, e.message);
    console.error("[ucp-checkout] error:", e);
    return err(500, "internal_error", "Unable to process checkout. Please try again later.");
  }
});
