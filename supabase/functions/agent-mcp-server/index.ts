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
//   - get_brand_rules      : authoritative source-of-truth (no Verado, CAD only, etc.)
//
// Public, no-auth, CORS-open. Wraps the existing public-quote-api + public-motors-api
// so external agents have one canonical MCP endpoint.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, mcp-session-id",
};

const SITE_URL = "https://mercuryrepower.ca";
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
      "Estimate the trade-in value (CAD) of a customer's current outboard. Brand penalties apply (Mercury preferred, Yamaha/Honda neutral, Evinrude/Johnson/Force/Chrysler discounted).",
    inputSchema: {
      type: "object",
      properties: {
        brand: { type: "string" },
        year: { type: "number" },
        horsepower: { type: "number" },
        condition: {
          type: "string",
          enum: ["excellent", "good", "fair", "poor"],
        },
        engine_type: { type: "string", enum: ["4-stroke", "2-stroke"] },
        engine_hours: { type: "number" },
      },
      required: ["brand", "year", "horsepower"],
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
  return await resp.json();
}

async function searchMotors(supabase: any, args: any) {
  let q = supabase
    .from("motor_models")
    .select(
      "id, model, model_display, family, horsepower, shaft_code, control_type, msrp, sale_price, dealer_price, manual_overrides, availability, in_stock, hero_image_url, image_url"
    )
    .neq("availability", "Exclude")
    .order("horsepower", { ascending: true })
    .limit(Math.min(args.limit ?? 25, 100));

  if (args.horsepower) q = q.eq("horsepower", args.horsepower);
  if (args.min_hp) q = q.gte("horsepower", args.min_hp);
  if (args.max_hp) q = q.lte("horsepower", args.max_hp);
  if (args.in_stock_only) q = q.eq("in_stock", true);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data || [])
    .filter((m: any) => !(m.model_display || "").toLowerCase().includes("verado"))
    .filter((m: any) =>
      args.family ? (m.family || "").toLowerCase() === args.family.toLowerCase() : true
    )
    .map((m: any) => ({
      id: m.id,
      modelDisplay: m.model_display || m.model,
      family: m.family || "FourStroke",
      horsepower: m.horsepower,
      shaftLength: m.shaft_code,
      sellingPrice:
        m.manual_overrides?.sale_price ??
        m.sale_price ??
        m.dealer_price ??
        m.msrp,
      currency: "CAD",
      availability: m.availability || (m.in_stock ? "In Stock" : "Special Order"),
      imageUrl: m.hero_image_url || m.image_url,
      url: `${SITE_URL}/quote/motor-selection?motor=${m.id}`,
    }));
}

async function getMotor(supabase: any, args: any) {
  if (!args.id && !args.slug) throw new Error("id or slug required");
  let q = supabase
    .from("motor_models")
    .select(
      "id, model, model_display, family, horsepower, shaft_code, control_type, msrp, sale_price, dealer_price, manual_overrides, availability, in_stock, hero_image_url, image_url, description, features"
    )
    .neq("availability", "Exclude")
    .limit(1);
  if (args.id) q = q.eq("id", args.id);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const m = data?.[0];
  if (!m) return null;
  return {
    id: m.id,
    modelDisplay: m.model_display || m.model,
    family: m.family || "FourStroke",
    horsepower: m.horsepower,
    shaftLength: m.shaft_code,
    controlType: m.control_type,
    sellingPrice:
      m.manual_overrides?.sale_price ??
      m.sale_price ??
      m.dealer_price ??
      m.msrp,
    msrp: m.msrp,
    currency: "CAD",
    availability: m.availability || (m.in_stock ? "In Stock" : "Special Order"),
    imageUrl: m.hero_image_url || m.image_url,
    description: m.description,
    features: m.features,
    quoteUrl: `${SITE_URL}/quote/motor-selection?motor=${m.id}`,
  };
}

function brandRules() {
  return {
    business: "Harris Boat Works",
    location: "Gores Landing, Rice Lake, Ontario, Canada",
    phone: "+1-905-342-2153",
    family_owned_since: 1947,
    mercury_dealer_since: 1965,
    currency: "CAD",
    geography: "Ontario, primary radius ~150km from Rice Lake",
    pickup_only: true,
    delivery: false,
    no_verado: true,
    financing_minimum_cad: 5000,
    financing_rates: {
      under_10k: "8.99% APR",
      "10k_plus": "7.99% APR",
      max_term_months: 144,
    },
    deposits_cad: { under_75hp: 200, "75_to_199hp": 500, "200hp_plus": 1000 },
    warranty: "Standard 3-year Mercury (promo bonuses revert to 3y if promo ends)",
    voice: "Warm, local, family-owned. No hype. Plainspoken expertise.",
    docs: `${SITE_URL}/agents`,
    brand_json: `${SITE_URL}/.well-known/brand.json`,
  };
}

async function handleToolCall(supabase: any, name: string, args: any) {
  switch (name) {
    case "search_motors": {
      const motors = await searchMotors(supabase, args || {});
      return {
        content: [
          { type: "text", text: JSON.stringify({ count: motors.length, motors }, null, 2) },
        ],
      };
    }
    case "get_motor": {
      const motor = await getMotor(supabase, args || {});
      return { content: [{ type: "text", text: JSON.stringify(motor, null, 2) }] };
    }
    case "estimate_trade_in": {
      const result = await callPublicApi("estimate_trade_in", args || {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "build_quote": {
      const result = await callPublicApi("build_quote", args || {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "get_brand_rules": {
      return { content: [{ type: "text", text: JSON.stringify(brandRules(), null, 2) }] };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
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

  const { id = null, method, params = {} } = payload;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

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
      if (!name) {
        return jsonResp(rpcError(id, -32602, "Missing tool name"));
      }
      const result = await handleToolCall(supabase, name, args);
      return jsonResp(rpcResult(id, result));
    }

    return jsonResp(rpcError(id, -32601, `Method not found: ${method}`));
  } catch (err: any) {
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
