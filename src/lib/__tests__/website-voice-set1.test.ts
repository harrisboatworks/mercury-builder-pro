// @vitest-environment node
// Offline Set 1 acceptance: all network, database and UI effects are intercepted.
import { readFileSync } from "node:fs";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as tradeInput from "../../../supabase/functions/_shared/voice-trade-in-input";
import { VOICE_SYSTEM_PROMPT } from "../../../supabase/functions/_shared/voice-system-prompt";

const compile = (source: string) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mcpSource = compile(readFileSync("supabase/functions/elevenlabs-mcp-server/index.ts", "utf8"));
const profile = {
  contact: { phone: "+15555550100", hours: { monSat: "10:00-14:00", sun: "Closed", note: "Synthetic schedule" } },
  geography: { headquarters: { city: "Test City" } },
};

async function invoke(tool: string, args = {}, options: { profileStatus?: number; valuationError?: Error } = {}) {
  vi.resetModules(); // Use a fresh business-profile cache for each outage scenario.
  const knowledge = await import("../../../supabase/functions/_shared/customer-knowledge-context");
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(profile), { status: options.profileStatus ?? 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const from = vi.fn(() => { throw new Error("Database access forbidden in Set 1 offline acceptance"); });
  const valuation = vi.fn(async () => {
    if (options.valuationError) throw options.valuationError;
    return { wholesale: 5000, rangeLow: 4500, rangeHigh: 5500, effectiveInputs: { stroke: "4-stroke" } };
  });
  let handler!: (req: Request) => Promise<Response>;
  new Function("require", "exports", "Deno", mcpSource)((specifier: string) => {
    const imports: Record<string, unknown> = {
      "https://deno.land/std@0.190.0/http/server.ts": { serve: (fn: typeof handler) => { handler = fn; } },
      "npm:@supabase/supabase-js@2.53.1": { createClient: () => ({ from }) },
      "../_shared/customer-knowledge-context.ts": knowledge,
      "../_shared/voice-trade-in-input.ts": tradeInput,
      "../_shared/hbw-valuation.ts": { fetchCanonicalHbwValuation: valuation, HbwValuationError: class extends Error {} },
      "../_shared/promotion-context.ts": {},
      "../_shared/rate-limit.ts": {},
      "../_shared/email-layout.ts": {},
      "npm:resend@2.0.0": { Resend: class { constructor() { throw new Error("Email forbidden"); } } },
    };
    if (!(specifier in imports)) throw new Error("Unmocked import: " + specifier);
    return imports[specifier];
  }, {}, { env: { get: () => "synthetic-offline-only" } });
  const response = await handler(new Request("https://edge.example.test", {
    method: "POST", headers: { "Content-Type": "application/json", "x-elevenlabs-mcp-secret": "synthetic-offline-only" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "offline-set1", method: "tools/call", params: { name: tool, arguments: args } }),
  }));
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body.error).toBeUndefined();
  expect(from).not.toHaveBeenCalled();
  return { text: body.result.content.map((item: { text: string }) => item.text).join("\n"), valuation, fetchMock };
}

// Extract the actual registered callback without mounting a voice session or opening a socket.
function clientTool(name: string, bindings: Record<string, unknown>) {
  const source = ts.createSourceFile("voice.ts", readFileSync("src/hooks/useElevenLabsVoice.ts", "utf8"), ts.ScriptTarget.Latest, true);
  let expression: string | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && node.name.getText(source) === name && ts.isArrowFunction(node.initializer)) {
      expression = node.initializer.getText(source);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!expression) throw new Error("Missing registered client tool: " + name);
  return new Function(...Object.keys(bindings), compile("const callback = " + expression + ";") + "\nreturn callback;")(...Object.values(bindings));
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Set 1 website voice offline acceptance", () => {
  it("speaks the fetched published hours", async () => {
    const result = await invoke("get_store_hours");
    expect(result.text).toContain("10:00-14:00");
    expect(result.text).toContain("Synthetic schedule");
    expect(result.fetchMock).toHaveBeenCalledOnce();
    expect(result.valuation).not.toHaveBeenCalled();
  });

  it("withholds fallback hours after a real profile-loader HTTP failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await invoke("get_store_hours", {}, { profileStatus: 503 });
    expect(result.text).toContain("can't verify the current store hours");
    expect(result.text).toContain("https://www.mercuryrepower.ca/contact");
    expect(result.text).not.toMatch(/published hours|08:00|09:00|17:00|16:00|April|November|December/);
    expect(result.fetchMock).toHaveBeenCalledOnce();
  });

  it.each([
    { brand: "Mercury", year: 2020, horsepower: 90, condition: "good" },
    { brand: "Mercury", year: 2020, horsepower: 90, engine_type: "4-stroke" },
  ])("requests missing trade inputs without invoking valuation: %j", async (args) => {
    const result = await invoke("estimate_trade_value", args);
    expect(result.text).toMatch(/need the (engine type|motor condition)/);
    expect(result.valuation).not.toHaveBeenCalled();
    expect(result.fetchMock).not.toHaveBeenCalled();
  });

  it("uses one estimate with the inspection caveat after confirmed architecture", async () => {
    const result = await invoke("estimate_trade_value", { brand: "Mercury", year: 2020, horsepower: 90, condition: "good", engine_type: "4-stroke", hours: 0 });
    expect(result.valuation).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ stroke: "4-stroke", hours: 0 }));
    expect(result.text).toContain("$5000 wholesale");
    expect(result.text).toContain("Final value requires in-person inspection");
  });

  it("fails closed with one attempt on an injected valuation timeout", async () => {
    const result = await invoke("estimate_trade_value", { brand: "Mercury", year: 2020, horsepower: 90, condition: "good", engine_type: "4-stroke" }, { valuationError: new Error("synthetic timeout") });
    expect(result.valuation).toHaveBeenCalledOnce();
    expect(result.text).toContain("unavailable or rejected");
    expect(result.text).not.toContain("$");
    expect(VOICE_SYSTEM_PROMPT).toContain("Do not repeat an identical failed call");
  });

  it("asks for architecture before valuing an ambiguous model, even if upstream would return a number", async () => {
    const result = await invoke("estimate_trade_value", { brand: "Mercury", year: 2020, horsepower: 90, condition: "good", model: "90 ELPT" });
    expect(result.valuation).not.toHaveBeenCalled();
    expect(result.text).toContain("need the engine type");
    expect(result.text).not.toContain("$");
  });

  it("keeps the confirmed name when displaying a synthetic receipt with no name", () => {
    const dispatchVoiceActivity = vi.fn();
    const tool = clientTool("deliver_quote_link", { toast: vi.fn(), dispatchVoiceActivity });
    const receipt = { share_url: "https://example.test/non-customer-fixture", motor_model: "Synthetic Motor", final_price: 12345 };
    expect(VOICE_SYSTEM_PROMPT).toContain("For customer_name, reuse the previously confirmed name for this customer");
    expect(VOICE_SYSTEM_PROMPT).not.toContain("Populate its name, motor and price fields from that same receipt");
    const result = JSON.parse(tool({ ...receipt, customer_name: "Set One Synthetic" }));
    expect(result.success).toBe(true);
    expect(dispatchVoiceActivity).toHaveBeenCalledWith(expect.objectContaining({ description: "Synthetic Motor for Set One Synthetic" }));
    expect(result.message).toContain("Set One Synthetic");
  });

  it("retrieves synthetic quote state through the registered get_quote_status tool", () => {
    const options = { quoteContext: { selectedMotor: { model: "Synthetic Motor", hp: 90 }, purchasePath: "installed", boatInfo: { length: 18, type: "aluminum" }, tradeInValue: 5000 } };
    const tool = clientTool("get_quote_status", { options });
    const before = structuredClone(options);
    expect(JSON.parse(tool())).toMatchObject({ motorModel: "Synthetic Motor", motorHp: 90, purchasePath: "installed", boatLength: 18, tradeInValue: 5000, nextStep: "promo", readyForSummary: true });
    expect(options).toEqual(before);
    options.quoteContext = undefined as never;
    expect(JSON.parse(tool())).toMatchObject({ hasMotor: false, nextStep: "motor", readyForSummary: false });
  });
});
