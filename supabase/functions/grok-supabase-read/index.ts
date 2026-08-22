import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.1";
import { invokeAggregateTool, TOOLS } from "./core.ts";
import { authorize, SlidingWindowRateLimiter } from "./security.ts";

const MAX_REQUEST_BYTES = 32 * 1024;
const rateLimiter = new SlidingWindowRateLimiter(60, 10 * 60 * 1000);

const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-session-id",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "Vary": "Authorization",
};

const SERVER_INFO = {
  name: "harris-boat-works-grok-read",
  version: "0.1.0",
  description:
    "Authenticated, aggregate-only HBW operational signals for Grok. No row-level customer, employee, unit, service, invoice, part, pricing, cost, or margin records.",
};

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders, ...extraHeaders },
  });
}

function rpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function requestIdentifier(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("cf-connecting-ip") || "grok-connector";
}

async function readJson(req: Request) {
  const declared = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) {
    throw new RangeError("Request too large");
  }
  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
    throw new RangeError("Request too large");
  }
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: responseHeaders });

  const auth = await authorize(
    req.headers.get("authorization"),
    Deno.env.get("GROK_SUPABASE_READ_TOKEN"),
  );
  if (auth === "missing_config") {
    console.error("[grok-supabase-read] GROK_SUPABASE_READ_TOKEN is not configured");
    return jsonResponse({ error: "Connector unavailable" }, 503);
  }
  if (auth !== "ok") {
    return jsonResponse(
      { error: "Unauthorized" },
      401,
      { "WWW-Authenticate": "Bearer" },
    );
  }

  if (!rateLimiter.allow(requestIdentifier(req))) {
    return jsonResponse(
      { error: "Rate limit exceeded" },
      429,
      { "Retry-After": "60" },
    );
  }

  if (req.method === "GET") {
    return jsonResponse({
      server: SERVER_INFO,
      protocol: "Model Context Protocol (JSON-RPC 2.0 over HTTP POST)",
      methods: ["initialize", "ping", "tools/list", "tools/call"],
      tools: TOOLS.map(({ name, description }) => ({ name, description })),
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, { Allow: "GET, POST, OPTIONS" });
  }

  let payload: any;
  try {
    payload = await readJson(req);
  } catch (error) {
    const tooLarge = error instanceof RangeError;
    return jsonResponse(
      rpcError(null, tooLarge ? -32001 : -32700, tooLarge ? "Request too large" : "Parse error"),
      tooLarge ? 413 : 400,
    );
  }

  if (!payload || Array.isArray(payload) || payload.jsonrpc !== "2.0") {
    return jsonResponse(rpcError(payload?.id ?? null, -32600, "Invalid Request"), 400);
  }

  const { id = null, method, params = {} } = payload;
  if (method === "notifications/initialized") return new Response(null, { status: 202 });

  try {
    if (method === "initialize") {
      const requested = params?.protocolVersion;
      const protocolVersion = requested === "2024-11-05" ? requested : "2025-03-26";
      return jsonResponse(rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      }));
    }

    if (method === "ping") return jsonResponse(rpcResult(id, {}));
    if (method === "tools/list") return jsonResponse(rpcResult(id, { tools: TOOLS }));

    if (method === "tools/call") {
      const toolName = params?.name;
      if (typeof toolName !== "string") {
        return jsonResponse(rpcError(id, -32602, "Missing tool name"), 400);
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !serviceRoleKey) throw new Error("Database client is not configured");

      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const result = await invokeAggregateTool(
        toolName,
        params?.arguments ?? {},
        async (rpcName, rpcArgs) => {
          const { data, error } = await supabase.rpc(rpcName, rpcArgs);
          if (error) {
            console.error(`[grok-supabase-read] ${rpcName} failed with ${error.code || "unknown"}`);
            throw new Error("Aggregate query failed");
          }
          return data;
        },
      );
      return jsonResponse(rpcResult(id, result));
    }

    return jsonResponse(rpcError(id, -32601, "Method not found"), 404);
  } catch (error) {
    const invalid = error instanceof TypeError;
    console.error(`[grok-supabase-read] request failed: ${invalid ? "invalid input" : "internal error"}`);
    return jsonResponse(
      rpcError(id, invalid ? -32602 : -32603, invalid ? error.message : "Internal error"),
      invalid ? 400 : 500,
    );
  }
});
