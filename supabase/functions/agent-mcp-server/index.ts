// MCP-style server for AI agents (Claude Desktop, ChatGPT custom GPTs, Cursor, etc.)
// Implements a JSON-RPC 2.0 surface with the Model Context Protocol shape:
//   - initialize
//   - tools/list
//   - tools/call
//
// Tools exposed:
//   - search_motors        : filter Mercury inventory by HP/family/in_stock
//   - get_motor            : fetch one motor by id or slug
//   - estimate_trade_in    : ballpark trade value
//   - build_quote          : itemized CAD quote with deep-link
//   - get_brand_rules      : authoritative source-of-truth (special-order Verado, CAD only, etc.)
//
// Public, no-auth, CORS-open. Wraps the existing public-quote-api + public-motors-api
// so external agents have one canonical MCP endpoint.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, mcp-session-id",
};

import {
  applyMotorPresentationOverrides,
  familyKey,
  motorSlug,
} from "../_shared/motor-slug.ts";
import {
  isPublicCatalogMotor,
  PUBLIC_CATALOG_AVAILABILITY_OR,
  PUBLIC_SITE_URL,
  resolvePublicSellingPrice,
  toPublicImageUrl,
} from "../_shared/public-motor-contract.ts";
import {
  fetchActiveFinancing,
  fetchActivePromotions,
} from "../_shared/customer-knowledge-context.ts";
import {
  mcpToolResult,
  mcpUpstreamErrorResult,
  parseMcpJsonRpc,
  parseMcpToolArguments,
  presentPublicAgentBrandRules,
  McpInvalidParamsError,
} from "../_shared/public-agent-mcp.ts";

const SITE_URL = PUBLIC_SITE_URL;
const QUOTE_API = `${Deno.env.get("SUPABASE_URL")}/functions/v1/public-quote-api`;
const MOTORS_API = `${Deno.env.get("SUPABASE_URL")}/functions/v1/public-motors-api`;

const TOOLS = [
  {
    name: "search_motors",
    description:
      "Search current Mercury outboard inventory at Harris Boat Works (Ontario). Filter by horsepower, family (FourStroke, Pro XS, SeaPro, Racing), or stock status. Returns CAD pricing. Excludes Verado.",
    inputSchema: {
      type: "object",
      properties: {
        horsepower: { type: "number", description: "Exact HP (e.g. 90, 150)" },
        min_hp: { type: "number" },
        max_hp: { type: "number" },
        family: {
          type: "string",
          enum: ["FourStroke", "Pro XS", "SeaPro", "Racing"],
        },
        in_stock_only: { type: "boolean", default: false },
        limit: { type: "number", default: 25, maximum: 100 },
      },
    },
  },
  {
    name: "get_motor",
    description:
      "Fetch a single Mercury motor by id or slug, including pricing, shaft length, and deep-link URL.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID of the motor" },
        slug: { type: "string", description: "URL slug" },
      },
    },
  },
  {
    name: "estimate_trade_in",
    description:
      "Estimate the trade-in value (CAD) of a customer's current outboard using the live Harris Boat Works valuation. Horsepower may be omitted when the model infers a single validated HP.",
    inputSchema: {
      type: "object",
      properties: {
        brand: { type: "string" },
        year: { type: "integer", minimum: 1950, maximum: new Date().getFullYear() },
        horsepower: { type: "number" },
        model: { type: "string" },
        condition: {
          type: "string",
          enum: ["excellent", "good", "fair", "poor"],
        },
        engine_type: { type: "string", enum: ["4-stroke", "2-stroke", "proxs", "optimax", "etec"] },
        engine_hours: { type: "number" },
      },
      required: ["brand", "year"],
    },
  },
  {
    name: "build_quote",
    description:
      "Build an itemized CAD quote (motor + installation + propeller + trade-in + HST + financing tier) and return a deep-link URL the customer can open. Optional contact captures a lead in the dealership CRM.",
    inputSchema: {
      type: "object",
      properties: {
        motor_id: { type: "string" },
        horsepower: { type: "number" },
        family: { type: "string" },
        purchase_path: {
          type: "string",
          enum: ["installed", "loose"],
          default: "installed",
        },
        customer_has_propeller: { type: "boolean" },
        boat_info: {
          type: "object",
          properties: { make: { type: "string" }, model: { type: "string" } },
        },
        trade_in: { type: "object" },
        contact: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            referrer: { type: "string" },
          },
        },
      },
    },
  },
  {
    name: "get_brand_rules",
    description:
      "Return Harris Boat Works' authoritative source-of-truth rules for any agent representing them: pricing currency, geography, no-Verado policy, financing minimums, deposit tiers, warranty.",
    inputSchema: { type: "object", properties: {} },
  },
];

const SERVER_INFO = {
  name: "harris-boat-works-mercury",
  version: "1.0.0",
  description:
    "Mercury repower specialist on Rice Lake, Ontario. Family-owned since 1947. Quote, search inventory, and estimate trade-ins.",
};

function rpcResult(id: any, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: any, code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

async function callPublicApi(action: string, params: Record<string, unknown>) {
  const resp = await fetch(QUOTE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  let payload: unknown;
  try { payload = await resp.json(); } catch { return { error: "Quote service returned an unreadable response." }; }
  if (!resp.ok) return { error: "Quote service request failed.", status: resp.status, details: payload };
  return payload;
}

async function searchMotors(supabase: any, args: any) {
  const resultLimit = Math.min(args.limit ?? 25, 100);
  const wantFamilyKey = args.family ? familyKey(args.family) : null;
  let q = supabase
    .from("motor_models")
    .select(
      "id, model, model_display, model_number, family, horsepower, shaft_code, control_type, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, stock_quantity, hero_image_url, image_url"
    )
    .or(PUBLIC_CATALOG_AVAILABILITY_OR)
    .order("horsepower", { ascending: true })
    .limit(500);

  if (args.horsepower) q = q.eq("horsepower", args.horsepower);
  if (args.min_hp) q = q.gte("horsepower", args.min_hp);
  if (args.max_hp) q = q.lte("horsepower", args.max_hp);
  if (args.in_stock_only) q = q.eq("in_stock", true);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data || [])
    .map((sourceMotor: any) => applyMotorPresentationOverrides(sourceMotor))
    .filter((m: any) => isPublicCatalogMotor(m))
    .filter((m: any) =>
      wantFamilyKey ? familyKey(m.family) === wantFamilyKey : true
    )
    .slice(0, resultLimit)
    .map((m: any) => {
      const slug = motorSlug(m);
      return {
        id: m.id,
        slug,
        modelDisplay: m.model_display || m.model,
        family: m.family || "FourStroke",
        horsepower: m.horsepower,
        shaftLength: m.shaft_code,
        sellingPrice: resolvePublicSellingPrice(m),
        currency: "CAD",
        availability: m.availability || (m.in_stock ? "In Stock" : "Special Order"),
        imageUrl: toPublicImageUrl(m.hero_image_url || m.image_url),
        url: slug ? `${SITE_URL}/motors/${slug}` : null,
        quoteUrl: `${SITE_URL}/quote/motor-selection?motor=${m.id}`,
      };
    });
}

async function getMotor(supabase: any, args: any) {
  if (!args.id && !args.slug) throw new Error("id or slug required");
  let q = supabase
    .from("motor_models")
    .select(
      "id, model, model_display, model_number, family, motor_type, horsepower, shaft_code, control_type, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, stock_quantity, hero_image_url, image_url, description, features"
    )
    .or(PUBLIC_CATALOG_AVAILABILITY_OR);
  if (args.id) q = q.eq("id", args.id).limit(1);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  let m: any = null;
  if (args.id) {
    m = data?.[0] ?? null;
  } else if (args.slug) {
    const wanted = String(args.slug).toLowerCase();
    m = (data || [])
      .map((r: any) => applyMotorPresentationOverrides(r))
      .find((r: any) => isPublicCatalogMotor(r) && motorSlug(r) === wanted) ?? null;
  }
  if (!m) return null;
  m = applyMotorPresentationOverrides(m);
  if (!isPublicCatalogMotor(m)) return null;

  const slug = motorSlug(m);
  return {
    id: m.id,
    slug,
    modelDisplay: m.model_display || m.model,
    family: m.family || "FourStroke",
    horsepower: m.horsepower,
    shaftLength: m.shaft_code,
    controlType: m.control_type,
    sellingPrice: resolvePublicSellingPrice(m),
    msrp: m.msrp,
    currency: "CAD",
    availability: m.availability || (m.in_stock ? "In Stock" : "Special Order"),
    imageUrl: toPublicImageUrl(m.hero_image_url || m.image_url),
    description: m.description,
    features: m.features,
    url: slug ? `${SITE_URL}/motors/${slug}` : null,
    quoteUrl: `${SITE_URL}/quote/motor-selection?motor=${m.id}`,
  };
}

async function brandRules(supabase: any) {
  try {
    const [financing, promotions] = await Promise.all([
      fetchActiveFinancing(supabase),
      fetchActivePromotions(supabase),
    ]);
    return presentPublicAgentBrandRules({ financing, promotions });
  } catch (_error) {
    return presentPublicAgentBrandRules({
      financing: [],
      promotions: [],
      available: false,
      reason: "Current financing terms are unavailable; no stale fallback rate was applied",
    });
  }
}

async function handleToolCall(supabase: any, name: string, rawArgs: unknown) {
  const args = parseMcpToolArguments(name, rawArgs);
  switch (name) {
    case "search_motors": {
      const motors = await searchMotors(supabase, args);
      return mcpToolResult({ count: motors.length, motors });
    }
    case "get_motor": {
      const motor = await getMotor(supabase, args);
      if (!motor) return mcpToolResult({ error: "Motor not found" }, true);
      return mcpToolResult(motor);
    }
    case "estimate_trade_in": {
      const result = await callPublicApi("estimate_trade_in", args);
      return mcpUpstreamErrorResult(result);
    }
    case "build_quote": {
      const result = await callPublicApi("build_quote", args);
      return mcpUpstreamErrorResult(result);
    }
    case "get_brand_rules": {
      return mcpToolResult(await brandRules(supabase));
    }
    default:
      throw new McpInvalidParamsError(`Unknown tool: ${name}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // GET → human-readable docs
  if (req.method === "GET") {
    return new Response(
      JSON.stringify(
        {
          server: SERVER_INFO,
          protocol: "Model Context Protocol (JSON-RPC 2.0)",
          transport: "HTTP POST",
          methods: ["initialize", "tools/list", "tools/call"],
          tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
          example: {
            request: {
              jsonrpc: "2.0",
              id: 1,
              method: "tools/call",
              params: {
                name: "search_motors",
                arguments: { horsepower: 90, in_stock_only: true },
              },
            },
          },
          docs: `${SITE_URL}/agents`,
        },
        null,
        2
      ),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify(rpcError(null, -32700, "Parse error")), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawMethod = payload && typeof payload === "object" ? (payload as any).method : "unknown";
  const rawParams = payload && typeof payload === "object" ? (payload as any).params : {};
  const methodKey = typeof rawMethod === "string" ? rawMethod.replace(/[^a-z0-9_/-]/gi, "_") : "unknown";
  const toolName = rawMethod === "tools/call" && rawParams && typeof rawParams.name === "string"
    ? rawParams.name.replace(/[^a-z0-9_-]/gi, "_")
    : null;
  const limit =
    toolName === "build_quote" ? { maxAttempts: 40, windowMinutes: 10 } :
    rawMethod === "tools/call" ? { maxAttempts: 80, windowMinutes: 10 } :
    { maxAttempts: 180, windowMinutes: 10 };
  const allowed = await checkRateLimit(req, {
    action: `agent_mcp_${toolName || methodKey}`.slice(0, 128),
    ...limit,
  });
  if (!allowed) return rateLimitedResponse(corsHeaders, 60);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let envelope: { id: string | number | null; method: string; params: Record<string, unknown> };
  try {
    envelope = parseMcpJsonRpc(payload);
  } catch (err: any) {
    const code = typeof err?.code === "number" ? err.code : -32600;
    return jsonResp(rpcError(null, code, err?.message || "Invalid Request"), 400);
  }
  const { id, method, params } = envelope;

  try {
    if (method === "initialize") {
      return jsonResp(
        rpcResult(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        })
      );
    }

    if (method === "tools/list") {
      return jsonResp(rpcResult(id, { tools: TOOLS }));
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params;
      if (typeof name !== "string" || !name.trim()) {
        return jsonResp(rpcError(id, -32602, "Tool name must be a non-empty string"));
      }
      const result = await handleToolCall(supabase, name, args);
      return jsonResp(rpcResult(id, result));
    }

    return jsonResp(rpcError(id, -32601, `Method not found: ${method}`));
  } catch (err: any) {
    if (err instanceof McpInvalidParamsError) {
      return jsonResp(rpcError(id, err.code, err.message), 400);
    }
    console.error("[agent-mcp-server] error:", err);
    return jsonResp(rpcError(id, -32603, err?.message || "Internal error"));
  }
});

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
