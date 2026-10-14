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
//   - build_quote          : read-only itemized CAD quote with deep-link
//   - submit_quote_lead    : explicit lead write; requires consent=true and contact
//   - get_brand_rules      : authoritative source-of-truth (special-order Verado, CAD only, etc.)
//   - search_articles      : published public blog guides only
//   - get_article          : one allowlisted public Markdown twin by catalog slug
//
// Public, no-auth, CORS-open. Wraps the existing public-quote-api + public-motors-api
// so external agents have one canonical MCP endpoint.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version",
};

import { PUBLIC_SITE_URL } from "../_shared/public-motor-contract.ts";
import { searchMcpMotors, getMcpMotor } from "../_shared/public-mcp-motors.ts";
import {
  fetchActiveFinancing,
  fetchActivePromotions,
} from "../_shared/customer-knowledge-context.ts";
import {
  runPublicQuoteTool,
  mcpToolResult,
  mcpUpstreamErrorResult,
  parseMcpJsonRpc,
  parseMcpToolArguments,
  presentPublicAgentBrandRules,
  McpInvalidParamsError,
} from "../_shared/public-agent-mcp.ts";
import { mcpToolAnnotations } from "../_shared/mcp-tool-annotations.ts";
import {
  runPublicArticleTool,
} from "../_shared/public-blog-mcp.ts";

const SITE_URL = PUBLIC_SITE_URL;
const QUOTE_API = `${Deno.env.get("SUPABASE_URL")}/functions/v1/public-quote-api`;
const MOTORS_API = `${Deno.env.get("SUPABASE_URL")}/functions/v1/public-motors-api`;

const TRADE_IN_SCHEMA = {
  type: "object",
  required: ["brand", "year"],
  properties: {
    brand: { type: "string", maxLength: 64 },
    year: { type: "integer", minimum: 1950 },
    horsepower: { type: "number", minimum: 1, maximum: 1000, description: "Required unless model infers a single HP." },
    model: { type: "string", maxLength: 120 },
    condition: { type: "string", enum: ["excellent", "good", "fair", "poor"], default: "good" },
    engine_type: { type: "string", enum: ["4-stroke", "2-stroke", "optimax", "proxs", "etec"] },
    engine_hours: { type: "number", minimum: 0, maximum: 100000 },
  },
};

const TOOLS = [
  {
    name: "search_motors",
    description:
      "Search current Mercury outboard inventory at Harris Boat Works (Ontario). Filter by horsepower, family (FourStroke, Pro XS, SeaPro, Racing), or stock status. Returns CAD pricing. Excludes Verado. inStock/stockQuantity are the normalized stock signal; availability is the catalog label. candidatePageTruncated warns when more than 500 candidates match: narrow horsepower filters. Decoded fitment needs transom confirmation; specSource flags database rigging presence, and other fields may still be model-code decoded.",
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
    annotations: mcpToolAnnotations("read"),
  },
  {
    name: "get_motor",
    description:
      "Fetch a single Mercury motor by id or slug, including pricing, decoded shaft/control/start facts, a specSource summary, normalized stock, and deep-link URL. Model-code fitment must be confirmed against the buyer’s transom before ordering; null means not stated. specSource flags database rigging presence; individual fields may still be model-code decoded. inStock/stockQuantity are the normalized stock signal; availability is the catalog label.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID of the motor" },
        slug: { type: "string", description: "URL slug" },
      },
    },
    annotations: mcpToolAnnotations("read"),
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
    annotations: mcpToolAnnotations("read"),
  },
  {
    name: "build_quote",
    description:
      "Build a read-only itemized CAD quote (motor + installation + propeller + trade-in + HST + financing tier) and return a deep-link URL the customer can open. Do not send contact details. A nonempty contact block is rejected. To store a lead, call submit_quote_lead with consent=true. Annotations are hints, not authorization.",
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
        customer_has_propeller: { type: "boolean", description: "True: reuse, subject to fit checks. False: include allowance. Omitted: reuse for same-HP Mercury trade, otherwise allowance. Standard propeller included below 25 HP." },
        financing_offer_id: { type: "string" },
        boat_info: {
          type: "object",
          properties: { make: { type: "string" }, model: { type: "string" } },
        },
        trade_in: TRADE_IN_SCHEMA,
      },
    },
    annotations: mcpToolAnnotations("read"),
  },
  {
    name: "submit_quote_lead",
    description:
      "Submit a quote lead through the existing public quote API. Requires consent=true and a contact block with name and email. consent is explicit permission to store that contact with the calculated quote. This tool does not issue a consent receipt and does not change pricing, financing, or warranty. Confirm storage only from the returned lead_captured flag. Annotations are hints, not authorization.",
    inputSchema: {
      type: "object",
      properties: {
        consent: { type: "boolean", const: true },
        motor_id: { type: "string" },
        horsepower: { type: "number" },
        family: { type: "string" },
        purchase_path: { type: "string", enum: ["installed", "loose"] },
        customer_has_propeller: { type: "boolean", description: "True: reuse, subject to fit checks. False: include allowance. Omitted: reuse for same-HP Mercury trade, otherwise allowance. Standard propeller included below 25 HP." },
        financing_offer_id: { type: "string" },
        boat_info: {
          type: "object",
          properties: { make: { type: "string" }, model: { type: "string" } },
        },
        trade_in: TRADE_IN_SCHEMA,
        contact: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            referrer: { type: "string" },
          },
          required: ["name", "email"],
        },
      },
      required: ["consent", "contact"],
    },
    annotations: mcpToolAnnotations("write"),
  },
  {
    name: "get_brand_rules",
    description:
      "Return Harris Boat Works' authoritative source-of-truth rules for any agent representing them: pricing currency, geography, no-Verado policy, financing minimums, deposit tiers, warranty.",
    inputSchema: { type: "object", properties: {} },
    annotations: mcpToolAnnotations("read"),
  },
  {
    name: "search_articles",
    description:
      "Search published public blog guides. Returns title, excerpt, canonical HTML URL, language, author, publication date, and Markdown URL. Omits hidden, draft, future, and the Traditional Chinese noindex pilot. Read-only. Does not accept a URL.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", maxLength: 120 },
        language: {
          type: "string",
          enum: ["en-CA", "fr-CA", "ko-KR", "zh-CN", "es", "pa", "ur", "tl", "hi"],
        },
        limit: { type: "integer", minimum: 1, maximum: 10, default: 5 },
      },
    },
    annotations: mcpToolAnnotations("read"),
  },
  {
    name: "get_article",
    description:
      "Fetch one published public blog guide by catalog slug and language. Reads only the allowlisted same-site Markdown twin for that catalog item. Never pass a URL. Text is bounded and truncation is explicit. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", maxLength: 160 },
        language: {
          type: "string",
          enum: ["en-CA", "fr-CA", "ko-KR", "zh-CN", "es", "pa", "ur", "tl", "hi"],
          default: "en-CA",
        },
      },
      required: ["slug"],
    },
    annotations: mcpToolAnnotations("read"),
  },
];

const SERVER_INFO = {
  name: "harris-boat-works-mercury",
  version: "2.0.0",
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
  if (name === "search_articles" || name === "get_article") {
    return runPublicArticleTool(name, rawArgs, fetch);
  }
  if (name === "build_quote" || name === "submit_quote_lead") {
    return runPublicQuoteTool(name, rawArgs, callPublicApi);
  }
  const args = parseMcpToolArguments(name, rawArgs);
  switch (name) {
    case "search_motors": {
      const result = await searchMcpMotors(supabase, args);
      return mcpToolResult({ count: result.motors.length, ...result });
    }
    case "get_motor": {
      const motor = await getMcpMotor(supabase, args);
      if (!motor) return mcpToolResult({ error: "Motor not found" }, true);
      return mcpToolResult(motor);
    }
    case "estimate_trade_in": {
      const result = await callPublicApi("estimate_trade_in", args);
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

  // This stateless server has no unsolicited SSE stream. Keep browser docs.
  if (req.method === "GET" && req.headers.get("accept")?.includes("text/event-stream")) {
    return new Response(null, { status: 405, headers: { ...corsHeaders, Allow: "POST, OPTIONS" } });
  }
  if (req.method === "GET") {
    return new Response(
      JSON.stringify(
        {
          server: SERVER_INFO,
          protocol: "Model Context Protocol (JSON-RPC 2.0)",
          transport: "HTTP POST",
          methods: ["initialize", "ping", "tools/list", "tools/call"],
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
    (toolName === "build_quote" || toolName === "submit_quote_lead") ? { maxAttempts: 40, windowMinutes: 10 } :
    rawMethod === "tools/call" ? { maxAttempts: 80, windowMinutes: 10 } :
    { maxAttempts: 180, windowMinutes: 10 };
  const allowed = await checkRateLimit(req, {
    action: `agent_mcp_${toolName || methodKey}`.slice(0, 128),
    ...limit,
  });
  if (!allowed) return rateLimitedResponse(corsHeaders, 60);

  let envelope: ReturnType<typeof parseMcpJsonRpc>;
  try {
    envelope = parseMcpJsonRpc(payload);
  } catch (err: any) {
    const code = typeof err?.code === "number" ? err.code : -32600;
    return jsonResp(rpcError(null, code, err?.message || "Invalid Request"), 400);
  }
  const { id, method, params } = envelope;
  const isNotification = !Object.prototype.hasOwnProperty.call(payload, "id");
  // Notifications have no response and must never dispatch a tool/write.
  if (isNotification) return new Response(null, { status: 202, headers: corsHeaders });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
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

    if (method === "ping") return jsonResp(rpcResult(id, {}));

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
