// @vitest-environment node
import { readFileSync } from "node:fs";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as emailLayout from "../../../supabase/functions/_shared/email-layout.ts";

const handlerSource = ts.transpileModule(
  readFileSync("supabase/functions/elevenlabs-mcp-server/index.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

const MOTOR = {
  id: "motor-1",
  model: "150 FourStroke",
  model_display: "Mercury 150 FourStroke",
  horsepower: 150,
  family: "FourStroke",
  in_stock: true,
  shaft: '20"',
  sale_price: 15499,
  msrp: 17000,
  dealer_price: 14000,
  base_price: 12000,
};

const TEST_SECRET = "test-elevenlabs-mcp-secret";

const DEFAULT_ENV: Record<string, string | undefined> = {
  SUPABASE_URL: "https://db.example.test",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  TWILIO_ACCOUNT_SID: "ACtest",
  TWILIO_AUTH_TOKEN: "twilio-token",
  TWILIO_FROM_NUMBER: "+19053422153",
  RESEND_API_KEY: "test-resend-key",
  ELEVENLABS_MCP_SECRET: TEST_SECRET,
};

type RateLimitOpts = {
  action: string;
  identifier?: string;
  maxAttempts: number;
  windowMinutes: number;
  failClosed?: boolean;
};

function createQuery(resolveResult: () => { data: unknown; error: unknown }) {
  const query: Record<string, unknown> = {};
  const chain = () => query;
  Object.assign(query, {
    select: chain,
    or: chain,
    eq: chain,
    gte: chain,
    lte: chain,
    not: chain,
    neq: chain,
    order: chain,
    ilike: chain,
    in: chain,
    limit: chain,
    single: async () => {
      const result = resolveResult();
      const data = Array.isArray(result.data) ? result.data[0] ?? null : result.data;
      return { data, error: result.error };
    },
    maybeSingle: async () => {
      const result = resolveResult();
      const data = Array.isArray(result.data) ? result.data[0] ?? null : result.data;
      return { data, error: result.error };
    },
    then(
      onFulfilled?: (value: { data: unknown; error: unknown }) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) {
      return Promise.resolve(resolveResult()).then(onFulfilled, onRejected);
    },
  });
  return query;
}

async function invoke(input: {
  tool?: string;
  args?: Record<string, unknown>;
  method?: string;
  body?: unknown;
  knownPhone?: boolean;
  knownEmail?: boolean;
  rateLimit?: boolean;
  env?: Record<string, string | undefined>;
  headers?: Record<string, string>;
  omitSecret?: boolean;
} = {}) {
  const env = { ...DEFAULT_ENV, ...input.env };
  const deno = { env: { get: (name: string) => env[name] } };
  const originalFetch = globalThis.fetch;
  const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
    new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  globalThis.fetch = fetchImpl as typeof fetch;

  const sendEmail = vi.fn(async (_payload: Record<string, unknown>) => ({
    data: { id: "email-1" },
    error: null,
  }));
  const Resend = vi.fn(class {
    emails = { send: sendEmail };
  });
  const checkRateLimit = vi.fn(async (_req: Request, _opts: RateLimitOpts) => input.rateLimit !== false);
  const from = vi.fn((table: string) => {
    if (table === "customer_quotes") {
      return createQuery(() => {
        if (input.knownPhone || input.knownEmail) {
          return {
            data: [{
              id: "lead-1",
              customer_phone: "9055551212",
              customer_email: "buyer@example.test",
            }],
            error: null,
          };
        }
        return { data: [], error: null };
      });
    }
    if (table === "motor_models") {
      return createQuery(() => ({ data: [MOTOR], error: null }));
    }
    return createQuery(() => ({ data: [], error: null }));
  });
  const createClient = vi.fn(() => ({ from }));

  let handler!: (request: Request) => Promise<Response>;
  try {
    new Function("require", "exports", "Deno", handlerSource)(
      (specifier: string) => {
        const imports: Record<string, unknown> = {
          "https://deno.land/std@0.190.0/http/server.ts": {
            serve: (fn: typeof handler) => { handler = fn; },
          },
          "npm:@supabase/supabase-js@2.53.1": { createClient },
          "npm:resend@2.0.0": { Resend },
          "../_shared/promotion-context.ts": {
            buildPromotionCustomerAnswer: () => "deals",
          },
          "../_shared/customer-knowledge-context.ts": {
            buildBusinessCustomerAnswer: () => "hours",
            buildFinancingCustomerAnswer: () => "financing",
            fetchActiveFinancing: async () => [],
            fetchActivePromotions: async () => [],
            fetchPublishedBusinessProfile: async () => ({ profile: {} }),
            isDefaultQuotedMotor: () => true,
            resolveCustomerSellingPrice: (motor: Record<string, unknown>) =>
              (typeof motor.sale_price === "number" ? motor.sale_price : null)
              ?? (typeof motor.msrp === "number" ? motor.msrp : null),
          },
          "../_shared/hbw-valuation.ts": {
            fetchCanonicalHbwValuation: async () => ({ wholesale: 0, rangeLow: 0, rangeHigh: 0 }),
            HbwValuationError: class HbwValuationError extends Error {
              code = "unavailable";
            },
          },
          "../_shared/voice-trade-in-input.ts": {
            mapVoiceTradeCondition: (value: string) => value,
            resolveVoiceArchitecture: () => "4-stroke",
          },
          "../_shared/rate-limit.ts": { checkRateLimit },
          "../_shared/email-layout.ts": emailLayout,
        };
        if (!(specifier in imports)) throw new Error(`Unmocked import: ${specifier}`);
        return imports[specifier];
      },
      {},
      deno,
    );

    const method = input.method ?? "POST";
    const headers: Record<string, string> = { ...input.headers };
    if (method !== "OPTIONS" && method !== "GET") {
      headers["content-type"] = headers["content-type"] ?? "application/json";
    }
    if (!input.omitSecret && headers["x-elevenlabs-mcp-secret"] === undefined && env.ELEVENLABS_MCP_SECRET) {
      headers["x-elevenlabs-mcp-secret"] = env.ELEVENLABS_MCP_SECRET;
    }

    const init: RequestInit = { method, headers };
    if (method !== "OPTIONS" && method !== "GET") {
      init.body = JSON.stringify(input.body ?? {
        jsonrpc: "2.0",
        id: "1",
        method: input.tool ? "tools/call" : "initialize",
        params: input.tool ? { name: input.tool, arguments: input.args ?? {} } : undefined,
      });
    }

    const response = await handler(new Request("https://edge.example.test/elevenlabs-mcp-server", init));
    const raw = await response.text();
    let payload: {
      jsonrpc?: string;
      id?: string;
      result?: { content?: { type: string; text: string }[] };
      error?: { code: number; message: string } | string;
    } = {};
    if (raw) {
      payload = JSON.parse(raw) as typeof payload;
    }
    return { response, payload, raw, fetchImpl, sendEmail, Resend, createClient, from, checkRateLimit };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function spokenText(payload: { result?: { content?: { type: string; text: string }[] } }) {
  return payload.result?.content?.map((item) => item.text).join("\n") ?? "";
}

describe("elevenlabs MCP relay containment", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refuses an unknown phone and never calls voice-send-follow-up", async () => {
    const { response, payload, fetchImpl, from } = await invoke({
      tool: "send_motor_photos",
      args: { customer_phone: "+15551234567", motor_model: "150 FourStroke" },
    });

    expect(response.status).toBe(200);
    expect(payload.error).toBeUndefined();
    expect(spokenText(payload)).toMatch(/already have on file/i);
    expect(from).toHaveBeenCalledWith("customer_quotes");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses an unknown email and never calls Resend", async () => {
    const { response, payload, sendEmail, Resend, from } = await invoke({
      tool: "send_motor_info_email",
      args: { customer_email: "stranger@example.com", motor_model: "150 FourStroke" },
    });

    expect(response.status).toBe(200);
    expect(payload.error).toBeUndefined();
    expect(spokenText(payload)).toMatch(/already have on file/i);
    expect(from).toHaveBeenCalledWith("customer_quotes");
    expect(Resend).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("still texts a known customer_quotes phone so voice keeps working", async () => {
    const { response, payload, fetchImpl } = await invoke({
      tool: "send_motor_photos",
      knownPhone: true,
      args: { customer_phone: "+1 (905) 555-1212", customer_name: "Pat", motor_model: "150 FourStroke" },
    });

    expect(response.status).toBe(200);
    expect(spokenText(payload)).toMatch(/sent details about the 150 FourStroke/i);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0][0])).toBe(
      "https://db.example.test/functions/v1/voice-send-follow-up",
    );
    const init = fetchImpl.mock.calls[0][1];
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer test-service-role",
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      customer_phone: "+1 (905) 555-1212",
      motor_model: "150 FourStroke",
    });
  });

  it("still emails a known customer_quotes address", async () => {
    const { response, payload, sendEmail, fetchImpl } = await invoke({
      tool: "send_motor_info_email",
      knownEmail: true,
      args: { customer_email: "buyer@example.test", customer_name: "Pat", motor_model: "150 FourStroke" },
    });

    expect(response.status).toBe(200);
    expect(spokenText(payload)).toMatch(/sent the Mercury 150 FourStroke details to buyer@example.test/i);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      to: ["buyer@example.test"],
      from: "Harris Boat Works <quotes@mercuryrepower.ca>",
    });
  });

  it("refuses a rate-limited relay and does not send", async () => {
    const photos = await invoke({
      tool: "send_motor_photos",
      knownPhone: true,
      rateLimit: false,
      args: { customer_phone: "9055551212", motor_model: "150 FourStroke" },
    });
    expect(photos.response.status).toBe(200);
    expect(spokenText(photos.payload)).toMatch(/few minutes/i);
    expect(photos.fetchImpl).not.toHaveBeenCalled();
    expect(photos.checkRateLimit).toHaveBeenCalled();
    expect(photos.checkRateLimit.mock.calls[0][1]).toMatchObject({
      action: "elevenlabs_mcp_send_motor_photos_ip",
      failClosed: true,
    });

    const email = await invoke({
      tool: "send_motor_info_email",
      knownEmail: true,
      rateLimit: false,
      args: { customer_email: "buyer@example.test", motor_model: "150 FourStroke" },
    });
    expect(email.response.status).toBe(200);
    expect(spokenText(email.payload)).toMatch(/few minutes/i);
    expect(email.sendEmail).not.toHaveBeenCalled();
    expect(email.checkRateLimit.mock.calls[0][1]).toMatchObject({
      action: "elevenlabs_mcp_send_motor_info_email_ip",
      failClosed: true,
    });
  });
});

describe("elevenlabs MCP shared-secret gate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects a missing secret header before any tool dispatch", async () => {
    const { response, payload, createClient, fetchImpl, sendEmail, Resend } = await invoke({
      tool: "send_motor_photos",
      knownPhone: true,
      omitSecret: true,
      args: { customer_phone: "9055551212", motor_model: "150 FourStroke" },
    });

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(createClient).not.toHaveBeenCalled();
    expect(Resend).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects a wrong secret before any tool dispatch", async () => {
    const { response, payload, createClient, fetchImpl, sendEmail } = await invoke({
      tool: "send_motor_photos",
      knownPhone: true,
      headers: { "x-elevenlabs-mcp-secret": "wrong-secret" },
      args: { customer_phone: "9055551212", motor_model: "150 FourStroke" },
    });

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(createClient).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("proceeds when the ElevenLabs MCP secret matches", async () => {
    const init = await invoke({
      body: { jsonrpc: "2.0", id: "1", method: "initialize" },
    });
    expect(init.response.status).toBe(200);
    expect(init.payload.result).toMatchObject({
      protocolVersion: "2025-03-26",
      serverInfo: { name: "harris-boat-works-mcp" },
    });
    expect(init.createClient).not.toHaveBeenCalled();

    const photos = await invoke({
      tool: "send_motor_photos",
      knownPhone: true,
      args: { customer_phone: "9055551212", motor_model: "150 FourStroke" },
    });
    expect(photos.response.status).toBe(200);
    expect(spokenText(photos.payload)).toMatch(/sent details about the 150 FourStroke/i);
    expect(photos.fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects when ELEVENLABS_MCP_SECRET is unset instead of staying open", async () => {
    const { response, payload, createClient, fetchImpl, sendEmail } = await invoke({
      tool: "send_motor_info_email",
      knownEmail: true,
      env: { ELEVENLABS_MCP_SECRET: undefined },
      headers: { "x-elevenlabs-mcp-secret": TEST_SECRET },
      args: { customer_email: "buyer@example.test", motor_model: "150 FourStroke" },
    });

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(createClient).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it.each(["GET", "PUT", "DELETE"])("rejects unauthenticated %s before dispatch", async (method) => {
    const result = await invoke({ method, omitSecret: true });
    expect(result.response.status).toBe(401);
    expect(result.createClient).not.toHaveBeenCalled();
    expect(result.fetchImpl).not.toHaveBeenCalled();
  });

  it.each(["initialize", "tools/list", "ping", "notifications/initialized"])(
    "rejects unauthenticated %s discovery or protocol requests",
    async (method) => {
      const result = await invoke({ body: { jsonrpc: "2.0", id: "1", method }, omitSecret: true });
      expect(result.response.status).toBe(401);
      expect(result.createClient).not.toHaveBeenCalled();
      expect(result.fetchImpl).not.toHaveBeenCalled();
    },
  );

  it.each(["schedule_callback", "set_reminder", "email_quote_to_customer", "send_motor_info_email"])(
    "rejects unauthenticated %s privileged forwarding",
    async (tool) => {
      const result = await invoke({ tool, omitSecret: true });
      expect(result.response.status).toBe(401);
      expect(result.createClient).not.toHaveBeenCalled();
      expect(result.fetchImpl).not.toHaveBeenCalled();
      expect(result.sendEmail).not.toHaveBeenCalled();
    },
  );

  it("allows authenticated GET discovery without executing a tool", async () => {
    const result = await invoke({ method: "GET" });
    expect(result.response.status).toBe(200);
    expect(result.createClient).not.toHaveBeenCalled();
    expect(result.fetchImpl).not.toHaveBeenCalled();
  });

  it("keeps OPTIONS working without the secret", async () => {
    const { response, raw, createClient, fetchImpl, sendEmail } = await invoke({
      method: "OPTIONS",
      omitSecret: true,
    });

    expect(response.status).toBe(200);
    expect(raw).toBe("");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("x-elevenlabs-mcp-secret");
    expect(createClient).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
